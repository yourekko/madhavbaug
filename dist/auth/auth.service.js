"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = __importStar(require("bcrypt"));
const typeorm_2 = require("typeorm");
const role_enum_1 = require("../common/enums/role.enum");
const audit_log_entity_1 = require("../entities/audit-log.entity");
const normalize_upload_url_1 = require("../common/utils/normalize-upload-url");
const users_service_1 = require("../users/users.service");
let AuthService = class AuthService {
    usersService;
    jwtService;
    auditRepo;
    constructor(usersService, jwtService, auditRepo) {
        this.usersService = usersService;
        this.jwtService = jwtService;
        this.auditRepo = auditRepo;
    }
    async signupPatient(input) {
        if (!input.email && !input.phone) {
            throw new common_1.BadRequestException('Either email or phone is required.');
        }
        const exists = await this.usersService.findByEmailOrPhone(input.email ?? null, input.phone ?? null);
        if (exists)
            throw new common_1.BadRequestException('User already exists with this email/phone.');
        const passwordHash = await bcrypt.hash(input.password, 10);
        const user = await this.usersService.createUser({
            name: input.name,
            email: input.email ?? null,
            phone: input.phone ?? null,
            role: role_enum_1.Role.PATIENT,
            passwordHash,
            signupLocation: input.signupLocation?.trim() || null,
        });
        await this.recordAuthAudit(user.id, 'auth.signup', { role: user.role });
        return this.buildAuthResponse(user);
    }
    async signupDoctor(input) {
        const exists = await this.usersService.findByEmailOrPhone(input.email, null);
        if (exists)
            throw new common_1.BadRequestException('Doctor already exists with this email.');
        const passwordHash = await bcrypt.hash(input.password, 10);
        const user = await this.usersService.createUser({
            name: input.name,
            email: input.email,
            phone: null,
            role: role_enum_1.Role.DOCTOR,
            passwordHash,
        });
        await this.usersService.createDoctorProfile({
            userId: user.id,
            degree: input.degree,
            qualification: input.qualification,
            clinicalExperienceYears: input.clinicalExperienceYears,
            photoUrl: input.photoUrl ?? null,
            bio: input.bio,
            expertiseTags: input.expertiseTags,
        });
        await this.recordAuthAudit(user.id, 'auth.signup', { role: user.role });
        return this.buildAuthResponse(user);
    }
    async login(input) {
        if (!input.email && !input.phone) {
            throw new common_1.BadRequestException('Either email or phone is required.');
        }
        const user = await this.usersService.findByEmailOrPhone(input.email ?? null, input.phone ?? null);
        if (!user)
            throw new common_1.UnauthorizedException('Invalid credentials.');
        const ok = await bcrypt.compare(input.password, user.passwordHash);
        if (!ok)
            throw new common_1.UnauthorizedException('Invalid credentials.');
        await this.recordAuthAudit(user.id, 'auth.login', { role: user.role });
        return this.buildAuthResponse(user);
    }
    async recordAuthAudit(userId, action, payload) {
        await this.auditRepo.save(this.auditRepo.create({
            actorUserId: userId,
            action,
            entityType: 'auth',
            entityId: null,
            payloadJson: payload,
        }));
    }
    async buildAuthResponse(user) {
        const payload = {
            sub: user.id,
            role: user.role,
            email: user.email,
            phone: user.phone,
        };
        const accessToken = await this.jwtService.signAsync(payload);
        return {
            accessToken,
            user: {
                id: user.id,
                name: user.name,
                role: user.role,
                email: user.email,
                phone: user.phone,
            },
        };
    }
    async getMe(userId) {
        const user = await this.usersService.getById(userId);
        const profile = user.role === role_enum_1.Role.DOCTOR ? await this.usersService.getDoctorProfileByUserId(user.id) : null;
        return {
            id: user.id,
            name: user.name,
            role: user.role,
            email: user.email,
            phone: user.phone,
            doctorProfile: profile
                ? {
                    degree: profile.degree,
                    qualification: profile.qualification,
                    clinicalExperienceYears: profile.clinicalExperienceYears,
                    bio: profile.bio,
                    photoUrl: (0, normalize_upload_url_1.normalizePublicUploadPhotoUrl)(profile.photoUrl),
                    expertiseTags: profile.expertiseTags ?? [],
                }
                : null,
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, typeorm_1.InjectRepository)(audit_log_entity_1.AuditLog)),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        jwt_1.JwtService,
        typeorm_2.Repository])
], AuthService);
//# sourceMappingURL=auth.service.js.map
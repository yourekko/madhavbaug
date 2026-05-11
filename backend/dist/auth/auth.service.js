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
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const jwt_1 = require("@nestjs/jwt");
const crypto_1 = require("crypto");
const bcrypt = __importStar(require("bcrypt"));
const google_auth_library_1 = require("google-auth-library");
const typeorm_2 = require("typeorm");
const role_enum_1 = require("../common/enums/role.enum");
const audit_log_entity_1 = require("../entities/audit-log.entity");
const normalize_upload_url_1 = require("../common/utils/normalize-upload-url");
const users_service_1 = require("../users/users.service");
let AuthService = class AuthService {
    usersService;
    jwtService;
    configService;
    auditRepo;
    constructor(usersService, jwtService, configService, auditRepo) {
        this.usersService = usersService;
        this.jwtService = jwtService;
        this.configService = configService;
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
            branchName: input.branchName,
            profileLink: input.profileLink,
            whatsappNumber: input.whatsappNumber,
            expertiseTags: input.expertiseTags,
            profileCompleted: true,
        });
        await this.usersService.updateDoctorWhatsappPhone(user.id, input.whatsappNumber);
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
    async loginWithGoogle(idToken, role) {
        const clientId = this.configService.get('GOOGLE_CLIENT_ID');
        if (!clientId)
            throw new common_1.BadRequestException('Google sign-in is not configured on the server.');
        const client = new google_auth_library_1.OAuth2Client(clientId);
        let ticket;
        try {
            ticket = await client.verifyIdToken({ idToken, audience: clientId });
        }
        catch {
            throw new common_1.UnauthorizedException('Invalid or expired Google sign-in.');
        }
        const payload = ticket.getPayload();
        if (!payload?.sub)
            throw new common_1.UnauthorizedException('Invalid Google sign-in.');
        if (!payload.email_verified) {
            throw new common_1.BadRequestException('Verify your Google email address before using Google sign-in.');
        }
        const sub = payload.sub;
        const email = (payload.email ?? '').toLowerCase().trim() || null;
        if (!email)
            throw new common_1.BadRequestException('Your Google account must have an email address.');
        const name = (payload.name ?? '').trim() || email.split('@')[0];
        const targetRole = role === 'doctor' ? role_enum_1.Role.DOCTOR : role_enum_1.Role.PATIENT;
        let user = await this.usersService.findByGoogleSub(sub);
        if (user) {
            if (user.role !== targetRole) {
                throw new common_1.BadRequestException('This Google account is already linked to a different account type.');
            }
            await this.recordAuthAudit(user.id, 'auth.login', { role: user.role, method: 'google' });
            return this.buildAuthResponse(user);
        }
        const existingByEmail = await this.usersService.findByEmailOrPhone(email, null);
        if (existingByEmail) {
            if (existingByEmail.role !== targetRole) {
                throw new common_1.BadRequestException('An account with this email already exists with a different role.');
            }
            if (existingByEmail.googleSub && existingByEmail.googleSub !== sub) {
                throw new common_1.BadRequestException('This email is linked to a different Google account.');
            }
            user = await this.usersService.setGoogleSub(existingByEmail.id, sub);
            await this.recordAuthAudit(user.id, 'auth.login', { role: user.role, method: 'google' });
            return this.buildAuthResponse(user);
        }
        const passwordHash = await bcrypt.hash((0, crypto_1.randomBytes)(32).toString('hex'), 10);
        if (targetRole === role_enum_1.Role.PATIENT) {
            user = await this.usersService.createUser({
                name,
                email,
                phone: null,
                role: role_enum_1.Role.PATIENT,
                passwordHash,
                googleSub: sub,
            });
        }
        else {
            user = await this.usersService.createUser({
                name,
                email,
                phone: null,
                role: role_enum_1.Role.DOCTOR,
                passwordHash,
                googleSub: sub,
            });
            await this.usersService.createDoctorProfile({
                userId: user.id,
                degree: '—',
                qualification: '—',
                clinicalExperienceYears: 0,
                photoUrl: null,
                bio: 'Please complete your professional profile to use the doctor panel.',
                branchName: null,
                profileLink: null,
                whatsappNumber: null,
                expertiseTags: [],
                profileCompleted: false,
            });
        }
        await this.recordAuthAudit(user.id, 'auth.signup', { role: user.role, method: 'google' });
        return this.buildAuthResponse(user);
    }
    async completePatientPhone(userId, phone, name) {
        const user = await this.usersService.getById(userId);
        if (user.role !== role_enum_1.Role.PATIENT)
            throw new common_1.ForbiddenException('Only patient accounts can use this step.');
        const updated = await this.usersService.updatePatientPhone(userId, phone, name);
        return this.buildAuthResponse(updated);
    }
    async completeDoctorProfile(userId, dto) {
        const user = await this.usersService.getById(userId);
        if (user.role !== role_enum_1.Role.DOCTOR)
            throw new common_1.ForbiddenException('Only doctor accounts can complete this profile.');
        await this.usersService.completeDoctorProfile(userId, {
            degree: dto.degree,
            qualification: dto.qualification,
            clinicalExperienceYears: dto.clinicalExperienceYears,
            photoUrl: dto.photoUrl ?? null,
            bio: dto.bio,
            branchName: dto.branchName,
            profileLink: dto.profileLink,
            whatsappNumber: dto.whatsappNumber,
            expertiseTags: dto.expertiseTags,
        });
        const refreshed = await this.usersService.updateDoctorWhatsappPhone(userId, dto.whatsappNumber);
        return this.buildAuthResponse(refreshed);
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
        const profile = user.role === role_enum_1.Role.DOCTOR ? await this.usersService.getDoctorProfileByUserId(user.id) : null;
        const needsPatientPhone = user.role === role_enum_1.Role.PATIENT && !user.phone;
        const needsDoctorProfile = user.role === role_enum_1.Role.DOCTOR && ((!!profile && profile.profileCompleted === false) || !user.phone);
        const jwtPayload = {
            sub: user.id,
            role: user.role,
            email: user.email,
            phone: user.phone,
            ...(needsPatientPhone ? { needsPatientPhone: true } : {}),
            ...(needsDoctorProfile ? { needsDoctorProfile: true } : {}),
        };
        const accessToken = await this.jwtService.signAsync(jwtPayload);
        return {
            accessToken,
            user: {
                id: user.id,
                name: user.name,
                role: user.role,
                email: user.email,
                phone: user.phone,
                needsPatientPhone,
                needsDoctorProfile,
            },
        };
    }
    async getMe(userId) {
        const user = await this.usersService.getById(userId);
        const profile = user.role === role_enum_1.Role.DOCTOR ? await this.usersService.getDoctorProfileByUserId(user.id) : null;
        const needsPatientPhone = user.role === role_enum_1.Role.PATIENT && !user.phone;
        const needsDoctorProfile = user.role === role_enum_1.Role.DOCTOR && ((!!profile && profile.profileCompleted === false) || !user.phone);
        return {
            id: user.id,
            name: user.name,
            role: user.role,
            email: user.email,
            phone: user.phone,
            needsPatientPhone,
            needsDoctorProfile,
            doctorProfile: profile
                ? {
                    degree: profile.degree,
                    qualification: profile.qualification,
                    clinicalExperienceYears: profile.clinicalExperienceYears,
                    bio: profile.bio,
                    photoUrl: (0, normalize_upload_url_1.normalizePublicUploadPhotoUrl)(profile.photoUrl),
                    branchName: profile.branchName,
                    profileLink: profile.profileLink,
                    whatsappNumber: profile.whatsappNumber,
                    expertiseTags: profile.expertiseTags ?? [],
                    profileCompleted: profile.profileCompleted,
                }
                : null,
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(3, (0, typeorm_1.InjectRepository)(audit_log_entity_1.AuditLog)),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        jwt_1.JwtService,
        config_1.ConfigService,
        typeorm_2.Repository])
], AuthService);
//# sourceMappingURL=auth.service.js.map
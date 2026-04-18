"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const crypto_1 = require("crypto");
const multer_1 = require("multer");
const path_1 = require("path");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const role_enum_1 = require("../common/enums/role.enum");
const roles_guard_1 = require("../common/guards/roles.guard");
const auth_service_1 = require("./auth.service");
const complete_doctor_profile_dto_1 = require("./dto/complete-doctor-profile.dto");
const complete_patient_phone_dto_1 = require("./dto/complete-patient-phone.dto");
const doctor_signup_dto_1 = require("./dto/doctor-signup.dto");
const google_auth_dto_1 = require("./dto/google-auth.dto");
const login_dto_1 = require("./dto/login.dto");
const patient_signup_dto_1 = require("./dto/patient-signup.dto");
const jwt_auth_guard_1 = require("./jwt-auth.guard");
let AuthController = class AuthController {
    authService;
    constructor(authService) {
        this.authService = authService;
    }
    signup(dto) {
        return this.authService.signupPatient(dto);
    }
    signupDoctor(dto) {
        return this.authService.signupDoctor(dto);
    }
    google(dto) {
        return this.authService.loginWithGoogle(dto.idToken, dto.role);
    }
    completePatientPhone(user, dto) {
        return this.authService.completePatientPhone(user.sub, dto.phone, dto.name);
    }
    completeDoctorProfile(user, dto) {
        return this.authService.completeDoctorProfile(user.sub, dto);
    }
    uploadDoctorPhoto(file, req) {
        if (!file)
            throw new common_1.BadRequestException('No image file received.');
        const host = req.get('host');
        const proto = req.protocol;
        return { url: `${proto}://${host}/uploads/${file.filename}` };
    }
    login(dto) {
        return this.authService.login(dto);
    }
    me(user) {
        return this.authService.getMe(user.sub);
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('signup'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [patient_signup_dto_1.PatientSignupDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "signup", null);
__decorate([
    (0, common_1.Post)('doctor/signup'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [doctor_signup_dto_1.DoctorSignupDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "signupDoctor", null);
__decorate([
    (0, common_1.Post)('google'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [google_auth_dto_1.GoogleAuthDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "google", null);
__decorate([
    (0, common_1.Patch)('patient/phone'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, complete_patient_phone_dto_1.CompletePatientPhoneDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "completePatientPhone", null);
__decorate([
    (0, common_1.Patch)('doctor/complete-profile'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.DOCTOR),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, complete_doctor_profile_dto_1.CompleteDoctorProfileDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "completeDoctorProfile", null);
__decorate([
    (0, common_1.Post)('doctor/upload-photo'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.diskStorage)({
            destination: (0, path_1.join)(process.cwd(), 'uploads'),
            filename: (_req, file, cb) => {
                const ext = (0, path_1.extname)(file.originalname).toLowerCase();
                const safe = ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext) ? ext : '.jpg';
                cb(null, `${(0, crypto_1.randomUUID)()}${safe}`);
            },
        }),
        limits: { fileSize: 5 * 1024 * 1024 },
        fileFilter: (_req, file, cb) => {
            if (!/^image\/(jpeg|pjpeg|png|gif|webp)$/i.test(file.mimetype)) {
                return cb(new common_1.BadRequestException('Only JPEG, PNG, GIF, or WebP images are allowed.'), false);
            }
            cb(null, true);
        },
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "uploadDoctorPhoto", null);
__decorate([
    (0, common_1.Post)('login'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.LoginDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('me'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "me", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map
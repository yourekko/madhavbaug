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
exports.DoctorController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const crypto_1 = require("crypto");
const multer_1 = require("multer");
const path_1 = require("path");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const question_status_enum_1 = require("../common/enums/question-status.enum");
const role_enum_1 = require("../common/enums/role.enum");
const doctor_profile_complete_guard_1 = require("../common/guards/doctor-profile-complete.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const create_answer_dto_1 = require("./dto/create-answer.dto");
const questions_service_1 = require("./questions.service");
let DoctorController = class DoctorController {
    questionsService;
    constructor(questionsService) {
        this.questionsService = questionsService;
    }
    list(user, status, page, limit) {
        return this.questionsService.listDoctorQuestions(user.sub, status, Number(page ?? 1), Number(limit ?? 20));
    }
    detail(user, id) {
        return this.questionsService.getQuestionThread(id, user.sub, user.role);
    }
    answer(user, id, dto) {
        return this.questionsService.addDoctorAnswer(user.sub, id, dto);
    }
    uploadImage(file, req) {
        if (!file)
            throw new common_1.BadRequestException('No image file received.');
        const host = req.get('host');
        const proto = req.protocol;
        return { url: `${proto}://${host}/uploads/${file.filename}` };
    }
    updateAnswerPlaceholder(id, dto) {
        return { id, answerText: dto.answerText, updated: true };
    }
};
exports.DoctorController = DoctorController;
__decorate([
    (0, common_1.Get)('questions'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('page')),
    __param(3, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", void 0)
], DoctorController.prototype, "list", null);
__decorate([
    (0, common_1.Get)('questions/:id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], DoctorController.prototype, "detail", null);
__decorate([
    (0, common_1.Post)('questions/:id/answers'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, create_answer_dto_1.CreateAnswerDto]),
    __metadata("design:returntype", void 0)
], DoctorController.prototype, "answer", null);
__decorate([
    (0, common_1.Post)('uploads/image'),
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
], DoctorController.prototype, "uploadImage", null);
__decorate([
    (0, common_1.Patch)('answers/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_answer_dto_1.CreateAnswerDto]),
    __metadata("design:returntype", void 0)
], DoctorController.prototype, "updateAnswerPlaceholder", null);
exports.DoctorController = DoctorController = __decorate([
    (0, common_1.Controller)('doctor'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, doctor_profile_complete_guard_1.DoctorProfileCompleteGuard),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.DOCTOR),
    __metadata("design:paramtypes", [questions_service_1.QuestionsService])
], DoctorController);
//# sourceMappingURL=doctor.controller.js.map
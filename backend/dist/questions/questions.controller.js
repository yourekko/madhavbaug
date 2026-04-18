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
exports.QuestionsController = void 0;
const common_1 = require("@nestjs/common");
const common_2 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const question_status_enum_1 = require("../common/enums/question-status.enum");
const role_enum_1 = require("../common/enums/role.enum");
const patient_phone_guard_1 = require("../common/guards/patient-phone.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const create_followup_dto_1 = require("./dto/create-followup.dto");
const create_question_dto_1 = require("./dto/create-question.dto");
const questions_service_1 = require("./questions.service");
let QuestionsController = class QuestionsController {
    questionsService;
    constructor(questionsService) {
        this.questionsService = questionsService;
    }
    createQuestion(user, dto) {
        return this.questionsService.createQuestion(user.sub, dto);
    }
    myQuestions(user, page, limit) {
        return this.questionsService.getMyQuestions(user.sub, Number(page ?? 1), Number(limit ?? 20));
    }
    thread(user, id) {
        return this.questionsService.getQuestionThread(id, user.sub, user.role);
    }
    followup(user, id, dto) {
        return this.questionsService.addFollowup(id, user.sub, dto);
    }
    statuses() {
        return Object.values(question_status_enum_1.QuestionStatus);
    }
};
exports.QuestionsController = QuestionsController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(patient_phone_guard_1.PatientPhoneGuard),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.PATIENT, role_enum_1.Role.DOCTOR, role_enum_1.Role.ADMIN, role_enum_1.Role.SUPERADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_question_dto_1.CreateQuestionDto]),
    __metadata("design:returntype", void 0)
], QuestionsController.prototype, "createQuestion", null);
__decorate([
    (0, common_1.Get)('my'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.PATIENT, role_enum_1.Role.DOCTOR, role_enum_1.Role.ADMIN, role_enum_1.Role.SUPERADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_2.Query)('page')),
    __param(2, (0, common_2.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], QuestionsController.prototype, "myQuestions", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], QuestionsController.prototype, "thread", null);
__decorate([
    (0, common_1.Post)(':id/followups'),
    (0, common_1.UseGuards)(patient_phone_guard_1.PatientPhoneGuard),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.PATIENT, role_enum_1.Role.DOCTOR, role_enum_1.Role.ADMIN, role_enum_1.Role.SUPERADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, create_followup_dto_1.CreateFollowupDto]),
    __metadata("design:returntype", void 0)
], QuestionsController.prototype, "followup", null);
__decorate([
    (0, common_1.Get)('status/open'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.PATIENT, role_enum_1.Role.DOCTOR, role_enum_1.Role.ADMIN, role_enum_1.Role.SUPERADMIN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], QuestionsController.prototype, "statuses", null);
exports.QuestionsController = QuestionsController = __decorate([
    (0, common_1.Controller)('questions'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [questions_service_1.QuestionsService])
], QuestionsController);
//# sourceMappingURL=questions.controller.js.map
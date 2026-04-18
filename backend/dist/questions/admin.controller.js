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
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const question_status_enum_1 = require("../common/enums/question-status.enum");
const role_enum_1 = require("../common/enums/role.enum");
const roles_guard_1 = require("../common/guards/roles.guard");
const users_service_1 = require("../users/users.service");
const assign_doctor_dto_1 = require("./dto/assign-doctor.dto");
const update_question_status_dto_1 = require("./dto/update-question-status.dto");
const questions_service_1 = require("./questions.service");
let AdminController = class AdminController {
    questionsService;
    usersService;
    constructor(questionsService, usersService) {
        this.questionsService = questionsService;
        this.usersService = usersService;
    }
    dashboard() {
        return this.questionsService.adminDashboard();
    }
    questions(status, page, limit) {
        return this.questionsService.adminListQuestions(status, Number(page ?? 1), Number(limit ?? 20));
    }
    updateStatus(id, dto, user) {
        return this.questionsService.adminUpdateStatus(id, dto.status, user.sub);
    }
    assignDoctor(id, dto, user) {
        return this.questionsService.adminAssignDoctor(id, dto.doctorUserId, user.sub);
    }
    doctors() {
        return this.usersService.getDoctors();
    }
    doctorReports() {
        return this.questionsService.adminDoctorAnalytics();
    }
    doctorDetail(doctorUserId) {
        return this.questionsService.adminDoctorAnalyticsDetail(doctorUserId);
    }
    patientReports() {
        return this.questionsService.adminPatientAnalytics();
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Get)('dashboard'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "dashboard", null);
__decorate([
    (0, common_1.Get)('questions'),
    __param(0, (0, common_1.Query)('status')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "questions", null);
__decorate([
    (0, common_1.Patch)('questions/:id/status'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_question_status_dto_1.UpdateQuestionStatusDto, Object]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Post)('questions/:id/assign-doctor'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, assign_doctor_dto_1.AssignDoctorDto, Object]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "assignDoctor", null);
__decorate([
    (0, common_1.Get)('doctors'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "doctors", null);
__decorate([
    (0, common_1.Get)('reports/doctors'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "doctorReports", null);
__decorate([
    (0, common_1.Get)('reports/doctors/:doctorUserId'),
    __param(0, (0, common_1.Param)('doctorUserId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "doctorDetail", null);
__decorate([
    (0, common_1.Get)('reports/patients'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "patientReports", null);
exports.AdminController = AdminController = __decorate([
    (0, common_1.Controller)('admin'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.SUPERADMIN),
    __metadata("design:paramtypes", [questions_service_1.QuestionsService,
        users_service_1.UsersService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map
"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuestionsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const answer_entity_1 = require("../entities/answer.entity");
const audit_log_entity_1 = require("../entities/audit-log.entity");
const question_assignment_entity_1 = require("../entities/question-assignment.entity");
const question_followup_entity_1 = require("../entities/question-followup.entity");
const question_entity_1 = require("../entities/question.entity");
const user_entity_1 = require("../entities/user.entity");
const users_module_1 = require("../users/users.module");
const admin_controller_1 = require("./admin.controller");
const doctor_controller_1 = require("./doctor.controller");
const forum_public_controller_1 = require("./forum-public.controller");
const questions_controller_1 = require("./questions.controller");
const questions_service_1 = require("./questions.service");
let QuestionsModule = class QuestionsModule {
};
exports.QuestionsModule = QuestionsModule;
exports.QuestionsModule = QuestionsModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([question_entity_1.Question, question_followup_entity_1.QuestionFollowup, answer_entity_1.Answer, question_assignment_entity_1.QuestionAssignment, user_entity_1.User, audit_log_entity_1.AuditLog]), users_module_1.UsersModule],
        controllers: [questions_controller_1.QuestionsController, doctor_controller_1.DoctorController, admin_controller_1.AdminController, forum_public_controller_1.ForumPublicController],
        providers: [questions_service_1.QuestionsService],
        exports: [questions_service_1.QuestionsService],
    })
], QuestionsModule);
//# sourceMappingURL=questions.module.js.map
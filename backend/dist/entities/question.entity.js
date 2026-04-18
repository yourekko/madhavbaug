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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Question = void 0;
const typeorm_1 = require("typeorm");
const question_status_enum_1 = require("../common/enums/question-status.enum");
const answer_entity_1 = require("./answer.entity");
const question_assignment_entity_1 = require("./question-assignment.entity");
const question_followup_entity_1 = require("./question-followup.entity");
const user_entity_1 = require("./user.entity");
let Question = class Question {
    id;
    patientUserId;
    patientUser;
    title;
    body;
    category;
    forumSlug;
    viewCount;
    status;
    assignments;
    answers;
    followups;
    createdAt;
    updatedAt;
};
exports.Question = Question;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Question.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'patient_user_id' }),
    __metadata("design:type", String)
], Question.prototype, "patientUserId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => user.patientQuestions, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'patient_user_id' }),
    __metadata("design:type", user_entity_1.User)
], Question.prototype, "patientUser", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 180 }),
    __metadata("design:type", String)
], Question.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], Question.prototype, "body", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 80 }),
    __metadata("design:type", String)
], Question.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'forum_slug', type: 'varchar', length: 200, unique: true, nullable: true }),
    __metadata("design:type", Object)
], Question.prototype, "forumSlug", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'view_count', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], Question.prototype, "viewCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: question_status_enum_1.QuestionStatus, default: question_status_enum_1.QuestionStatus.OPEN }),
    __metadata("design:type", String)
], Question.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => question_assignment_entity_1.QuestionAssignment, (assignment) => assignment.question),
    __metadata("design:type", Array)
], Question.prototype, "assignments", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => answer_entity_1.Answer, (answer) => answer.question),
    __metadata("design:type", Array)
], Question.prototype, "answers", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => question_followup_entity_1.QuestionFollowup, (followup) => followup.question),
    __metadata("design:type", Array)
], Question.prototype, "followups", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Question.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Question.prototype, "updatedAt", void 0);
exports.Question = Question = __decorate([
    (0, typeorm_1.Entity)('questions')
], Question);
//# sourceMappingURL=question.entity.js.map
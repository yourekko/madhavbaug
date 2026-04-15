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
exports.QuestionFollowup = void 0;
const typeorm_1 = require("typeorm");
const question_entity_1 = require("./question.entity");
const user_entity_1 = require("./user.entity");
let QuestionFollowup = class QuestionFollowup {
    id;
    questionId;
    question;
    patientUserId;
    patientUser;
    message;
    optionalContactName;
    optionalContactPhone;
    createdAt;
};
exports.QuestionFollowup = QuestionFollowup;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], QuestionFollowup.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'question_id' }),
    __metadata("design:type", String)
], QuestionFollowup.prototype, "questionId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => question_entity_1.Question, (question) => question.followups, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'question_id' }),
    __metadata("design:type", question_entity_1.Question)
], QuestionFollowup.prototype, "question", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'patient_user_id' }),
    __metadata("design:type", String)
], QuestionFollowup.prototype, "patientUserId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => user.followups, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'patient_user_id' }),
    __metadata("design:type", user_entity_1.User)
], QuestionFollowup.prototype, "patientUser", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], QuestionFollowup.prototype, "message", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'optional_contact_name', type: 'varchar', nullable: true, length: 120 }),
    __metadata("design:type", Object)
], QuestionFollowup.prototype, "optionalContactName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'optional_contact_phone', type: 'varchar', nullable: true, length: 20 }),
    __metadata("design:type", Object)
], QuestionFollowup.prototype, "optionalContactPhone", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], QuestionFollowup.prototype, "createdAt", void 0);
exports.QuestionFollowup = QuestionFollowup = __decorate([
    (0, typeorm_1.Entity)('question_followups')
], QuestionFollowup);
//# sourceMappingURL=question-followup.entity.js.map
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
exports.User = void 0;
const typeorm_1 = require("typeorm");
const role_enum_1 = require("../common/enums/role.enum");
const answer_entity_1 = require("./answer.entity");
const audit_log_entity_1 = require("./audit-log.entity");
const doctor_profile_entity_1 = require("./doctor-profile.entity");
const question_entity_1 = require("./question.entity");
const question_assignment_entity_1 = require("./question-assignment.entity");
const question_followup_entity_1 = require("./question-followup.entity");
let User = class User {
    id;
    role;
    name;
    email;
    phone;
    passwordHash;
    isActive;
    createdAt;
    updatedAt;
    doctorProfile;
    patientQuestions;
    assignments;
    answers;
    followups;
    auditLogs;
};
exports.User = User;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], User.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: role_enum_1.Role, default: role_enum_1.Role.PATIENT }),
    __metadata("design:type", String)
], User.prototype, "role", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 120 }),
    __metadata("design:type", String)
], User.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', unique: true, nullable: true, length: 180 }),
    __metadata("design:type", Object)
], User.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', unique: true, nullable: true, length: 20 }),
    __metadata("design:type", Object)
], User.prototype, "phone", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'password_hash' }),
    __metadata("design:type", String)
], User.prototype, "passwordHash", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_active', default: true }),
    __metadata("design:type", Boolean)
], User.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], User.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], User.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => doctor_profile_entity_1.DoctorProfile, (profile) => profile.user),
    __metadata("design:type", doctor_profile_entity_1.DoctorProfile)
], User.prototype, "doctorProfile", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => question_entity_1.Question, (question) => question.patientUser),
    __metadata("design:type", Array)
], User.prototype, "patientQuestions", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => question_assignment_entity_1.QuestionAssignment, (assignment) => assignment.doctor),
    __metadata("design:type", Array)
], User.prototype, "assignments", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => answer_entity_1.Answer, (answer) => answer.doctor),
    __metadata("design:type", Array)
], User.prototype, "answers", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => question_followup_entity_1.QuestionFollowup, (followup) => followup.patientUser),
    __metadata("design:type", Array)
], User.prototype, "followups", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => audit_log_entity_1.AuditLog, (log) => log.actorUser),
    __metadata("design:type", Array)
], User.prototype, "auditLogs", void 0);
exports.User = User = __decorate([
    (0, typeorm_1.Entity)('users')
], User);
//# sourceMappingURL=user.entity.js.map
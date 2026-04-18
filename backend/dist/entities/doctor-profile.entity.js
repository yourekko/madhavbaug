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
exports.DoctorProfile = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
let DoctorProfile = class DoctorProfile {
    id;
    userId;
    user;
    degree;
    qualification;
    clinicalExperienceYears;
    bio;
    photoUrl;
    branchName;
    profileLink;
    whatsappNumber;
    expertiseTags;
    profileCompleted;
};
exports.DoctorProfile = DoctorProfile;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], DoctorProfile.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id', unique: true }),
    __metadata("design:type", String)
], DoctorProfile.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => user_entity_1.User, (user) => user.doctorProfile, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], DoctorProfile.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100 }),
    __metadata("design:type", String)
], DoctorProfile.prototype, "degree", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 180 }),
    __metadata("design:type", String)
], DoctorProfile.prototype, "qualification", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'clinical_experience_years', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], DoctorProfile.prototype, "clinicalExperienceYears", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], DoctorProfile.prototype, "bio", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'photo_url', type: 'varchar', nullable: true, length: 500 }),
    __metadata("design:type", Object)
], DoctorProfile.prototype, "photoUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'branch_name', type: 'varchar', nullable: true, length: 180 }),
    __metadata("design:type", Object)
], DoctorProfile.prototype, "branchName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'profile_link', type: 'varchar', nullable: true, length: 500 }),
    __metadata("design:type", Object)
], DoctorProfile.prototype, "profileLink", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'whatsapp_number', type: 'varchar', nullable: true, length: 20 }),
    __metadata("design:type", Object)
], DoctorProfile.prototype, "whatsappNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'expertise_tags', type: 'simple-json', nullable: true }),
    __metadata("design:type", Object)
], DoctorProfile.prototype, "expertiseTags", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'profile_completed', default: true }),
    __metadata("design:type", Boolean)
], DoctorProfile.prototype, "profileCompleted", void 0);
exports.DoctorProfile = DoctorProfile = __decorate([
    (0, typeorm_1.Entity)('doctor_profiles')
], DoctorProfile);
//# sourceMappingURL=doctor-profile.entity.js.map
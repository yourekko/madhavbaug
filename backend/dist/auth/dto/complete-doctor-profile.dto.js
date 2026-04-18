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
exports.CompleteDoctorProfileDto = void 0;
const class_validator_1 = require("class-validator");
const question_categories_1 = require("../../common/constants/question-categories");
class CompleteDoctorProfileDto {
    degree;
    qualification;
    clinicalExperienceYears;
    photoUrl;
    bio;
    whatsappNumber;
    branchName;
    profileLink;
    expertiseTags;
}
exports.CompleteDoctorProfileDto = CompleteDoctorProfileDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    __metadata("design:type", String)
], CompleteDoctorProfileDto.prototype, "degree", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    __metadata("design:type", String)
], CompleteDoctorProfileDto.prototype, "qualification", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CompleteDoctorProfileDto.prototype, "clinicalExperienceYears", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", Object)
], CompleteDoctorProfileDto.prototype, "photoUrl", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(400),
    __metadata("design:type", String)
], CompleteDoctorProfileDto.prototype, "bio", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(8),
    __metadata("design:type", String)
], CompleteDoctorProfileDto.prototype, "whatsappNumber", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    __metadata("design:type", String)
], CompleteDoctorProfileDto.prototype, "branchName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(5),
    __metadata("design:type", String)
], CompleteDoctorProfileDto.prototype, "profileLink", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(1, { message: 'Select at least one area of expertise.' }),
    (0, class_validator_1.IsIn)([...question_categories_1.QUESTION_CATEGORY_VALUES], { each: true }),
    __metadata("design:type", Array)
], CompleteDoctorProfileDto.prototype, "expertiseTags", void 0);
//# sourceMappingURL=complete-doctor-profile.dto.js.map
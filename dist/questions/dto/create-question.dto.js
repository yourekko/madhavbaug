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
exports.CreateQuestionDto = exports.CREATABLE_QUESTION_CATEGORIES = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const question_categories_1 = require("../../common/constants/question-categories");
exports.CREATABLE_QUESTION_CATEGORIES = question_categories_1.QUESTION_CATEGORY_VALUES;
class CreateQuestionDto {
    title;
    body;
    category;
    patientAgeGroup;
    patientGender;
    patientHistory;
}
exports.CreateQuestionDto = CreateQuestionDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(180),
    __metadata("design:type", String)
], CreateQuestionDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(20),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], CreateQuestionDto.prototype, "body", void 0);
__decorate([
    (0, class_transformer_1.Transform)(({ value }) => {
        if (value == null || value === '')
            return undefined;
        const s = String(value).trim();
        if (!s || s === 'Select your condition')
            return undefined;
        return s;
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)([...exports.CREATABLE_QUESTION_CATEGORIES]),
    __metadata("design:type", String)
], CreateQuestionDto.prototype, "category", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(40),
    __metadata("design:type", String)
], CreateQuestionDto.prototype, "patientAgeGroup", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(40),
    __metadata("design:type", String)
], CreateQuestionDto.prototype, "patientGender", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], CreateQuestionDto.prototype, "patientHistory", void 0);
//# sourceMappingURL=create-question.dto.js.map
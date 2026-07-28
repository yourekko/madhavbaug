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
exports.SeoController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const role_enum_1 = require("../common/enums/role.enum");
const roles_guard_1 = require("../common/guards/roles.guard");
const upsert_question_seo_dto_1 = require("./dto/upsert-question-seo.dto");
const upsert_seo_page_dto_1 = require("./dto/upsert-seo-page.dto");
const seo_service_1 = require("./seo.service");
let SeoController = class SeoController {
    seoService;
    constructor(seoService) {
        this.seoService = seoService;
    }
    listHubs() {
        return this.seoService.listHubPages();
    }
    listQuestionSeo() {
        return this.seoService.listAnsweredQuestionSeo();
    }
    upsertQuestionSeo(questionId, dto, user) {
        return this.seoService.upsertQuestionSeo(questionId, dto, user.sub);
    }
    getBySlug(slug) {
        return this.seoService.getPublicPageSeo(slug);
    }
    upsert(slug, dto, user) {
        return this.seoService.upsertBySlug(slug, dto, user.sub);
    }
};
exports.SeoController = SeoController;
__decorate([
    (0, common_1.Get)('hubs'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SeoController.prototype, "listHubs", null);
__decorate([
    (0, common_1.Get)('questions'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SeoController.prototype, "listQuestionSeo", null);
__decorate([
    (0, common_1.Put)('questions/:questionId'),
    __param(0, (0, common_1.Param)('questionId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, upsert_question_seo_dto_1.UpsertQuestionSeoDto, Object]),
    __metadata("design:returntype", void 0)
], SeoController.prototype, "upsertQuestionSeo", null);
__decorate([
    (0, common_1.Get)('pages/:slug'),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SeoController.prototype, "getBySlug", null);
__decorate([
    (0, common_1.Put)('pages/:slug'),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, upsert_seo_page_dto_1.UpsertSeoPageDto, Object]),
    __metadata("design:returntype", void 0)
], SeoController.prototype, "upsert", null);
exports.SeoController = SeoController = __decorate([
    (0, common_1.Controller)('admin/seo'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.SUPERADMIN),
    __metadata("design:paramtypes", [seo_service_1.SeoService])
], SeoController);
//# sourceMappingURL=seo.controller.js.map
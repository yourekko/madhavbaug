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
exports.ForumPublicController = void 0;
const common_1 = require("@nestjs/common");
const forum_report_dto_1 = require("./dto/forum-report.dto");
const forum_category_map_1 = require("./forum-category-map");
const questions_service_1 = require("./questions.service");
let ForumPublicController = class ForumPublicController {
    questionsService;
    constructor(questionsService) {
        this.questionsService = questionsService;
    }
    stats() {
        return this.questionsService.getPublicForumStats();
    }
    homeFeed() {
        return this.questionsService.getPublicHomeFeed();
    }
    async sitemap(res) {
        const xml = await this.questionsService.buildPublicForumSitemapXml();
        res.setHeader('Content-Type', 'application/xml; charset=utf-8');
        res.send(xml);
    }
    list(categorySlug, page, limit, search, filter, sort) {
        if (!(0, forum_category_map_1.isValidForumCategorySlug)(categorySlug))
            throw new common_1.NotFoundException();
        const f = filter === 'open' ? 'open' : 'answered';
        const sortBy = sort === 'views' ? 'views' : 'latest';
        return this.questionsService.listPublicForumQuestions(categorySlug, Number(page ?? 1), Number(limit ?? 10), search, f, sortBy);
    }
    detail(req, viewerId, categorySlug, questionSlug) {
        if (!(0, forum_category_map_1.isValidForumCategorySlug)(categorySlug))
            throw new common_1.NotFoundException();
        return this.questionsService.getPublicForumQuestionDetail(categorySlug, questionSlug, req, viewerId);
    }
    report(categorySlug, questionSlug, dto) {
        if (!(0, forum_category_map_1.isValidForumCategorySlug)(categorySlug))
            throw new common_1.NotFoundException();
        return this.questionsService.submitPublicForumReport(categorySlug, questionSlug, dto.message);
    }
};
exports.ForumPublicController = ForumPublicController;
__decorate([
    (0, common_1.Get)('stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ForumPublicController.prototype, "stats", null);
__decorate([
    (0, common_1.Get)('home-feed'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ForumPublicController.prototype, "homeFeed", null);
__decorate([
    (0, common_1.Get)('sitemap.xml'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ForumPublicController.prototype, "sitemap", null);
__decorate([
    (0, common_1.Get)(':categorySlug/questions'),
    __param(0, (0, common_1.Param)('categorySlug')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('search')),
    __param(4, (0, common_1.Query)('filter')),
    __param(5, (0, common_1.Query)('sort')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], ForumPublicController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':categorySlug/questions/:questionSlug'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Headers)('x-forum-viewer-id')),
    __param(2, (0, common_1.Param)('categorySlug')),
    __param(3, (0, common_1.Param)('questionSlug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String]),
    __metadata("design:returntype", void 0)
], ForumPublicController.prototype, "detail", null);
__decorate([
    (0, common_1.Post)(':categorySlug/questions/:questionSlug/report'),
    __param(0, (0, common_1.Param)('categorySlug')),
    __param(1, (0, common_1.Param)('questionSlug')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, forum_report_dto_1.ForumReportDto]),
    __metadata("design:returntype", void 0)
], ForumPublicController.prototype, "report", null);
exports.ForumPublicController = ForumPublicController = __decorate([
    (0, common_1.Controller)('public/forum'),
    __metadata("design:paramtypes", [questions_service_1.QuestionsService])
], ForumPublicController);
//# sourceMappingURL=forum-public.controller.js.map
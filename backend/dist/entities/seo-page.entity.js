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
exports.SeoPage = void 0;
const typeorm_1 = require("typeorm");
let SeoPage = class SeoPage {
    id;
    slug;
    pageType;
    title;
    metaDescription;
    canonicalUrl;
    robots;
    ogTitle;
    ogDescription;
    keywords;
    focusKeyword;
    internalLinks;
    updatedBy;
    updatedAt;
};
exports.SeoPage = SeoPage;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], SeoPage.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true, length: 140 }),
    __metadata("design:type", String)
], SeoPage.prototype, "slug", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'page_type', length: 60 }),
    __metadata("design:type", String)
], SeoPage.prototype, "pageType", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 180 }),
    __metadata("design:type", String)
], SeoPage.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'meta_description', type: 'text', nullable: true }),
    __metadata("design:type", Object)
], SeoPage.prototype, "metaDescription", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'canonical_url', type: 'varchar', nullable: true, length: 500 }),
    __metadata("design:type", Object)
], SeoPage.prototype, "canonicalUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true, length: 80 }),
    __metadata("design:type", Object)
], SeoPage.prototype, "robots", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'og_title', type: 'varchar', nullable: true, length: 180 }),
    __metadata("design:type", Object)
], SeoPage.prototype, "ogTitle", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'og_description', nullable: true, type: 'text' }),
    __metadata("design:type", Object)
], SeoPage.prototype, "ogDescription", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], SeoPage.prototype, "keywords", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'focus_keyword', type: 'varchar', nullable: true, length: 120 }),
    __metadata("design:type", Object)
], SeoPage.prototype, "focusKeyword", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'internal_links', type: 'text', nullable: true }),
    __metadata("design:type", Object)
], SeoPage.prototype, "internalLinks", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'updated_by', type: 'varchar', nullable: true, length: 120 }),
    __metadata("design:type", Object)
], SeoPage.prototype, "updatedBy", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], SeoPage.prototype, "updatedAt", void 0);
exports.SeoPage = SeoPage = __decorate([
    (0, typeorm_1.Entity)('seo_pages')
], SeoPage);
//# sourceMappingURL=seo-page.entity.js.map
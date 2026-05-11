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
exports.ForumQuestionViewDedupe = void 0;
const typeorm_1 = require("typeorm");
let ForumQuestionViewDedupe = class ForumQuestionViewDedupe {
    id;
    questionId;
    viewerKey;
    lastCountedAt;
};
exports.ForumQuestionViewDedupe = ForumQuestionViewDedupe;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ForumQuestionViewDedupe.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'question_id', type: 'char', length: 36 }),
    __metadata("design:type", String)
], ForumQuestionViewDedupe.prototype, "questionId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'viewer_key', type: 'varchar', length: 256 }),
    __metadata("design:type", String)
], ForumQuestionViewDedupe.prototype, "viewerKey", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'last_counted_at', type: 'datetime' }),
    __metadata("design:type", Date)
], ForumQuestionViewDedupe.prototype, "lastCountedAt", void 0);
exports.ForumQuestionViewDedupe = ForumQuestionViewDedupe = __decorate([
    (0, typeorm_1.Entity)('forum_question_view_dedupe'),
    (0, typeorm_1.Index)(['questionId', 'viewerKey'], { unique: true })
], ForumQuestionViewDedupe);
//# sourceMappingURL=forum-question-view-dedupe.entity.js.map
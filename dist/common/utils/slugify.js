"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.slugifyTitle = slugifyTitle;
exports.buildForumSlug = buildForumSlug;
function slugifyTitle(title) {
    const s = title
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 72);
    return s || 'question';
}
function buildForumSlug(title, questionId) {
    const base = slugifyTitle(title);
    const frag = questionId.replace(/-/g, '').slice(0, 10);
    return `${base}-${frag}`;
}
//# sourceMappingURL=slugify.js.map
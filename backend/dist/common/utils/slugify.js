"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractQuestionTitle = extractQuestionTitle;
exports.slugifyTitle = slugifyTitle;
exports.buildForumSlug = buildForumSlug;
exports.forumSlugIdFragment = forumSlugIdFragment;
const SLUG_MAX_BASE = 55;
const SLUG_ID_LEN = 8;
function extractQuestionTitle(text, maxLen = 100) {
    const normalized = text.replace(/\s+/g, ' ').trim();
    if (!normalized)
        return 'Health question';
    const sentenceMatch = normalized.match(/^(.{10,220}?[.?!])(?:\s|$)/);
    if (sentenceMatch) {
        const sentence = sentenceMatch[1].trim();
        if (sentence.length <= maxLen)
            return sentence;
        return truncateAtWord(sentence, maxLen);
    }
    const firstLine = (normalized.split(/\n/)[0] ?? normalized).trim();
    if (firstLine.length <= maxLen)
        return firstLine;
    return truncateAtWord(firstLine, maxLen);
}
function truncateAtWord(text, maxLen) {
    if (text.length <= maxLen)
        return text;
    const cut = text.slice(0, maxLen - 1);
    const lastSpace = cut.lastIndexOf(' ');
    const trimmed = (lastSpace > 30 ? cut.slice(0, lastSpace) : cut).trim();
    return trimmed.endsWith('…') ? trimmed : `${trimmed}…`;
}
function slugifyTitle(title) {
    const s = title
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, SLUG_MAX_BASE);
    return s || 'question';
}
function buildForumSlug(title, questionId) {
    const base = slugifyTitle(title);
    const frag = questionId.replace(/-/g, '').slice(0, SLUG_ID_LEN);
    return `${base}-${frag}`;
}
function forumSlugIdFragment(slugOrId) {
    const part = slugOrId.split('-').pop()?.trim();
    if (!part || part.length < SLUG_ID_LEN)
        return null;
    return part.slice(0, SLUG_ID_LEN);
}
//# sourceMappingURL=slugify.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FORUM_SLUG_TO_CATEGORIES = void 0;
exports.getCategoriesForForumSlug = getCategoriesForForumSlug;
exports.isValidForumCategorySlug = isValidForumCategorySlug;
exports.FORUM_SLUG_TO_CATEGORIES = {
    'diabetes-management': ['Diabetes'],
    'heart-disease-heart-blockage': ['Heart Health'],
    'obesity-metabolic-health': ['Weight Management'],
    'hypertension-high-blood-pressure': ['Blood Pressure'],
    'lifestyle-disorders-preventive': ['Lifestyle & Diet'],
};
function getCategoriesForForumSlug(slug) {
    return exports.FORUM_SLUG_TO_CATEGORIES[slug] ?? null;
}
function isValidForumCategorySlug(slug) {
    return slug in exports.FORUM_SLUG_TO_CATEGORIES;
}
//# sourceMappingURL=forum-category-map.js.map
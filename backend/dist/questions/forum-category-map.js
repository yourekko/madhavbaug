"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FORUM_SLUG_TO_CATEGORIES = void 0;
exports.getCategoriesForForumSlug = getCategoriesForForumSlug;
exports.isValidForumCategorySlug = isValidForumCategorySlug;
exports.FORUM_SLUG_TO_CATEGORIES = {
    'diabetes-management': ['Diabetes'],
    'heart-disease-heart-blockage': ['Heart', 'Heart Health'],
    'obesity-metabolic-health': ['Weight Management', 'Weight Loss'],
    'hypertension-high-blood-pressure': ['Blood Pressure', 'Hypertension'],
    'lifestyle-disorders-preventive': [
        'Lifestyle & Diet',
        'Skin Care',
        'Hair Loss / Hair Fall',
        'Thyroid',
        'PCOD / PCOS',
        'Joint Pain',
        'Kidney',
        'Piles',
        'Arthritis',
    ],
};
function getCategoriesForForumSlug(slug) {
    return exports.FORUM_SLUG_TO_CATEGORIES[slug] ?? null;
}
function isValidForumCategorySlug(slug) {
    return slug in exports.FORUM_SLUG_TO_CATEGORIES;
}
//# sourceMappingURL=forum-category-map.js.map
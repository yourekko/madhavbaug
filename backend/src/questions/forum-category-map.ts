/** Forum URL segment → question.category values (Ask Question form). */
export const FORUM_SLUG_TO_CATEGORIES: Record<string, string[]> = {
  'diabetes-management': ['Diabetes'],
  'heart-disease-heart-blockage': ['Heart Health'],
  'obesity-metabolic-health': ['Weight Management'],
  'hypertension-high-blood-pressure': ['Blood Pressure'],
  'lifestyle-disorders-preventive': ['Lifestyle & Diet'],
};

export function getCategoriesForForumSlug(slug: string): string[] | null {
  return FORUM_SLUG_TO_CATEGORIES[slug] ?? null;
}

export function isValidForumCategorySlug(slug: string): boolean {
  return slug in FORUM_SLUG_TO_CATEGORIES;
}

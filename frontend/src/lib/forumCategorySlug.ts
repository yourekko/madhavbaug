import type { ForumCategorySlug } from '../data/forumData';
import { DEFAULT_FORUM_SLUG } from '../data/forumData';

/**
 * Maps Ask / API category labels → forum URL slugs.
 * Keep aligned with `backend/src/questions/forum-category-map.ts`.
 */
const CATEGORY_LABEL_TO_SLUG: Record<string, ForumCategorySlug> = {
  Diabetes: 'diabetes-management',
  Heart: 'heart-disease-heart-blockage',
  'Heart Health': 'heart-disease-heart-blockage',
  Hypertension: 'hypertension-high-blood-pressure',
  'Blood Pressure': 'hypertension-high-blood-pressure',
  'Weight Loss': 'obesity-metabolic-health',
  'Weight Management': 'obesity-metabolic-health',
  'Lifestyle & Diet': 'lifestyle-disorders-preventive',
  'Skin Care': 'lifestyle-disorders-preventive',
  'Hair Loss / Hair Fall': 'lifestyle-disorders-preventive',
  Thyroid: 'lifestyle-disorders-preventive',
  'PCOD / PCOS': 'lifestyle-disorders-preventive',
  'Joint Pain': 'lifestyle-disorders-preventive',
  Kidney: 'lifestyle-disorders-preventive',
  Piles: 'lifestyle-disorders-preventive',
  Arthritis: 'lifestyle-disorders-preventive',
  Other: 'lifestyle-disorders-preventive',
};

export function forumSlugForCategoryLabel(category: string | null | undefined): ForumCategorySlug | null {
  if (!category?.trim()) return null;
  return CATEGORY_LABEL_TO_SLUG[category.trim()] ?? null;
}

export function forumPathForCategoryLabel(category: string | null | undefined): string {
  const slug = forumSlugForCategoryLabel(category) ?? DEFAULT_FORUM_SLUG;
  return `/forum/${slug}`;
}

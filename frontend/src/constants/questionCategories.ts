/**
 * Full list accepted by API + doctor expertise chips. Keep aligned with backend
 * `backend/src/common/constants/question-categories.ts` (`QUESTION_CATEGORY_VALUES`).
 */
export const QUESTION_CATEGORY_ALL = [
  'Heart',
  'Diabetes',
  'Hypertension',
  'Weight Loss',
  'PCOD / PCOS',
  'Joint Pain',
  'Kidney',
  'Skin Care',
  'Hair Loss / Hair Fall',
  'Thyroid',
  'Piles',
  'Arthritis',
  'Lifestyle & Diet',
  'Heart Health',
  'Blood Pressure',
  'Weight Management',
  'Other',
] as const;

/**
 * Patient “Ask Question” dropdown — aligned to the 5 public forum hubs
 * (see `FORUM_NAV_ITEMS` / `forum-category-map`). Broader labels remain in
 * `QUESTION_CATEGORY_ALL` for doctor expertise + legacy rows.
 */
export const QUESTION_CATEGORY_OPTIONS = [
  'Diabetes',
  'Heart',
  'Hypertension',
  'Weight Loss',
  'Lifestyle & Diet',
] as const;

export const QUESTION_CATEGORY_PLACEHOLDER = 'Select your condition';

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
 * Patient “Ask Question” dropdown — newer labels only (legacy values remain valid via API).
 */
export const QUESTION_CATEGORY_OPTIONS = [
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
  'Other',
] as const;

export const QUESTION_CATEGORY_PLACEHOLDER = 'Select your condition';

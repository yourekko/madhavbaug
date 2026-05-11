/**
 * Canonical question categories — must match patient Ask dropdown + doctor expertise.
 * Backend `CreateQuestionDto` re-exports this as `CREATABLE_QUESTION_CATEGORIES`.
 */
export const QUESTION_CATEGORY_VALUES = [
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
  /** Legacy labels still stored on older rows / doctor tags */
  'Heart Health',
  'Blood Pressure',
  'Weight Management',
  'Other',
] as const;

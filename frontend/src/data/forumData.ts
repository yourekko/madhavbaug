/** Forum route config and static SEO copy. Question lists come from the API (`/public/forum/...`). */

export const FORUM_NAV_ITEMS = [
  { slug: 'diabetes-management', label: 'Diabetes Management' },
  { slug: 'heart-disease-heart-blockage', label: 'Heart Disease & Heart Blockage' },
  { slug: 'obesity-metabolic-health', label: 'Obesity & Metabolic Health' },
  { slug: 'hypertension-high-blood-pressure', label: 'Hypertension (High Blood Pressure)' },
  { slug: 'lifestyle-disorders-preventive', label: 'Lifestyle Disorders (Preventive Focus)' },
] as const;

export type ForumCategorySlug = (typeof FORUM_NAV_ITEMS)[number]['slug'];

export const FORUM_CATEGORY_SLUGS = FORUM_NAV_ITEMS.map((i) => i.slug) as readonly ForumCategorySlug[];

export const DEFAULT_FORUM_SLUG: ForumCategorySlug = 'diabetes-management';

export function isForumCategorySlug(s: string | undefined): s is ForumCategorySlug {
  return !!s && (FORUM_CATEGORY_SLUGS as readonly string[]).includes(s);
}

export function forumNavLabel(slug: ForumCategorySlug): string {
  return FORUM_NAV_ITEMS.find((i) => i.slug === slug)?.label ?? slug;
}

/** Fallback hero count if stats API fails; live count preferred. */
export const CATEGORY_META: Record<
  ForumCategorySlug,
  { title: string; pageTitle: string; description: string; answeredCount: number }
> = {
  'diabetes-management': {
    title: 'Diabetes Management',
    pageTitle: 'Diabetes Questions Answered by Doctors',
    description:
      'Browse medically reviewed answers from endocrinologists and diabetes specialists. Every response is verified for clinical accuracy.',
    answeredCount: 1247,
  },
  'heart-disease-heart-blockage': {
    title: 'Heart Disease & Blockage',
    pageTitle: 'Heart Disease & Heart Blockage — Doctor Answers',
    description:
      'Expert guidance on angina, coronary artery disease, stents, and heart-healthy living from cardiologists and cardiac care specialists.',
    answeredCount: 892,
  },
  'obesity-metabolic-health': {
    title: 'Obesity & Metabolic Health',
    pageTitle: 'Obesity & Metabolic Health — Expert Forum',
    description:
      'Medically reviewed answers on weight management, metabolic syndrome, NAFLD, and sustainable lifestyle change.',
    answeredCount: 634,
  },
  'hypertension-high-blood-pressure': {
    title: 'Hypertension',
    pageTitle: 'High Blood Pressure (Hypertension) — Doctor Q&A',
    description:
      'Clinician-reviewed answers on blood pressure targets, medications, home monitoring, and when to seek urgent care.',
    answeredCount: 756,
  },
  'lifestyle-disorders-preventive': {
    title: 'Lifestyle & Prevention',
    pageTitle: 'Lifestyle Disorders — Preventive Health Forum',
    description:
      'Preventive focus: stress, sleep, sedentary lifestyle, and early screening — answers from lifestyle medicine and GP specialists.',
    answeredCount: 521,
  },
};

export const RELATED_TOPIC_LINKS: Record<
  ForumCategorySlug,
  { label: string; count: string; slug: ForumCategorySlug }[]
> = {
  'diabetes-management': [
    { label: 'Heart disease & blockage', count: '892', slug: 'heart-disease-heart-blockage' },
    { label: 'Obesity & metabolic health', count: '634', slug: 'obesity-metabolic-health' },
    { label: 'Hypertension', count: '756', slug: 'hypertension-high-blood-pressure' },
    { label: 'Lifestyle & prevention', count: '521', slug: 'lifestyle-disorders-preventive' },
    { label: 'Blood sugar monitoring', count: '512', slug: 'diabetes-management' },
  ],
  'heart-disease-heart-blockage': [
    { label: 'Diabetes management', count: '1247', slug: 'diabetes-management' },
    { label: 'Hypertension', count: '756', slug: 'hypertension-high-blood-pressure' },
    { label: 'Obesity & metabolic health', count: '634', slug: 'obesity-metabolic-health' },
    { label: 'Lifestyle & prevention', count: '521', slug: 'lifestyle-disorders-preventive' },
    { label: 'Post-stent care', count: '289', slug: 'heart-disease-heart-blockage' },
  ],
  'obesity-metabolic-health': [
    { label: 'Diabetes management', count: '1247', slug: 'diabetes-management' },
    { label: 'Heart disease', count: '892', slug: 'heart-disease-heart-blockage' },
    { label: 'Hypertension', count: '756', slug: 'hypertension-high-blood-pressure' },
    { label: 'Lifestyle & prevention', count: '521', slug: 'lifestyle-disorders-preventive' },
    { label: 'NAFLD & diet', count: '412', slug: 'obesity-metabolic-health' },
  ],
  'hypertension-high-blood-pressure': [
    { label: 'Diabetes management', count: '1247', slug: 'diabetes-management' },
    { label: 'Heart disease', count: '892', slug: 'heart-disease-heart-blockage' },
    { label: 'Obesity & metabolic health', count: '634', slug: 'obesity-metabolic-health' },
    { label: 'Lifestyle & prevention', count: '521', slug: 'lifestyle-disorders-preventive' },
    { label: 'Home BP monitoring', count: '334', slug: 'hypertension-high-blood-pressure' },
  ],
  'lifestyle-disorders-preventive': [
    { label: 'Diabetes management', count: '1247', slug: 'diabetes-management' },
    { label: 'Heart disease', count: '892', slug: 'heart-disease-heart-blockage' },
    { label: 'Obesity & metabolic health', count: '634', slug: 'obesity-metabolic-health' },
    { label: 'Hypertension', count: '756', slug: 'hypertension-high-blood-pressure' },
    { label: 'Stress & sleep', count: '298', slug: 'lifestyle-disorders-preventive' },
  ],
};

export const HELPFUL_RESOURCE_LINKS: Record<ForumCategorySlug, { label: string; slug: ForumCategorySlug }[]> = {
  'diabetes-management': [
    { label: 'Diabetes diet guide', slug: 'diabetes-management' },
    { label: 'Blood sugar chart', slug: 'diabetes-management' },
    { label: 'Walking plan for beginners', slug: 'lifestyle-disorders-preventive' },
  ],
  'heart-disease-heart-blockage': [
    { label: 'Heart-healthy diet basics', slug: 'heart-disease-heart-blockage' },
    { label: 'Understanding stents', slug: 'heart-disease-heart-blockage' },
    { label: 'When to call emergency', slug: 'heart-disease-heart-blockage' },
  ],
  'obesity-metabolic-health': [
    { label: 'Portion control guide', slug: 'obesity-metabolic-health' },
    { label: 'NAFLD nutrition', slug: 'obesity-metabolic-health' },
    { label: 'Activity for weight loss', slug: 'lifestyle-disorders-preventive' },
  ],
  'hypertension-high-blood-pressure': [
    { label: 'Home BP diary template', slug: 'hypertension-high-blood-pressure' },
    { label: 'DASH diet overview', slug: 'hypertension-high-blood-pressure' },
    { label: 'Salt and packaged foods', slug: 'hypertension-high-blood-pressure' },
  ],
  'lifestyle-disorders-preventive': [
    { label: 'Sleep hygiene checklist', slug: 'lifestyle-disorders-preventive' },
    { label: 'Desk stretches', slug: 'lifestyle-disorders-preventive' },
    { label: 'Preventive screening by age', slug: 'lifestyle-disorders-preventive' },
  ],
};

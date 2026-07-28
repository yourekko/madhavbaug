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

/** Category page titles / descriptions. Live answered counts come from `/public/forum/stats`. */
export const CATEGORY_META: Record<
  ForumCategorySlug,
  { title: string; pageTitle: string; description: string }
> = {
  'diabetes-management': {
    title: 'Diabetes Management',
    pageTitle: 'Diabetes Questions Answered by Doctors',
    description:
      'Browse medically reviewed answers from endocrinologists and diabetes specialists. Every response is verified for clinical accuracy.',
  },
  'heart-disease-heart-blockage': {
    title: 'Heart Disease & Blockage',
    pageTitle: 'Heart Disease & Heart Blockage — Doctor Answers',
    description:
      'Expert guidance on angina, coronary artery disease, stents, and heart-healthy living from cardiologists and cardiac care specialists.',
  },
  'obesity-metabolic-health': {
    title: 'Obesity & Metabolic Health',
    pageTitle: 'Obesity & Metabolic Health — Expert Forum',
    description:
      'Medically reviewed answers on weight management, metabolic syndrome, NAFLD, and sustainable lifestyle change.',
  },
  'hypertension-high-blood-pressure': {
    title: 'Hypertension',
    pageTitle: 'High Blood Pressure (Hypertension) — Doctor Q&A',
    description:
      'Clinician-reviewed answers on blood pressure targets, medications, home monitoring, and when to seek urgent care.',
  },
  'lifestyle-disorders-preventive': {
    title: 'Lifestyle & Prevention',
    pageTitle: 'Lifestyle Disorders — Preventive Health Forum',
    description:
      'Preventive focus: stress, sleep, sedentary lifestyle, and early screening — answers from lifestyle medicine and GP specialists.',
  },
};

export const RELATED_TOPIC_LINKS: Record<ForumCategorySlug, { label: string; slug: ForumCategorySlug }[]> = {
  'diabetes-management': [
    { label: 'Heart disease & blockage', slug: 'heart-disease-heart-blockage' },
    { label: 'Obesity & metabolic health', slug: 'obesity-metabolic-health' },
    { label: 'Hypertension', slug: 'hypertension-high-blood-pressure' },
    { label: 'Lifestyle & prevention', slug: 'lifestyle-disorders-preventive' },
  ],
  'heart-disease-heart-blockage': [
    { label: 'Diabetes management', slug: 'diabetes-management' },
    { label: 'Hypertension', slug: 'hypertension-high-blood-pressure' },
    { label: 'Obesity & metabolic health', slug: 'obesity-metabolic-health' },
    { label: 'Lifestyle & prevention', slug: 'lifestyle-disorders-preventive' },
  ],
  'obesity-metabolic-health': [
    { label: 'Diabetes management', slug: 'diabetes-management' },
    { label: 'Heart disease', slug: 'heart-disease-heart-blockage' },
    { label: 'Hypertension', slug: 'hypertension-high-blood-pressure' },
    { label: 'Lifestyle & prevention', slug: 'lifestyle-disorders-preventive' },
  ],
  'hypertension-high-blood-pressure': [
    { label: 'Diabetes management', slug: 'diabetes-management' },
    { label: 'Heart disease', slug: 'heart-disease-heart-blockage' },
    { label: 'Obesity & metabolic health', slug: 'obesity-metabolic-health' },
    { label: 'Lifestyle & prevention', slug: 'lifestyle-disorders-preventive' },
  ],
  'lifestyle-disorders-preventive': [
    { label: 'Diabetes management', slug: 'diabetes-management' },
    { label: 'Heart disease', slug: 'heart-disease-heart-blockage' },
    { label: 'Obesity & metabolic health', slug: 'obesity-metabolic-health' },
    { label: 'Hypertension', slug: 'hypertension-high-blood-pressure' },
  ],
};

export const HELPFUL_RESOURCE_LINKS: Record<ForumCategorySlug, { label: string; slug: ForumCategorySlug }[]> = {
  'diabetes-management': [
    { label: 'Diabetes management forum', slug: 'diabetes-management' },
    { label: 'Lifestyle & prevention', slug: 'lifestyle-disorders-preventive' },
    { label: 'Obesity & metabolic health', slug: 'obesity-metabolic-health' },
  ],
  'heart-disease-heart-blockage': [
    { label: 'Heart disease forum', slug: 'heart-disease-heart-blockage' },
    { label: 'Hypertension forum', slug: 'hypertension-high-blood-pressure' },
    { label: 'Lifestyle & prevention', slug: 'lifestyle-disorders-preventive' },
  ],
  'obesity-metabolic-health': [
    { label: 'Obesity & metabolic health', slug: 'obesity-metabolic-health' },
    { label: 'Diabetes management', slug: 'diabetes-management' },
    { label: 'Lifestyle & prevention', slug: 'lifestyle-disorders-preventive' },
  ],
  'hypertension-high-blood-pressure': [
    { label: 'Hypertension forum', slug: 'hypertension-high-blood-pressure' },
    { label: 'Heart disease forum', slug: 'heart-disease-heart-blockage' },
    { label: 'Lifestyle & prevention', slug: 'lifestyle-disorders-preventive' },
  ],
  'lifestyle-disorders-preventive': [
    { label: 'Lifestyle & prevention', slug: 'lifestyle-disorders-preventive' },
    { label: 'Diabetes management', slug: 'diabetes-management' },
    { label: 'Obesity & metabolic health', slug: 'obesity-metabolic-health' },
  ],
};

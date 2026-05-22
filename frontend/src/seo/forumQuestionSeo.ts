import { extractQuestionTitle } from '../lib/questionSlug';

/** SEO title: primary keyword (category) + concise question (under ~60 chars before site suffix). */
export function buildForumQuestionSeoTitle(categoryLabel: string, body: string): string {
  const q = extractQuestionTitle(body, 58);
  return `${categoryLabel}: ${q}`;
}

/** Meta description ~150–160 chars with CTA for SERP. */
export function buildForumQuestionSeoDescription(
  body: string,
  opts?: { doctorName?: string; answerCount?: number },
): string {
  const lead = extractQuestionTitle(body, 120);
  const reviewed =
    opts?.answerCount && opts.answerCount > 0
      ? ` ${opts.answerCount} verified doctor ${opts.answerCount === 1 ? 'answer' : 'answers'}.`
      : ' Medically reviewed doctor answers.';
  const by = opts?.doctorName ? ` Reviewed by ${opts.doctorName}.` : '';
  const tail = ' Free health Q&A on Madhavbaug Health Forum.';
  const raw = `${lead}${reviewed}${by}${tail}`;
  if (raw.length <= 160) return raw;
  return `${lead.slice(0, 155 - tail.length).trim()}…${tail}`;
}

export function forumCategoryKeywords(categorySlug: string): string {
  const map: Record<string, string> = {
    'diabetes-management':
      'diabetes management, blood sugar, HbA1c, type 2 diabetes, prediabetes, diabetes diet India',
    'heart-disease-heart-blockage':
      'heart disease, heart blockage, angina, coronary artery disease, cardiac care, heart health',
    'obesity-metabolic-health':
      'obesity, weight loss, metabolic syndrome, BMI, NAFLD, healthy weight India',
    'hypertension-high-blood-pressure':
      'hypertension, high blood pressure, BP control, DASH diet, home blood pressure monitor',
    'lifestyle-disorders-preventive':
      'lifestyle disorders, preventive health, stress management, sleep, wellness',
  };
  return map[categorySlug] ?? 'health questions, doctor answers, medical advice India';
}

import { extractQuestionTitle } from '../lib/questionSlug';

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

/** SEO title: primary keyword (category) + concise question (under ~60 chars before site suffix). */
export function buildForumQuestionSeoTitle(categoryLabel: string, body: string): string {
  const q = extractQuestionTitle(body, 58);
  return `${categoryLabel}: ${q}`;
}

/**
 * Meta description ~150–160 chars.
 * Includes a short doctor-answer snippet so each published answer strengthens SERP copy.
 */
export function buildForumQuestionSeoDescription(
  body: string,
  opts?: {
    doctorName?: string;
    answerCount?: number;
    /** Plain text or HTML from the primary published answer */
    answerSnippet?: string | null;
  },
): string {
  const lead = extractQuestionTitle(body, 70);
  const answerPlain = opts?.answerSnippet ? stripHtml(opts.answerSnippet) : '';
  const answerBit = answerPlain
    ? ` Doctor answer: ${answerPlain.slice(0, 70).trim()}${answerPlain.length > 70 ? '…' : ''}`
    : opts?.answerCount && opts.answerCount > 0
      ? ` ${opts.answerCount} verified doctor ${opts.answerCount === 1 ? 'answer' : 'answers'}.`
      : ' Medically reviewed doctor answers.';
  const by = opts?.doctorName ? ` — ${opts.doctorName}.` : '';
  const tail = ' Madhavbaug Health Forum.';
  const raw = `${lead}${answerBit}${by}${tail}`;
  if (raw.length <= 160) return raw;
  return `${raw.slice(0, 157).trim()}…`;
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

/** Stable in-page anchor for a published answer (shareable, schema url). */
export function forumAnswerAnchorId(answerId: string): string {
  return `answer-${answerId}`;
}

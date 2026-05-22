/** Max slug base length — keeps URLs readable for SEO (Quora-style short slugs). */
const SLUG_MAX_BASE = 55;
const SLUG_ID_LEN = 8;

/**
 * Derive a short display title from free-form question text (first sentence or trimmed line).
 */
export function extractQuestionTitle(text: string, maxLen = 100): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) return 'Health question';

  const sentenceMatch = normalized.match(/^(.{10,220}?[.?!])(?:\s|$)/);
  if (sentenceMatch) {
    const sentence = sentenceMatch[1].trim();
    if (sentence.length <= maxLen) return sentence;
    return truncateAtWord(sentence, maxLen);
  }

  const firstLine = (normalized.split(/\n/)[0] ?? normalized).trim();
  if (firstLine.length <= maxLen) return firstLine;
  return truncateAtWord(firstLine, maxLen);
}

function truncateAtWord(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  const cut = text.slice(0, maxLen - 1);
  const lastSpace = cut.lastIndexOf(' ');
  const trimmed = (lastSpace > 30 ? cut.slice(0, lastSpace) : cut).trim();
  return trimmed.endsWith('…') ? trimmed : `${trimmed}…`;
}

export function slugifyTitle(title: string): string {
  const s = title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, SLUG_MAX_BASE);
  return s || 'question';
}

/** Stable public path segment: short title slug + id fragment (globally unique). */
export function buildForumSlug(title: string, questionId: string): string {
  const base = slugifyTitle(title);
  const frag = questionId.replace(/-/g, '').slice(0, SLUG_ID_LEN);
  return `${base}-${frag}`;
}

/** Resolve question by exact slug or trailing id fragment (legacy long URLs still work). */
export function forumSlugIdFragment(slugOrId: string): string | null {
  const part = slugOrId.split('-').pop()?.trim();
  if (!part || part.length < SLUG_ID_LEN) return null;
  return part.slice(0, SLUG_ID_LEN);
}

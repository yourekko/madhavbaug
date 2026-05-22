/** Mirrors backend `extractQuestionTitle` for consistent SEO titles at submit time. */
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

/** Public forum question URL — category slug + question slug (no `/question/` segment). */
export function forumQuestionPath(categorySlug: string, questionSlug: string): string {
  return `/forum/${categorySlug}/${encodeURIComponent(questionSlug)}`;
}

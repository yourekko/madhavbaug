/** True if HTML has real text (after stripping tags) or at least one image. */
export function answerHasMeaningfulContent(html: string): boolean {
  const s = html?.trim() ?? '';
  if (!s) return false;
  if (/<img\b/i.test(s)) return true;
  const text = s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return text.length >= 10;
}

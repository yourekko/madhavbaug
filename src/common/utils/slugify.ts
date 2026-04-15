export function slugifyTitle(title: string): string {
  const s = title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72);
  return s || 'question';
}

/** Stable public path segment: title slug + short id fragment (globally unique). */
export function buildForumSlug(title: string, questionId: string): string {
  const base = slugifyTitle(title);
  const frag = questionId.replace(/-/g, '').slice(0, 10);
  return `${base}-${frag}`;
}

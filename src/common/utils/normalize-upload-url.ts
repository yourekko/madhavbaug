/**
 * Coerce stored `/uploads/…` URLs to path-only so clients always resolve them against
 * their API base (avoids rows saved with SPA or proxy `Host`, e.g. madhavbaug.org).
 */
export function normalizePublicUploadPhotoUrl(stored: string | null | undefined): string | null {
  if (stored == null) return null;
  const s = String(stored).trim();
  if (!s) return null;
  try {
    const parsed = /^https?:\/\//i.test(s)
      ? new URL(s)
      : s.startsWith('//')
        ? new URL(`https:${s}`)
        : new URL(s.startsWith('/') ? s : `/${s}`, 'https://placeholder.invalid');
    if (parsed.pathname.startsWith('/uploads/')) {
      return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    }
  } catch {
    return s;
  }
  return s;
}

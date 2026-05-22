/**
 * Public URL paths for SEO (canonical, sitemap) — always include Vite `BASE_URL` (/forum/ on Hostinger).
 */
const BASE = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '') || '';

export function seoPublicPath(path: string): string {
  const raw = path.trim() || '/';
  const normalized = raw.startsWith('/') ? raw : `/${raw}`;
  if (!BASE) return normalized === '/' ? '/' : normalized;
  if (normalized === '/') return `${BASE}/`;
  if (normalized === BASE || normalized.startsWith(`${BASE}/`)) return normalized;
  return `${BASE}${normalized}`;
}

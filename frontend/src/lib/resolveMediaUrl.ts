import { API_BASE_URL } from './api';

const API_ORIGIN = API_BASE_URL.replace(/\/$/, '');

/**
 * Doctor photos and other local files live under `/uploads/` on the API server only.
 * Older rows may store `https://<wrong-host>/uploads/…` (e.g. SPA domain from a proxy Host
 * header). Always load those from `VITE_API_BASE_URL` so the `<img>` hits Render, not Hostinger.
 */
function rewriteLocalUploadsToApiOrigin(u: string): string | null {
  const s = u.trim();
  if (!s) return null;
  try {
    const parsed = /^https?:\/\//i.test(s)
      ? new URL(s)
      : s.startsWith('//')
        ? new URL(`https:${s}`)
        : new URL(s.startsWith('/') ? s : `/${s}`, `${API_ORIGIN}/`);
    if (!parsed.pathname.startsWith('/uploads/')) return null;
    return `${API_ORIGIN}${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return null;
  }
}

/** Turn API-relative paths (e.g. `/uploads/…`) into absolute URLs against the API origin. */
export function resolveMediaUrl(url: string | null | undefined): string | null {
  if (url == null) return null;
  const u = String(url).trim();
  if (!u) return null;

  const uploadsOnApi = rewriteLocalUploadsToApiOrigin(u);
  if (uploadsOnApi) return uploadsOnApi;

  if (/^https?:\/\//i.test(u)) return u;
  if (u.startsWith('//')) return u;
  const path = u.startsWith('/') ? u : `/${u}`;
  return `${API_ORIGIN}${path}`;
}

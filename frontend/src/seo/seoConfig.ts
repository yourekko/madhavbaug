/**
 * Central SEO configuration — update titles/descriptions here and set `VITE_SITE_URL`
 * in `.env` / Vercel so canonical URLs, Open Graph, and JSON-LD match production.
 */

function envSiteUrl(): string {
  const raw = import.meta.env.VITE_SITE_URL as string | undefined;
  if (raw && /^https?:\/\//i.test(raw)) {
    return raw.replace(/\/$/, '');
  }
  return 'https://www.madhavbaug.com';
}

export const seoConfig = {
  siteName: 'Madhavbaug Health Forum',
  brandName: 'Madhavbaug',
  get siteUrl() {
    return envSiteUrl();
  },
  defaultDescription:
    'Ask health questions and get medically verified answers from doctors. Ayurvedic cardiac care, diabetes, heart health, hypertension, and lifestyle guidance.',
  /** Used for og:image and twitter — place a 1200×630 asset in /public when ready */
  defaultOgImagePath: '/favicon.svg',
  /** Twitter @handle — leave empty string to omit meta tag */
  twitterSite: '',
} as const;

/** Page title in format: "Segment | Site name" — change separator or site name in seoConfig.siteName */
export function formatPageTitle(segment: string): string {
  const s = segment.trim();
  if (!s) return seoConfig.siteName;
  return `${s} | ${seoConfig.siteName}`;
}

export function absoluteUrl(path: string): string {
  const base = seoConfig.siteUrl.replace(/\/$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}

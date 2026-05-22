/**
 * Central SEO configuration — set `VITE_SITE_URL` in `.env.production` (e.g. https://madhavbaug.org).
 */
import { seoPublicPath } from './seoPaths';

function envSiteUrl(): string {
  const raw = import.meta.env.VITE_SITE_URL as string | undefined;
  if (raw && /^https?:\/\//i.test(raw)) {
    return raw.replace(/\/$/, '');
  }
  return 'https://madhavbaug.org';
}

export const seoConfig = {
  siteName: 'Madhavbaug Health Forum',
  brandName: 'Madhavbaug',
  get siteUrl() {
    return envSiteUrl();
  },
  defaultDescription:
    'Ask health questions and get medically verified answers from licensed doctors. Diabetes, heart disease, hypertension, obesity, and preventive care — trusted Ayurvedic & modern medical guidance.',
  /** Relative to site root + base path; use PNG/JPEG 1200×630 when available */
  defaultOgImagePath: 'madhavbaug-logo.png',
  twitterSite: '',
} as const;

export function formatPageTitle(segment: string): string {
  const s = segment.trim();
  if (!s) return seoConfig.siteName;
  return `${s} | ${seoConfig.siteName}`;
}

/** Absolute URL for canonical, OG, JSON-LD — path is app route (e.g. `/forum/ask`). */
export function absoluteUrl(path: string): string {
  const base = seoConfig.siteUrl.replace(/\/$/, '');
  const publicPath = seoPublicPath(path);
  return `${base}${publicPath.startsWith('/') ? publicPath : `/${publicPath}`}`;
}

export function defaultOgImageUrl(): string {
  const assetPath = seoPublicPath(seoConfig.defaultOgImagePath);
  return absoluteUrl(assetPath.startsWith('/') ? assetPath : `/${assetPath}`);
}

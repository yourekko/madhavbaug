import { API_BASE_URL } from './api';

export type PublicPageSeo = {
  slug: string;
  pageType: string;
  label: string;
  publicPath: string | null;
  publicUrl: string | null;
  isCustom?: boolean;
  title: string;
  metaDescription: string | null;
  robots: string;
  focusKeyword?: string | null;
  keywords?: string | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
  canonicalUrl?: string | null;
};

export async function fetchPublicPageSeo(slug: string): Promise<PublicPageSeo | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/public/seo/pages/${encodeURIComponent(slug)}`);
    if (!res.ok) return null;
    return (await res.json()) as PublicPageSeo;
  } catch {
    return null;
  }
}

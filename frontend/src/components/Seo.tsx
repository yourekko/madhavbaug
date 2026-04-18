import { Helmet } from 'react-helmet-async';
import { absoluteUrl, formatPageTitle, seoConfig } from '../seo/seoConfig';

type SeoProps = {
  /** Short segment (e.g. "Home") or full title if it already contains "|" */
  title: string;
  description?: string;
  /** Path only, e.g. `/ask` — used for canonical & og:url */
  canonicalPath: string;
  noindex?: boolean;
  ogType?: 'website' | 'article';
};

export function Seo({ title, description, canonicalPath, noindex, ogType = 'website' }: SeoProps) {
  const titleTag = title.includes('|') ? title.trim() : formatPageTitle(title.trim());
  const desc = (description ?? seoConfig.defaultDescription).trim();
  const canonical = absoluteUrl(canonicalPath);
  const ogImage = absoluteUrl(seoConfig.defaultOgImagePath);

  return (
    <Helmet>
      <title>{titleTag}</title>
      <meta name="description" content={desc} />
      <link rel="canonical" href={canonical} />
      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow" />
      )}

      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={titleTag} />
      <meta property="og:description" content={desc} />
      <meta property="og:url" content={canonical} />
      <meta property="og:site_name" content={seoConfig.siteName} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:locale" content="en_IN" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={titleTag} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={ogImage} />
      {seoConfig.twitterSite ? <meta name="twitter:site" content={seoConfig.twitterSite} /> : null}
    </Helmet>
  );
}

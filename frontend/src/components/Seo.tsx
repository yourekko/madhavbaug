import { Helmet } from 'react-helmet-async';
import { absoluteUrl, defaultOgImageUrl, formatPageTitle, seoConfig } from '../seo/seoConfig';

type SeoProps = {
  title: string;
  description?: string;
  /** App route path — canonical & og:url (use `seoPublicPath` patterns like `/forum/...`) */
  canonicalPath: string;
  noindex?: boolean;
  ogType?: 'website' | 'article';
  keywords?: string;
  ogImage?: string;
  /** ISO-8601 — for article / Q&A pages */
  publishedTime?: string;
  modifiedTime?: string;
  /** Extra JSON-LD objects (injected as separate script tags) */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
};

export function Seo({
  title,
  description,
  canonicalPath,
  noindex,
  ogType = 'website',
  keywords,
  ogImage,
  publishedTime,
  modifiedTime,
  jsonLd,
}: SeoProps) {
  const titleTag = title.includes('|') ? title.trim() : formatPageTitle(title.trim());
  const desc = (description ?? seoConfig.defaultDescription).trim();
  const canonical = absoluteUrl(canonicalPath);
  const image = ogImage ?? defaultOgImageUrl();

  const ldBlocks = jsonLd
    ? Array.isArray(jsonLd)
      ? jsonLd
      : [jsonLd]
    : [];

  return (
    <Helmet>
      <html lang="en-IN" />
      <title>{titleTag}</title>
      <meta name="description" content={desc} />
      {keywords ? <meta name="keywords" content={keywords} /> : null}
      <link rel="canonical" href={canonical} />
      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      )}

      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={titleTag} />
      <meta property="og:description" content={desc} />
      <meta property="og:url" content={canonical} />
      <meta property="og:site_name" content={seoConfig.siteName} />
      <meta property="og:image" content={image} />
      <meta property="og:locale" content="en_IN" />
      {publishedTime ? <meta property="article:published_time" content={publishedTime} /> : null}
      {modifiedTime ? <meta property="article:modified_time" content={modifiedTime} /> : null}

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={titleTag} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={image} />
      {seoConfig.twitterSite ? <meta name="twitter:site" content={seoConfig.twitterSite} /> : null}

      {ldBlocks.map((block, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(block)}
        </script>
      ))}
    </Helmet>
  );
}

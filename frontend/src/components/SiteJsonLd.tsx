import { Helmet } from 'react-helmet-async';
import { seoConfig } from '../seo/seoConfig';

/** Organization + WebSite JSON-LD — extend fields as your SEO strategy requires */
export function SiteJsonLd() {
  const org = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: seoConfig.brandName,
    url: seoConfig.siteUrl,
    description: seoConfig.defaultDescription,
  };

  const website = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: seoConfig.siteName,
    url: seoConfig.siteUrl,
    publisher: { '@type': 'Organization', name: seoConfig.brandName },
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(org)}</script>
      <script type="application/ld+json">{JSON.stringify(website)}</script>
    </Helmet>
  );
}

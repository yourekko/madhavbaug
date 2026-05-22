import { Helmet } from 'react-helmet-async';
import { absoluteUrl, seoConfig } from '../seo/seoConfig';
import { seoPublicPath } from '../seo/seoPaths';

/** Organization + WebSite JSON-LD (site-wide) */
export function SiteJsonLd() {
  const siteRoot = absoluteUrl(seoPublicPath('/forum'));

  const org = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: seoConfig.brandName,
    url: seoConfig.siteUrl,
    description: seoConfig.defaultDescription,
    logo: absoluteUrl(seoPublicPath(seoConfig.defaultOgImagePath)),
  };

  const website = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: seoConfig.siteName,
    url: siteRoot,
    inLanguage: 'en-IN',
    publisher: { '@type': 'Organization', name: seoConfig.brandName },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteRoot}?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(org)}</script>
      <script type="application/ld+json">{JSON.stringify(website)}</script>
    </Helmet>
  );
}

/**
 * After `vite build`, writes dist/robots.txt and dist/sitemap.xml for Hostinger.
 * Fetches live question URLs from the API sitemap when reachable.
 */
import { mkdir, writeFile } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = join(__dirname, '..', 'dist');

const siteUrl = (process.env.VITE_SITE_URL || 'https://madhavbaug.org').replace(/\/$/, '');
const basePath = (process.env.VITE_BASE_PATH || '/forum/').replace(/\/?$/, '/');
const apiBase = (process.env.VITE_API_BASE_URL || 'https://madhavbaug.onrender.com').replace(
  /\/$/,
  '',
);

const robots = `# Madhavbaug Health Forum
User-agent: *
Allow: ${basePath}

Sitemap: ${siteUrl}${basePath}sitemap.xml
`;

async function fetchSitemapXml() {
  const url = `${apiBase}/public/forum/sitemap.xml`;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15_000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } catch (err) {
    console.warn('[generate-seo-static] API sitemap fetch failed:', err.message);
    return null;
  }
}

function fallbackSitemap() {
  const categories = [
    'diabetes-management',
    'heart-disease-heart-blockage',
    'obesity-metabolic-health',
    'hypertension-high-blood-pressure',
    'lifestyle-disorders-preventive',
  ];
  const urls = [
    { loc: `${siteUrl}${basePath}`, priority: '1.0' },
    { loc: `${siteUrl}${basePath}ask`, priority: '0.85' },
    ...categories.map((c) => ({
      loc: `${siteUrl}${basePath}${c}`,
      priority: '0.9',
    })),
  ];
  const nodes = urls
    .map(
      (u) =>
        `  <url><loc>${u.loc}</loc><changefreq>weekly</changefreq><priority>${u.priority}</priority></url>`,
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${nodes}\n</urlset>\n`;
}

async function main() {
  await mkdir(distDir, { recursive: true });
  await writeFile(join(distDir, 'robots.txt'), robots, 'utf8');

  const sitemap = (await fetchSitemapXml()) || fallbackSitemap();
  await writeFile(join(distDir, 'sitemap.xml'), sitemap, 'utf8');
  console.log('[generate-seo-static] wrote dist/robots.txt and dist/sitemap.xml');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

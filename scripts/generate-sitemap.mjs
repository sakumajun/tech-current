import fs from 'node:fs/promises';

const articles = JSON.parse(await fs.readFile('data/articles.json', 'utf8'));
const base = 'https://tech-current.net';
const escapeXml = (value) => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&apos;');

const entries = [{ ja: base + '/', en: base + '/en/' }];
for (const article of articles) {
  // Match both Astro getStaticPaths() filters so every listed URL has a generated page.
  if (article.status !== 'published' || !article.slug || !article.title ||
      !Array.isArray(article.body) || !article.en?.title ||
      !Array.isArray(article.en?.body)) continue;
  entries.push({
    ja: `${base}/articles/${article.slug}/`,
    en: `${base}/en/articles/${article.slug}/`,
    lastmod: (article.updatedAt || article.publishedAt || '').slice(0, 10),
  });
}

const urls = entries.flatMap(({ ja, en, lastmod }) =>
  [ja, en].map((loc) => [
    '  <url>',
    `    <loc>${escapeXml(loc)}</loc>`,
    `    <xhtml:link rel="alternate" hreflang="ja" href="${escapeXml(ja)}" />`,
    `    <xhtml:link rel="alternate" hreflang="en" href="${escapeXml(en)}" />`,
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(ja)}" />`,
    ...(lastmod ? [`    <lastmod>${escapeXml(lastmod)}</lastmod>`] : []),
    '  </url>',
  ].join('\n'))
);
const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
  ...urls,
  '</urlset>',
  '',
].join('\n');
await fs.writeFile('public/sitemap.xml', xml, 'utf8');
console.log(`Generated bilingual sitemap: ${urls.length} URLs`);

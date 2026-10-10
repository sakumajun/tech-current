import fs from 'node:fs/promises';
const articles = JSON.parse(await fs.readFile('data/articles.json','utf8'));
if (!Array.isArray(articles)) throw new Error('Articles must be an array');
const ids = new Set(), slugs = new Set();
const allowed = new Set(['draft','review','published']);
for (const a of articles) {
  if (!/^TC-\d{4,}$/.test(a.articleId ?? '')) throw new Error('Invalid articleId: '+a.articleId);
  if (ids.has(a.articleId)) throw new Error('Duplicate articleId: '+a.articleId);
  ids.add(a.articleId);
  if (!allowed.has(a.status)) throw new Error('Invalid status: '+a.articleId);
  if (a.status !== 'published') continue;
  for (const key of ['slug','title','description','category','publishedAt','sourceUrl','sourceName']) {
    if (typeof a[key] !== 'string' || !a[key].trim()) throw new Error('Missing '+key+': '+a.articleId);
  }
  if (!/^[a-z0-9-]+$/.test(a.slug) || slugs.has(a.slug)) throw new Error('Invalid/duplicate slug: '+a.articleId);
  slugs.add(a.slug);
  if (!Array.isArray(a.body) || a.body.length < 2 || a.body.some(p=>typeof p !== 'string'||!p.trim())) throw new Error('Invalid body: '+a.articleId);
  if (!a.en || typeof a.en !== 'object') throw new Error('Missing English translation: '+a.articleId);
  for (const key of ['title','description','category','sourceName']) {
    if (typeof a.en[key] !== 'string' || !a.en[key].trim()) throw new Error('Missing English '+key+': '+a.articleId);
  }
  if (!Array.isArray(a.en.body) || a.en.body.length < 2 || a.en.body.some(p=>typeof p !== 'string'||!p.trim())) throw new Error('Invalid English body: '+a.articleId);
  if (!/^https:\/\//.test(a.sourceUrl)) throw new Error('Invalid source URL: '+a.articleId);
  if (Number.isNaN(Date.parse(a.publishedAt))) throw new Error('Invalid date: '+a.articleId);
}
console.log('Validated',articles.length,'articles;',articles.filter(a=>a.status==='published').length,'published');

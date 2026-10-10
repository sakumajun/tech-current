import fs from 'node:fs/promises';
import crypto from 'node:crypto';

const { sources } = JSON.parse(await fs.readFile('config/sources.json', 'utf8'));
const out = [];
const errors = [];
const decode = (s) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'");
const clean = (s) => decode(s.replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]*>/g, '').trim());
const tag = (body, name) => {
  const m = body.match(new RegExp('<' + name + '(?:\\s[^>]*)?>([\\s\\S]*?)<\\/' + name + '>', 'i'));
  return m ? clean(m[1]) : '';
};
const linkOf = (body, isAtom) => {
  if (!isAtom) return tag(body, 'link');
  const links = [...body.matchAll(/<link\b([^>]*?)\/?\s*>/gi)];
  for (const [, attrs] of links) {
    const href = attrs.match(/\bhref\s*=\s*["']([^"']+)["']/i)?.[1];
    const rel = attrs.match(/\brel\s*=\s*["']([^"']+)["']/i)?.[1];
    if (href && (!rel || rel === 'alternate')) return decode(href);
  }
  return '';
};
for (const source of sources) {
  try {
    const response = await fetch(source.url, {
      headers: { 'User-Agent': 'TechCurrentBot/0.2 (+news research)' },
      signal: AbortSignal.timeout(12000)
    });
    if (!response.ok) throw new Error('HTTP ' + response.status);
    const xml = await response.text();
    const rssItems = [...xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)].map(m => m[1]);
    const isAtom = rssItems.length === 0;
    const bodies = (isAtom ? [...xml.matchAll(/<entry\b[^>]*>([\s\S]*?)<\/entry>/gi)].map(m => m[1]) : rssItems).slice(0, 15);
    if (!bodies.length) throw new Error('No RSS items or Atom entries');
    for (const body of bodies) {
      const title = tag(body, 'title');
      const url = linkOf(body, isAtom);
      const rawDate = tag(body, 'pubDate') || tag(body, 'published') || tag(body, 'updated') || tag(body, 'dc:date');
      const date = rawDate && !Number.isNaN(Date.parse(rawDate)) ? new Date(rawDate).toISOString() : null;
      if (!title || !url) continue;
      if (!/^https:\/\//i.test(url)) continue;
      out.push({
        id: crypto.createHash('sha256').update(url).digest('hex').slice(0, 16),
        title, url, source: source.id, language: source.language,
        publishedAt: date, status: 'candidate'
      });
    }
  } catch (e) {
    errors.push({ source: source.id, error: String(e.message) });
  }
}
const unique = [...new Map(out.map(x => [x.url, x])).values()];
await fs.mkdir('data', { recursive: true });
await fs.writeFile('data/news-candidates.json', JSON.stringify({
  collectedAt: new Date().toISOString(),
  items: unique, errors
}, null, 2) + '\n');
console.log('Candidates:', unique.length, 'Missing dates:', unique.filter(x => !x.publishedAt).length, 'Errors:', errors.length);
if (errors.length) console.warn(JSON.stringify(errors, null, 2));
if (!unique.length) process.exitCode = 1;

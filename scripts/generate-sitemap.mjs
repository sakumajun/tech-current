import fs from 'node:fs/promises';
const articles = JSON.parse(await fs.readFile('data/articles.json', 'utf8'));
const base = 'https://tech-current.net';
const esc = v => String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const entries = [
  { ja: base+'/', en: base+'/en/' },
  ...articles.filter(a=>a.status==='published' && a.en).map(a=>({
    ja: base+'/articles/'+a.slug+'/',
    en: base+'/en/articles/'+a.slug+'/',
    lastmod: (a.updatedAt || a.publishedAt || '').slice(0,10)
  }))
];
const xml = '<?xml version="1.0" encoding="UTF-8"?>\n'+
'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n'+
entries.flatMap(e=>[e.ja,e.en].map(loc=>'<url><loc>'+esc(loc)+'</loc>'+
'<xhtml:link rel="alternate" hreflang="ja" href="'+esc(e.ja)+'"/>'+
'<xhtml:link rel="alternate" hreflang="en" href="'+esc(e.en)+'"/>'+
'<xhtml:link rel="alternate" hreflang="x-default" href="'+esc(e.ja)+'"/>'+
(e.lastmod?'<lastmod>'+e.lastmod+'</lastmod>':'')+'</url>')).join('\n')+
'\n</urlset>\n';
await fs.writeFile('public/sitemap.xml',xml);
console.log('Generated bilingual sitemap:', entries.length*2, 'URLs');

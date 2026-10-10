import fs from 'node:fs/promises';
import crypto from 'node:crypto';
const {sources}=JSON.parse(await fs.readFile('config/sources.json','utf8'));
const out=[];const errors=[];
for(const source of sources){
 try{
  const response=await fetch(source.url,{headers:{'User-Agent':'TechCurrentBot/0.1 (+news research)'},signal:AbortSignal.timeout(12000)});
  if(!response.ok)throw new Error('HTTP '+response.status);
  const xml=await response.text();
  const items=[...xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)].slice(0,15);
  for(const [,body] of items){
   const get=(tag)=>{const m=body.match(new RegExp('<'+tag+'(?:\\s[^>]*)?>([\\s\\S]*?)<\\/'+tag+'>','i'));return m?m[1].replace(/<!\[CDATA\[|\]\]>/g,'').replace(/<[^>]*>/g,'').trim():''};
   const title=get('title'),url=get('link');if(!title||!url)continue;
   out.push({id:crypto.createHash('sha256').update(url).digest('hex').slice(0,16),title,url,source:source.id,language:source.language,publishedAt:get('pubDate'),status:'candidate'});
  }
 }catch(e){errors.push({source:source.id,error:String(e.message)})}
}
const unique=[...new Map(out.map(x=>[x.url,x])).values()];
await fs.mkdir('data',{recursive:true});
await fs.writeFile('data/news-candidates.json',JSON.stringify({collectedAt:new Date().toISOString(),items:unique,errors},null,2)+'\n');
console.log('Candidates:',unique.length,'Errors:',errors.length);

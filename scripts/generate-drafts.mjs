import fs from 'node:fs/promises';
import crypto from 'node:crypto';

const candidates = JSON.parse(await fs.readFile('data/news-candidates.json','utf8')).items ?? [];
const articles = JSON.parse(await fs.readFile('data/articles.json','utf8'));
const existing = new Set(articles.map(a=>a.sourceUrl));
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) throw new Error('OPENAI_API_KEY is not configured. Set an Actions secret; do not commit a key.');
const limit = Math.min(5,Math.max(1,Number(process.env.DRAFT_LIMIT || 3)));
const sourceAllowlist = new Set(['openai','google-developers','github','huggingface','arxiv']);
const cutoff = Date.now()-7*24*60*60*1000;
const eligible = candidates.filter(x=>sourceAllowlist.has(x.source) && x.publishedAt && Date.parse(x.publishedAt)>=cutoff && !existing.has(x.url));
const weights = {openai:5,'google-developers':4,github:3,huggingface:2,arxiv:1};
eligible.sort((a,b)=>(weights[b.source]-weights[a.source]) || Date.parse(b.publishedAt)-Date.parse(a.publishedAt));
const selected = eligible.slice(0,limit);
const drafts=[],errors=[];
function extract(html) {
  const m = html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i) || html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i);
  const raw = (m?.[1] || html).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<nav\b[^>]*>[\s\S]*?<\/nav>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim();
  return raw.slice(0,15000);
}
function slug(title,id){return title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,65).replace(/-$/,'')+'-'+id.slice(0,6)}
async function generate(item,sourceText){
 const prompt = `You are an editor of TECH CURRENT, a Japanese technology news site. Use ONLY the supplied source excerpt. Do not invent facts, dates, numbers, quotes or availability. Do not reproduce or closely translate long source passages. Create original Japanese reporting, clearly separating reported facts from analysis. If evidence is insufficient, respond with {"skip":true,"reason":"..."}.
Return ONLY a JSON object with keys title,description,category,body,sourceVerified. body must be an array of 3 to 6 substantial Japanese paragraphs. category must be one of 生成AI,AIツール,ビジネス・DX,テクノロジー,解説・ガイド. sourceVerified must be true only if the excerpt has enough relevant substantive details to substantiate the article. Do not include markdown fences.
Source: ${item.source}
Headline: ${item.title}
Date: ${item.publishedAt}
URL: ${item.url}
Source text excerpt: ${sourceText}`;
 const response = await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json'},body:JSON.stringify({model:process.env.DRAFT_MODEL||'gpt-4.1-mini',temperature:0.2,response_format:{type:'json_object'},messages:[{role:'user',content:prompt}] }),signal:AbortSignal.timeout(90000)});
 if(!response.ok) throw new Error('AI API HTTP '+response.status+' '+(await response.text()).slice(0,300));
 const payload=await response.json();
 return JSON.parse(payload.choices?.[0]?.message?.content||'{}');
}
for(const item of selected){
 try {
  const r=await fetch(item.url,{headers:{'User-Agent':'Mozilla/5.0 (compatible; TechCurrentEditorial/0.1)'},signal:AbortSignal.timeout(15000)});
  if(!r.ok) throw new Error('Source HTTP '+r.status);
  const text=extract(await r.text());
  if(text.length<900) throw new Error('Insufficient extracted source text');
  const result=await generate(item,text);
  if(result.skip || result.sourceVerified!==true || !Array.isArray(result.body) || result.body.length<3 || !result.title || !result.description) throw new Error('Draft declined or incomplete: '+String(result.reason||'insufficient evidence'));
  drafts.push({draftId:'DRAFT-'+crypto.createHash('sha256').update(item.url).digest('hex').slice(0,12),sourceId:item.id,slug:slug(item.title,item.id),title:result.title,description:result.description,category:result.category,body:result.body,sourceName:item.source,sourceUrl:item.url,sourcePublishedAt:item.publishedAt,status:'draft',reviewRequired:true,generatedAt:new Date().toISOString()});
 }catch(e){errors.push({url:item.url,error:String(e.message)});}
}
await fs.mkdir('data',{recursive:true});
await fs.writeFile('data/generated-drafts.json',JSON.stringify({generatedAt:new Date().toISOString(),count:drafts.length,drafts,errors},null,2)+'\n');
console.log('Generated draft count:',drafts.length,'Errors:',errors.length);
if(errors.length) console.warn(JSON.stringify(errors,null,2));
if(!drafts.length) process.exitCode=1;

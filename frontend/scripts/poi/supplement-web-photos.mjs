import {readFile,writeFile,mkdir,rename,stat,open,rm,readdir} from 'node:fs/promises';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {photoUpdateMap,applyPhotoUpdates,placeNames,claimValues,needsIdentityReview} from './photo-sources.mjs';
import {yahooImages,naverImages,nativeImages,matchingWebImages,websiteImages,webPhoto,imageDimensions,publicHttpsUrl,samePhotoPlace} from './web-photo-sources.mjs';

const scriptDir=dirname(fileURLToPath(import.meta.url));
const root=resolve(process.env.POI_DATA_DIR || join(scriptDir,'../../public/poi'));
const cache=resolve(process.env.POI_WEB_CACHE_DIR || join(scriptDir,'.cache/web'));
const stage=process.env.POI_WEB_STAGE || 'all';
if(!['all','websites','search','native','manifest'].includes(stage))throw new Error('Invalid POI_WEB_STAGE');
const selected=process.env.POI_REGIONS?.split(',').map(s=>s.trim()).filter(Boolean);
const catalog=JSON.parse(await readFile(join(root,'index.json'),'utf8'));
if(selected?.some(id=>!catalog.regions.some(r=>r.id===id)))throw new Error('Unknown POI_REGIONS');
const limit=Number(process.env.POI_WEB_LIMIT || Infinity);
if(!(limit>0))throw new Error('Invalid POI_WEB_LIMIT');
const individual=process.env.POI_WEB_INDIVIDUAL || 'all';
const batchSize=Number(process.env.POI_WEB_BATCH_SIZE || 6);
if(!Number.isInteger(batchSize) || batchSize<1 || batchSize>6)throw new Error('Invalid POI_WEB_BATCH_SIZE');
if(!['all','linked'].includes(individual))throw new Error('Invalid POI_WEB_INDIVIDUAL');
const snapshots=[];for(const region of catalog.regions.filter(r=>r.file))snapshots.push(JSON.parse(await readFile(join(root,region.file),'utf8')));
const unique=photoUpdateMap(snapshots),targets=new Set(snapshots.filter(s=>!selected || selected.includes(s.region.id)).flatMap(s=>s.pois.map(p=>p.id)));
const missing=[...unique.values()].filter(p=>targets.has(p.id) && !p.photo && p.wikidataMismatch!=='human').slice(0,limit);
const regionFor=new Map();for(const s of snapshots)for(const p of s.pois)if(!regionFor.has(p.id))regionFor.set(p.id,s.region);
const before=[...unique.values()].filter(p=>p.photo).length;
const previous=JSON.parse(await readFile(join(root,'exports/photo-supplement-report.json'),'utf8').catch(()=>'null'));
const additions=[],errors=[],searched=new Map(),entities=new Map(),blocked=new Set(),nextRequest=new Map();
const nameCounts=new Map();for(const p of unique.values()){const name=placeNames(p)[0];if(name)nameCounts.set(name,(nameCounts.get(name)||0)+1);}
const photoPlaces=new Map();for(const p of unique.values())if(p.photo){const list=photoPlaces.get(p.photo.original)||[];list.push(p);photoPlaces.set(p.photo.original,list);}
let requests=0,stopping=false,lastSaved=0;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
await mkdir(cache,{recursive:true});
const lock=join(root,'.import-lock');await (await open(lock,'wx')).close();
for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>{stopping=true;console.info('[stopping] Saving completed photos after active requests finish');});
async function atomic(path,value){const tmp=path+'.'+process.pid+'.tmp';await writeFile(tmp,JSON.stringify(value));await rename(tmp,path);}
const cachePath=(kind,url)=>join(cache,kind+'-'+createHash('sha256').update(url).digest('hex')+'.json');
async function cached(kind,url){const path=cachePath(kind,url);try{if(Date.now()-(await stat(path)).mtimeMs<7*86400000)return JSON.parse(await readFile(path,'utf8'));}catch(error){if(error.code!=='ENOENT')throw error;}return null;}
async function paced(url){
  const host=new URL(url).hostname,waitUntil=Math.max(Date.now(),nextRequest.get(host)||0);
  const interval=host==='search.yahoo.co.jp' || host==='search.naver.com'?400:host==='msp.c.yimg.jp' || host==='search.pstatic.net'?75:250;
  nextRequest.set(host,waitUntil+interval);await sleep(Math.max(0,waitUntil-Date.now()));
}
async function response(url){
  if(!publicHttpsUrl(url))throw new Error('Only public HTTPS URLs are accepted');
  await paced(url);requests++;
  // No cookies, credentials, referrer spoofing, proxy rotation or challenge bypass.
  const result=await fetch(url,{headers:{'User-Agent':'chicTrip-POI/1.2 (https://github.com/wiwincolab/demo-repository)'},signal:AbortSignal.timeout(12000)});
  if(!result.ok){await result.body?.cancel();throw new Error('HTTP '+result.status);}
  if(!publicHttpsUrl(result.url)){await result.body?.cancel();throw new Error('Unexpected redirect');}
  return result;
}
async function html(url){
  const old=await cached('html',url);if(old)return old;
  const result=await response(url);
  if(!/text\/html|application\/xhtml\+xml/i.test(result.headers.get('content-type') || '')){await result.body?.cancel();throw new Error('Not an HTML page');}
  const reader=result.body.getReader(),parts=[];let length=0;
  try{while(true){const {value,done}=await reader.read();if(done)break;length+=value.length;if(length>3*1024*1024)throw new Error('HTML page too large');parts.push(Buffer.from(value));}}finally{await reader.cancel();}
  const buffer=Buffer.concat(parts),charset=result.headers.get('content-type')?.match(/charset=["']?([^;\s"']+)/i)?.[1] || buffer.toString('ascii',0,4000).match(/charset=["']?([\w-]+)/i)?.[1] || 'utf-8';
  let value;try{value=new TextDecoder(charset).decode(buffer);}catch{value=buffer.toString('utf8');}
  const data={url:result.url,html:value};await atomic(cachePath('html',url),data);return data;
}
async function dimensions(url){
  const old=await cached('image',url);if(old)return old;
  const result=await response(url);
  if(!/^image\/(jpeg|png|webp)/i.test(result.headers.get('content-type') || '') || Number(result.headers.get('content-length'))>4*1024*1024){await result.body?.cancel();return null;}
  const reader=result.body.getReader(),parts=[];let length=0,data=null;
  try{while(length<256*1024){const {value,done}=await reader.read();if(done)break;parts.push(Buffer.from(value));length+=value.length;data=imageDimensions(Buffer.concat(parts));if(data)break;}}finally{await reader.cancel();}
  if(data)await atomic(cachePath('image',url),data);return data;
}
async function assignFirst(p,items,method,query){
  for(const item of items.slice(0,4)){
    if(p.photo || stopping)return;
    if((photoPlaces.get(item.original) || []).some(other=>!samePhotoPlace(p,other)))continue;
    try{
      const photo=webPhoto(item,await dimensions(item.src),new Date().toISOString());if(!photo)continue;
      // Another website/search request might have completed while awaiting the image.
      if(p.photo)return;
      if((photoPlaces.get(photo.original) || []).some(other=>!samePhotoPlace(p,other)))continue;
      p.photo=photo;p.commonsFile=null;p.imageStatus='available';
      const places=photoPlaces.get(photo.original)||[];places.push(p);photoPlaces.set(photo.original,places);
      additions.push({id:p.id,name:p.name,country:p.country,method,query,matchedTitle:item.title,imageSource:photo.source});
      return;
    }catch(error){errors.push({stage:'web-image',id:p.id,url:item.src,message:error.message});}
  }
}
async function checkpoint(force=false){
  if(!force && Date.now()-lastSaved<30000)return;lastSaved=Date.now();
  const now=new Date().toISOString(),frozen=new Map([...unique].map(([id,p])=>[id,{...p}])),savedAdditions=[...additions],savedErrors=[...errors];
  for(const s of snapshots){const update=applyPhotoUpdates(s,frozen),count=update.pois.filter(p=>p.photo).length;if(update.changed || s.region.count!==update.pois.length || s.region.photoCount!==count){s.pois=update.pois;s.imagesUpdatedAt=now;s.region.count=s.pois.length;s.region.photoCount=count;s.pois.sort((a,b)=>Number(!!b.photo)-Number(!!a.photo) || Number(!!b.wikidata)-Number(!!a.wikidata) || a.name.localeCompare(b.name,'zh-Hant'));await atomic(join(root,'regions',s.region.id+'.json'),s);}}
  for(const r of catalog.regions){const s=snapshots.find(s=>s.region.id===r.id);if(s)r.photoCount=s.pois.filter(p=>p.photo).length;}
  if(additions.length && !catalog.sources.some(s=>s.name==='Source websites'))catalog.sources.push({name:'Source websites',url:'https://search.yahoo.co.jp/image/',license:'Per image; unspecified when the source provides no license'});
  catalog.totalWithPhoto=[...frozen.values()].filter(p=>p.photo).length;catalog.generatedAt=now;await atomic(join(root,'index.json'),catalog);
  const previousReasons=new Map((previous?.remaining || []).map(p=>[p.id,p.reason]));
  const remaining=[...frozen.values()].filter(p=>!p.photo).map(p=>({id:p.id,country:p.country,name:p.name,localName:p.localName,at:p.at,wikidata:p.wikidata,wikipedia:p.wikipedia,osmUrl:p.source.url,reason:searched.get(p.id) || previousReasons.get(p.id) || 'Not searched on the web yet'}));
  const report={...(previous || {}),generatedAt:now,before:previous?.before ?? before,after:catalog.totalWithPhoto,added:(previous?.added || 0)+savedAdditions.length,requests:(previous?.requests || 0)+requests,additions:[...(previous?.additions || []),...savedAdditions],errors:[...(previous?.errors || []),...savedErrors],remaining,
    web:{before,added:savedAdditions.length,requests,searched:searched.size,stopped:stopping,blockedProviders:[...blocked]}};
  await mkdir(join(root,'exports'),{recursive:true});await atomic(join(root,'exports/photo-supplement-report.json'),report);
}
async function workers(items,count,work,label){
  let cursor=0,done=0;
  await Promise.all(Array.from({length:count},async()=>{while(cursor<items.length && !stopping){const item=items[cursor++];await work(item);done++;if(done%50===0 || done===items.length){console.info(`[${label}] ${done}/${items.length}; added ${additions.length}; requests ${requests}`);await checkpoint();}}}));
  await checkpoint(true);
}
const krRegion={'kr-seoul':'서울','kr-busan':'부산','kr-jeju':'제주','kr-incheon':'인천','kr-suwon':'수원','kr-daejeon':'대전','kr-daegu':'대구','kr-gwangju':'광주','kr-gyeongju':'경주','kr-jeonju':'전주','kr-gangneung':'강릉','kr-sokcho':'속초 설악산','kr-chuncheon':'춘천','kr-yeosu-suncheon':'여수 순천','kr-andong':'안동','kr-pohang':'포항','kr-ulsan':'울산'};
function locations(p,specific=false){
  const language=p.country==='JP'?'ja':p.country==='KR'?'ko':'zh';
  const parents=claimValues(entities.get(p.wikidata),'P131').flatMap(value=>{const labels=entities.get(value?.id)?.labels;return [labels?.[language]?.value,labels?.en?.value];}).filter(Boolean);
  const addressLocations=p.country==='KR'?(p.address || '').match(/[가-힣]{1,10}?(?:특별자치시|광역시|특별시|시|군|구)/gu) || []:p.country==='JP'?(p.address || '').match(/[\p{L}]{1,10}?[都道府県市区町村]/gu) || []:(p.address || '').match(/[\p{L}]{1,6}?[縣市區鄉鎮]/gu) || [];
  const region=regionFor.get(p.id),fallback=p.country==='KR'?krRegion[region?.id]?.split(' '):region?.name?.split(/[・／]/);
  const aliases=[...parents,...addressLocations].map(value=>value.replace(/(?:特別市|廣域市|特别市|广域市|[都道府県縣市区區郡町村]|특별자치시|특별자치도|광역시|특별시|[시군구도]| (?:City|Prefecture|District|Ward))$/iu,'')).filter(value=>value.length>=2);
  return [...new Set([...parents,...aliases,...addressLocations,...(!specific ? fallback || [] : [])])];
}
function matchingOptions(p){const first=placeNames(p)[0],specific=p.category==='peak' || (nameCounts.get(first) || 0)>1 || (first?.length || 0)<=4;return {locations:locations(p,specific),requireLocation:specific,aliases:Object.values(entities.get(p.wikidata)?.labels || {}).map(label=>label.value)};}
function searchUrl(pois){
  const first=pois[0],region=regionFor.get(first.id),names=pois.map(p=>placeNames(p)[0].replace(/["|\\]/g,' '));
  const individualLocation=pois.length===1?locations(first)[0]:null;
  const location=individualLocation || (first.country==='KR'?krRegion[region?.id]:region?.name) || (first.country==='JP'?'日本':first.country==='KR'?'대한민국':'台灣');
  const query=(names.length===1?names[0]:'('+names.map(n=>'"'+n+'"').join(' OR ')+')')+' '+location;
  return {url:'https://search.yahoo.co.jp/image/search?'+new URLSearchParams({p:query}),query,provider:'yahoo'};
}
async function search(pois){
  pois=pois.filter(p=>!p.photo);if(!pois.length)return;
  const {url,query,provider}=searchUrl(pois);if(blocked.has(provider))return;
  try{
    const page=await html(url),items=provider==='naver'?naverImages(page.html):yahooImages(page.html);
    if(!items.length && /(?:verify you are human|unusual traffic|captcha challenge|자동입력 방지|不正なアクセス)/i.test(page.html)){blocked.add(provider);throw new Error('Search provider requested verification; stopped this provider');}
    for(const p of pois){if(p.photo)continue;await assignFirst(p,matchingWebImages(items,p,matchingOptions(p)),'web-search-first-match',query);searched.set(p.id,items.length?'No matching loadable photo in web search results':'Web search returned no images');}
  }catch(error){for(const p of pois)searched.set(p.id,'Web source request failed; needs retry');errors.push({stage:'web-search',ids:pois.map(p=>p.id),url,message:error.message});if(/HTTP (403|429|500|502|503|504)/.test(error.message)){blocked.add(provider);console.info('[search paused] '+provider+': '+error.message);}}
}
try {
  // Reuse the previously retrieved official website links, without new Wikidata calls.
  const entityCache=join(scriptDir,'.cache');
  for(const name of await readdir(entityCache).catch(()=>[])){if(!name.endsWith('.json'))continue;const data=JSON.parse(await readFile(join(entityCache,name),'utf8'));for(const[id,entity]of Object.entries(data.entities || {}))entities.set(id,{...entities.get(id),...entity});}
  const parents=[...new Set(missing.flatMap(p=>claimValues(entities.get(p.wikidata),'P131').map(v=>v?.id)).filter(id=>id && !entities.get(id)?.labels))];
  for(let i=0;i<parents.length && !stopping;i+=50){
    const url='https://www.wikidata.org/w/api.php?'+new URLSearchParams({action:'wbgetentities',format:'json',ids:parents.slice(i,i+50).join('|'),props:'labels',languages:'ja|ko|zh|zh-tw|en'});
    try{let data=await cached('labels',url);if(!data){const result=await response(url);data=await result.json();await atomic(cachePath('labels',url),data);}for(const[id,e]of Object.entries(data.entities || {}))entities.set(id,e);}catch(error){errors.push({stage:'web-location-labels',message:error.message});}
  }
  const safeMissing=missing.filter(p=>!needsIdentityReview(entities.get(p.wikidata)));
  if(stage==='manifest'){
    const rows=safeMissing.filter(p=>placeNames(p).length).map(p=>({id:p.id,query:searchUrl([p]).query}));
    await atomic(resolve(process.env.POI_WEB_TARGETS_FILE || join(cache,'targets.json')),rows);console.info(`[manifest] ${rows.length} web search targets`);
  }
  if(stage==='native'){
    if(!process.env.POI_WEB_RESULTS)throw new Error('POI_WEB_RESULTS is required');
    const input=JSON.parse(await readFile(resolve(process.env.POI_WEB_RESULTS),'utf8'));
    if(!Array.isArray(input))throw new Error('Expected a search-results array');
    const rows=input.flatMap(row=>row.targets ? row.targets.map(target=>({...target,items:nativeImages(row.result),error:row.error})) : [row]);
    await workers(rows,6,async row=>{const p=unique.get(row.id);if(!p || p.photo || !targets.has(p.id) || needsIdentityReview(entities.get(p.wikidata)))return;
      const verifiedPoint=row.dataset==='https://data.gov.tw/dataset/7777' && Array.isArray(row.sourceAt) && row.sourceAt.length===2 && row.sourceAt.every(Number.isFinite) && (row.items || []).every(i=>i.provider==='Official tourism data') && samePhotoPlace(p,{id:'official-source',country:p.country,at:row.sourceAt});
      const matches=matchingWebImages(row.items || [],p,verifiedPoint?{}:matchingOptions(p));
      await assignFirst(p,matches,'web-search-first-match',row.query);searched.set(p.id,row.error?'Web source request failed; needs retry':row.items?.length?'No matching loadable photo in web search results':'Web search returned no images');
    },'native-search-results');
  }
  if(stage==='all' || stage==='websites'){
    const sites=safeMissing.map(p=>({p,urls:[...new Set([p.website,...claimValues(entities.get(p.wikidata),'P856')].map(u=>publicHttpsUrl(u)).filter(Boolean))]})).filter(job=>job.urls.length);
    console.info(`[websites] ${sites.length} missing POIs have linked websites`);
    await workers(sites,6,async({p,urls})=>{for(const url of urls.slice(0,2)){if(p.photo || stopping)break;try{const page=await html(url);await assignFirst(p,websiteImages(page.html,page.url,p),'linked-website-first-photo',url);}catch(error){errors.push({stage:'web-website',id:p.id,url,message:error.message});}}},'websites');
  }
  if(stage==='all' || stage==='search'){
    const groups=new Map();for(const p of safeMissing.filter(p=>!p.photo && placeNames(p).length)){const key=p.country+'|'+regionFor.get(p.id)?.id;const list=groups.get(key)||[];list.push(p);groups.set(key,list);}
    const jobs=[];for(const list of groups.values())for(let i=0;i<list.length;i+=batchSize)jobs.push(list.slice(i,i+batchSize));
    console.info(`[search] ${jobs.length} batches; ${safeMissing.filter(p=>!p.photo).length} missing photos`);
    // Group queries preserve each result's order. Unmatched places are retried alone.
    await workers(jobs,4,search,'search-batches');
    const retry=safeMissing.filter(p=>!p.photo && placeNames(p).length && (individual==='all' || p.wikidata || p.website));
    console.info(`[search] ${retry.length} places need an individual query`);
    await workers(retry,4,p=>search([p]),'search-individual');
  }
  if(stage!=='manifest'){await checkpoint(true);console.info(`[done] added ${additions.length}; ${before} -> ${catalog.totalWithPhoto}; ${[...unique.values()].filter(p=>!p.photo).length} still missing; ${errors.length} source errors`);}
}finally{await rm(lock,{force:true});}

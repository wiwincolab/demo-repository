// Resolve missing photos through explicit OSM / Wikidata / article / Commons links.
// No nearby-photo substitution or fuzzy matching between different places.
import {readFile,writeFile,readdir,mkdir,rename,stat,open,rm} from 'node:fs/promises';
import {join,dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {commonsFile} from './model.mjs';
import {claimValues,needsIdentityReview,articleReference,resolvedPage,articleFiles,photographicPage,categoryPhoto,photoUpdateMap,applyPhotoUpdates,placeNames,photoSearchPhrase,photoSearchBatches,namedNearPlace,completeSearchCoordinates,nextPhotoSearchOffset} from './photo-sources.mjs';

const scriptDir=dirname(fileURLToPath(import.meta.url));
const root=resolve(process.env.POI_DATA_DIR || join(scriptDir,'../../public/poi'));
const cacheRoot=resolve(process.env.POI_CACHE_DIR || join(scriptDir,'.cache'));
const selected=process.env.POI_REGIONS?.split(',').map(s=>s.trim()).filter(Boolean);
const mode=process.env.POI_PHOTO_MODE || 'linked';
if(!['linked','geographic'].includes(mode))throw new Error('Invalid POI_PHOTO_MODE');
const catalog=JSON.parse(await readFile(join(root,'index.json'),'utf8'));
if(selected?.some(id=>!catalog.regions.some(r=>r.id===id)))throw new Error('Unknown POI_REGIONS');
await mkdir(cacheRoot,{recursive:true});
const lock=join(root,'.import-lock');const handle=await open(lock,'wx');await handle.close();
for(const [signal,code] of [['SIGTERM',143],['SIGINT',130]])process.once(signal,async()=>{await rm(lock,{force:true});process.exit(code);});
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function atomic(path,value) {const tmp=path+'.'+process.pid+'.tmp';await writeFile(tmp,JSON.stringify(value));await rename(tmp,path);}
let nextRequest=0,requestCount=0;const errors=[];
function requestUrl(host,params) {return `https://${host}/w/api.php?${new URLSearchParams({action:'query',format:'json',...params})}`;}
function cachePath(url) {return join(cacheRoot,createHash('sha256').update(url).digest('hex')+'.json');}
async function cachedResponse(host,params) {
  const path=cachePath(requestUrl(host,params));
  try {if(Date.now()-(await stat(path)).mtimeMs<30*86400000)return JSON.parse(await readFile(path,'utf8'));}catch(error){if(error.code!=='ENOENT')throw error;}
  return null;
}
async function request(host,params) {
  const url=requestUrl(host,params),path=cachePath(url),cached=await cachedResponse(host,params);
  if(cached)return cached;
  const start=Math.max(Date.now(),nextRequest);nextRequest=start+500;await sleep(Math.max(0,start-Date.now()));
  for(let attempt=0;attempt<3;attempt++) {
    const long=url.length>7000,headers={'User-Agent':'chicTrip-POI/1.1 (https://github.com/wiwincolab/demo-repository)',...(long?{'Content-Type':'application/x-www-form-urlencoded'}:{})};
    const response=await fetch(long?`https://${host}/w/api.php`:url,{headers,...(long?{method:'POST',body:url.slice(url.indexOf('?')+1)}:{}),signal:AbortSignal.timeout(30000)}).catch(()=>null);
    if(response?.ok) {const data=await response.json();if(data.error)throw new Error(data.error.info);await atomic(path,data);requestCount++;return data;}
    if(attempt===2 || (response && ![429,500,502,503,504].includes(response.status)))throw new Error(`HTTP ${response?.status || 'network'}: ${host}`);
    await sleep(Math.max(2000,Number(response?.headers.get('retry-after') || 0)*1000)*(attempt+1));
  }
}
async function batches(items,size,work,label) {
  for(let i=0;i<items.length;i+=size) {await work(items.slice(i,i+size));if(i%100===0 || i+size>=items.length)console.info(`[${label}] ${Math.min(i+size,items.length)}/${items.length}`);}
}
async function parallel(items,work,label) {
  let cursor=0,done=0;
  await Promise.all(Array.from({length:2},async()=>{while(cursor<items.length){const item=items[cursor++];await work(item);done++;if(done%25===0 || done===items.length)console.info(`[${label}] ${done}/${items.length}`);}}));
}
try {
  const snapshots=[];for(const r of catalog.regions.filter(r=>r.file)){snapshots.push(JSON.parse(await readFile(join(root,r.file),'utf8')));}
  const unique=photoUpdateMap(snapshots);
  const overrides=JSON.parse(await readFile(join(scriptDir,'photo-overrides.json'),'utf8'));
  const corrections=[];
  for(const [id,override]of Object.entries(overrides)){const p=unique.get(id);if(p && p.wikidata===override.previousWikidata){p.wikidata=override.wikidata;p.name=override.name || p.name;p.description=null;corrections.push({id,...override});}}
  const targets=new Set(snapshots.filter(s=>!selected || selected.includes(s.region.id)).flatMap(s=>s.pois.map(p=>p.id)));
  const missing=[...unique.values()].filter(p=>targets.has(p.id) && !p.photo && p.wikidataMismatch!=='human');
  const before=[...unique.values()].filter(p=>p.photo).length;
  const additions=[],searchedIds=new Set();
  function assign(p,file,photo,method,linkedSource) {
    p.photo=photo;p.commonsFile=photo.source.startsWith('https://commons.wikimedia.org/')?file:null;p.imageStatus='available';
    additions.push({id:p.id,name:p.name,country:p.country,method,linkedSource,imageSource:photo.source});
  }
  const entities=new Map(),osm=new Map(),cachedFiles=new Map();
  for(const name of await readdir(cacheRoot)) {
    if(!name.endsWith('.json'))continue;
    const path=join(cacheRoot,name);if(Date.now()-(await stat(path)).mtimeMs>30*86400000)continue;
    const data=JSON.parse(await readFile(path,'utf8'));
    for(const [id,entity] of Object.entries(data.entities || {}))entities.set(id,{...entities.get(id),...entity});
    for(const element of data.elements || [])if(element.tags)osm.set(`osm:${element.type}:${element.id}`,element.tags);
    for(const page of Object.values(data.query?.pages || {})){if(photographicPage(page) && page.imageinfo?.[0]?.descriptionurl?.startsWith('https://commons.wikimedia.org/'))cachedFiles.set(page.title.replaceAll('_',' '),page);}
  }
  if(mode==='linked') {
  const ids=[...new Set(missing.map(p=>p.wikidata).filter(Boolean))];
  await batches(ids,50,async batch=>{
    try {const data=await request('www.wikidata.org',{action:'wbgetentities',ids:batch.join('|'),props:'claims|labels|sitelinks',languages:'zh-tw|zh-hant|zh|en|ja|ko'});for(const[id,entity]of Object.entries(data.entities || {}))entities.set(id,entity);}
    catch(error){errors.push({stage:'wikidata',ids:batch,message:error.message});}
  },'entities');
  const candidates=new Map(),categories=new Map(),articles=new Map();
  function addFile(p,file,method,linkedSource,imageHost='commons.wikimedia.org') {if(typeof file!=='string' || !file || file.includes('|'))return;const list=candidates.get(p.id)||[];if(!list.some(v=>v.file===file && v.imageHost===imageHost))list.push({file,method,linkedSource,imageHost});candidates.set(p.id,list);}
  function addArticle(p,language,title) {const group=articles.get(language)||new Map();const list=group.get(title)||[];if(!list.includes(p))list.push(p);group.set(title,list);articles.set(language,group);}
  for(const p of missing) {
    const entity=entities.get(p.wikidata);if(needsIdentityReview(entity))continue;
    addFile(p,p.commonsFile,'osm-or-p18',p.wikidata?`https://www.wikidata.org/wiki/${p.wikidata}`:p.source.url);
    for(const file of claimValues(entity,'P18'))addFile(p,file,'wikidata-image',`https://www.wikidata.org/wiki/${p.wikidata}`);
    const tags=osm.get(p.id)||{};
    for(const tag of [tags.wikimedia_commons,tags.image]){const file=commonsFile(tag);if(file)addFile(p,file,'osm-image',p.source.url);}
    const categoryValues=[...claimValues(entity,'P373'),entity?.sitelinks?.commonswiki?.title?.replace(/^Category:/,''),tags.wikimedia_commons?.startsWith('Category:')?tags.wikimedia_commons.slice(9):null].filter(v=>typeof v==='string' && v);
    for(const category of new Set(categoryValues)){const list=categories.get(category)||[];list.push(p);categories.set(category,list);}
    const ref=articleReference(p.wikipedia);if(ref)addArticle(p,ref.language,ref.title);
    for(const lang of ['ja','ko','zh','en']){const title=entity?.sitelinks?.[lang+'wiki']?.title;if(title)addArticle(p,lang,title);}
  }
  for(const [language,group] of articles) {
    await batches([...group.keys()],25,async titles=>{
      try {
        const data=await request(language+'.wikipedia.org',{prop:'pageimages|pageprops|images',piprop:'name',pilicense:'free',ppprop:'wikibase_item',imlimit:'500',redirects:'1',titles:titles.join('|')});
        const articleCandidates=new Set();
        for(const title of titles){const page=resolvedPage(data,title);if(!page)continue;for(const p of group.get(title)){if(p.wikidata && page.pageprops?.wikibase_item!==p.wikidata)continue;const entity=entities.get(p.wikidata);for(const file of articleFiles(page,[p.name,p.localName,page.title,...Object.values(entity?.labels || {}).map(v=>v.value)])){addFile(p,file,file===page.pageimage?'wikipedia-lead':'wikipedia-named-photo',`https://${language}.wikipedia.org/wiki/${encodeURIComponent(page.title.replaceAll(' ','_'))}`,language+'.wikipedia.org');articleCandidates.add(file);}}}
        await batches([...articleCandidates],50,async files=>{
          const images=await request(language+'.wikipedia.org',{prop:'imageinfo',iiprop:'url|extmetadata|mime',iiurlwidth:'640',redirects:'1',titles:files.map(file=>'File:'+file).join('|')});
          for(const file of files){const page=resolvedPage(images,'File:'+file);if(page && photographicPage(page))for(const p of missing)for(const c of candidates.get(p.id)||[]){if(c.imageHost===language+'.wikipedia.org' && c.file.replaceAll('_',' ')===file.replaceAll('_',' '))c.photo=photographicPage(page);}}
        },'article-images');
      }catch(error){errors.push({stage:'wikipedia',language,titles,message:error.message});}
    },'articles-'+language);
  }
  const files=[...new Set([...candidates.values()].flatMap(list=>list.filter(v=>v.imageHost==='commons.wikimedia.org').map(v=>v.file)))];
  await batches(files.filter(file=>!cachedFiles.has('File:'+file.replaceAll('_',' '))),50,async batch=>{
    try {
      const data=await request('commons.wikimedia.org',{prop:'imageinfo',iiprop:'url|extmetadata|mime',iiurlwidth:'640',redirects:'1',titles:batch.map(f=>'File:'+f).join('|')});
      for(const file of batch){const page=resolvedPage(data,'File:'+file);if(page && photographicPage(page))cachedFiles.set('File:'+file.replaceAll('_',' '),page);}
    }catch(error){errors.push({stage:'files',files:batch,message:error.message});}
  },'files');
  for(const p of missing){for(const c of candidates.get(p.id)||[]){const photo=c.photo || (c.imageHost==='commons.wikimedia.org' && photographicPage(cachedFiles.get('File:'+c.file.replaceAll('_',' ')) || {}));if(photo){assign(p,c.file,photo,c.method,c.linkedSource);break;}}}
  const depictedPois=new Map();for(const p of missing.filter(p=>!p.photo && p.wikidata && !needsIdentityReview(entities.get(p.wikidata)))){const list=depictedPois.get(p.wikidata)||[];list.push(p);depictedPois.set(p.wikidata,list);}
  await batches([...depictedPois.keys()],40,async ids=>{
    try {
      const search='haswbstatement:'+ids.map(id=>'P180='+id).join('|');let offset;
      for(let pageNo=0;pageNo<3;pageNo++) {
        const data=await request('commons.wikimedia.org',{generator:'search',gsrnamespace:'6',gsrsearch:search,gsrlimit:'50',...(offset?{gsroffset:offset}:{}),prop:'imageinfo',iiprop:'url|extmetadata|mime',iiurlwidth:'640'});
        const pages=Object.values(data.query?.pages || {}).filter(page=>photographicPage(page));
        if(pages.length){const claims=await request('commons.wikimedia.org',{action:'wbgetentities',ids:pages.map(page=>'M'+page.pageid).join('|'),props:'claims'});for(const page of pages){const entity=claims.entities?.['M'+page.pageid];for(const value of claimValues(entity,'P180')){if(!ids.includes(value?.id))continue;for(const p of depictedPois.get(value.id)||[]){if(!p.photo)assign(p,page.title.slice(5),photographicPage(page),'commons-depicts',`https://commons.wikimedia.org/wiki/Special:EntityData/M${page.pageid}`);}}}}
        offset=data.continue?.gsroffset;if(offset===undefined)break;
      }
    }catch(error){errors.push({stage:'depicts',ids,message:error.message});}
  },'depicts');
  const remainingCategories=[...categories].filter(([,pois])=>pois.some(p=>!p.photo));
  await parallel(remainingCategories,async ([category,pois])=>{
    try {
      const data=await request('commons.wikimedia.org',{generator:'categorymembers',gcmtitle:'Category:'+category,gcmtype:'file',gcmlimit:'30',prop:'imageinfo',iiprop:'url|extmetadata|mime',iiurlwidth:'640'});
      for(const p of pois.filter(p=>!p.photo)){const entity=entities.get(p.wikidata),names=[p.name,p.localName,category,...Object.values(entity?.labels || {}).map(v=>v.value)];const choice=categoryPhoto(data,names);if(choice)assign(p,choice.file,choice.photo,'commons-category',`https://commons.wikimedia.org/wiki/Category:${encodeURIComponent(category.replaceAll(' ','_'))}`);}
    }catch(error){errors.push({stage:'category',category,message:error.message});}
  },'categories');
  }
  if(mode==='geographic') {
    const cells=new Map();
    for(const p of missing.filter(p=>placeNames(p).length && !needsIdentityReview(entities.get(p.wikidata)))) {
      const cell=[Math.floor(p.at[0]*2)/2+0.25,Math.floor(p.at[1]*2)/2+0.25],key=p.country+'|'+cell.join(',');
      const group=cells.get(key)||{cell,pois:[]};group.pois.push(p);cells.set(key,group);
    }
    const jobs=[];for(const group of cells.values())for(const pois of photoSearchBatches(group.pois))jobs.push({cell:group.cell,pois});
    await parallel(jobs,async ({cell,pois})=>{
      try {
        const search=`${photoSearchPhrase(pois)} nearcoord:50km,${cell[1]},${cell[0]}`;let offset;
        for(let pageNo=0;pageNo<3;pageNo++) {
          const params={generator:'search',gsrnamespace:'6|14',gsrsearch:search,gsrlimit:'50',...(offset?{gsroffset:offset}:{}),prop:'coordinates|pageprops|imageinfo',coprimary:'all',iiprop:'url|extmetadata|mime',iiurlwidth:'640'};
          // Reuse previous searches, but request all primary coordinates in one call for new searches.
          let data=await cachedResponse('commons.wikimedia.org',params) || await request('commons.wikimedia.org',{...params,coprimary:'primary',colimit:'max'});
          const pages=Object.values(data.query?.pages || {});
          if(pages.length && (data.continue?.cocontinue || pages.some(page=>!page.coordinates?.length))) {
            const coordinates=await request('commons.wikimedia.org',{prop:'coordinates',pageids:pages.map(page=>page.pageid).join('|'),coprimary:'primary',colimit:'max'});
            data=completeSearchCoordinates(data,coordinates);
          }
          for(const page of Object.values(data.query?.pages || {})) {
            const matches=pois.filter(p=>!p.photo && namedNearPlace(page,p));if(!matches.length)continue;
            if(page.ns===6){const photo=photographicPage(page);if(photo)for(const p of matches)assign(p,page.title.slice(5),photo,'commons-name-and-location',photo.source);}
            else if(page.ns===14){const images=await request('commons.wikimedia.org',{generator:'categorymembers',gcmtitle:page.title,gcmtype:'file',gcmlimit:'30',prop:'imageinfo',iiprop:'url|extmetadata|mime',iiurlwidth:'640'});for(const p of matches.filter(p=>!p.photo)){const choice=categoryPhoto(images,placeNames(p));if(choice)assign(p,choice.file,choice.photo,'commons-category-and-location','https://commons.wikimedia.org/wiki/'+encodeURIComponent(page.title.replaceAll(' ','_')));}}
          }
          offset=nextPhotoSearchOffset(data,offset);if(offset===undefined || pois.every(p=>p.photo))break;
        }
        for(const p of pois)searchedIds.add(p.id);
      }catch(error){errors.push({stage:'name-and-location',ids:pois.map(p=>p.id),message:error.message});}
    },'name-and-location');
  }
  const now=new Date().toISOString();
  for(const snapshot of snapshots){const update=applyPhotoUpdates(snapshot,unique);if(update.changed){snapshot.pois=update.pois;snapshot.imagesUpdatedAt=now;snapshot.pois.sort((a,b)=>Number(!!b.photo)-Number(!!a.photo) || Number(!!b.wikidata)-Number(!!a.wikidata) || a.name.localeCompare(b.name,'zh-Hant'));await atomic(join(root,'regions',snapshot.region.id+'.json'),snapshot);}}
  for(const region of catalog.regions){const snapshot=snapshots.find(s=>s.region.id===region.id);if(snapshot)region.photoCount=snapshot.pois.filter(p=>p.photo).length;}
  if([...unique.values()].some(p=>p.photo?.source && new URL(p.photo.source).hostname.endsWith('.wikipedia.org')) && !catalog.sources.some(source=>source.name==='Wikipedia'))catalog.sources.push({name:'Wikipedia',url:'https://www.wikipedia.org/',license:'Per image'});
  catalog.totalWithPhoto=[...unique.values()].filter(p=>p.photo).length;catalog.generatedAt=now;await atomic(join(root,'index.json'),catalog);
  const report={generatedAt:now,before,after:catalog.totalWithPhoto,added:additions.length,requests:requestCount,errors,corrections,additions,remaining:[...unique.values()].filter(p=>targets.has(p.id) && !p.photo).map(p=>({id:p.id,country:p.country,name:p.name,localName:p.localName,at:p.at,wikidata:p.wikidata,wikipedia:p.wikipedia,osmUrl:p.source.url,reason:p.wikidataMismatch==='human' || needsIdentityReview(entities.get(p.wikidata)) ? 'Linked identity is a person, list or disambiguation; needs manual verification' : mode==='geographic' ? placeNames(p).length ? 'No verified photo after linked-source and name/location searches' : 'Ambiguous or short name; needs manual verification' : p.wikidata || p.wikipedia || osm.get(p.id)?.wikimedia_commons ? 'No verified photo from linked sources' : 'No linked image source'}))};
  if(mode==='geographic'){const previous=JSON.parse(await readFile(join(root,'exports','photo-supplement-report.json'),'utf8').catch(()=>'null'));if(previous){report.before=previous.before;report.additions=[...previous.additions,...report.additions];report.added=report.additions.length;const resolved=error=>error.stage==='name-and-location' && error.ids.every(id=>searchedIds.has(id) || unique.get(id)?.photo);report.resolvedErrors=[...(previous.resolvedErrors || []),...previous.errors.filter(resolved).map(error=>({...error,resolvedAt:now}))];report.errors=[...previous.errors.filter(error=>!resolved(error)),...report.errors];report.corrections=[...(previous.corrections || []),...report.corrections];report.requests+=previous.requests;}}
  await mkdir(join(root,'exports'),{recursive:true});await atomic(join(root,'exports','photo-supplement-report.json'),report);
  console.info(`[done] added ${additions.length}; ${before} -> ${catalog.totalWithPhoto}; ${report.remaining.length} still missing; ${errors.length} source errors`);
}finally{await rm(lock,{force:true});}

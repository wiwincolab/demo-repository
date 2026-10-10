import { mkdir, readFile, writeFile, rename, stat, open, rm } from 'node:fs/promises';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { regions } from './regions.mjs';
import { normalize, queryFor, landmarkQuery, commonsPhoto, deduplicate } from './model.mjs';

const root = resolve(process.env.POI_DATA_DIR || join(dirname(fileURLToPath(import.meta.url)), '../../public/poi'));
const cacheRoot = process.env.POI_CACHE_DIR || (process.env.POI_DATA_DIR ? join(root,'cache') : join(dirname(fileURLToPath(import.meta.url)),'.cache'));
const stage = process.env.POI_STAGE || 'all';
const landmarks = process.env.POI_SOURCE === 'landmarks';
const selected = process.env.POI_REGIONS?.trim() ? process.env.POI_REGIONS.split(',').map(s=>s.trim()) : null;
const targets = selected ? regions.filter(r=>selected.includes(r.id)) : regions;
if (!targets.length || selected?.some(id=>!regions.some(r=>r.id===id)) || !['all','poi','images'].includes(stage)) throw new Error('Invalid POI_REGIONS or POI_STAGE');
const endpoint = process.env.POI_OVERPASS_URL || 'https://overpass-api.de/api/interpreter';
const userAgent = 'chicTrip-POI/1.0 (https://github.com/wiwincolab/demo-repository)';
const delay = ms => new Promise(resolve=>setTimeout(resolve,ms));
const cacheDays = Number(process.env.POI_CACHE_DAYS || 7);
await mkdir(cacheRoot,{recursive:true});
await mkdir(join(root,'regions'),{recursive:true});
// A single writer per PVC prevents simultaneous deployments from overwriting snapshots.
const lock = join(root,'.import-lock');
const handle = await open(lock,'wx').catch(()=>{throw new Error('Another importer holds .import-lock; inspect that Job before removing a stale lock.');});
await handle.writeFile(`${process.pid}\n${new Date().toISOString()}\n`);
await handle.close();
for(const [signal,code] of [['SIGTERM',143],['SIGINT',130]])process.once(signal,async()=>{await rm(lock,{force:true});process.exit(code);});
async function atomic(path,value) {
  const temp = `${path}.${process.pid}.tmp`;
  await writeFile(temp,JSON.stringify(value)); await rename(temp,path);
}
async function json(path) { try { return JSON.parse(await readFile(path,'utf8')); } catch(e) { if(e.code==='ENOENT')return null;throw e; } }
async function request(url, options={}, ttlDays=cacheDays) {
  const key = createHash('sha256').update(url + (options.body || '')).digest('hex');
  const path = join(cacheRoot,`${key}.json`);
  try { if(Date.now()-(await stat(path)).mtimeMs < ttlDays*86400000)return await json(path); } catch(e) { if(e.code !== 'ENOENT')throw e; }
  for(let attempt=0;attempt<3;attempt++) {
    const response = await fetch(url,{...options,headers:{'User-Agent':userAgent,...options.headers},signal:AbortSignal.timeout(85000)}).catch(error=>({ok:false,status:0,error}));
    if(response.ok) { const data = await response.json(); if(data.error || data.remark) throw new Error(data.error?.info || data.remark); await atomic(path,data); await delay(url===endpoint ? 5000 : 350); return data; }
    if(![0,429,406,502,503,504].includes(response.status) || attempt===2)throw new Error(`HTTP ${response.status} from ${new URL(url).host}`);
    const pause=Math.max(30000,Number(response.headers?.get('retry-after') || 0)*1000) * (attempt+1);
    console.warn(`[retry] ${new URL(url).host}: HTTP ${response.status}; pause ${pause/1000}s`);
    await delay(pause);
  }
}
const summary = new Map();
async function index() {
  const unique = new Map();
  const entries=[];
  for(const region of regions) {
    const snapshot = await json(join(root,'regions',`${region.id}.json`));
    const failure = summary.get(region.id);
    const pois=snapshot?.pois || [];
    for(const p of pois)unique.set(p.id,p);
    entries.push({...region,status:snapshot?'ready':failure?'failed':'pending',count:pois.length,photoCount:pois.filter(p=>p.photo).length,fetchedAt:snapshot?.fetchedAt || null, ...(failure?{error:failure}:{}),file:snapshot?`regions/${region.id}.json`:null});
  }
  const data = {schemaVersion:1,generatedAt:new Date().toISOString(),coverage:'Curated bounding boxes of travel areas; not an exhaustive national inventory or a popularity ranking.',sources:[{name:'OpenStreetMap',url:'https://www.openstreetmap.org/copyright',license:'ODbL-1.0'},{name:'Wikidata',url:'https://www.wikidata.org/wiki/Wikidata:Licensing',license:'CC0-1.0'},{name:'Wikimedia Commons',url:'https://commons.wikimedia.org',license:'Per image'}],totalUnique:unique.size,totalWithPhoto:[...unique.values()].filter(p=>p.photo).length,regions:entries};
  await atomic(join(root,'index.json'),data);
  return data;
}
try {
  if(stage !== 'images') {
    for(const region of targets) {
      try {
        // Island areas already use the country-intersected full query; do not add mainland points.
        if(landmarks && ['tw-kinmen','tw-matsu'].includes(region.id))continue;
        const query=landmarks ? landmarkQuery(region) : queryFor(region);
        const options={method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({data:query}).toString()};
        const data=await request(endpoint,options);
        if(!Array.isArray(data.elements))throw new Error('Overpass response missing elements');
        const fetchedAt=new Date().toISOString();
        const old = await json(join(root,'regions',`${region.id}.json`));
        const prior=new Map((old?.pois || []).map(p=>[p.id,p]));
        const fresh=data.elements.map(e=>normalize(e,region,fetchedAt)).filter(Boolean);
        const candidates=landmarks ? [...new Map([...(old?.pois || []),...fresh].map(p=>[p.id,p])).values()] : fresh;
        const pois=deduplicate(candidates).map(p=> {
          const before=prior.get(p.id);
          if(before?.wikidata===p.wikidata) {
            if(p.name===p.localName && before.name!==before.localName)p.name=before.name;
            p.description ||= before.description;
          }
          return before?.photo && before.wikidata===p.wikidata && before.commonsFile===p.commonsFile ? {...p,photo:before.photo,imageStatus:'available'} : p;
        });
        await atomic(join(root,'regions',`${region.id}.json`),{schemaVersion:1,region,fetchedAt,osmTimestamp:data.osm3s?.timestamp_osm_base || null,pois});
        console.info(`[poi] ${region.id}: ${pois.length}`);
        await index();
      } catch(error) {summary.set(region.id,error.message);console.error(`[poi] ${region.id}: ${error.message}`);await index();}
    }
  }
  if(stage !== 'poi') {
    const snapshots = (await Promise.all(targets.map(r=>json(join(root,'regions',`${r.id}.json`))))).filter(Boolean);
    const unique=new Map(snapshots.flatMap(s=>s.pois).map(p=>[p.id,p]));
    const entities=new Map(), images=new Map();
    // Resolve only articles already linked by the OSM record; no fuzzy name/image search.
    const articles=new Map();
    for(const p of unique.values()) {
      const match=!p.wikidata && p.wikipedia?.match(/^([a-z]{2,3}(?:-[a-z]+)?):(.+)$/);
      if(!match)continue;
      const [_,language,title]=match;
      const group=articles.get(language) || new Map();
      const linked=group.get(title) || [];linked.push(p);group.set(title,linked);articles.set(language,group);
    }
    for(const [language,group] of articles) {
      const titles=[...group.keys()];
      for(let i=0;i<titles.length;i+=25) {
        try {
          const params=new URLSearchParams({action:'query',format:'json',prop:'pageprops',ppprop:'wikibase_item',redirects:'1',titles:titles.slice(i,i+25).join('|')});
          const data=await request(`https://${language}.wikipedia.org/w/api.php?${params}`,{},30);
          const pages=new Map(Object.values(data.query?.pages || {}).map(p=>[p.title,p.pageprops?.wikibase_item]));
          for(const title of titles.slice(i,i+25)) {
            const normalized=data.query?.normalized?.find(n=>n.from===title)?.to || title.replaceAll('_',' ');
            const redirect=data.query?.redirects?.find(r=>r.from===normalized)?.to || normalized;
            const id=pages.get(redirect);
            if(/^Q\d+$/.test(id || ''))for(const p of group.get(title))p.wikidata=id;
          }
        } catch(error) {console.error(`[images] Wikipedia ${language}: ${error.message}`);}
      }
    }
    const ids=[...new Set([...unique.values()].filter(p=>!p.photo && p.wikidata).map(p=>p.wikidata))];
    for(let i=0;i<ids.length;i+=50) {
      try {
        const params=new URLSearchParams({action:'wbgetentities',ids:ids.slice(i,i+50).join('|'),props:'labels|claims|descriptions',languages:'zh-tw|zh-hant|zh|en|ja|ko',format:'json'});
        const data=await request(`https://www.wikidata.org/w/api.php?${params}`,{},30);
        for(const [id,entity] of Object.entries(data.entities || {})) {
          const statements=entity.claims?.P18 || [];
          const human=(entity.claims?.P31 || []).some(s=>s.mainsnak?.datavalue?.value?.id==='Q5');
          entities.set(id,{labels:entity.labels,descriptions:entity.descriptions,claims:{P18:statements},human});
        }
        console.info(`[images] Wikidata ${Math.min(i+50,ids.length)}/${ids.length}`);
      } catch(error) {console.error(`[images] Wikidata: ${error.message}`);}
    }
    for(const p of unique.values()) {
      const entity=entities.get(p.wikidata);
      if(entity?.human) {
        p.name=p.names['name:zh-Hant'] || p.names['name:zh-TW'] || p.names['name:zh'] || p.localName;
        p.description=null;p.commonsFile=null;p.photo=null;p.wikidataMismatch='human';
        continue;
      }
      const label=['zh-tw','zh-hant','zh'].map(l=>entity?.labels?.[l]?.value).find(Boolean);
      if(label)p.name=label;
      const description=['zh-tw','zh-hant','zh','en'].map(l=>entity?.descriptions?.[l]?.value).find(Boolean);
      if(description && !p.description)p.description=description;
      const statements=entity?.claims?.P18 || [];
      const image=statements.find(s=>s.rank==='preferred' && s.mainsnak?.datavalue?.value)?.mainsnak.datavalue.value || statements.find(s=>s.rank!=='deprecated' && s.mainsnak?.datavalue?.value)?.mainsnak.datavalue.value;
      if(!p.commonsFile && typeof image==='string')p.commonsFile=image;
    }
    const files=[...new Set([...unique.values()].filter(p=>!p.photo && p.commonsFile).map(p=>p.commonsFile))];
    for(let i=0;i<files.length;i+=50) {
      try {
        const params=new URLSearchParams({action:'query',format:'json',prop:'imageinfo',iiprop:'url|extmetadata|mime',iiurlwidth:'640',redirects:'1',titles:files.slice(i,i+50).map(f=>`File:${f}`).join('|')});
        const data=await request(`https://commons.wikimedia.org/w/api.php?${params}`,{},30);
        const photos=new Map(Object.values(data.query?.pages || {}).map(page=>[page.title,commonsPhoto(page)]));
        for(const f of files.slice(i,i+50)) {
          const title=`File:${f}`.replaceAll('_',' '), normalized=data.query?.normalized?.find(n=>n.from===`File:${f}`)?.to || title;
          const redirect=data.query?.redirects?.find(r=>r.from===normalized)?.to || normalized;
          images.set(f,photos.get(redirect) || null);
        }
        console.info(`[images] Commons ${Math.min(i+50,files.length)}/${files.length}`);
      } catch(error) {console.error(`[images] Commons: ${error.message}`);}
    }
    for(const p of unique.values()) {
      if(!p.photo && p.commonsFile && images.has(p.commonsFile))p.photo=images.get(p.commonsFile);
      p.imageStatus=p.photo?'available':(p.commonsFile && !images.has(p.commonsFile)) || (p.wikidata && !entities.has(p.wikidata))?'pending':'unavailable';
    }
    for(const snapshot of snapshots) {
      snapshot.pois=snapshot.pois.map(p=>unique.get(p.id)).sort((a,b)=>Number(!!b.photo)-Number(!!a.photo) || Number(!!b.wikidata)-Number(!!a.wikidata) || a.name.localeCompare(b.name,'zh-Hant'));
      snapshot.imagesUpdatedAt=new Date().toISOString();
      await atomic(join(root,'regions',`${snapshot.region.id}.json`),snapshot);
    }
  }
  const manifest=await index();
  console.info(`[done] ${manifest.totalUnique} unique POIs; ${manifest.totalWithPhoto} with licensed images; ${manifest.regions.filter(r=>r.status==='ready').length}/${regions.length} areas`);
  if(summary.size)process.exitCode=1;
} finally { await rm(lock,{force:true}); }

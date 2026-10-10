// A deployment Job publishes the researched snapshot to the API's read-only PVC.
// No network calls; refreshes are explicit runs of import.mjs.
import { readFile, writeFile, rename, mkdir, open, rm } from 'node:fs/promises';
import { join } from 'node:path';
const source=process.env.POI_SEED_DIR || '/srv/poi-seed';
const target=process.env.POI_DATA_DIR || '/data/poi';
await mkdir(join(target,'regions'),{recursive:true});
const lock=join(target,'.import-lock');
const handle=await open(lock,'wx');await handle.close();
for(const [signal,code] of [['SIGTERM',143],['SIGINT',130]])process.once(signal,async()=>{await rm(lock,{force:true});process.exit(code);});
async function json(path) {try{return JSON.parse(await readFile(path,'utf8'));}catch(error){if(error.code==='ENOENT')return null;throw error;}}
async function atomic(path,data) {const temp=`${path}.${process.pid}.tmp`;await writeFile(temp,JSON.stringify(data));await rename(temp,path);}
try {
  const seed=await json(join(source,'index.json'));
  if(!seed)throw new Error('No POI seed snapshot in image');
  const unique=new Map();
  for(const region of seed.regions) {
    const path=join(target,'regions',`${region.id}.json`);
    const existing=await json(path), shipped=await json(join(source,'regions',`${region.id}.json`));
    const version=s=>Date.parse(s?.imagesUpdatedAt || s?.fetchedAt || '1970-01-01');
    const snapshot=!existing || version(shipped)>version(existing) ? shipped : existing;
    if(snapshot && snapshot!==existing)await atomic(path,snapshot);
    const pois=snapshot?.pois || [];
    for(const p of pois)unique.set(p.id,p);
    Object.assign(region,{status:snapshot?'ready':'pending',count:pois.length,photoCount:pois.filter(p=>p.photo).length,file:snapshot?`regions/${region.id}.json`:null,fetchedAt:snapshot?.fetchedAt || null});
  }
  seed.totalUnique=unique.size;seed.totalWithPhoto=[...unique.values()].filter(p=>p.photo).length;seed.generatedAt=new Date().toISOString();
  await atomic(join(target,'index.json'),seed);
  console.info(`[publish] ${seed.totalUnique} POIs; ${seed.totalWithPhoto} licensed photos`);
} finally {await rm(lock,{force:true});}

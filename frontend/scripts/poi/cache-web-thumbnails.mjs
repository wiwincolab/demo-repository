// Reduce large, already verified web photos for mobile. Source attribution stays intact.
// Uses macOS sips; run after supplement-web-photos.mjs, before export.mjs.
import {readFile,writeFile,mkdir,rename,open,rm,mkdtemp,stat} from 'node:fs/promises';
import {resolve,join,dirname} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {publicHttpsUrl,imageDimensions} from './web-photo-sources.mjs';

if(process.platform!=='darwin')throw new Error('This thumbnail command requires macOS sips');
const root=resolve(process.env.POI_DATA_DIR || join(dirname(fileURLToPath(import.meta.url)),'../../public/poi'));
const catalog=JSON.parse(await readFile(join(root,'index.json'),'utf8'));
const snapshots=await Promise.all(catalog.regions.filter(r=>r.file).map(async r=>({path:join(root,r.file),data:JSON.parse(await readFile(join(root,r.file),'utf8'))})));
const unique=new Map(snapshots.flatMap(s=>s.data.pois).map(p=>[p.id,p]));
const jobs=[...unique.values()].filter(p=>p.photo?.licenseStatus==='unspecified' && !p.photo.thumbnailOf && Math.max(p.photo.width,p.photo.height)>1280);
const lock=join(root,'.import-lock');await (await open(lock,'wx')).close();
const temporary=await mkdtemp(join(tmpdir(),'chictrip-photo-'));
const images=join(root,'photos');await mkdir(images,{recursive:true});
const run=promisify(execFile),updates=new Map();let cursor=0,done=0,bytes=0;
async function thumbnail(p){
  const photo=p.photo,url=publicHttpsUrl(photo.src);if(!url)return;
  const hash=createHash('sha256').update(url).digest('hex'),relative='poi/photos/'+hash+'.jpg',path=join(images,hash+'.jpg');
  try{
    let existing;try{existing=imageDimensions(await readFile(path));}catch(error){if(error.code!=='ENOENT')throw error;}
    if(!existing){
      const response=await fetch(url,{signal:AbortSignal.timeout(15000),headers:{'User-Agent':'chicTrip-POI/1.2 (https://github.com/wiwincolab/demo-repository)'}});
      if(!response.ok || !publicHttpsUrl(response.url) || !/^image\/(jpeg|png|webp)/i.test(response.headers.get('content-type') || '') || Number(response.headers.get('content-length'))>16*1024*1024){await response.body?.cancel();throw new Error('Source photo unavailable or exceeds 16 MiB');}
      const reader=response.body.getReader(),parts=[];let length=0;
      try{while(true){const {value,done}=await reader.read();if(done)break;length+=value.length;if(length>16*1024*1024)throw new Error('Source photo exceeds 16 MiB');parts.push(Buffer.from(value));}}finally{await reader.cancel();}
      const source=Buffer.concat(parts),originalSize=imageDimensions(source);if(!originalSize || originalSize.width*originalSize.height>40_000_000)throw new Error('Invalid or excessive source image dimensions');
      const input=join(temporary,hash+'.source'),output=join(temporary,hash+'.jpg');await writeFile(input,source);
      await run('/usr/bin/sips',['-s','format','jpeg','-s','formatOptions','70','-Z','640',input,'--out',output],{timeout:15000});
      const image=await readFile(output);existing=imageDimensions(image);if(!existing || Math.max(existing.width,existing.height)>640 || image.length>200*1024)throw new Error('Thumbnail failed size validation');
      await rename(output,path);await rm(input,{force:true});
    }
    updates.set(p.id,{...photo,src:relative,thumbnailOf:url,...existing});bytes+=(await stat(path)).size;
  }catch(error){console.info('[skipped] '+p.id+': '+error.message);}
}
try{
  await Promise.all(Array.from({length:4},async()=>{while(cursor<jobs.length){await thumbnail(jobs[cursor++]);done++;if(done%50===0)console.info('[thumbnails] '+done+'/'+jobs.length);}}));
  for(const snapshot of snapshots){let changed=false;for(const p of snapshot.data.pois){const photo=updates.get(p.id);if(photo){p.photo=photo;changed=true;}}if(changed){const temp=snapshot.path+'.'+process.pid+'.tmp';await writeFile(temp,JSON.stringify(snapshot.data));await rename(temp,snapshot.path);}}
  console.info('[done] '+updates.size+' mobile thumbnails; '+Math.round(bytes/1024)+' KiB');
}finally{await rm(temporary,{recursive:true,force:true});await rm(lock,{force:true});}

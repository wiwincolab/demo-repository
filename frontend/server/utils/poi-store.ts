import { readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';

const cache=new Map<string,{stamp:number; data:unknown}>();
export function validPoiRegion(id: string) {return /^(jp|kr|tw)-[a-z]+(?:-[a-z]+)*$/.test(id);}
// Only prepared JSON is served; user requests never run an external crawler.
export async function readPoiSnapshot(region?:string) {
  if(region && !validPoiRegion(region))throw Object.assign(new Error('Invalid POI region'),{statusCode:400});
  const path=join(process.env.POI_DATA_DIR || '/data/poi',region ? `regions/${region}.json` : 'index.json');
  const metadata=await stat(path);
  const saved=cache.get(path);
  if(saved?.stamp===metadata.mtimeMs)return saved.data;
  const data:unknown=JSON.parse(await readFile(path,'utf8'));
  if(cache.size>=8)cache.delete(cache.keys().next().value!);
  cache.set(path,{stamp:metadata.mtimeMs,data});
  return data;
}

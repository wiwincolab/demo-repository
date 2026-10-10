import { readdir, readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { compactPassCoverage } from '../../app/utils/compact-pass-coverage.ts';

const root=new URL('../../public/pass-coverage/',import.meta.url), output=new URL('compact/',root);
const generatorTime=Math.max((await stat(fileURLToPath(import.meta.url))).mtimeMs,(await stat(new URL('../../app/utils/compact-pass-coverage.ts',import.meta.url))).mtimeMs);
await mkdir(output,{recursive:true});
for(const file of await readdir(root)) {
  if(!file.endsWith('.json') || file==='index.json')continue;
  const source=new URL(file,root),target=new URL(file,output);
  const original=await stat(source),existing=await stat(target).catch(()=>null);
  if(existing && existing.mtimeMs>=Math.max(original.mtimeMs,generatorTime))continue;
  const coverage=JSON.parse(await readFile(source,'utf8'));
  if(coverage.type!=='FeatureCollection' || !Array.isArray(coverage.features))continue;
  await writeFile(target,JSON.stringify(compactPassCoverage(coverage)));
}
console.log(`Prepared compact ticket maps in ${fileURLToPath(output)}`);

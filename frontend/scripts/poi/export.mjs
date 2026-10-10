import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root=resolve(process.env.POI_DATA_DIR || join(dirname(fileURLToPath(import.meta.url)),'../../public/poi'));
const output=resolve(process.env.POI_EXPORT_DIR || join(root,'exports'));
await mkdir(output,{recursive:true});
const catalog=JSON.parse(await readFile(join(root,'index.json'),'utf8'));
const unique=new Map();
for(const region of catalog.regions.filter(r=>r.file)) {
  const snapshot=JSON.parse(await readFile(join(root,region.file),'utf8'));
  for(const p of snapshot.pois) {
    const old=unique.get(p.id);
    if(old){old.regions.push(region.id);if(!old.photo && p.photo)old.photo=p.photo;}
    else unique.set(p.id,{...p,regions:[region.id]});
  }
}
const pois=[...unique.values()];
const fields=['id','country','regions','name','localName','names','category','categoryLabel','longitude','latitude','description','address','website','phone','openingHours','fee','wheelchair','wikidata','wikipedia','wikidataMismatch','imageStatus','imageUrl','imageOriginalUrl','imageSource','imageCredit','imageLicense','imageLicenseUrl','osmUrl','sourceLicense','sourceLicenseUrl','fetchedAt'];
const cell=value=>{const text=String(value ?? '');return `"${(/^[=+@-]/.test(text)?"'":'')+text.replaceAll('"','""')}"`;};
for(const country of ['JP','KR','TW']) {
  const rows=pois.filter(p=>p.country===country);
  const geojson={type:'FeatureCollection',name:`chicTrip ${country} POIs`,license:'OpenStreetMap ODbL-1.0; Wikidata CC0; image licenses per photo',attribution:'© OpenStreetMap contributors; Wikidata; Wikimedia Commons image authors',generatedAt:catalog.generatedAt,features:rows.map(p=>{const {at,...properties}=p;return {type:'Feature',id:p.id,geometry:{type:'Point',coordinates:at},properties};})};
  await writeFile(join(output,`${country.toLowerCase()}.geojson`),JSON.stringify(geojson));
  const csv=[fields.map(cell).join(','),...rows.map(p=>{
    const flat={...p,regions:p.regions.join('|'),names:JSON.stringify(p.names),longitude:p.at[0],latitude:p.at[1],imageUrl:p.photo?.src,imageOriginalUrl:p.photo?.original,imageSource:p.photo?.source,imageCredit:p.photo?.credit,imageLicense:p.photo?.license,imageLicenseUrl:p.photo?.licenseUrl,osmUrl:p.source.url,sourceLicense:p.source.license,sourceLicenseUrl:p.source.licenseUrl};
    return fields.map(field=>cell(flat[field])).join(',');
  })].join('\r\n');
  await writeFile(join(output,`${country.toLowerCase()}.csv`),'\ufeff'+csv);
  console.info(`[export] ${country}: ${rows.length} POIs; ${rows.filter(p=>p.photo).length} images`);
}
const report={generatedAt:catalog.generatedAt,coverage:catalog.coverage,totalUnique:pois.length,totalWithPhoto:pois.filter(p=>p.photo).length,totalPendingPhotos:pois.filter(p=>p.imageStatus==='pending').length,countries:['JP','KR','TW'].map(country=>({country,pois:pois.filter(p=>p.country===country).length,photos:pois.filter(p=>p.country===country && p.photo).length,regions:catalog.regions.filter(r=>r.country===country).length})),regions:catalog.regions};
await writeFile(join(output,'report.json'),JSON.stringify(report,null,2));

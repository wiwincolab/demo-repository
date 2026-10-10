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
const fields=['id','country','regions','name','localName','names','category','categoryLabel','longitude','latitude','description','address','website','phone','openingHours','fee','wheelchair','wikidata','wikipedia','wikidataMismatch','imageStatus','imageUrl','imageLocalThumbnail','imageOriginalUrl','imageSource','imageCredit','imageLicense','imageLicenseUrl','imageLicenseStatus','imageProvider','osmUrl','sourceLicense','sourceLicenseUrl','fetchedAt'];
const cell=value=>{const text=String(value ?? '');return `"${(/^[=+@-]/.test(text)?"'":'')+text.replaceAll('"','""')}"`;};
for(const country of ['JP','KR','TW']) {
  const rows=pois.filter(p=>p.country===country);
  const geojson={type:'FeatureCollection',name:`chicTrip ${country} POIs`,license:'OpenStreetMap ODbL-1.0; Wikidata CC0; image licenses per photo',attribution:'© OpenStreetMap contributors; Wikidata; Wikimedia Commons, Wikipedia and per-photo source credits',generatedAt:catalog.generatedAt,features:rows.map(p=>{const {at,...properties}=p;return {type:'Feature',id:p.id,geometry:{type:'Point',coordinates:at},properties};})};
  await writeFile(join(output,`${country.toLowerCase()}.geojson`),JSON.stringify(geojson));
  const csv=[fields.map(cell).join(','),...rows.map(p=>{
    const flat={...p,regions:p.regions.join('|'),names:JSON.stringify(p.names),longitude:p.at[0],latitude:p.at[1],imageUrl:p.photo?.thumbnailOf || p.photo?.src,imageLocalThumbnail:p.photo?.thumbnailOf ? p.photo.src : null,imageOriginalUrl:p.photo?.original,imageSource:p.photo?.source,imageCredit:p.photo?.credit,imageLicense:p.photo?.license,imageLicenseUrl:p.photo?.licenseUrl,imageLicenseStatus:p.photo?.licenseStatus,imageProvider:p.photo?.provider,osmUrl:p.source.url,sourceLicense:p.source.license,sourceLicenseUrl:p.source.licenseUrl};
    return fields.map(field=>cell(flat[field])).join(',');
  })].join('\r\n');
  await writeFile(join(output,`${country.toLowerCase()}.csv`),'\ufeff'+csv);
  console.info(`[export] ${country}: ${rows.length} POIs; ${rows.filter(p=>p.photo).length} images`);
}
const report={generatedAt:catalog.generatedAt,coverage:catalog.coverage,totalUnique:pois.length,totalWithPhoto:pois.filter(p=>p.photo).length,totalPendingPhotos:pois.filter(p=>p.imageStatus==='pending').length,countries:['JP','KR','TW'].map(country=>({country,pois:pois.filter(p=>p.country===country).length,photos:pois.filter(p=>p.country===country && p.photo).length,regions:catalog.regions.filter(r=>r.country===country).length})),regions:catalog.regions};
await writeFile(join(output,'report.json'),JSON.stringify(report,null,2));
const supplement=JSON.parse(await readFile(join(root,'exports','photo-supplement-report.json'),'utf8').catch(error=>{if(error.code==='ENOENT')return 'null';throw error;}));
const reasons={
  'Linked identity is a person, list or disambiguation; needs manual verification':'來源指向人物、列表或消歧義頁，需人工確認景點身分',
  'No verified photo after linked-source and name/location searches':'已查來源連結與景點名稱／座標，仍未找到能確認對應景點的照片',
  'Ambiguous or short name; needs manual verification':'名稱過短或不明確，需人工確認景點身分',
  'No verified photo from linked sources':'來源連結未找到能確認對應景點的照片',
  'No linked image source':'資料沒有照片來源連結',
  'No matching loadable photo in web search results':'已查網路圖片搜尋，未找到名稱／地區相符且可載入的照片',
  'Web search returned no images':'網路圖片搜尋沒有回傳照片',
  'Web source request failed; needs retry':'來源網頁暫時無法連線，需重試',
  'Not searched on the web yet':'尚未完成網路圖片搜尋',
};
const countries={JP:'日本',KR:'韓國',TW:'台灣'};
const regionNames=new Map(catalog.regions.map(region=>[region.id,region.name]));
const remainingReasons=new Map((supplement?.remaining || []).map(p=>[p.id,reasons[p.reason] || p.reason]));
const missing=pois.filter(p=>!p.photo).sort((a,b)=>a.country.localeCompare(b.country) || a.regions[0].localeCompare(b.regions[0]) || a.name.localeCompare(b.name,'zh-Hant'));
const missingFields=['國家','地區','景點名稱','當地名稱','經度','緯度','景點 ID','OpenStreetMap 來源','Wikidata','Wikipedia','查找結果'];
const wikipediaUrl=value=>{const match=value?.match(/^([a-z]{2,3}(?:-[a-z]+)?):(.+)$/);return match ? `https://${match[1]}.wikipedia.org/wiki/${encodeURIComponent(match[2].replaceAll(' ','_'))}` : value;};
const missingRows=missing.map(p=>[countries[p.country] || p.country,p.regions.map(id=>regionNames.get(id) || id).join('／'),p.name,p.localName,p.at[0],p.at[1],p.id,p.source.url,p.wikidata ? `https://www.wikidata.org/wiki/${p.wikidata}` : '',wikipediaUrl(p.wikipedia),remainingReasons.get(p.id) || '尚未補上照片']);
await writeFile(join(output,'missing-photos.csv'),'\ufeff'+[missingFields,...missingRows].map(row=>row.map(cell).join(',')).join('\r\n'));
console.info(`[export] Missing photos: ${missing.length}; missing-photos.csv`);

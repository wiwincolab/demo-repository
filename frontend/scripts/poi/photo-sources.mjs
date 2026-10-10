import { commonsPhoto, plainText } from './model.mjs';

export function claimValues(entity, property) {
  const statements=(entity?.claims?.[property] || entity?.statements?.[property] || []).filter(s=>s.rank!=='deprecated' && s.mainsnak?.datavalue);
  return statements.sort((a,b)=>Number(b.rank==='preferred')-Number(a.rank==='preferred')).map(s=>s.mainsnak.datavalue.value);
}
export function humanEntity(entity) { return claimValues(entity,'P31').some(value=>value?.id==='Q5'); }
export function needsIdentityReview(entity) {return claimValues(entity,'P31').some(value=>['Q5','Q4167410','Q4167836','Q13406463'].includes(value?.id));}
export function articleReference(value) {
  const match=value?.match(/^([a-z]{2,3}(?:-[a-z]+)?):(.+)$/);
  return match ? {language:match[1],title:match[2].replaceAll('_',' ')} : null;
}
export function resolvedPage(data,title) {
  let key=data.query?.normalized?.find(n=>n.from===title)?.to || title.replaceAll('_',' ');
  const seen=new Set();
  while(!seen.has(key)) {seen.add(key);const next=data.query?.redirects?.find(r=>r.from===key)?.to;if(!next)break;key=next;}
  return Object.values(data.query?.pages || {}).find(page=>page.title===key && (page.missing===undefined || page.imageinfo?.length));
}
export function articleFiles(page, names=[]) {
  const normalize=value=>value.toLocaleLowerCase().replace(/[\s_\-()（）]/g,'');
  const labels=names.filter(Boolean).map(normalize).filter(value=>value.length>=3 && !/^(museum|temple|park|gallery|城堡|博物館|神社|公園)$/.test(value));
  const files=(page.images || []).filter(image=>image.ns===6 || image.title.startsWith('File:')).map(image=>image.title.slice(image.title.indexOf(':')+1)).filter(file=>labels.some(label=>normalize(file).includes(label)));
  return [...new Set([page.pageimage,...files].filter(Boolean))];
}
export function photographicPage(page) {
  if(/(?:\b(?:logo|icon|map|plan|diagram|flag|seal|coat of arms|portrait|signature|scan)\b|地図|地圖|地图|路線圖|平面図|紋章)/i.test(page.title || ''))return null;
  const photo=commonsPhoto(page);
  return photo && Math.min(photo.width || 0,photo.height || 0)>=120 ? photo : null;
}
export function categoryPhoto(data, names=[]) {
  const labels=names.filter(Boolean).map(name=>name.toLocaleLowerCase().replace(/[\s_\-()（）]/g,''));
  const choices=Object.values(data.query?.pages || {}).map(page=>{
    const photo=photographicPage(page),title=(page.title || '').toLocaleLowerCase().replace(/[\s_\-()（）]/g,'');
    const match=labels.some(label=>label.length>=3 && title.includes(label));
    const exterior=/exterior|facade|entrance|panorama|外観|外觀|正面|全景/i.test(page.title || '');
    return {page,photo,score:Number(match)*10+Number(exterior)*3+Number(photo?.width>=photo?.height)};
  }).filter(item=>item.photo).sort((a,b)=>b.score-a.score || a.page.title.localeCompare(b.page.title,'en'));
  return choices[0] ? {file:choices[0].page.title.slice(5),photo:choices[0].photo} : null;
}
export function photoUpdateMap(snapshots) {
  return new Map(snapshots.flatMap(snapshot=>snapshot.pois).map(p=>[p.id,{...p}]));
}
export function applyPhotoUpdates(snapshot,updates) {
  let changed=false;
  const pois=snapshot.pois.map(p=>{const fresh=updates.get(p.id);if(fresh && ((!p.photo && fresh.photo) || fresh.wikidata!==p.wikidata)){changed=true;return fresh;}return p;});
  return {changed,pois};
}
export function placeNames(p) {
  return [...new Set([p.localName,p.names?.['name:en'],p.name].filter(Boolean))].filter(name=>name.length>=3 && name.length<=100 && !/^[a-z]{0,2}\d+$/i.test(name.replace(/[\s\-_.]/g,'')) && !/^(museum|temple|park|gallery|viewpoint|觀景台|展望台|展望所|博物館|博物馆|神社|公園|公园|福德祠|祠|景點|寺院|碑|動物園|动物园)$/i.test(name));
}
export function photoSearchPhrase(pois) {
  const names=[...new Set(pois.flatMap(p=>placeNames(p).slice(0,2)))];
  return '('+names.map(name=>'"'+name.replace(/["|\\]/g,' ')+'"').join(' OR ')+')';
}
export function photoSearchBatches(pois,maxLength=280) {
  const batches=[];let batch=[];
  for(const p of pois) {
    if(batch.length && (batch.length===20 || photoSearchPhrase([...batch,p]).length>maxLength)){batches.push(batch);batch=[];}
    batch.push(p);
  }
  if(batch.length)batches.push(batch);
  return batches;
}
export function namedNearPlace(page,p,maxMeters=250) {
  const normalize=value=>String(value).normalize('NFKC').toLocaleLowerCase().replace(/[\s_\-()（）.,，:：]/g,'');
  const text=normalize((page.title || '')+' '+plainText(page.imageinfo?.[0]?.extmetadata?.ImageDescription?.value || ''));
  const sameIdentity=p.wikidata && page.pageprops?.wikibase_item===p.wikidata;
  if(!sameIdentity && !placeNames(p).some(name=>text.includes(normalize(name))))return false;
  return (page.coordinates || []).some(point=>{
    if(point.globe!=='earth' || !Number.isFinite(point.lon) || !Number.isFinite(point.lat))return false;
    const rad=Math.PI/180,lat1=p.at[1]*rad,lat2=point.lat*rad,dlat=(point.lat-p.at[1])*rad,dlon=(point.lon-p.at[0])*rad;
    const a=Math.sin(dlat/2)**2+Math.cos(lat1)*Math.cos(lat2)*Math.sin(dlon/2)**2;
    return 6371000*2*Math.asin(Math.min(1,Math.sqrt(a)))<=maxMeters;
  });
}
export function completeSearchCoordinates(data,coordinateData) {
  const coordinates=new Map(Object.values(coordinateData.query?.pages || {}).map(page=>[page.pageid,page.coordinates || []]));
  return {...data,query:{...data.query,pages:Object.fromEntries(Object.entries(data.query?.pages || {}).map(([key,page])=>[key,{...page,coordinates:coordinates.get(page.pageid) || page.coordinates || []}]))}};
}
export function nextPhotoSearchOffset(data,current=0) {
  return data.continue?.gsroffset ?? (Object.keys(data.query?.pages || {}).length===50 ? Number(current)+50 : undefined);
}

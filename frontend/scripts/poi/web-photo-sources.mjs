// Public search-result metadata and linked websites; never execute their scripts.
import {placeNames} from './photo-sources.mjs';

const normalize=value=>String(value || '').normalize('NFKD').replace(/臺/gu,'台').replace(/\p{M}/gu,'').toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
export function decodeHtml(value='') {
  return value.replace(/&(?:quot|apos|amp|lt|gt|nbsp);|&#(?:x[\da-f]+|\d+);/gi,entity=>{
    const known={'&quot;':'"','&apos;':"'",'&amp;':'&','&lt;':'<','&gt;':'>','&nbsp;':' '};
    if(known[entity.toLowerCase()])return known[entity.toLowerCase()];
    const point=entity[2].toLowerCase()==='x'?parseInt(entity.slice(3,-1),16):Number(entity.slice(2,-1));
    return point>0 && point<=0x10ffff?String.fromCodePoint(point):'';
  });
}
function text(value='') {return decodeHtml(value.replace(/<[^>]+>/g,' ')).replace(/\s+/g,' ').trim();}
export function publicHttpsUrl(value,base) {
  if(typeof value!=='string' || !value.trim())return null;
  try {
    const url=new URL(decodeHtml(value),base);
    if(url.protocol==='http:')url.protocol='https:';
    const host=url.hostname.toLowerCase();
    if(url.protocol!=='https:' || url.username || url.password || url.port && url.port!=='443' || !host.includes('.') || host.endsWith('.local') || host==='localhost' || /^[\d.]+$/.test(host) || host.includes(':'))return null;
    return url.href;
  }catch{return null;}
}
function attributes(tag) {
  return Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)].map(m=>[m[1].toLowerCase(),decodeHtml(m[2]??m[3]??m[4])]));
}

// Read a JSON array embedded in a script, including escaped brackets in strings.
// JSON.parse (rather than eval) keeps downloaded code and instructions inert.
export function embeddedArray(html,anchor) {
  const anchorAt=html.indexOf(anchor);if(anchorAt<0)return [];
  const start=html.indexOf('[',anchorAt+anchor.length);if(start<0 || start-anchorAt>1000)return [];
  let depth=0,quoted=false,escape=false;
  for(let i=start;i<html.length;i++) {
    const char=html[i];
    if(quoted){if(escape)escape=false;else if(char==='\\')escape=true;else if(char==='"')quoted=false;continue;}
    if(char==='"')quoted=true;
    else if(char==='[')depth++;
    else if(char===']' && --depth===0){try{return JSON.parse(html.slice(start,i+1));}catch{return [];}}
  }
  return [];
}
export function yahooImages(html) {
  const script=html.match(/<script\b[^>]*id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i);
  if(!script)return [];
  let data;try{data=JSON.parse(script[1]);}catch{return [];}
  const page=data.props?.initialProps?.pageProps || data.props?.pageProps;
  return (page?.algos || []).map(item=>({
    title:text(item.title),src:publicHttpsUrl(item.main?.url || item.imageSrc),original:publicHttpsUrl(item.original?.url),
    source:publicHttpsUrl(item.refererUrl),credit:text(item.refererName || item.domain),
    width:item.main?.width || 0,height:item.main?.height || 0,provider:'Yahoo! JAPAN image search',
  })).filter(item=>item.src && item.original && item.source);
}
export function naverImages(html) {
  let section=html.slice(html.indexOf('var imageSearchTabData ='));
  section=section.slice(section.indexOf('content:'));
  return embeddedArray(section,'items:').filter(item=>item.type==='image').map(item=>({
    title:text(item.title),src:publicHttpsUrl(item.viewerThumb || item.thumb),original:publicHttpsUrl(item.originalUrl),
    source:publicHttpsUrl(item.link),credit:text(item.writerTitle || item.source || item.tld),
    width:item.orgWidth || 0,height:item.orgHeight || 0,provider:'Naver image search',
  })).filter(item=>item.src && item.original && item.source);
}
export function nativeImages(raw) {
  if(typeof raw!=='string')return [];
  return raw.split(/-{20,}/).flatMap(section=>{
    const heading=section.match(/^\s*(.+?) \((https?:\/\/[^\n]+)\)\r?\n/),image=section.match(/Image URL: ([^\s#]+)/);
    if(!heading || !image)return [];
    const body=section.slice(section.indexOf(image[0])+image[0].length).replace(/^#\s*/,'').trim().split(/\r?\n\s*\r?\n/);
    const source=publicHttpsUrl(heading[2]),src=publicHttpsUrl(image[1]);if(!source || !src)return [];
    return [{title:text(heading[1].replace(/cite[^]*/g,'')),src,original:src,source,credit:new URL(source).hostname,
      scene:body[0]?.slice(0,250) || '',photoDescription:body[1]?.slice(0,1000) || '',caption:body.slice(0,2).join(' ').slice(0,1000),width:0,height:0,provider:'Web image search'}];
  });
}
const notPhoto=/(?:\b(?:logo|icon|favicon|sprite|banner|poster|flyer|map|diagram|floorplan|flag|pdf|qr)\b|地図|地圖|地图|平面図|路線圖|ポスター|チラシ|로고|포스터|약도|지도|海報|活動簡章|출발.*(?:패키지|여행)|(?:北朝鮮|북한|中國|中国).*백두산)/i;
const notPhotoFile=/(?:^|[/_.-])(?:logo|icon|favicon|sprite|banner|poster|flyer|map|diagram|floorplan|flag|qr|no[-_]?image|no[-_]?photo|placeholder|dummy|spacer|blank)(?:[_.-]|$)/i;
export function matchingWebImages(items,poi,{locations=[],requireLocation=false,aliases=[]}={}) {
  const names=placeNames(poi).map(normalize).filter(name=>name.length>=3);
  const municipalNames=placeNames(poi).flatMap(name=>{const m=name.match(/^(.{1,12}?[都道府県市区町村])立(.{3,})$/u);return m?[{location:normalize(m[1]),name:normalize(m[2])}]:[];});
  const alternate=aliases.filter(n=>typeof n==='string').map(normalize).filter(n=>n.length>=3);
  return items.filter(item=>{
    if(!publicHttpsUrl(item.src) || !publicHttpsUrl(item.original) || !publicHttpsUrl(item.source))return false;
    // Native captions may include article context mentioning other attractions.
    // Use the result title and the individual image's heading/description.
    const title=normalize(item.title+' '+(item.scene || '')+' '+(item.photoDescription || '')+' '+decodeURIComponentSafe(item.source));
    const locationMatch=locations.some(location=>title.includes(normalize(location)));
    if(!names.some(name=>title.includes(name)) && !municipalNames.some(n=>title.includes(n.name) && title.includes(n.location)) && !(locationMatch && alternate.some(name=>title.includes(name))))return false;
    // A first image from a multi-stop travel diary can depict another stop.
    if(/[\/／]/.test(item.title) && item.title.split(/[\/／]/).filter(part=>normalize(part).length>=3).length>2)return false;
    if(requireLocation && !locationMatch)return false;
    const path=decodeURIComponentSafe(new URL(item.original).pathname);
    if(notPhoto.test(item.title+' '+path) || notPhotoFile.test(path) || /photowall|wallpaper|shutterstock|istockphoto/i.test(item.source))return false;
    if(item.caption && /\b(?:illustration|illustrated|rendering|diagram|poster|flyer|map|logo|collage)\b/i.test(item.scene || item.caption.slice(0,100)))return false;
    if(item.width && item.height && (Math.min(item.width,item.height)<120 || item.width/item.height>4 || item.height/item.width>4))return false;
    return true;
  });
}
function decodeURIComponentSafe(value){try{return decodeURIComponent(value);}catch{return value;}}
export function websiteImages(html,url,poi) {
  const metas=[...html.matchAll(/<meta\b[^>]*>/gi)].map(m=>attributes(m[0]));
  const pageTitle=text(html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] || metas.find(m=>m.property==='og:title')?.content || '');
  const headings=[...html.matchAll(/<h[12]\b[^>]*>([\s\S]*?)<\/h[12]>/gi)].map(m=>text(m[1])).join(' ');
  if(!placeNames(poi).some(name=>normalize(pageTitle+' '+headings).includes(normalize(name))))return [];
  const candidates=[];
  for(const meta of metas.filter(m=>m.property==='og:image' || m.name==='twitter:image'))candidates.push({src:meta.content,alt:pageTitle});
  const main=html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] || html.replace(/<(header|footer|nav)\b[^>]*>[\s\S]*?<\/\1>/gi,'');
  for(const match of main.matchAll(/<img\b[^>]*>/gi)) {
    const img=attributes(match[0]);
    const src=img['data-src'] || img['data-original'] || img.src || img.srcset?.split(',')[0]?.trim().split(/\s+/)[0];
    candidates.push({src,alt:img.alt || '',width:Number(img.width)||0,height:Number(img.height)||0,cl:img.class || ''});
  }
  const seen=new Set();
  return candidates.map(item=>({
    title:pageTitle,src:publicHttpsUrl(item.src,url),original:publicHttpsUrl(item.src,url),source:publicHttpsUrl(url),
    credit:metas.find(m=>m.property==='og:site_name')?.content || new URL(url).hostname,width:item.width || 0,height:item.height || 0,
    provider:'Linked website',alt:item.alt,cl:item.cl,
  })).filter(item=>{
    if(!item.src || seen.has(item.src) || notPhoto.test(item.alt+' '+item.cl+' '+decodeURIComponentSafe(new URL(item.src).pathname)) || notPhotoFile.test(decodeURIComponentSafe(new URL(item.src).pathname)) || /\.(?:svg|gif)(?:$|\?)/i.test(item.src))return false;
    seen.add(item.src);return !item.width || !item.height || Math.min(item.width,item.height)>=120;
  });
}
export function webPhoto(item,dimensions,now) {
  if(!publicHttpsUrl(item.src) || !publicHttpsUrl(item.original) || !publicHttpsUrl(item.source) || !dimensions || Math.min(dimensions.width,dimensions.height)<120 || dimensions.width/dimensions.height>4 || dimensions.height/dimensions.width>4)return null;
  return {src:item.src,original:item.original,source:item.source,credit:'來源：'+(item.credit || new URL(item.source).hostname),
    license:'照片授權尚未確認',licenseUrl:'',licenseStatus:'unspecified',provider:item.provider,
    width:dimensions.width,height:dimensions.height,retrievedAt:now};
}

export function samePhotoPlace(a,b) {
  if(a.id===b.id || a.wikidata && a.wikidata===b.wikidata)return true;
  if(a.country!==b.country)return false;
  const rad=Math.PI/180,lat1=a.at[1]*rad,lat2=b.at[1]*rad;
  const value=Math.sin((lat2-lat1)/2)**2+Math.cos(lat1)*Math.cos(lat2)*Math.sin((b.at[0]-a.at[0])*rad/2)**2;
  return 6371000*2*Math.asin(Math.min(1,Math.sqrt(value)))<=250;
}

export function tourismPhotoRows(data,pois) {
  const rows=[],byName=new Map();
  for(const attraction of data.Attractions || [])for(const label of [attraction.AttractionName,...(attraction.AlternateNames || [])].filter(n=>typeof n==='string')){
    const key=normalize(label),list=byName.get(key)||[];list.push(attraction);byName.set(key,list);
  }
  for(const poi of pois.filter(p=>p.country==='TW' && !p.photo)){
    const names=placeNames(poi).map(normalize);
    for(const attraction of new Set(names.flatMap(name=>byName.get(name)||[]))){
      const at=[Number(attraction.PositionLon),Number(attraction.PositionLat)];
      if(!at.every(Number.isFinite) || !samePhotoPlace(poi,{id:'official:'+attraction.AttractionID,country:'TW',at}))continue;
      const address=attraction.PostalAddress || {},source=publicHttpsUrl(attraction.WebsiteURL) || 'https://data.gov.tw/dataset/7777';
      const items=(attraction.Images || []).map(image=>({title:attraction.AttractionName+' '+(address.City || '')+' '+(address.Town || ''),scene:image.Name || '',
        src:publicHttpsUrl(image.URL),original:publicHttpsUrl(image.URL),source,credit:'交通部觀光署'+(image.Description?'／'+text(image.Description):''),
        width:image.Width || 0,height:image.Height || 0,provider:'Official tourism data'})).filter(i=>i.src);
      if(items.length)rows.push({id:poi.id,query:attraction.AttractionName,dataset:'https://data.gov.tw/dataset/7777',sourceAt:at,items});
      break;
    }
  }
  return rows;
}

// Inspect only the first bytes of the response; no original images are saved.
export function imageDimensions(buffer) {
  if(buffer.length>=24 && buffer.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))return {width:buffer.readUInt32BE(16),height:buffer.readUInt32BE(20)};
  if(buffer.length>=30 && buffer.toString('ascii',0,4)==='RIFF' && buffer.toString('ascii',8,12)==='WEBP') {
    const type=buffer.toString('ascii',12,16);
    if(type==='VP8X')return {width:1+buffer.readUIntLE(24,3),height:1+buffer.readUIntLE(27,3)};
    if(type==='VP8 ' && buffer[23]===0x9d && buffer[24]===1 && buffer[25]===0x2a)return {width:buffer.readUInt16LE(26)&0x3fff,height:buffer.readUInt16LE(28)&0x3fff};
    if(type==='VP8L' && buffer[20]===0x2f){const bits=buffer.readUInt32LE(21);return {width:1+(bits&0x3fff),height:1+((bits>>>14)&0x3fff)};}
  }
  if(buffer.length<4 || buffer[0]!==0xff || buffer[1]!==0xd8)return null;
  let offset=2;
  while(offset+4<=buffer.length){if(buffer[offset]!==0xff)return null;while(buffer[offset]===0xff)offset++;const marker=buffer[offset++];if(marker===0xd9 || marker===0xda)return null;if(marker===1 || marker>=0xd0 && marker<=0xd8)continue;const size=buffer.readUInt16BE(offset);if(size<2 || offset+size>buffer.length)return null;if([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker) && size>=7)return {width:buffer.readUInt16BE(offset+5),height:buffer.readUInt16BE(offset+3)};offset+=size;}
  return null;
}

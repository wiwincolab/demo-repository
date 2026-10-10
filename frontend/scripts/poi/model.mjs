export const categories = { attraction:'景點', museum:'博物館', gallery:'美術館', viewpoint:'觀景台', zoo:'動物園', aquarium:'水族館', theme_park:'主題樂園', castle:'城堡', ruins:'歷史遺跡', archaeological_site:'考古遺址', park:'公園', garden:'庭園', place_of_worship:'寺廟・神社・宗教建築',tower:'地標塔',lighthouse:'燈塔',peak:'山岳',beach:'海灘',hot_spring:'溫泉' };
export function httpsUrl(value) {
  try { const url = new URL(value); return url.protocol === 'https:' ? url.href : url.protocol === 'http:' ? new URL(url.href.replace(/^http:/,'https:')).href : null; } catch { return null; }
}
export function plainText(value = '') {
  return String(value).replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/\s+/g,' ').trim();
}
export function commonsFile(value) {
  if(!value)return null;
  if(value.startsWith('File:'))return value.slice(5);
  try {
    const url=new URL(value);
    if(url.hostname==='commons.wikimedia.org' && url.pathname.startsWith('/wiki/File:'))return decodeURIComponent(url.pathname.slice(11));
    if(url.hostname==='upload.wikimedia.org' && url.pathname.startsWith('/wikipedia/commons/')) {
      const parts=url.pathname.split('/');return decodeURIComponent(parts[url.pathname.includes('/thumb/')?parts.length-2:parts.length-1]);
    }
  } catch {}
  return null;
}
export function queryFor(region) {
  const [w,s,e,n] = region.bbox, box = `(${s},${w},${n},${e})`;
  // Offshore island boxes also touch the mainland: intersect the Taiwan OSM area.
  const area=region.country==='TW'?'area["ISO3166-1"="TW"]["boundary"="administrative"]["admin_level"="2"]->.country;':'';
  const scope=area?'(area.country)':'';
  return `[out:json][timeout:60][maxsize:134217728];${area}(nwr["tourism"~"^(attraction|museum|gallery|viewpoint|zoo|aquarium|theme_park)$"]${scope}${box};nwr["historic"~"^(castle|ruins|archaeological_site)$"]${scope}${box};nwr["leisure"~"^(park|garden)$"]["wikidata"]${scope}${box};nwr["amenity"="place_of_worship"]["wikidata"]${scope}${box};nwr["man_made"~"^(tower|lighthouse)$"]["wikidata"]${scope}${box};nwr["natural"~"^(peak|beach|hot_spring)$"]["wikidata"]${scope}${box};);out center tags;`;
}
export function landmarkQuery(region) {
  const [w,s,e,n]=region.bbox;
  const box=`(${s},${w},${n},${e})`;
  const area=region.country==='TW'?'area["ISO3166-1"="TW"]["boundary"="administrative"]["admin_level"="2"]->.country;':'';
  const scope=area?'(area.country)':'';
  return `[out:json][timeout:30][maxsize:134217728];${area}(nwr["amenity"="place_of_worship"]["wikidata"]${scope}${box};nwr["man_made"~"^(tower|lighthouse)$"]["wikidata"]${scope}${box};nwr["natural"~"^(peak|beach|hot_spring)$"]["wikidata"]${scope}${box};);out center tags;`;
}
export function normalize(element, region, fetchedAt) {
  const t = element.tags || {}, lon = element.lon ?? element.center?.lon, lat = element.lat ?? element.center?.lat;
  const name = t['name:zh-Hant'] || t['name:zh-TW'] || t['name:zh'] || t.name || t['name:en'];
  if (!name || !['node','way','relation'].includes(element.type) || !Number.isSafeInteger(element.id) || !Number.isFinite(lon) || !Number.isFinite(lat) || Math.abs(lon)>180 || Math.abs(lat)>90) return null;
  const [w,s,e,n] = region.bbox;
  if (lon<w || lon>e || lat<s || lat>n) return null;
  const category = [t.tourism,t.historic,t.leisure,t.amenity,t.man_made,t.natural].find(v => categories[v]);
  if (!category) return null;
  const commons = commonsFile(t.wikimedia_commons) || commonsFile(t.image);
  return {
    id:`osm:${element.type}:${element.id}`, country:region.country, name, localName:t.name || name,
    names:Object.fromEntries(Object.entries(t).filter(([k]) => k === 'name' || k.startsWith('name:'))),
    category, categoryLabel:categories[category], at:[lon,lat], description:t['description:zh'] || t.description || null,
    address:t['addr:full'] || [t['addr:city'],t['addr:suburb'],t['addr:street'],t['addr:housenumber']].filter(Boolean).join(' ') || null,
    website:httpsUrl(t.website || t['contact:website']), phone:t.phone || t['contact:phone'] || null,
    openingHours:t.opening_hours || null, fee:t.fee || null, wheelchair:t.wheelchair || null,
    wikidata:/^Q\d+$/.test(t.wikidata || '') ? t.wikidata : null, wikipedia:t.wikipedia || null,
    commonsFile:commons, imageStatus:commons || t.wikidata ? 'pending' : 'unavailable', photo:null,
    source:{provider:'OpenStreetMap',url:`https://www.openstreetmap.org/${element.type}/${element.id}`,license:'ODbL-1.0',licenseUrl:'https://www.openstreetmap.org/copyright'},
    fetchedAt,
  };
}
export function commonsPhoto(page) {
  const info = page.imageinfo?.[0], meta = info?.extmetadata;
  const license = plainText(meta?.LicenseShortName?.value);
  const licenseUrl = httpsUrl(meta?.LicenseUrl?.value) || (license==='Public domain' && meta?.Copyrighted?.value==='False' ? 'https://commons.wikimedia.org/wiki/Commons:Public_domain' : null);
  // Never publish an image with unknown permission or an untrusted image host.
  if (!info || !/^https:\/\/(upload|thumb)\.wikimedia\.org\//.test(info.thumburl || info.url || '') || !license || !licenseUrl || !/^(CC0|CC BY(?:-SA)?(?: |-|$)|Public domain)/i.test(license)) return null;
  if (info.mime && !/^image\/(jpeg|png|webp|tiff)$/.test(info.mime)) return null;
  return {src:info.thumburl || info.url, original:info.url, source:info.descriptionurl, credit:plainText(meta.Artist?.value || meta.Credit?.value || 'Wikimedia Commons contributors'),license,licenseUrl,width:info.thumbwidth || info.width,height:info.thumbheight || info.height};
}
export function deduplicate(pois) {
  const seen = new Set();
  return pois.filter(p => { const key = p.wikidata ? `wd:${p.wikidata}` : `${p.name.toLocaleLowerCase()}|${p.at.map(v=>v.toFixed(4)).join(',')}`; if(seen.has(key))return false; seen.add(key);return true; });
}

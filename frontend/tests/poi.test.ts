import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { normalize, commonsFile, commonsPhoto, deduplicate, queryFor } from '../scripts/poi/model.mjs';
import { regions } from '../scripts/poi/regions.mjs';
import { validPoiRegion } from '../server/utils/poi-store.ts';
import { filterPois, poiFeatures, poiClusterIndex } from '../app/utils/poi.ts';
import type { Poi, PoiCatalog } from '../app/types/poi.ts';

const region=regions[0];
test('coordinates use longitude/latitude and exclude nameless or out-of-area records',()=>{
  const element={type:'way',id:123,center:{lon:139.7,lat:35.7},tags:{name:'東京の景点','name:zh-TW':'東京景點',tourism:'museum',website:'javascript:alert(1)'}};
  const p=normalize(element,region,'2026-10-10T00:00:00Z');
  assert.equal(p.name,'東京景點');assert.deepEqual(p.at,[139.7,35.7]);assert.equal(p.website,null);assert.equal(p.photo,null);
  assert.equal(normalize({...element,center:{lon:127,lat:37}},region,''),null);
  assert.equal(normalize({...element,tags:{tourism:'museum'}},region,''),null);
  assert.equal(normalize({...element,tags:{name:'Hotel',tourism:'hotel'}},region,''),null);
  assert.match(queryFor(region),/out center tags/);
  assert.match(queryFor(regions.find(r=>r.id==='tw-kinmen')),/ISO3166-1.*TW.*area\.country/);
});
test('photos require permitted license, author attribution and Wikimedia image host',()=>{
  const page={imageinfo:[{url:'https://upload.wikimedia.org/example.jpg',thumburl:'https://upload.wikimedia.org/thumb.jpg',descriptionurl:'https://commons.wikimedia.org/wiki/File:Example.jpg',mime:'image/jpeg',extmetadata:{Artist:{value:'<a href="x">Photographer</a>'},LicenseShortName:{value:'CC BY-SA 4.0'},LicenseUrl:{value:'https://creativecommons.org/licenses/by-sa/4.0/'}}}]};
  assert.equal(commonsPhoto(page)?.credit,'Photographer');
  assert.equal(commonsPhoto({imageinfo:[{...page.imageinfo[0],thumburl:'https://thumb.wikimedia.org/thumb.jpg'}]})?.credit,'Photographer');
  assert.equal(commonsPhoto({imageinfo:[{...page.imageinfo[0],thumburl:'https://example.com/image.jpg'}]}),null);
  assert.equal(commonsPhoto({imageinfo:[{...page.imageinfo[0],extmetadata:{}}]}),null);
  assert.equal(commonsPhoto({imageinfo:[{...page.imageinfo[0],extmetadata:{...page.imageinfo[0].extmetadata,LicenseShortName:{value:'All rights reserved'}}}]}),null);
});
test('OSM image references resolve only Wikimedia Commons filenames',()=>{
  assert.equal(commonsFile('https://commons.wikimedia.org/wiki/File:Tokyo%20Tower.jpg'),'Tokyo Tower.jpg');
  assert.equal(commonsFile('https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Tokyo_Tower.jpg/640px-Tokyo_Tower.jpg'),'Tokyo_Tower.jpg');
  assert.equal(commonsFile('https://example.com/image.jpg'),null);
  assert.equal(commonsFile('Category:Tokyo'),null);
});
test('duplicates use Wikidata identity while preserving different nearby places',()=>{
  const p=normalize({type:'node',id:1,lon:139.7,lat:35.7,tags:{name:'Museum',tourism:'museum',wikidata:'Q1'}},region,'');
  assert.equal(deduplicate([p,{...p,id:'osm:way:2'}, {...p,id:'osm:node:3',wikidata:'Q2'}]).length,2);
});
test('region paths reject traversal, extensions and foreign country prefixes',()=>{
  assert.ok(validPoiRegion('jp-tokyo'));
  for(const id of ['../index','jp-tokyo.json','jp-../../etc/passwd','us-tokyo','jp-tokyo/extra','jp-tokyo%2f..'])assert.equal(validPoiRegion(id),false);
  assert.equal(new Set(regions.map(r=>r.id)).size,74);
  for(const r of regions){assert.ok(validPoiRegion(r.id));assert.ok(r.bbox[0]<r.bbox[2]);assert.ok(r.bbox[1]<r.bbox[3]);}
});
test('map clusters preserve all POIs and expose the original identifiers when expanded',()=>{
  const snapshot=JSON.parse(readFileSync(new URL('../public/poi/regions/jp-tokyo.json',import.meta.url),'utf8')) as {pois:Poi[]};
  const sample=snapshot.pois.slice(0,100), index=poiClusterIndex(sample);
  const clustered=index.getClusters([-180,-85,180,85],0);
  assert.equal(clustered.reduce((total,f)=>total+('cluster' in f.properties ? f.properties.point_count : 1),0),sample.length);
  const expanded=index.getClusters([-180,-85,180,85],18);
  assert.deepEqual(new Set(expanded.map(f=>f.properties.id)),new Set(sample.map(p=>p.id)));
  for(const f of clustered)if('cluster' in f.properties)assert.ok(index.getClusterExpansionZoom(f.properties.cluster_id)>0);
});
test('shipped snapshots retain image licenses, geographic provenance and truthful counts',()=>{
  const catalog=JSON.parse(readFileSync(new URL('../public/poi/index.json',import.meta.url),'utf8')) as PoiCatalog;
  const unique=new Map<string,Poi>();
  for(const r of catalog.regions.filter(r=>r.file)) {
    const {pois}=JSON.parse(readFileSync(new URL(`../public/poi/${r.file}`,import.meta.url),'utf8')) as {pois:Poi[]};
    assert.equal(pois.length,r.count,r.id);assert.equal(pois.filter(p=>p.photo).length,r.photoCount,r.id);
    for(const p of pois){
      unique.set(p.id,p);assert.match(p.source.url,/^https:\/\/www.openstreetmap.org\/(node|way|relation)\/\d+$/);assert.equal(p.source.license,'ODbL-1.0');
      if(p.wikidataMismatch==='human'){assert.equal(p.photo,null);assert.equal(p.description,null);}
      if(p.photo){
        assert.ok(p.photo.credit);assert.match(p.photo.source,/^https:\/\//);assert.equal(p.imageStatus,'available');
        if(p.photo.licenseStatus==='unspecified'){
          if(p.photo.thumbnailOf){
            assert.match(p.photo.thumbnailOf,/^https:\/\//);assert.match(p.photo.src,/^poi\/photos\/[a-f0-9]{64}\.jpg$/);
            assert.ok(readFileSync(new URL('../public/'+p.photo.src,import.meta.url)).length<=200*1024);assert.ok(Math.max(p.photo.width,p.photo.height)<=640);
          }else assert.match(p.photo.src,/^https:\/\//);
          assert.match(p.photo.original,/^https:\/\//);assert.equal(p.photo.licenseUrl,'');assert.equal(p.photo.license,'照片授權尚未確認');
          assert.ok(['Linked website','Yahoo! JAPAN image search','Naver image search','Web image search','Official tourism data'].includes(p.photo.provider || ''));assert.ok(p.photo.retrievedAt);assert.ok(Math.min(p.photo.width,p.photo.height)>=120);
        }else{assert.match(p.photo.src,/^https:\/\/(upload|thumb)\.wikimedia\.org\//);assert.ok(p.photo.licenseUrl);}
      }
    }
  }
  assert.equal(unique.size,catalog.totalUnique);assert.equal([...unique.values()].filter(p=>p.photo).length,catalog.totalWithPhoto);
  const sample=[...unique.values()].slice(0,10);
  assert.equal(poiFeatures(sample).features.length,sample.length);
  assert.equal(filterPois(sample,'','',true).length,sample.filter(p=>p.photo).length);
  if(sample[0])assert.ok(filterPois(sample,sample[0].localName,'',false).some(p=>p.id===sample[0]!.id));
});

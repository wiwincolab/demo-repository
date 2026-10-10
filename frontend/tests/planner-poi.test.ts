import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createPoiRepository, createVisiblePoiLoader, plannerPoiId, poiToPlannerStop, mergePlannerPlaces, poiRegionsInBounds, plannerStopClusters } from '../app/utils/planner-poi.ts';
import type { Poi, PoiCatalog, PoiSnapshot } from '../app/types/poi.ts';

const catalog = JSON.parse(readFileSync(new URL('../public/poi/index.json', import.meta.url), 'utf8')) as PoiCatalog;
const snapshot = (file: string) => JSON.parse(readFileSync(new URL(`../public/poi/${file}`, import.meta.url), 'utf8')) as PoiSnapshot;

test('rapid destination switches publish only the newest POIs and reuse cached downloads',async()=>{
  const tokyo=snapshot('regions/jp-tokyo.json'),busan=snapshot('regions/kr-busan.json');
  let completeTokyo!:(value:PoiSnapshot)=>void, calls=0;
  const published:PoiSnapshot[][]=[];
  const loader=createVisiblePoiLoader({region:async region=>{calls++;return region.id===tokyo.region.id ? new Promise<PoiSnapshot>(resolve=>{completeTokyo=resolve;}) : busan;}},value=>published.push(value));
  const first=loader.load([tokyo.region]);
  await loader.load([busan.region]);
  completeTokyo(tokyo);await first;
  assert.deepEqual(published.at(-1)?.map(s=>s.region.id),[busan.region.id]);
  await loader.load([tokyo.region]);assert.deepEqual(published.at(-1)?.map(s=>s.region.id),[tokyo.region.id]);assert.equal(calls,2);
  const count=published.length;await loader.load([tokyo.region]);assert.equal(published.length,count);
  loader.dispose();
});
test('cancelled POI requests stop without a static retry and can be loaded again',async()=>{
  const tokyo=snapshot('regions/jp-tokyo.json'),controller=new AbortController();
  const region=catalog.regions.find(r=>r.id===tokyo.region.id)!;
  const urls:string[]=[];
  const repository=createPoiRepository(async(url,signal)=>{urls.push(url);if(!signal)return tokyo;return new Promise((resolve,reject)=>signal.addEventListener('abort',()=>reject(signal.reason),{once:true}));},path=>'/'+path);
  const first=repository.region(region,controller.signal),cancelled=assert.rejects(first);
  controller.abort();
  const retried=repository.region(region);
  await cancelled;assert.equal(await retried,tokyo);
  assert.equal(urls.length,2);assert.ok(urls.every(url=>url.startsWith('/api/poi/')));
  assert.equal(repository.region(region),retried);
});

test('each prepared Japanese and Korean region has selectable clustered places, including those without photos', () => {
  const regions = catalog.regions.filter(r => ['JP','KR'].includes(r.country));
  assert.equal(regions.length, 52);
  for (const region of regions) {
    assert.ok(region.file, region.id);
    const pois = snapshot(region.file!).pois, stops = mergePlannerPlaces([], pois);
    assert.ok(stops.length > 0, region.id);
    assert.ok(stops.some(p => p.photo.src), region.id);
    assert.ok(stops.some(p => !p.photo.src), region.id);
    assert.equal(new Set(stops.map(p => p.id)).size, stops.length);
    const selected = [stops[0]!.id], index = plannerStopClusters(stops, selected);
    const groups = index.getClusters([-180,-85,180,85], 0);
    assert.equal(groups.reduce((count, f) => count + ('cluster' in f.properties ? f.properties.point_count : 1), 0), stops.length - 1, region.id);
    const expanded = index.getClusters([-180,-85,180,85], 18);
    assert.deepEqual(new Set(expanded.map(f => f.properties.id)), new Set(stops.slice(1).map(p => p.id)), region.id);
  }
});

test('OSM IDs are stable across regions and types, and preserve photo attribution without inventing images', () => {
  assert.equal(new Set(['node','way','relation'].map(type => plannerPoiId(`osm:${type}:123`))).size, 3);
  for (const id of ['123','osm:area:123','osm:node:NaN','osm:way:9007199254740991']) assert.throws(() => plannerPoiId(id));
  const pois = snapshot('regions/kr-busan.json').pois;
  for (const poi of pois) {
    const stop = poiToPlannerStop(poi);
    assert.ok(stop.id < 0);
    assert.equal(stop.poiId, poi.id);
    assert.deepEqual(stop.at, poi.at);
    assert.equal(stop.photo.src, poi.photo?.src || '');
    assert.equal(stop.photo.licenseUrl, poi.photo?.licenseUrl || '');
  }
});

test('large ticket selections stay clustered and retain selection and range state', () => {
  const stops=mergePlannerPlaces([],snapshot('regions/jp-tokyo.json').pois);
  const selected=stops.map(p=>p.id), index=plannerStopClusters(stops,selected,selected,true);
  const groups=index.getClusters([-180,-85,180,85],0);
  assert.ok(groups.length<stops.length);
  assert.equal(groups.reduce((total,f)=>total+f.properties.selectedCount,0),stops.length);
  assert.equal(groups.reduce((total,f)=>total+f.properties.inRange,0),stops.length);
  const outside=plannerStopClusters(stops,[],[],true).getClusters([-180,-85,180,85],0);
  assert.ok(outside.every(f=>f.properties.inRange===0));
});

test('itinerary duplicates and overlapping snapshots share one marker while saved imported stops retain IDs', () => {
  const poi = snapshot('regions/kr-busan.json').pois.find(p => p.photo)!;
  const existing = {...poiToPlannerStop(poi), id: 1, poiId: undefined, name: poi.localName};
  const saved = {...poiToPlannerStop(poi), id: plannerPoiId('osm:node:1'), poiId: 'osm:node:1', name: '已儲存的景點', at: [129.1,35.1]};
  const places = mergePlannerPlaces([existing], [poi, {...poi}], [saved]);
  assert.deepEqual(places.map(p=>p.id), [1, saved.id]);
});

test('viewport lookup includes nearby snapshots and excludes other countries and invalid bounds', () => {
  const japanese = catalog.regions.filter(r=>r.country==='JP');
  assert.ok(poiRegionsInBounds(japanese, [135.4,34.6,135.6,34.8]).some(r=>r.id==='jp-osaka'));
  assert.deepEqual(poiRegionsInBounds(japanese, [128.9,35.0,129.2,35.3]), []);
  assert.deepEqual(poiRegionsInBounds(japanese, [NaN,0,1,1]), []);
});

test('missing API region falls back independently to static data and supports a deployment subpath', async () => {
  const region = catalog.regions.find(r=>r.id==='kr-busan')!, data = snapshot(region.file!);
  const urls: string[] = [];
  const repository = createPoiRepository(async url => {
    urls.push(url);
    if(url==='/demo/api/poi/catalog') return catalog;
    if(url==='/demo/api/poi/regions/kr-busan') throw new Error('not published');
    if(url==='/demo/poi/regions/kr-busan.json') return data;
    throw new Error('unexpected URL');
  }, path=>'/demo/'+path);
  assert.equal(await repository.catalog(), catalog);
  const [first, second] = await Promise.all([repository.region(region), repository.region(region)]);
  assert.equal(first, data); assert.equal(second, data);
  assert.deepEqual(urls, ['/demo/api/poi/catalog','/demo/api/poi/regions/kr-busan','/demo/poi/regions/kr-busan.json']);
});

test('a failed region can be retried after static and API requests recover', async () => {
  const region = catalog.regions[0]!, data = snapshot(region.file!);
  let available = false;
  const repository = createPoiRepository(async () => { if(!available)throw new Error('offline');return data; }, p=>'/'+p);
  await assert.rejects(repository.region(region));
  available = true;
  assert.equal(await repository.region(region), data);
});

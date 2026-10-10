import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { visibleTransitCountries, preparePlannerBasemap, attachTransitMap, transitCoverageOpacity, transitLegend } from '../app/utils/transit-map.ts';

test('底圖不可帶入不受圈選控制的灰色景點，車站名稱另外保留', () => {
  const hidden: string[] = [], added: any[] = [];
  const map = {
    getStyle: () => ({ layers: [{ id: 'poi', source: 'osm', 'source-layer': 'poi' }, { id: 'shops', source: 'osm', 'source-layer': 'poi' }, { id: 'roads', 'source-layer': 'transportation' }] }),
    getLayer: () => null,
    setLayoutProperty: (id: string, property: string, value: string) => { assert.equal(property, 'visibility'); assert.equal(value, 'none'); hidden.push(id); },
    addLayer: (layer: any) => added.push(layer),
  };
  preparePlannerBasemap(map);
  assert.deepEqual(hidden, ['poi','shops']);
  assert.equal(added.length, 1);
  assert.deepEqual(added[0].filter, ['==', ['get','class'], 'railway']);
});

test('依地圖視窗載入所需國家的軌道檔案', () => {
  assert.deepEqual(visibleTransitCountries([139.6,35.5,139.9,35.9]).map(c => c.id), ['jp']);
  assert.deepEqual(visibleTransitCountries([126.8,37.4,127.2,37.7]).map(c => c.id), ['kr']);
  assert.deepEqual(visibleTransitCountries([121.4,24.9,121.9,25.2]).map(c => c.id), ['tw']);
  assert.deepEqual(visibleTransitCountries([127.6,26.1,127.8,26.3]).map(c => c.id), ['jp']);
  assert.deepEqual(visibleTransitCountries([10,50,11,51]), []);
  assert.deepEqual(visibleTransitCountries([NaN,0,1,2]), []);
});
test('日韓台使用實際 OSM 軌道，高速線不得混入一般鐵路或鄰國路線', () => {
  const groups: Record<string,string[]> = {};
  for (const country of ['jp','kr','tw']) {
    const data = JSON.parse(readFileSync(new URL(`../public/transit/${country}.json`, import.meta.url), 'utf8'));
    assert.equal(data.type, 'FeatureCollection');
    assert.ok(data.features.length > 100);
    const names: string[] = [];
    for (const f of data.features) {
      const p = f.properties;
      assert.equal(f.geometry.type, 'LineString');
      assert.ok(f.geometry.coordinates.length >= 2);
      assert.ok(f.geometry.coordinates.every((at: number[]) => at.length === 2 && at.every(Number.isFinite)));
      if (p.kind === 'high-speed') { assert.equal(p.highspeed, 'yes'); assert.equal(p.railway, 'rail'); names.push(p.name); }
      else assert.ok(['subway','light_rail'].includes(p.railway));
      assert.ok(Number.isInteger(p.osmId));
    }
    groups[country] = names;
  }
  assert.ok(groups.jp!.some(n => n.includes('東海道新幹線')));
  assert.ok(!groups.jp!.some(n => n.includes('京釜') || n.includes('沈佳')));
  assert.ok(groups.kr!.some(n => n.includes('京釜')));
  assert.ok(!groups.kr!.some(n => n.includes('新幹線')));
  assert.ok(groups.tw!.some(n => n.includes('台灣高速鐵路')));
  const metadata = JSON.parse(readFileSync(new URL('../public/transit/index.json', import.meta.url), 'utf8'));
  assert.equal(metadata.license, 'ODbL-1.0');
  assert.ok(metadata.checkedAt && metadata.licenseUrl);
});

test('日韓台主要地鐵有逐線代表色與可追溯來源', async () => {
  const {transitLegend,transitLineColour}=await import('../app/utils/transit-map.ts');
  const read=(country:string)=>JSON.parse(readFileSync(new URL(`../public/transit/${country}.json`, import.meta.url),'utf8')).features;
  for(const [country,names] of [['jp',['東京メトロ銀座線','東京メトロ丸ノ内線','Osaka Metro御堂筋線']],['kr',['서울 지하철 1호선','2호선','부산 도시철도 1호선']],['tw',['捷運淡水信義線','捷運板南線','臺中捷運綠線']]] as const){
    const features=read(country);
    for(const name of names){const line=features.find((f:any)=>f.properties.lineName===name);assert.ok(line,name);assert.match(line.properties.colour,/^#[0-9A-F]{6}$/);assert.match(line.properties.colourSource,/^https:\/\//);}
    const entries=transitLegend(features);assert.equal(new Set(entries.map(e=>e.key)).size,entries.length);assert.ok(new Set(entries.map(e=>e.colour)).size>4);
  }
  assert.equal(transitLineColour[0],'case');
  const tokyo=read('jp').filter((f:any)=>f.properties.lineName?.startsWith('東京メトロ') && f.properties.lineName.endsWith('線'));
  for(const name of new Set(tokyo.map((f:any)=>f.properties.lineName))){
    const pieces=tokyo.filter((f:any)=>f.properties.lineName===name);
    assert.equal(new Set(pieces.map((f:any)=>f.properties.colour)).size,1,`${name} 不應套用直通列車的其他路線色`);
    assert.equal(new Set(pieces.map((f:any)=>f.properties.ref)).size,1,`${name} 應使用地鐵路線代號`);
  }
  assert.deepEqual(transitLegend([{properties:{kind:'metro',lineName:'未確認路線',lineKey:'unknown'}}]),[{key:'unknown',name:'未確認路線',ref:'',colour:'#778896'}]);
});

test('東京地鐵券讓未包含軌道淡化，切換國家仍維持篩選，取消後恢復底圖', () => {
  const coverage = JSON.parse(readFileSync(new URL('../public/pass-coverage/tokyo-subway.json', import.meta.url),'utf8'));
  const ids:number[] = coverage.features.filter((f:any)=>f.properties.role==='network').map((f:any)=>f.properties.osmId);
  const jp = JSON.parse(readFileSync(new URL('../public/transit/jp.json', import.meta.url),'utf8')).features;
  const included = jp.find((f:any)=>f.properties.lineName==='東京メトロ銀座線');
  const excluded = jp.find((f:any)=>f.properties.lineName==='ゆりかもめ');
  assert.ok(ids.includes(included.properties.osmId));
  assert.ok(!ids.includes(excluded.properties.osmId));
  const legend = transitLegend([included,excluded],new Set(ids));
  assert.equal(legend.find(l=>l.name==='東京メトロ銀座線')?.covered,true);
  assert.equal(legend.find(l=>l.name==='ゆりかもめ')?.covered,false);

  let bounds = [139.6,35.5,139.9,35.9];
  const layers:any[] = [{id:'road_major_rail',type:'line','source-layer':'transportation',paint:{'line-opacity':.7}}, {id:'road_primary',type:'line','source-layer':'transportation'}];
  const paint = new Map<string,any>();
  const listeners = new Map<string,()=>void>();
  const map = {
    getStyle:()=>({layers}), isStyleLoaded:()=>true,
    getBounds:()=>({getWest:()=>bounds[0],getSouth:()=>bounds[1],getEast:()=>bounds[2],getNorth:()=>bounds[3]}),
    addSource:()=>{}, addLayer:(layer:any)=>layers.push(layer), queryRenderedFeatures:()=>[included,excluded],
    setPaintProperty:(id:string,property:string,value:any)=>paint.set(`${id}:${property}`,value),
    on:(event:string,listener:()=>void)=>listeners.set(event,listener),off:(event:string)=>listeners.delete(event),
  };
  const dispose = attachTransitMap(map,path=>`/${path}`);
  dispose.setCoverage(ids);
  assert.equal(paint.get('road_major_rail:line-opacity'),.14);
  assert.ok(!paint.has('road_primary:line-opacity'));
  assert.deepEqual(paint.get('travel-transit-jp-urban-lines:line-opacity'),transitCoverageOpacity(ids));
  bounds=[126.8,37.4,127.2,37.7];listeners.get('moveend')!();
  assert.deepEqual(paint.get('travel-transit-kr-urban-lines:line-opacity'),transitCoverageOpacity(ids));
  dispose.setCoverage(null);
  assert.equal(paint.get('road_major_rail:line-opacity'),.7);
  assert.equal(paint.get('travel-transit-jp-urban-lines:line-opacity'),.85);
  assert.equal(paint.get('travel-transit-jp-names:text-opacity'),1);
  dispose();assert.equal(listeners.size,0);
  dispose.setCoverage([]);assert.equal(paint.get('road_major_rail:line-opacity'),.7);
});

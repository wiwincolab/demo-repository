import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { visibleTransitCountries, preparePlannerBasemap } from '../app/utils/transit-map.ts';

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

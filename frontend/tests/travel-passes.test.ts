import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { travelPasses, findTravelPass, filterTravelPasses, travelPassRegions, passCountries } from '../app/data/travel-passes.ts';
import { validPlanningBoundary, withinPlanningAreas } from '../app/utils/planner-map.ts';
import { tripItineraries } from '../app/data/trips.ts';

test('ticket cards have real local images, official sources and valid planning areas', () => {
  assert.equal(new Set(travelPasses.map(p => p.id)).size, travelPasses.length);
  for (const pass of travelPasses) {
    const file = new URL('../public/' + pass.image, import.meta.url);
    assert.ok(existsSync(file), pass.name + ' image missing');
    const bytes = readFileSync(file);
    const raster = bytes.subarray(0, 8).toString('hex') === '89504e470d0a1a0a' || bytes.subarray(0, 3).toString('hex') === 'ffd8ff' || bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP' || bytes.toString('ascii', 0, 3) === 'GIF';
    assert.ok(bytes.length > 500 && raster, pass.name + ' must have a real raster image');
    assert.match(pass.source, /^https:\/\//);
    assert.match(pass.imageSource, /^https:\/\//);
    assert.match(pass.coverageUrl, /^https:\/\//);
    assert.ok(pass.credit && pass.coverage && pass.exclusions && pass.regionKeys.length && pass.imageKind);
    for (const area of pass.areas) assert.deepEqual(validPlanningBoundary(area), area);
  }
});
test('the full Japan, Korea and Taiwan library is available regardless of current trip', () => {
  assert.deepEqual(filterTravelPasses(), travelPasses);
  assert.ok(travelPasses.length >= 100);
  for (const country of passCountries) assert.ok(filterTravelPasses({ country: country.id }).length >= 10);
  for (const id of ['jr-hokkaido-hrp', 'jr-east-eastpass', 'jr-central-alpine', 'jr-west-all', 'jr-shikoku', 'jr-kyushu-all', 'okinawa-yui', 'discover-seoul', 'visit-busan', 'korail-pass', 'namane', 'taiwan-hsr', 'taiwan-tra', 'tw-kenting-shuttle']) assert.equal(findTravelPass(id)?.id, id);
  assert.equal(findTravelPass('unknown'), undefined);
  assert.equal(findTravelPass({ id: 'discover-seoul' }), undefined);
});
test('country, regional and text filters find national passes and normalize user spelling', () => {
  assert.ok(filterTravelPasses({ country: 'JP', region: '北海道' }).some(p => p.id === 'japan-rail'));
  assert.ok(filterTravelPasses({ country: 'JP', region: '北海道' }).every(p => p.country === 'JP'));
  assert.deepEqual(filterTravelPasses({ query: '大阪 周遊卷' }), filterTravelPasses({ query: '大阪 周遊券' }));
  assert.ok(filterTravelPasses({ query: '大阪 周遊卷' }).some(p => p.id === 'osaka-amazing'));
  assert.equal(filterTravelPasses({ query: 'ｗｏｗｐａｓｓ', country: 'KR' }).some(p => p.id === 'wowpass'), true);
  assert.equal(filterTravelPasses({ country: 'TW', query: '日月潭' }).length, 2);
  assert.equal(filterTravelPasses({ country: 'TW', query: '不存在的票券' }).length, 0);
  assert.ok(travelPassRegions('TW').includes('東部'));
  assert.ok(!travelPassRegions('TW').includes('關西'));
  assert.ok(!filterTravelPasses({ country: 'JP', region: '沖繩' }).some(p => p.id === 'japan-rail'));
  assert.ok(!filterTravelPasses({ country: 'TW', region: '東部' }).some(p => p.id === 'taiwan-hsr'));
});
test('prepaid cards disclose top-up requirements and discontinued passes are not offered', () => {
  const prepaid = travelPasses.filter(p => p.kind === 'stored-value');
  assert.ok(prepaid.length >= 4);
  for (const pass of prepaid) assert.match(pass.exclusions, /儲值/);
  for (const id of ['korea-tour-card', 'jr-west-kansai', 'jr-east-eastpass_t', 'jr-east-eastpass_n', 'kagawa-mini']) assert.equal(findTravelPass(id), undefined);
});
test('ticket planning areas exclude unrelated cities and airport/theme-park excursions', () => {
  const tokyo = findTravelPass('tokyo-subway')!;
  assert.equal(withinPlanningAreas([139.7967,35.7148], tokyo.areas), true);
  assert.equal(withinPlanningAreas([139.8814,35.6327], tokyo.areas), false);
  assert.equal(withinPlanningAreas([140.3933,35.7759], tokyo.areas), false);
  const osaka = findTravelPass('osaka-amazing')!;
  assert.equal(withinPlanningAreas([135.5013,34.6687], osaka.areas), true);
  assert.equal(withinPlanningAreas([135.785,34.9949], osaka.areas), false);
  assert.equal(withinPlanningAreas([135.1898,34.7012], osaka.areas), false);
  const busan = findTravelPass('visit-busan')!;
  const chosen = tripItineraries.busan.flatMap(d => d.stops).filter(s => withinPlanningAreas(s.at, busan.areas));
  assert.ok(chosen.some(p => p.name.includes('海雲台')));
  assert.ok(chosen.every(p => p.at[1]! < 35.3));
  const seoul = findTravelPass('discover-seoul')!;
  assert.equal(withinPlanningAreas([127.2025,37.2935], seoul.areas), true);
  assert.equal(withinPlanningAreas([127.5251,37.7917], seoul.areas), true);
  assert.equal(withinPlanningAreas([126.4417,37.4635], seoul.areas), false);
  assert.equal(withinPlanningAreas([139.75,35.65], findTravelPass('jr-kyushu-all')!.areas), false);
  assert.equal(withinPlanningAreas([120.3,22.65], findTravelPass('taiwan-tra')!.areas), true);
  assert.equal(withinPlanningAreas([126.52,33.49], findTravelPass('korail-pass')!.areas), false);
});

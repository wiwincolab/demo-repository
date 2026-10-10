import test from 'node:test';
import assert from 'node:assert/strict';
import { recommendPlaces, rainPlanDetailsFor } from '../app/utils/planner.ts';
import { tripItineraries } from '../app/data/trips.ts';
const stops = tripItineraries.fuji.flatMap(d => d.stops).slice(0, 2);
test('keeps recommendations inside the selection by default', () => {
  assert.deepEqual(recommendPlaces(stops, [1], '喜歡自然景點', 3, 0).stops.map(s => s.id), [1]);
});
test('uses explicit extension and explains the outside recommendation', () => {
  const plan = recommendPlaces(stops, [1], '喜歡自然景點，圈外多搭 60 分鐘', 3, 0);
  assert.ok(plan.stops.some(s => s.id === 0 && s.outside && s.reason.includes('自然景觀')));
  assert.ok(plan.notes.includes('圈外交通上限 60 分鐘'));
});
test('respects an explicit refusal to go outside', () => {
  assert.ok(recommendPlaces(stops, [1], '喜歡自然景點，不要圈外', 3, 60).stops.every(s => !s.outside));
});
test('respects time and identifies unverified costs and pass coverage', () => {
  const plan = recommendPlaces(stops, [0, 1], '只有一小時，預算 3000 日圓，買了周遊券', 3, 0);
  assert.deepEqual(plan.stops.map(s => s.id), [1]);
  assert.ok(plan.notes.some(n => n.includes('尚無法驗證總花費')));
  assert.ok(plan.notes.some(n => n.includes('涵蓋路線與優惠待查核')));
});
test('does not substitute outdoor places for a rain requirement', () => {
  assert.equal(recommendPlaces([stops[0]!], [0], '雨天室內', 3, 0).stops.length, 0);
});
test('recognizes Chinese extension durations and half an hour', () => {
  const plan = recommendPlaces(stops, [1], '喜歡自然景點，圈外多搭二十分鐘，只有半小時', 3, 60);
  assert.ok(plan.notes.includes('圈外交通上限 20 分鐘'));
  assert.equal(plan.stops.length, 0);
});
test('requires a selected area even if extension is allowed', () => {
  assert.equal(recommendPlaces(stops, [], '自然景點', 3, 60).stops.length, 0);
});

test('selected profile keywords change ranking and explain the recommendation', () => {
  const places = [
    { ...stops[0]!, id: 10, name: '城市公園', at: [139.7, 35.6], stay: '停留 30 分鐘' },
    { ...stops[1]!, id: 11, name: '街角咖啡店', at: [139.7001, 35.6001], stay: '停留 30 分鐘' },
  ];
  const food = recommendPlaces(places, [10,11], '', 1, 0, ['food']);
  assert.equal(food.stops[0]?.id, 11);
  assert.match(food.stops[0]!.reason, /偏好關鍵字：咖啡與甜點/);
  assert.equal(recommendPlaces(places, [10,11], '', 1, 0, ['nature']).stops[0]?.id, 10);
  assert.equal(recommendPlaces(places, [10,11], '', 1, 0).stops[0]?.id, 10);
});

test('this-trip exclusions override saved preference keywords', () => {
  const places = [
    { ...stops[0]!, id: 10, name: '城市公園', at: [139.7, 35.6], stay: '停留 30 分鐘' },
    { ...stops[1]!, id: 11, name: '街角咖啡店', at: [139.7001, 35.6001], stay: '停留 30 分鐘' },
  ];
  const result = recommendPlaces(places, [10,11], '這次不要咖啡，只有一小時', 3, 0, ['food']);
  assert.deepEqual(result.stops.map(p => p.id), [10]);
  assert.ok(result.notes.some(n => n.includes('依本次條件排除：咖啡與甜點')));
});

test('profile preferences never bypass area, time or rain constraints', () => {
  assert.equal(recommendPlaces(stops, [1], '只有半小時', 3, 0, ['nature']).stops.length, 0);
  assert.equal(recommendPlaces([stops[0]!], [0], '雨天室內', 3, 0, ['nature']).stops.length, 0);
  assert.ok(recommendPlaces(stops, [1], '', 3, 0, ['nature']).stops.every(s => !s.outside));
});

test('explicit interests rank ahead of the selected long-term preferences', () => {
  const places = [
    { ...stops[0]!, id: 10, name: '城市公園', at: [139.7, 35.6], stay: '停留 30 分鐘' },
    { ...stops[1]!, id: 11, name: '街角咖啡店', at: [139.7001, 35.6001], stay: '停留 30 分鐘' },
  ];
  assert.equal(recommendPlaces(places, [10,11], '今天想喝咖啡', 1, 0, ['nature']).stops[0]?.id, 11);
});

test('text edits promote a named outside place and support removal in order', async () => {
  const { refineSelection } = await import('../app/utils/planner.ts');
  const a = stops[0]!, b = stops[1]!;
  assert.deepEqual(refineSelection(stops, [a.id], `加入${b.name}，移除${a.name}`).ids, [b.id]);
  assert.deepEqual(refineSelection(stops, [], `加入${b.name}，不要${b.name}`).ids, []);
  assert.deepEqual(refineSelection(stops, [a.id], '喜歡自然景點，加入不存在的景點').ids, [a.id]);
});

test('selected-only planning does not automatically include gray places', () => {
  const result = recommendPlaces(stops, [1], '喜歡自然景點，圈外多搭 60 分鐘', 4, 60, [], true);
  assert.deepEqual(result.stops.map(s => s.id), [1]);
});

test('every generated stop has a rain plan without requiring rain keywords', async () => {
  const { rainPlanFor } = await import('../app/utils/planner.ts');
  const indoor = { ...stops[0]!, id: 100, name: '城市博物館' };
  const places = [...stops, indoor];
  const plan = recommendPlaces(places, places.map(p => p.id), '', 4, 0, [], true);
  assert.ok(plan.stops.length > 0);
  assert.ok(plan.stops.every(s => s.rainPlan.length > 0));
  assert.match(rainPlanFor(stops[0]!, places), /城市博物館/);
  assert.match(rainPlanFor(indoor, places), /保留城市博物館/);
  assert.match(rainPlanFor(stops[0]!, [stops[0]!]), /沒有可確認/);
});

test('hour-based visits do not fit into an undersized time budget', () => {
  const themePark = { ...stops[0]!, id: 20, name: '東京迪士尼樂園', stay: '停留 8 小時' };
  assert.equal(recommendPlaces([themePark], [20], '有四小時', 3, 0).stops.length, 0);
  assert.equal(recommendPlaces([themePark], [20], '有九小時', 3, 0).stops.length, 1);
  const mixed = { ...themePark, stay: '停留 1 小時 30 分鐘' };
  assert.equal(recommendPlaces([mixed], [20], '只有一小時', 3, 0).stops.length, 0);
});

test('rain backups avoid explicitly excluded interests and distant indoor venues', async () => {
  const { rainPlanFor } = await import('../app/utils/planner.ts');
  const outdoor = { ...stops[0]!, name: '城市公園' };
  const coffee = { ...stops[1]!, name: '街角咖啡店', at: outdoor.at };
  const result = recommendPlaces([outdoor, coffee], [outdoor.id], '不要咖啡', 3, 0);
  assert.doesNotMatch(result.stops[0]!.rainPlan, /街角咖啡店/);
  assert.match(rainPlanFor(outdoor, [outdoor, { ...coffee, at: [120, 23] }]), /沒有可確認/);
});

test('rain alternatives retain the matching photo and attribution after saving and reloading', () => {
  const places = tripItineraries.tokyo.flatMap(d => d.stops);
  const outdoor = places.find(p => p.name.includes('淺草寺'))!;
  const plan = recommendPlaces(places, [outdoor.id], '', 1, 0, [], true);
  const saved = JSON.parse(JSON.stringify(plan));
  const backup = saved.stops[0].rainAlternative;
  assert.ok(backup?.photo.src);
  assert.match(saved.stops[0].rainPlan, new RegExp(backup.name));
  assert.deepEqual(backup.photo, places.find(p => p.id === backup.id)!.photo);
  const retained = rainPlanDetailsFor(places.find(p => p.id === backup.id)!, places);
  assert.equal(retained.rainAlternative?.id, backup.id);
  assert.match(retained.rainPlan, /保留/);
});

test('rain photo choices stay nearby, respect exclusions and never borrow an unrelated image', () => {
  const outdoor = { ...stops[0]!, id: 20, name: '城市公園', at: [139.7, 35.6] };
  const noPhoto = { ...stops[1]!, id: 21, name: '室內展覽', at: outdoor.at, photo: { ...stops[1]!.photo, src: '' } };
  const museum = { ...stops[1]!, id: 22, name: '城市博物館', at: [139.71, 35.61] };
  assert.equal(rainPlanDetailsFor(outdoor, [noPhoto, museum]).rainAlternative?.id, museum.id);
  assert.equal(rainPlanDetailsFor(outdoor, [noPhoto, museum], '不要文化景點').rainAlternative?.id, noPhoto.id);
  assert.equal(rainPlanDetailsFor(outdoor, [noPhoto, { ...museum, at: [120, 23] }]).rainAlternative?.photo.src, '');
  assert.equal(rainPlanDetailsFor(outdoor, []).rainAlternative, null);
  const snapshot = rainPlanDetailsFor(outdoor, [museum]).rainAlternative!;
  snapshot.photo.credit = 'changed';
  assert.notEqual(snapshot.photo.credit, museum.photo.credit);
});

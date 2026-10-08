import test from 'node:test';
import assert from 'node:assert/strict';
import { recommendPlaces } from '../app/utils/planner.ts';
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

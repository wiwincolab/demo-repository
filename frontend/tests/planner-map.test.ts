import test from 'node:test';
import assert from 'node:assert/strict';
import { plannerMarkerState, mapDetailLevel, visibleMapDetails, validPlanningBoundary, withinPlanningAreas, isUsableMapStroke } from '../app/utils/planner-map.ts';

test('gray markers only appear outside a completed selection', () => {
  assert.equal(plannerMarkerState(1, [], [], false), 'candidate');
  assert.equal(plannerMarkerState(1, [], [1], true), 'candidate');
  assert.equal(plannerMarkerState(2, [], [1], true), 'outside');
  assert.equal(plannerMarkerState(2, [2], [1], true), 'selected');
  assert.equal(plannerMarkerState(2, [], [], false), 'candidate');
});
test('zoom progressively reveals names and photo details without a detail button', () => {
  assert.equal(mapDetailLevel(9), 'dots');
  assert.equal(mapDetailLevel(12), 'names');
  assert.equal(mapDetailLevel(13.9), 'names');
  assert.equal(mapDetailLevel(14), 'photos');
});
test('photo detail cards prioritize chosen places, avoid overlap and stay on the map', () => {
  const points = [{ stop: { id: 1 }, point: [180, 200] }, { stop: { id: 2 }, point: [182, 205] }, { stop: { id: 3 }, point: [350, 220] }, { stop: { id: 4 }, point: [10, 20] }];
  assert.deepEqual(visibleMapDetails(points, [2], 500, 400, 'dots'), []);
  assert.deepEqual(visibleMapDetails(points, [2], 500, 400, 'photos').map(p => p.stop.id), [2, 3]);
});
test('saved boundaries reject malformed coordinates and preserve valid drawn ranges', () => {
  const polygon = [[139.7,35.6],[139.8,35.6],[139.8,35.7],[139.7,35.7]];
  const restored = validPlanningBoundary(polygon);
  assert.deepEqual(restored, polygon);
  assert.notEqual(restored, polygon);
  assert.equal(withinPlanningAreas([139.75,35.65], [restored]), true);
  for (const value of [null, [], [[0,0]], [[181,0],[0,0],[1,1]], [[0,91],[0,0],[1,1]], [[NaN,0],[0,0],[1,1]], [['139',35],[0,0],[1,1]]]) assert.deepEqual(validPlanningBoundary(value), []);
});
test('separate ticket areas never include the gap between partner destinations', () => {
  const areas = [[[0,0],[1,0],[1,1],[0,1]], [[3,0],[4,0],[4,1],[3,1]]];
  assert.equal(withinPlanningAreas([.5,.5], areas), true);
  assert.equal(withinPlanningAreas([3.5,.5], areas), true);
  assert.equal(withinPlanningAreas([2,.5], areas), false);
});
test('an accidental click, straight drag or tiny loop does not complete a range', () => {
  for (const points of [[], [[20,20]], [[20,20],[40,40],[80,80]], [[20,20],[22,20],[22,22],[20,22]]]) assert.equal(isUsableMapStroke(points), false);
  const loop = [[20,20],[120,20],[120,120],[20,120]];
  assert.equal(isUsableMapStroke(loop), true);
  assert.equal(isUsableMapStroke([...loop].reverse()), true);
});

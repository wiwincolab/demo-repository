import test from 'node:test';
import assert from 'node:assert/strict';
import { directionsUrl } from '../app/utils/directions.ts';
test('directions preserve itinerary order and convert longitude/latitude for Maps URLs', () => {
  const url = new URL(directionsUrl({ at: [126.977, 37.579] }, { at: [127.059, 37.512] }));
  assert.equal(url.origin, 'https://www.google.com');
  assert.equal(url.pathname, '/maps/dir/');
  assert.equal(url.searchParams.get('api'), '1');
  assert.equal(url.searchParams.get('origin'), '37.579,126.977');
  assert.equal(url.searchParams.get('destination'), '37.512,127.059');
  assert.equal(url.searchParams.has('travelmode'), false);
});

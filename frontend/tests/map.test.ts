import test from 'node:test';
import assert from 'node:assert/strict';
import { projection, pointInPolygon } from '../app/utils/map.ts';
test('circle selection includes interior points and excludes unrelated locations', () => {
    const polygon = [[0, 0], [10, 0], [10, 10], [0, 10]];
    assert.equal(pointInPolygon([5, 5], polygon), true);
    assert.equal(pointInPolygon([11, 5], polygon), false);
    assert.equal(pointInPolygon([5, 5], []), false);
});
test('map projection remains finite for a single selected location', () => {
    const project = projection([{ at: [139.8, 35.7] }], 390, 300);
    assert.deepEqual(project([139.8, 35.7]), [195, 150]);
});
test('a saved geographic selection stays aligned after resizing the map', () => {
    const places = [{ at: [139.8, 35.7] }, { at: [139.9, 35.8] }];
    const small = projection(places, 390, 300);
    const large = projection(places, 900, 400);
    const boundary = [[139.79,35.69],[139.81,35.69],[139.81,35.71],[139.79,35.71]];
    const saved = boundary.map(small).map(small.invert);
    const restored = saved.map(large);
    assert.equal(pointInPolygon(large(places[0]!.at), restored), true);
    assert.equal(pointInPolygon(large(places[1]!.at), restored), false);
    saved.forEach((p, i) => p.forEach((n, axis) => assert.ok(Math.abs(n - boundary[i]![axis]!) < 1e-9)));
});

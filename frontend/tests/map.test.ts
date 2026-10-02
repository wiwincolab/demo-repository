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

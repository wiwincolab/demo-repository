import test from 'node:test';
import assert from 'node:assert/strict';
import { isTownLayout } from '../app/utils/town-layout.ts';

test('saved town layouts accept any complete permutation', () => {
  assert.equal(isTownLayout([8, 1, 2, 3, 4, 5, 6, 7, 0]), true);
});
test('reject corrupted or unexpected frame payloads', () => {
  for (const input of [null, {}, '012345678', [], [0, 1, 2, 3, 4, 5, 6, 7],
    [0, 1, 2, 3, 4, 5, 6, 7, 7], [0, 1, 2, 3, 4, 5, 6, 7, 9],
    [0, 1, 2, 3, 4, 5, 6, 7, -1], [0, 1, 2, 3, 4, 5, 6, 7, '8'],
    [0, 1, 2, 3, 4, 5, 6, 7, 8.1]]) assert.equal(isTownLayout(input), false);
});

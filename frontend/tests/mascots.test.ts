import test from 'node:test';
import assert from 'node:assert/strict';
import { mascots, isMascotId } from '../app/data/mascots.ts';

test('member outfits must come from the known mascot catalog', () => {
  assert.equal(new Set(mascots.map(m => m.id)).size, mascots.length);
  for (const mascot of mascots) assert.equal(isMascotId(mascot.id), true);
  for (const invalid of [null, undefined, '', 'unknown', '../../etc/passwd', 'https://example.com/avatar.png', {}]) {
    assert.equal(isMascotId(invalid), false);
  }
});

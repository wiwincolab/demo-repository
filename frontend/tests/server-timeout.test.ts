import test from 'node:test';
import assert from 'node:assert/strict';
import { withTimeout } from '../server/utils/timeout.ts';

test('withTimeout rejects slow work and passes fast work through', async () => {
    assert.equal(await withTimeout(Promise.resolve(7), 50, 'fast'), 7);
    await assert.rejects(withTimeout(new Promise(() => {}), 20, 'slow'), /slow 逾時/);
});

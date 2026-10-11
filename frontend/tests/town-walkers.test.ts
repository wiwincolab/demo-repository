import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const context = vm.createContext({});
vm.runInContext(readFileSync(new URL('../public/demos/travel-town/walker-paths.js', import.meta.url), 'utf8'), context);
const paths = context.TownWalkerPaths;

test('all three walking loops keep the mascot footprint within the 1.42m pedestrian corridor', () => {
  for (const row of [-1, 0, 1]) for (let d = 0; d < paths.length; d += .025) {
    const p = paths.sample(d, row);
    assert.ok(Math.abs(p.z - (row * 12 + 2)) + .35 < .71);
    assert.ok(Math.abs(p.x) + .35 < 18);
    assert.ok(Number.isFinite(p.heading));
  }
});

test('turns and loop wrap preserve position, direction and walking speed', () => {
  const step = .0001;
  for (let d = 0; d < paths.length; d += .013) {
    const a = paths.sample(d), b = paths.sample(d + step);
    assert.ok(Math.abs(Math.hypot(b.x - a.x, b.z - a.z) / step - 1) < .001);
    const heading = Math.atan2(b.x - a.x, b.z - a.z);
    const difference = Math.atan2(Math.sin(heading - a.heading), Math.cos(heading - a.heading));
    assert.ok(Math.abs(difference) < .001);
  }
  const start = paths.sample(0), before = paths.sample(-step), after = paths.sample(paths.length);
  assert.ok(Math.hypot(start.x - before.x, start.z - before.z) <= step * 1.001);
  assert.equal(after.x, start.x); assert.equal(after.z, start.z);
});

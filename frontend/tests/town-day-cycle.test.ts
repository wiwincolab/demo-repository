import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const root = new URL('../public/demos/travel-town/', import.meta.url);
class Vector {
  x: number; y: number; z: number;
  constructor(x: number, y: number, z: number) { this.x = x; this.y = y; this.z = z; }
  multiplyScalar(scale: number) { this.x *= scale; this.y *= scale; this.z *= scale; return this; }
}
class Color { lerp() { return this; } }
function stateAt(instant: string) {
  class ClockDate extends Date {
    constructor(value?: string | number | Date) {
      super(value === undefined ? instant : value instanceof Date ? +value : value);
    }
  }
  const context = vm.createContext({ Date: ClockDate, Intl });
  context.window = context;
  for (const file of ['vendor/astronomy.browser.min.js', 'sky-core.js', 'town-astronomy.js']) {
    vm.runInContext(readFileSync(new URL(file, root), 'utf8'), context);
  }
  return { raw: context.TownAstronomy.state.snapshot,
    frame: context.TownAstronomy.frame({ Vector3: Vector, Color }) };
}

test('daytime display shows only the Sun even when the real Moon is above the horizon', () => {
  const { raw, frame } = stateAt('2026-10-12T03:00:00Z');
  assert.equal(raw.sun.visible, true); assert.equal(raw.moon.visible, true);
  assert.equal(frame.sunOpacity, 1); assert.equal(frame.moonOpacity, 0);
});

test('nighttime display shows only the real risen Moon', () => {
  const { raw, frame } = stateAt('2026-10-26T12:00:00Z');
  assert.equal(raw.sun.visible, false); assert.equal(raw.moon.visible, true);
  assert.equal(frame.sunOpacity, 0); assert.equal(frame.moonOpacity, 1);
});

test('nighttime does not invent a Moon when it is below the horizon', () => {
  const { raw, frame } = stateAt('2026-10-12T15:00:00Z');
  assert.equal(raw.sun.visible, false); assert.equal(raw.moon.visible, false);
  assert.equal(frame.sunOpacity, 0); assert.equal(frame.moonOpacity, 0);
});

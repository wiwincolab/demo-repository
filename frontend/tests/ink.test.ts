import test from 'node:test';
import assert from 'node:assert/strict';
import { createInkController, type InkFrame } from '../app/utils/ink/controller.ts';
import { inkColors, pickEffect } from '../app/utils/ink/effects.ts';

function setup(animate = true) {
  let now = 0, clears = 0;
  let frames: (() => void)[] = [];
  const timers = new Set<{ at: number; fn: () => void }>();
  const drawn: InkFrame[] = [];
  const ink = createInkController({
    now: () => now, random: () => .5, canAnimate: () => animate,
    raf: callback => { frames.push(callback); },
    setTimer: (fn, ms) => {
      const timer = { at: now + ms, fn }; timers.add(timer);
      return () => { timers.delete(timer); };
    },
  });
  ink.attach({ begin: () => ({ origin: [10, 20] }), draw: frame => { drawn.push(frame); }, clear: () => { clears++; } });
  return { ink, drawn, clears: () => clears, async step(ms = 16, paint = true) {
    now += ms;
    for (const timer of timers) if (timer.at <= now) { timers.delete(timer); timer.fn(); }
    if (paint) { const batch = frames; frames = []; batch.forEach(fn => fn()); }
    await Promise.resolve(); await Promise.resolve();
  } };
}

test('trip list splats, tabs bleed, detail pages brush; same path does not animate', () => {
  assert.equal(pickEffect('/trips', '/trip'), 'splat');
  assert.equal(pickEffect('/trip', '/trips/'), 'splat');
  assert.equal(pickEffect('/trip', '/esim'), 'bleed');
  assert.equal(pickEffect('/memory', '/memory/usj'), 'brush');
  assert.equal(pickEffect('/atlas/', '/atlas'), null);
});

test('page swaps only under full ink, waits for page render, then clears', async () => {
  const s = setup(); let swaps = 0; let release!: () => void;
  s.ink.play({ effect: 'splat', colors: inkColors('light'), atSwap: () => {
    swaps++; return new Promise<void>(resolve => { release = resolve; });
  } });
  await s.step(400); assert.equal(swaps, 0);
  await s.step(80); assert.equal(swaps, 1); assert.equal(s.drawn.at(-1)?.t, .5);
  await s.step(); await s.step(); assert.equal(s.ink.phase(), 'hold');
  release(); await s.step(); await s.step(); assert.equal(s.ink.phase(), 'reveal');
  await s.step(500); assert.equal(s.ink.phase(), 'idle'); assert.equal(s.clears(), 1);
});

test('reduced motion and unavailable WebGL still allow navigation immediately', () => {
  for (const reduced of [true, false]) {
    const s = setup(!reduced); if (!reduced) s.ink.attach(null);
    let swaps = 0;
    s.ink.play({ effect: 'brush', colors: inkColors('light'), atSwap: () => { swaps++; } });
    assert.equal(swaps, 1); assert.equal(s.ink.phase(), 'idle'); assert.equal(s.drawn.length, 0);
  }
});

test('stalled rendering and unmount release pending navigation exactly once', async () => {
  for (const stalled of [true, false]) {
    const s = setup(); let swaps = 0;
    s.ink.play({ effect: 'bleed', colors: inkColors('light'), atSwap: () => { swaps++; } });
    if (stalled) await s.step(1000, false); else s.ink.attach(null);
    await s.step(); assert.equal(swaps, 1); assert.equal(s.ink.phase(), 'idle');
  }
});

test('an unresolved destination cannot hold the ink indefinitely', async () => {
  const s = setup();
  s.ink.play({ effect: 'brush', colors: inkColors('light'), atSwap: () => new Promise(() => {}) });
  await s.step(400); await s.step(); await s.step(1600);
  assert.equal(s.ink.phase(), 'reveal');
  await s.step(400); assert.equal(s.ink.phase(), 'idle');
});

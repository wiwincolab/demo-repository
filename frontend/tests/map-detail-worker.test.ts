import test from 'node:test';
import assert from 'node:assert/strict';
import { layoutMapDetails, detailFits, detailRect, type DetailView, type DetailRequest, type DetailResponse } from '../app/utils/map-detail-layout.ts';
import { createMapDetailClient, type DetailClock, type DetailWorker } from '../app/utils/map-detail-client.ts';

const view = (key = 'tokyo:photos'): DetailView => ({ key, level: 'photos', width: 500, height: 400, preferred: [], points: [
  { id: 1, point: [180, 200], photo: true, selected: false },
  { id: 2, point: [182, 205], photo: true, selected: true },
  { id: 3, point: [350, 220], photo: true, selected: false },
  { id: 4, point: [10, 20], photo: true, selected: false },
] });
class WorkerMock implements DetailWorker {
  onmessage: ((event: MessageEvent<DetailResponse>) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  sent: DetailRequest[] = []; terminated = false;
  postMessage(data: DetailRequest) { this.sent.push(data); }
  terminate() { this.terminated = true; }
  reply(index: number) { const data = this.sent[index]!; this.onmessage?.({ data: { request: data.request, ids: layoutMapDetails(data.view) } } as MessageEvent<DetailResponse>); }
}
function fakeClock() {
  let now = 0, timer: (() => void) | undefined;
  const clock: DetailClock = { now: () => now, later(fn) { timer = fn; return 1; }, cancel() { timer = undefined; } };
  return { clock, advance() { now += 80; const fn = timer; timer = undefined; fn?.(); }, hasTimer: () => !!timer };
}
test('automatic cards prioritize selected places and photos, and stay inside the map', () => {
  assert.deepEqual(layoutMapDetails(view()), [2, 3]);
  assert.deepEqual(layoutMapDetails({ ...view(), level: 'dots' }), []);
  for (const level of ['names', 'photos'] as const) for (const id of layoutMapDetails({ ...view(), level })) {
    assert.ok(detailFits(view().points.find(p => p.id === id)!.point, 500, 400, level));
  }
  assert.equal(detailFits([NaN, 200], 500, 400, 'photos'), false);
});
test('dense viewports keep a bounded, non-overlapping set and prefer existing cards', () => {
  const dense: DetailView = { ...view(), width: 600, height: 2000, points: Array.from({ length: 3000 }, (_, i) => ({ id: i, point: [90 + i % 3 * 180, 190 + Math.floor(i / 3) * 190], photo: true, selected: false })) };
  const ids = layoutMapDetails(dense);
  assert.equal(ids.length, 8);
  const boxes = ids.map(id => detailRect(dense.points.find(p => p.id === id)!.point, 'photos'));
  for (let i = 0; i < boxes.length; i++) for (const b of boxes.slice(i + 1)) {
    const a = boxes[i]!; assert.ok(!(a[0]! < b[2]! + 6 && a[2]! > b[0]! - 6 && a[1]! < b[3]! + 6 && a[3]! > b[1]! - 6));
  }
  assert.equal(layoutMapDetails({ ...view(), points: view().points.map(p => ({ ...p, selected: false })), preferred: [1] })[0], 1);
  assert.equal(layoutMapDetails({ ...dense, width: 2000 }).length, 18);
});
test('layout worker is lazy, coalesces drag views and ignores repeat camera frames', () => {
  const worker = new WorkerMock(), time = fakeClock(); let created = 0;
  const client = createMapDetailClient(() => { created++; return worker; }, () => {}, time.clock);
  client.query({ ...view('dots'), level: 'dots' }); assert.equal(created, 0);
  client.query(view()); assert.equal(created, 1); assert.equal(worker.sent.length, 1);
  for (let i = 0; i < 100; i++) client.query({ ...view(), points: view().points.map(p => ({ ...p, point: [p.point[0]! + i / 10, p.point[1]!] })) });
  assert.equal(worker.sent.length, 1);
  worker.reply(0); assert.ok(time.hasTimer()); time.advance(); assert.equal(worker.sent.length, 2);
  assert.equal(worker.sent[1]!.view.points[0]!.point[0], 189.9);
  worker.reply(1); client.query(worker.sent[1]!.view); assert.equal(worker.sent.length, 2);
  client.dispose(); assert.ok(worker.terminated);
});
test('zoom-out and destination changes never resurrect stale photo cards', () => {
  const worker = new WorkerMock(), time = fakeClock(), results: (string | number)[][] = [];
  const client = createMapDetailClient(() => worker, ids => results.push(ids), time.clock);
  client.query(view()); client.query({ ...view('tokyo:dots'), level: 'dots' }); worker.reply(0);
  assert.deepEqual(results.at(-1), []);
  client.query(view('osaka:photos')); client.query(view('busan:photos')); worker.reply(1);
  assert.deepEqual(results.at(-1), []);
  worker.reply(2); assert.deepEqual(results.at(-1), [2, 3]);
  client.query({ ...view('busan:photos'), points: [] }); assert.ok(time.hasTimer()); client.dispose();
  time.advance(); assert.equal(worker.sent.length, 3);
});
test('unavailable or failed workers retain zoom cards through a bounded fallback', () => {
  for (const supported of [false, true]) {
    const worker = new WorkerMock(), time = fakeClock(), results: (string | number)[][] = [];
    const client = createMapDetailClient(() => { if (!supported) throw Error('unsupported'); return worker; }, ids => results.push(ids), time.clock);
    client.query(view()); if (supported) { worker.onerror?.({} as ErrorEvent); time.advance(); }
    assert.equal(client.mode, 'fallback'); assert.deepEqual(results.at(-1), [2, 3]); client.dispose();
  }
});

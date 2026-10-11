import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createMapClusterEngine, emptyClusterState, type ClusterRequest, type ClusterResponse, type MapClusterPoint } from '../app/utils/map-cluster-engine.ts';
import { createMapClusterClient, type ClusterWorker } from '../app/utils/map-cluster-client.ts';
import { poiClusterIndex } from '../app/utils/poi.ts';
import { mergePlannerPlaces, plannerStopClusters } from '../app/utils/planner-poi.ts';
import type { Poi } from '../app/types/poi.ts';

const world: [number, number, number, number] = [-180, -85, 180, 85];
const pois = JSON.parse(readFileSync(new URL('../public/poi/regions/jp-tokyo.json', import.meta.url), 'utf8')).pois as Poi[];
const geometry = pois.map(p => ({ id: p.id, at: p.at, photo: !!p.photo }));

test('worker geometry preserves every POI, photo count and cluster expansion', () => {
  const engine = createMapClusterEngine();
  engine.load(geometry, { mode: 'places', radius: 60 }, emptyClusterState());
  for (const zoom of [0, 10, 14, 18]) {
    const old = poiClusterIndex(pois, 60).getClusters(world, zoom), actual = engine.query(world, zoom);
    assert.equal(actual.length, old.length);
    assert.equal(actual.reduce((n, f) => n + f.count, 0), pois.length);
    assert.equal(actual.reduce((n, f) => n + f.photoCount, 0), pois.filter(p => p.photo).length);
    if (zoom === 18) assert.deepEqual(new Set(actual.map(f => f.id)), new Set(pois.map(p => p.id)));
    else for (const f of actual) if (f.clusterId !== undefined) assert.ok(f.expansionZoom! > zoom);
  }
  assert.ok(JSON.stringify(geometry).length < JSON.stringify(pois).length / 10);
});

test('worker selections retain small separate markers and large ticket cluster state', () => {
  const stops = mergePlannerPlaces([], pois), points = stops.map(p => ({ id: p.id, at: p.at, photo: !!p.photo.src }));
  const engine = createMapClusterEngine(), chosen = stops.map(p => p.id);
  engine.load(points, { mode: 'planner', radius: 60 }, { selected: chosen, rangeIds: chosen, hasRange: true });
  let features = engine.query(world, 0);
  assert.equal(features.reduce((n, f) => n + f.selectedCount, 0), stops.length);
  assert.equal(features.reduce((n, f) => n + f.inRange, 0), stops.length);
  assert.equal(features.length, plannerStopClusters(stops, chosen, chosen, true, 60).getClusters(world, 0).length);
  engine.select({ selected: [chosen[0]!], rangeIds: [], hasRange: true });
  features = engine.query(world, 18);
  assert.equal(features.length, stops.length - 1);
  assert.ok(features.every(f => f.id !== chosen[0] && f.inRange === 0));
  engine.load([], { mode: 'places', radius: 45 }, emptyClusterState());
  assert.deepEqual(engine.query(world, 0), []);
});

class FakeWorker implements ClusterWorker {
  sent: ClusterRequest[] = []; stopped = false;
  onmessage: ClusterWorker['onmessage'] = null;
  onerror: ClusterWorker['onerror'] = null;
  postMessage(data: ClusterRequest) { this.sent.push(structuredClone(data)); }
  terminate() { this.stopped = true; }
  reply(data: ClusterResponse) { this.onmessage?.({ data } as MessageEvent<ClusterResponse>); }
}
const small: MapClusterPoint[] = [{ id: 'first', at: [139.7, 35.7], photo: true }];
const feature = (id: string) => ({ id, at: [139.7, 35.7], count: 1, photoCount: 1, selectedCount: 0, inRange: 1 });

test('worker client coalesces dragging and publishes only the newest viewport', () => {
  const worker = new FakeWorker(), shown: string[] = [];
  const client = createMapClusterClient(() => worker, fs => shown.push(String(fs[0]?.id)));
  client.query(world, 10); // A viewport arriving before data must not create a query.
  assert.equal(worker.sent.length, 0);
  client.load(small, { mode: 'places', radius: 60 });
  worker.reply({ type: 'ready', revision: client.revision });
  const first = worker.sent.at(-1)!; assert.equal(first.type, 'query');
  for (let i = 0; i < 60; i++) client.query([139 + i / 1000, 35, 140, 36], 12);
  assert.equal(worker.sent.filter(m => m.type === 'query').length, 1);
  if (first.type !== 'query') return;
  worker.reply({ type: 'result', revision: client.revision, request: first.request, features: [feature('obsolete')] });
  assert.deepEqual(shown, []);
  const latest = worker.sent.at(-1)!; assert.equal(latest.type, 'query');
  if (latest.type !== 'query') return;
  assert.equal(latest.bounds[0], 139.059);
  worker.reply({ type: 'result', revision: client.revision, request: latest.request, features: [feature('latest')] });
  assert.deepEqual(shown, ['latest']);
  client.query(latest.bounds, latest.zoom);
  assert.equal(worker.sent.filter(m => m.type === 'query').length, 2);
  client.dispose(); assert.ok(worker.stopped);
});

test('old destination replies and selection replies cannot repaint newer data', () => {
  const worker = new FakeWorker(), shown: string[] = [];
  const client = createMapClusterClient(() => worker, fs => shown.push(String(fs[0]?.id)));
  client.load(small, { mode: 'planner', radius: 60 }); client.query(world, 18);
  worker.reply({ type: 'ready', revision: client.revision });
  const old = worker.sent.at(-1)!;
  client.load([{ ...small[0]!, id: 'second' }], { mode: 'planner', radius: 60 });
  if (old.type !== 'query') return;
  worker.reply({ type: 'result', revision: old.revision, request: old.request, features: [feature('first')] });
  assert.deepEqual(shown, []);
  client.select({ selected: ['second'], rangeIds: ['second'], hasRange: true });
  const selection = worker.sent.at(-1)!;
  assert.equal(selection.type, 'select'); assert.ok(!('points' in selection));
  worker.reply({ type: 'ready', revision: client.revision });
  const current = worker.sent.at(-1)!;
  if (current.type !== 'query') return;
  worker.reply({ type: 'result', revision: client.revision, request: current.request, features: [feature('second')] });
  assert.deepEqual(shown, ['second']);
  client.dispose();
  worker.reply({ type: 'result', revision: client.revision, request: current.request, features: [feature('disposed')] });
  assert.deepEqual(shown, ['second']);
});

test('a browser without workers, or a failed worker, still provides selectable POIs', () => {
  for (const failAtStart of [true, false]) {
    const worker = new FakeWorker(), shown: string[] = [];
    const client = createMapClusterClient(() => { if (failAtStart) throw new Error('unsupported'); return worker; }, fs => shown.push(String(fs[0]?.id)));
    client.load(small, { mode: 'places', radius: 60 }); client.query(world, 18);
    if (!failAtStart) worker.reply({ type: 'error', revision: client.revision });
    assert.deepEqual(shown, ['first']);
    client.select(emptyClusterState());
    assert.deepEqual(shown, ['first', 'first']);
    client.dispose();
  }
});

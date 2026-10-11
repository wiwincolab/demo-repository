import { layoutMapDetails, type DetailId, type DetailRequest, type DetailResponse, type DetailView } from './map-detail-layout.ts';

export interface DetailWorker {
  postMessage(data: DetailRequest): void; terminate(): void;
  onmessage: ((event: MessageEvent<DetailResponse>) => void) | null;
  onerror: ((event: ErrorEvent) => void) | null;
}
export interface DetailClock { now(): number; later(callback: () => void, ms: number): unknown; cancel(timer: unknown): void }
const browserClock: DetailClock = { now: () => performance.now(), later: (fn, ms) => setTimeout(fn, ms), cancel: timer => clearTimeout(timer as ReturnType<typeof setTimeout>) };

// A second, lazy worker keeps photo-card layout independent of clustering.
// At most one layout runs and one latest view waits; no drag-event backlog.
export function createMapDetailClient(createWorker: () => DetailWorker, publish: (ids: DetailId[]) => void, clock = browserClock) {
  let worker: DetailWorker | undefined, fallback = false, disposed = false, request = 0, completed = 0, lastSent = -Infinity;
  let latest: { serial: number; view: DetailView } | undefined;
  let flight: { request: number; serial: number; key: string; level: DetailView['level'] } | undefined, timer: unknown;
  function clearTimer() { if (timer !== undefined) clock.cancel(timer); timer = undefined; }
  function receive(data: DetailResponse) {
    if (disposed || data.request !== flight?.request) return;
    const active = flight; flight = undefined; completed = active.serial;
    // A zoom-out or region change must never resurrect an old photo card.
    if (latest?.view.key === active.key && latest.view.level === active.level && latest.view.level !== 'dots') publish(data.ids);
    pump();
  }
  function recover() {
    worker?.terminate(); worker = undefined; fallback = true; flight = undefined; completed = 0;
    pump();
  }
  function pump() {
    if (disposed || !latest || latest.view.level === 'dots' || flight || completed === latest.serial || timer !== undefined) return;
    const delay = lastSent + 80 - clock.now();
    if (delay > 0) { timer = clock.later(() => { timer = undefined; pump(); }, delay); return; }
    if (!worker && !fallback) {
      try { worker = createWorker(); worker.onmessage = e => receive(e.data); worker.onerror = recover; }
      catch { fallback = true; }
    }
    lastSent = clock.now(); flight = { request: ++request, serial: latest.serial, key: latest.view.key, level: latest.view.level };
    if (fallback) receive({ request, ids: layoutMapDetails(latest.view) });
    else try { worker!.postMessage({ request, view: latest.view }); } catch { recover(); }
  }
  function sameView(a: DetailView, b: DetailView) {
    return a.key === b.key && a.level === b.level && a.width === b.width && a.height === b.height && a.points.length === b.points.length && a.points.every((p,i) => {
      const q = b.points[i]!; return p.id === q.id && p.point[0] === q.point[0] && p.point[1] === q.point[1] && p.selected === q.selected && p.photo === q.photo;
    });
  }
  return {
    get mode() { return worker ? 'worker' : fallback ? 'fallback' : 'pending'; },
    query(view: DetailView) {
      if (disposed || !Number.isFinite(view.width) || !Number.isFinite(view.height)) return;
      if (latest && sameView(latest.view, view)) return;
      const changed = !latest || latest.view.key !== view.key || latest.view.level !== view.level;
      latest = { serial: (latest?.serial || 0) + 1, view };
      if (changed) { clearTimer(); lastSent = -Infinity; publish([]); }
      if (view.level === 'dots') { clearTimer(); return; }
      pump();
    },
    dispose() { disposed = true; clearTimer(); worker?.terminate(); worker = undefined; latest = undefined; flight = undefined; },
  };
}

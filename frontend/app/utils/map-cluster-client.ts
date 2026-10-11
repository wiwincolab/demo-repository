import { createMapClusterEngine, emptyClusterState, type ClusterRequest, type ClusterResponse, type MapClusterPoint, type MapClusterOptions, type MapClusterState, type MapClusterFeature } from './map-cluster-engine.ts';

export interface ClusterWorker {
  postMessage(data: ClusterRequest): void; terminate(): void;
  onmessage: ((event: MessageEvent<ClusterResponse>) => void) | null;
  onerror: ((event: ErrorEvent) => void) | null;
}

// One query in flight, one latest viewport. Dragging must not queue dozens of
// obsolete results or let an old destination replace the current markers.
export function createMapClusterClient(createWorker: () => ClusterWorker, publish: (features: MapClusterFeature[], revision: number) => void) {
  let worker: ClusterWorker | undefined, fallback: ReturnType<typeof createMapClusterEngine> | undefined;
  let points: MapClusterPoint[] = [], options: MapClusterOptions = { mode: 'places', radius: 45 }, state = emptyClusterState();
  let revision = 0, ready = -1, request = 0, viewRevision = 0, completedView = -1, disposed = false;
  let view: { bounds: [number, number, number, number]; zoom: number } | undefined;
  let flight: { request: number; view: number } | undefined;
  function pump() {
    if (disposed || !view || ready !== revision || flight || completedView === viewRevision) return;
    flight = { request: ++request, view: viewRevision };
    const data: ClusterRequest = { type: 'query', revision, request, ...view };
    if (fallback) receive({ type: 'result', revision, request, features: fallback.query(view.bounds, view.zoom) });
    else send(data);
  }
  function recover() {
    worker?.terminate(); worker = undefined; flight = undefined;
    if (disposed) return;
    fallback = createMapClusterEngine(); fallback.load(points, options, state);
    ready = revision; completedView = -1; pump();
  }
  function receive(data: ClusterResponse) {
    if (disposed || data.revision !== revision) return;
    if (data.type === 'error') { recover(); return; }
    if (data.type === 'ready') { ready = revision; pump(); return; }
    if (data.request !== flight?.request) return;
    const current = flight.view === viewRevision;
    flight = undefined;
    if (current) { completedView = viewRevision; publish(data.features, revision); }
    pump();
  }
  function send(data: ClusterRequest) { try { worker!.postMessage(data); } catch { recover(); } }
  function invalidate() { revision++; ready = -1; completedView = -1; flight = undefined; }
  return {
    get revision() { return revision; },
    get mode() { return worker ? 'worker' : fallback ? 'fallback' : 'pending'; },
    load(next: MapClusterPoint[], config: MapClusterOptions, selection = emptyClusterState()) {
      if (disposed) return;
      points = next; options = config; state = selection; invalidate();
      if (!worker && !fallback) {
        try { worker = createWorker(); worker.onmessage = event => receive(event.data); worker.onerror = recover; }
        catch { recover(); return; }
      }
      if (fallback) { fallback.load(points, options, state); ready = revision; pump(); }
      else send({ type: 'load', revision, points, options, state });
    },
    select(selection: MapClusterState) {
      if (disposed) return;
      state = selection; invalidate();
      if (fallback) { fallback.select(state); ready = revision; pump(); }
      else if (worker) send({ type: 'select', revision, state });
    },
    query(bounds: number[], zoom: number) {
      if (disposed || bounds.length !== 4 || !bounds.every(Number.isFinite) || !Number.isFinite(zoom)) return;
      const nextZoom = Math.max(0, Math.floor(zoom));
      if (view && view.zoom === nextZoom && bounds.every((value, i) => value === view!.bounds[i])) { pump(); return; }
      view = { bounds: [...bounds] as [number, number, number, number], zoom: nextZoom }; viewRevision++; pump();
    },
    dispose() { disposed = true; worker?.terminate(); worker = undefined; fallback = undefined; points = []; flight = undefined; },
  };
}

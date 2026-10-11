import Supercluster from 'supercluster';
import { individualSelectionLimit } from './planner-poi.ts';

export type MapPointId = string | number;
// Only geometry and flags cross the worker boundary; photos and descriptions stay
// on the page. Sending whole reactive POIs also fails structured cloning.
export interface MapClusterPoint { id: MapPointId; at: number[]; photo: boolean }
export interface MapClusterState { selected: MapPointId[]; rangeIds: MapPointId[]; hasRange: boolean }
export interface MapClusterOptions { mode: 'places' | 'planner'; radius: number }
export interface MapClusterFeature {
  id?: MapPointId; clusterId?: number; at: number[]; count: number;
  photoCount: number; selectedCount: number; inRange: number; expansionZoom?: number; previewId?: MapPointId;
}
export const emptyClusterState = (): MapClusterState => ({ selected: [], rangeIds: [], hasRange: false });

export function createMapClusterEngine() {
  let points: MapClusterPoint[] = [], options: MapClusterOptions = { mode: 'places', radius: 45 };
  let state = emptyClusterState();
  type Flags = { photoCount: number; selectedCount: number; inRange: number; previewId: MapPointId; previewPriority: number };
  let index: Supercluster<{ id: MapPointId } & Flags, Flags>;
  function rebuild() {
    const selected = new Set(state.selected), range = new Set(state.rangeIds);
    const separate = options.mode === 'planner' && state.selected.length <= individualSelectionLimit;
    index = new Supercluster<{ id: MapPointId } & Flags, Flags>({
      radius: options.radius, maxZoom: options.mode === 'planner' ? 16 : 17,
      map: p => ({ photoCount: p.photoCount, selectedCount: p.selectedCount, inRange: p.inRange, previewId: p.id, previewPriority: p.previewPriority }),
      reduce: (a, b) => { if (b.previewPriority > a.previewPriority) { a.previewId=b.previewId; a.previewPriority=b.previewPriority; } a.photoCount += b.photoCount; a.selectedCount += b.selectedCount; a.inRange += b.inRange; },
    }).load(points.filter(p => !separate || !selected.has(p.id)).map(p => ({
      type: 'Feature', geometry: { type: 'Point', coordinates: p.at },
      properties: { id: p.id, photoCount: Number(p.photo), selectedCount: Number(selected.has(p.id)), inRange: Number(!state.hasRange || range.has(p.id)), previewId:p.id, previewPriority:Number(p.photo)*4+Number(selected.has(p.id))*2+Number(!state.hasRange || range.has(p.id)) },
    })));
  }
  return {
    load(next: MapClusterPoint[], config: MapClusterOptions, selection: MapClusterState) { points = next; options = config; state = selection; rebuild(); },
    select(selection: MapClusterState) { state = selection; rebuild(); },
    query(bounds: [number, number, number, number], zoom: number): MapClusterFeature[] {
      if (!index) return [];
      return index.getClusters(bounds, Math.max(0, Math.floor(zoom))).map(f => {
        const p = f.properties;
        return 'cluster' in p
          ? { clusterId: p.cluster_id, at: f.geometry.coordinates, count: p.point_count, photoCount: p.photoCount, selectedCount: p.selectedCount, inRange: p.inRange, expansionZoom: index.getClusterExpansionZoom(p.cluster_id), previewId:p.previewId }
          : { id: p.id, at: f.geometry.coordinates, count: 1, photoCount: p.photoCount, selectedCount: p.selectedCount, inRange: p.inRange };
      });
    },
  };
}

export type ClusterRequest =
  | { type: 'load'; revision: number; points: MapClusterPoint[]; options: MapClusterOptions; state: MapClusterState }
  | { type: 'select'; revision: number; state: MapClusterState }
  | { type: 'query'; revision: number; request: number; bounds: [number, number, number, number]; zoom: number };
export type ClusterResponse =
  | { type: 'ready'; revision: number }
  | { type: 'result'; revision: number; request: number; features: MapClusterFeature[] }
  | { type: 'error'; revision: number };

import Supercluster from 'supercluster';
import type { Poi, PoiCatalog, PoiRegion, PoiSnapshot } from '../types/poi.ts';
import type { Stop } from '../types/trip.ts';

// Negative IDs keep imported OSM places separate from existing itinerary IDs.
export function plannerPoiId(id: string): number {
  const match = /^osm:(node|way|relation):(\d+)$/.exec(id);
  if (!match) throw new Error('Invalid OSM place ID');
  const value = Number(match[2]) * 4 + ['node', 'way', 'relation'].indexOf(match[1]!)+1;
  if (!Number.isSafeInteger(value)) throw new Error('Invalid OSM place ID');
  return -value;
}

export function poiToPlannerStop(poi: Poi): Stop {
  return {
    id: plannerPoiId(poi.id), poiId: poi.id, poiCountry: poi.country, day: 0, name: poi.name, short: poi.name,
    at: [...poi.at], time: '', stay: '建議停留 60 分鐘', range: [40, 90],
    note: poi.description || poi.address || poi.categoryLabel,
    photo: {
      src: poi.photo?.src || '', alt: poi.name + '景點照片',
      source: poi.photo?.source || '', credit: poi.photo?.credit || '',
      license: poi.photo?.license || '', licenseUrl: poi.photo?.licenseUrl || '', objectPosition: '50% 50%',
    },
  };
}

export function mergePlannerPlaces(itinerary: Stop[], pois: Poi[], saved: Stop[] = []): Stop[] {
  const result = [...itinerary], ids = new Set(result.map(p => p.id));
  const names = new Map<string, Stop[]>();
  const key = (name: string) => name.normalize('NFKC').toLocaleLowerCase().replace(/[\s・·]/g, '');
  const register = (stop: Stop) => names.set(key(stop.name), [...(names.get(key(stop.name)) || []), stop]);
  result.forEach(register);
  for (const stop of saved) if (stop.poiId && !ids.has(stop.id)) { result.push(stop); ids.add(stop.id); register(stop); }
  for (const poi of pois) {
    const stop = poiToPlannerStop(poi);
    const aliases = [poi.name, poi.localName, ...Object.values(poi.names)].map(key);
    const duplicate = aliases.some(name => names.get(name)?.some(p => Math.hypot((p.at[0]! - poi.at[0]!) * 90, (p.at[1]! - poi.at[1]!) * 111) < .08));
    if (ids.has(stop.id) || duplicate) continue;
    result.push(stop); ids.add(stop.id); register(stop);
  }
  return result;
}

export function poiRegionsInBounds(regions: PoiRegion[], bounds: number[]) {
  if (bounds.length !== 4 || !bounds.every(Number.isFinite)) return [];
  const [w, s, e, n] = bounds as [number, number, number, number];
  return regions.filter(r => r.file && r.status === 'ready' && e >= r.bbox[0]! && w <= r.bbox[2]! && n >= r.bbox[1]! && s <= r.bbox[3]!);
}

export const individualSelectionLimit = 100;
export function plannerStopClusters(stops: Stop[], selected: number[] = [], rangeIds: number[] = [], hasRange = false, radius = 44) {
  const chosen = new Set(selected);
  const range = new Set(rangeIds), separateSelected = selected.length <= individualSelectionLimit;
  return new Supercluster<{ id: number; inRange: number; selectedCount: number }, {inRange:number;selectedCount:number}>({ radius, maxZoom: 16, map:p=>({inRange:p.inRange,selectedCount:p.selectedCount}), reduce:(total,p)=>{total.inRange+=p.inRange;total.selectedCount+=p.selectedCount;} }).load(stops.filter(p => !separateSelected || !chosen.has(p.id)).map(p => ({
    type: 'Feature' as const, geometry: { type: 'Point' as const, coordinates: p.at }, properties: { id: p.id, inRange:Number(!hasRange || range.has(p.id)),selectedCount:Number(chosen.has(p.id)) },
  })));
}

type FetchJson = (url: string) => Promise<unknown>;
// A catalog can exist on the API while an individual region is still being
// published. Fall back per request, including for static subpath deployments.
export function createPoiRepository(fetchJson: FetchJson, asset: (path: string) => string) {
  const requests = new Map<string, Promise<PoiSnapshot>>();
  async function read<T>(api: string, file: string): Promise<T> {
    try { return await fetchJson(asset(api)) as T; }
    catch { return await fetchJson(asset(file)) as T; }
  }
  return {
    catalog: () => read<PoiCatalog>('api/poi/catalog', 'poi/index.json'),
    region(region: PoiRegion) {
      if (!region.file) return Promise.reject(new Error('POI region is unavailable'));
      if (!requests.has(region.id)) {
        const request = read<PoiSnapshot>(`api/poi/regions/${region.id}`, `poi/${region.file}`)
          .catch(error => { requests.delete(region.id); throw error; });
        requests.set(region.id, request);
      }
      return requests.get(region.id)!;
    },
  };
}

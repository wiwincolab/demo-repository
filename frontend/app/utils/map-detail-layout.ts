export type DetailId = string | number;
export type DetailLevel = 'dots' | 'names' | 'photos';
export interface DetailPoint { id: DetailId; point: number[]; selected: boolean; photo: boolean }
export interface DetailView { key: string; level: DetailLevel; width: number; height: number; points: DetailPoint[]; preferred: DetailId[] }
export interface DetailRequest { request: number; view: DetailView }
export interface DetailResponse { request: number; ids: DetailId[] }

export function detailRect(point: number[], level: DetailLevel) {
  const width = level === 'photos' ? 150 : 140, height = level === 'photos' ? 171 : 44;
  return [point[0]! - width / 2, point[1]! - height - 18, point[0]! + width / 2, point[1]! - 18];
}
export function detailFits(point: number[], width: number, height: number, level: DetailLevel) {
  const r = detailRect(point, level);
  return level !== 'dots' && r.every(Number.isFinite) && r[0]! >= 8 && r[1]! >= 8 && r[2]! <= width - 8 && r[3]! <= height - 8;
}

// Stable priority buckets avoid sorting the entire dense viewport every frame.
// Keep existing cards when possible so camera movement does not reload photos.
export function layoutMapDetails(view: DetailView): DetailId[] {
  if (view.level === 'dots') return [];
  const preferred = new Set(view.preferred), buckets: DetailPoint[][] = Array.from({ length: 8 }, () => []);
  for (const p of view.points) {
    if (!detailFits(p.point, view.width, view.height, view.level)) continue;
    const priority = (p.selected ? 4 : 0) + (p.photo ? 2 : 0) + (preferred.has(p.id) ? 1 : 0);
    buckets[7 - priority]!.push(p);
  }
  const ids: DetailId[] = [], boxes: number[][] = [], seen = new Set<DetailId>();
  const limit = view.width <= 600 ? 8 : 18;
  for (const bucket of buckets) for (const p of bucket) {
    if (seen.has(p.id)) continue;
    const r = detailRect(p.point, view.level);
    if (boxes.some(b => r[0]! < b[2]! + 6 && r[2]! > b[0]! - 6 && r[1]! < b[3]! + 6 && r[3]! > b[1]! - 6)) continue;
    ids.push(p.id); boxes.push(r); seen.add(p.id);
    if (ids.length === limit) return ids;
  }
  return ids;
}

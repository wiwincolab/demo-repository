import { pointInPolygon, type Point } from './map.ts';

export type PlannerMarkerState = 'candidate' | 'selected' | 'outside';
export function plannerMarkerState(id: number, selected: number[], rangeIds: number[], hasRange: boolean): PlannerMarkerState {
  if (selected.includes(id)) return 'selected';
  return hasRange && !rangeIds.includes(id) ? 'outside' : 'candidate';
}
export function withinPlanningAreas(point: Point, areas: Point[][]) {
  return areas.some(area => pointInPolygon(point, area));
}
export function mapDetailLevel(zoom: number): 'dots' | 'names' | 'photos' {
  return zoom >= 14 ? 'photos' : zoom >= 12 ? 'names' : 'dots';
}
export function isUsableMapStroke(points: Point[]) {
  if (points.length < 3) return false;
  let twiceArea = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i]!, b = points[(i + 1) % points.length]!;
    twiceArea += a[0]! * b[1]! - b[0]! * a[1]!;
  }
  // A click, a straight drag or a tiny accidental loop must not turn all places gray.
  return Math.abs(twiceArea) >= 128;
}
export function validPlanningBoundary(value: unknown): Point[] {
  if (!Array.isArray(value) || value.length < 3 || value.length > 4000) return [];
  if (!value.every(p => Array.isArray(p) && p.length === 2 && p.every(Number.isFinite) && Math.abs(p[0]) <= 180 && Math.abs(p[1]) <= 90)) return [];
  return value.map(p => [...p]);
}
// Keep entire touch targets inside the map, with space for rounded corners.
export function visibleMapTarget(point: Point, width: number, height: number, radius=22, inset=8) {
  return point[0]!>=radius+inset && point[0]!<=width-radius-inset && point[1]!>=radius+inset && point[1]!<=height-radius-inset;
}
export function sampleMapStroke(points: Point[], limit=256) {
  if (points.length<=limit)return points.map(p=>[...p]);
  return Array.from({length:limit},(_,i)=>[...points[Math.round(i*(points.length-1)/(limit-1))]!]);
}
// Photos should appear as the map zooms in, without covering adjacent places.
export function visibleMapDetails<T extends { stop: { id: number }; point: Point }>(points: T[], selected: number[], width: number, height: number, level: ReturnType<typeof mapDetailLevel>) {
  if (level === 'dots') return [];
  const cardWidth = level === 'photos' ? 150 : 140, cardHeight = level === 'photos' ? 171 : 44;
  const accepted: T[] = [];
  const boxes: number[][] = [];
  const ordered = [...points].sort((a, b) => Number(selected.includes(b.stop.id)) - Number(selected.includes(a.stop.id)));
  for (const p of ordered) {
    const [x, y] = p.point as [number, number];
    const rect = [x - cardWidth / 2, y - cardHeight - 18, x + cardWidth / 2, y - 18];
    if (rect[0]! < 8 || rect[1]! < 8 || rect[2]! > width - 8 || rect[3]! > height - 8) continue;
    if (boxes.some(b => rect[0]! < b[2]! + 6 && rect[2]! > b[0]! - 6 && rect[1]! < b[3]! + 6 && rect[3]! > b[1]! - 6)) continue;
    accepted.push(p); boxes.push(rect);
  }
  return accepted;
}

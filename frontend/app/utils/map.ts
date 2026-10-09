import type { Stop } from '../types/trip.ts';
export const dayColors = ['#148dba', '#d78043', '#7461b4', '#438e75', '#bc596c', '#3f8290'];
export type Point = number[];
export interface MapFeature {
    points: Point[];
    closed?: boolean;
}
export interface BaseMap {
    parks: MapFeature[];
    water: MapFeature[];
    roads: MapFeature[];
    rail: MapFeature[];
}
export function projection(stops: Pick<Stop, 'at'>[], width: number, height: number) {
    const xs = stops.map(s => s.at[0]!), ys = stops.map(s => s.at[1]!);
    const x = (Math.min(...xs) + Math.max(...xs)) / 2, y = (Math.min(...ys) + Math.max(...ys)) / 2;
    let sx = Math.max(.003, Math.max(...xs) - Math.min(...xs)) * 1.5;
    let sy = Math.max(.003, Math.max(...ys) - Math.min(...ys)) * 1.6;
    const aspect = width / height / .812;
    if (sx / sy < aspect)
        sx = sy * aspect;
    else
        sy = sx / aspect;
    return (p: Point): Point => [(p[0]! - x) / sx * width + width / 2, (y - p[1]!) / sy * height + height / 2];
}
export function paintBase(ctx: CanvasRenderingContext2D, data: BaseMap, project: (p: Point) => Point, width: number, height: number) {
    ctx.fillStyle = '#edf1e9';
    ctx.fillRect(0, 0, width, height);
    function path(points: Point[]) {
        ctx.beginPath();
        points.forEach((point, i) => { const p = project(point); if (i)
            ctx.lineTo(p[0]!, p[1]!);
        else
            ctx.moveTo(p[0]!, p[1]!); });
    }
    ctx.fillStyle = '#dbe8d6';
    data.parks.forEach(f => { path(f.points); ctx.fill(); });
    ctx.fillStyle = ctx.strokeStyle = '#cce8f2';
    ctx.lineWidth = 9;
    data.water.forEach(f => { path(f.points); if (f.closed)
        ctx.fill();
    else
        ctx.stroke(); });
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    data.roads.forEach(f => { path(f.points); ctx.stroke(); });
    ctx.strokeStyle = '#bfcbc2';
    ctx.lineWidth = .7;
    ctx.setLineDash([3, 4]);
    data.rail.forEach(f => { path(f.points); ctx.stroke(); });
    ctx.setLineDash([]);
}
export function pointInPolygon(point: Point, polygon: Point[]) {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const a = polygon[i]!, b = polygon[j]!;
        if ((a[1]! > point[1]!) !== (b[1]! > point[1]!) && point[0]! < (b[0]! - a[0]!) * (point[1]! - a[1]!) / (b[1]! - a[1]!) + a[0]!)
            inside = !inside;
    }
    return inside;
}

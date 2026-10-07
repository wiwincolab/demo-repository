import { tripItineraries, tripSummaries, type TripId } from '../../app/data/trips.ts';
import { db } from './db.ts';
import { isShortId } from './short-id.ts';

export type ShareEvent = 'view' | 'save' | 'create' | 'join' | 'buy' | 'claim';
export interface ShareRow { id: string; device_id: string; kind: 'creation' | 'trip'; trip_id: TripId; style_id: string | null; location: string; stop_ids: number[]; caption: string; media_path: string | null; mime: string | null; created_at: Date; nickname: string | null }

export async function loadShare(id: unknown) {
    if (!isShortId(id)) return null;
    const sql = await db();
    const [row] = await sql<ShareRow[]>`
        select s.*, d.nickname from shares s join devices d on d.id = s.device_id where s.id = ${id}`;
    return row ?? null;
}

// 漏斗事件：每台裝置每種事件只記一次；分享者自己打開自己的分享不算
export async function recordShareEvent(share: Pick<ShareRow, 'id' | 'device_id'>, device: string, event: ShareEvent) {
    if (share.device_id === device) return;
    const sql = await db();
    await sql`insert into share_events (share_id, device_id, event) values (${share.id}, ${device}, ${event}) on conflict do nothing`;
}

export const tripTitle = (id: TripId) => tripSummaries.find(trip => trip.id === id)!.title;

// 分享出去的只有分享者勾選的景點，依原行程順序；住宿與旅伴名單本來就不在景點裡，不會跟著公開（US-07）
export function publicStops(tripId: TripId, stopIds: number[]) {
    const wanted = new Set(stopIds);
    return tripItineraries[tripId].flatMap(day => day.stops)
        .filter(stop => wanted.has(stop.id))
        .filter((stop, index, all) => all.findIndex(other => other.id === stop.id) === index)
        .map(stop => ({ id: stop.id, day: stop.day, name: stop.name, short: stop.short, at: stop.at, photo: stop.photo.src }));
}

// 匿名暱稱：分享卡上的「小安的淺草回憶」、旅伴名單都用它；最多 12 字
export function cleanNickname(value: unknown) {
    if (typeof value !== 'string') return null;
    const name = [...value.trim()].slice(0, 12).join('');
    return name || null;
}

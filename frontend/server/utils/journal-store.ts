import type { TripId } from '../../app/data/trips.ts';
import { db } from './db.ts';
import { groupIdFor } from './groups.ts';
import { dedupe, memberStats, taipeiDate, type DailyPicks, type PhotoTag } from './journal.ts';

// 共同遊記的資料：在旅伴群組裡就是整組人的照片，否則只有自己的。
// 每日卡片的範圍（scope）跟著同一個規則：g:群組 或 d:裝置
export interface JournalItem { id: string; owner: string; nickname: string | null; title: string; tag: PhotoTag | null; hash: string | null; day: string; createdAt: Date }

export async function loadJournal(device: string, tripId: TripId) {
    const sql = await db();
    const groupId = await groupIdFor(device, tripId);
    const members = groupId
        ? (await sql<{ device_id: string }[]>`select device_id from group_members where group_id = ${groupId}`).map(row => row.device_id)
        : [device];
    const photos = await sql<{ id: string; device_id: string; nickname: string | null; title: string; tag: PhotoTag | null; hash: string | null; created_at: Date }[]>`
        select p.id, p.device_id, d.nickname, p.title, p.tag, p.hash, p.created_at
        from photos p join devices d on d.id = p.device_id
        where p.device_id = any(${members}) and p.trip_id = ${tripId} order by p.created_at`;
    const items: JournalItem[] = photos.map(p => ({ id: p.id, owner: p.device_id, nickname: p.nickname, title: p.title, tag: p.tag, hash: p.hash, day: taipeiDate(p.created_at), createdAt: p.created_at }));
    const { kept, hidden } = dedupe(items, 6);
    return {
        scope: groupId ? `g:${groupId}` : `d:${device}`,
        kept,
        hidden,
        stats: memberStats(kept, device),
    };
}

export async function dailyCards(scope: string, tripId: TripId) {
    const sql = await db();
    const rows = await sql<{ id: string; day: Date; status: 'queued' | 'done' | 'fallback'; media_ids: string[]; picks: DailyPicks | null }[]>`
        select id, day, status, media_ids, picks from daily_cards where scope = ${scope} and trip_id = ${tripId}`;
    return rows.map(row => ({ id: row.id, day: taipeiDate(row.day), status: row.status, mediaIds: row.media_ids, picks: row.picks }));
}

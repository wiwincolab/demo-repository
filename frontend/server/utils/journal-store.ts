import type { TripId } from '../../app/data/trips.ts';
import { findBoard } from './bingo.ts';
import { db } from './db.ts';
import { groupIdFor } from './groups.ts';
import { dedupe, memberStats, taipeiDate, type DailyPicks, type PhotoTag } from './journal.ts';

// 共同遊記的資料：在旅伴群組裡就是整組人的照片＋這組 Bingo 完成的照片，否則只有自己的。
// 每日卡片的範圍（scope）跟著同一個規則：g:群組 或 d:裝置
export interface JournalItem { id: string; kind: 'photo' | 'bingo'; owner: string; nickname: string | null; title: string; tag: PhotoTag | null; hash: string | null; day: string; createdAt: Date }

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
    const board = await findBoard(device, tripId, groupId);
    const marks = board ? await sql<{ id: string; device_id: string; nickname: string | null; cell: number; created_at: Date }[]>`
        select m.id, m.device_id, d.nickname, m.cell, m.created_at
        from bingo_marks m join devices d on d.id = m.device_id
        where m.board_id = ${board.id} and m.status in ('pass', 'noted') order by m.created_at` : [];
    const items: JournalItem[] = [
        ...photos.map(p => ({ id: p.id, kind: 'photo' as const, owner: p.device_id, nickname: p.nickname, title: p.title, tag: p.tag, hash: p.hash, day: taipeiDate(p.created_at), createdAt: p.created_at })),
        ...marks.map(m => ({ id: m.id, kind: 'bingo' as const, owner: m.device_id, nickname: m.nickname, title: board!.cells[m.cell]?.title ?? 'Bingo', tag: null, hash: null, day: taipeiDate(m.created_at), createdAt: m.created_at })),
    ].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    const { kept, hidden } = dedupe(items, 6);
    return {
        scope: groupId ? `g:${groupId}` : `d:${device}`,
        kept,
        hidden,
        stats: memberStats(kept.filter(item => item.kind === 'photo'), marks.map(m => ({ owner: m.device_id, nickname: m.nickname })), device),
    };
}

export async function dailyCards(scope: string, tripId: TripId) {
    const sql = await db();
    const rows = await sql<{ id: string; day: Date; status: 'queued' | 'done' | 'fallback'; media_ids: string[]; picks: DailyPicks | null }[]>`
        select id, day, status, media_ids, picks from daily_cards where scope = ${scope} and trip_id = ${tripId}`;
    return rows.map(row => ({ id: row.id, day: taipeiDate(row.day), status: row.status, mediaIds: row.media_ids, picks: row.picks }));
}

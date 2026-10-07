import { randomUUID } from 'node:crypto';

// 產生（或重產）某一天的每日卡片：當天照片最多 8 張排進佇列，worker 挑代表、食物、意外並配字。
// 同一組同一天只有一張，重產就覆蓋。Redis 連不上就直接退回（第一張當代表），畫面照樣有卡片
const MAX_PHOTOS = 8;
export default defineEventHandler(async event => {
    const day = getRouterParam(event, 'day') ?? '';
    const tripId = (await readBody<{ tripId?: unknown }>(event))?.tripId;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !isTripId(tripId)) throw createError({ statusCode: 400 });
    const device = await requireDevice(event);
    const journal = await loadJournal(device, tripId);
    const chosen = journal.kept.filter(item => item.day === day).slice(0, MAX_PHOTOS);
    if (!chosen.length) throw createError({ statusCode: 400, statusMessage: '這天還沒有照片' });

    const sql = await db();
    const id = randomUUID();
    await sql`
        insert into daily_cards (id, scope, trip_id, day, media_ids)
        values (${id}, ${journal.scope}, ${tripId}, ${day}, ${chosen.map(item => item.id)})
        on conflict (scope, trip_id, day) do update
        set id = excluded.id, media_ids = excluded.media_ids, status = 'queued', picks = null, created_at = now(), finished_at = null`;
    try {
        await withTimeout(creationQueue().add('daily', { cardId: id }, { jobId: `daily-${id}` }), 3000, '排入佇列');
    } catch {
        await sql`update daily_cards set status = 'fallback', picks = ${sql.json(fallbackPicks as never)}, finished_at = now() where id = ${id}`;
    }
    return { id, day, status: 'queued' };
});

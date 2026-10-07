// 這台裝置在某一趟存過的朋友版本；沒有就是 null，行程頁照原本的示範行程
export default defineEventHandler(async event => {
    const tripId = getQuery(event).tripId;
    if (!isTripId(tripId)) throw createError({ statusCode: 400, statusMessage: '行程不存在' });
    const device = await requireDevice(event);
    const sql = await db();
    const [row] = await sql<{ share_id: string; stop_ids: number[]; title: string; nickname: string | null }[]>`
        select t.share_id, t.stop_ids, t.title, d.nickname
        from saved_trips t join shares s on s.id = t.share_id join devices d on d.id = s.device_id
        where t.device_id = ${device} and t.trip_id = ${tripId}`;
    return row ? { shareId: row.share_id, stopIds: row.stop_ids, title: row.title, from: row.nickname || '朋友' } : null;
});

// 「存成我的行程」：把分享裡公開的景點存成這台裝置在同一趟的版本（US-08）。
// 只複製公開內容、保留來源；分享者的原行程不受影響。同一趟再存一次就換成新的來源
export default defineEventHandler(async event => {
    const share = await loadShare(getRouterParam(event, 'id'));
    if (!share) throw createError({ statusCode: 404 });
    const body = await readBody<{ title?: unknown }>(event) ?? {};
    const title = String(body.title ?? '').trim().slice(0, 30) || `${share.nickname || '朋友'}推薦的${share.location.split(' · ')[0]}`;
    const device = await requireDevice(event);
    const sql = await db();
    await sql`
        insert into saved_trips (device_id, trip_id, share_id, stop_ids, title)
        values (${device}, ${share.trip_id}, ${share.id}, ${share.stop_ids}, ${title})
        on conflict (device_id, trip_id) do update set share_id = excluded.share_id, stop_ids = excluded.stop_ids, title = excluded.title, created_at = now()`;
    await recordShareEvent(share, device, 'save');
    return { tripId: share.trip_id, title };
});

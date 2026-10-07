// 建立一個分享：只記分享者勾選公開的景點與文案；作品圖另外用 PUT /api/shares/:id/image 上傳
// （作品可能是 AI 生成、預製或手機上合成的，上傳一份，朋友的落地頁與 LINE 連結預覽才一定看得到）
export default defineEventHandler(async event => {
    const body = await readBody<Record<string, unknown>>(event) ?? {};
    const { tripId } = body;
    if (!isTripId(tripId)) throw createError({ statusCode: 400, statusMessage: '行程不存在' });
    const kind = body.kind === 'trip' ? 'trip' : 'creation';
    const stopIds = Array.isArray(body.stopIds) ? body.stopIds.filter((id): id is number => Number.isInteger(id)) : [];
    const stops = publicStops(tripId, stopIds);
    if (!stops.length) throw createError({ statusCode: 400, statusMessage: '至少公開一個景點' });
    const styleId = typeof body.styleId === 'string' ? body.styleId.slice(0, 20) : null;
    const location = String(body.location ?? '').trim().slice(0, 60) || tripTitle(tripId);
    const caption = String(body.caption ?? '').trim().slice(0, 500);

    const device = await requireDevice(event);
    const sql = await db();
    const id = shortId();
    await sql`
        insert into shares (id, device_id, kind, trip_id, style_id, location, stop_ids, caption)
        values (${id}, ${device}, ${kind}, ${tripId}, ${styleId}, ${location}, ${stops.map(s => s.id)}, ${caption})`;
    return { id, url: `/s/${id}` };
});

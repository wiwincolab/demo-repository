// 領取禮物：不能領自己送的；只能領一次（條件式更新，兩個人同時按只有先到的領到）
export default defineEventHandler(async event => {
    const id = getRouterParam(event, 'id');
    if (!isShortId(id)) throw createError({ statusCode: 404 });
    const device = await requireDevice(event);
    const sql = await db();
    await sql`
        update gifts set claimed_device_id = ${device}, claimed_at = now()
        where id = ${id} and claimed_device_id is null and sender_device_id <> ${device}`;
    const row = await loadGift(id);
    if (!row) throw createError({ statusCode: 404, statusMessage: '這份禮物不存在' });
    const view = giftView(row, device);
    if (view.mine) throw createError({ statusCode: 409, statusMessage: '這是你送出的禮物，傳給朋友領取吧' });
    if (!view.claimedByMe) throw createError({ statusCode: 409, statusMessage: `這份禮物已經被${view.claimedBy}領走了` });
    return view;
});

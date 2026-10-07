// 落地頁記錄瀏覽、按「我也做一張」；存成行程、加入、購買、領取各自在自己的 API 記
export default defineEventHandler(async event => {
    const share = await loadShare(getRouterParam(event, 'id'));
    if (!share) throw createError({ statusCode: 404 });
    const kind = (await readBody<{ event?: unknown }>(event))?.event;
    if (kind !== 'view' && kind !== 'create') throw createError({ statusCode: 400 });
    await recordShareEvent(share, await requireDevice(event), kind);
    return { ok: true };
});

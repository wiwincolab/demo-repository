// 分享者上傳這次分享的作品圖（只能傳自己的分享）
export default defineEventHandler(async event => {
    const share = await loadShare(getRouterParam(event, 'id'));
    if (!share) throw createError({ statusCode: 404 });
    const device = await requireDevice(event);
    if (share.device_id !== device) throw createError({ statusCode: 403 });
    const body = await readRawBody(event, false);
    if (!body?.length || body.length > 10 * 1024 * 1024) throw createError({ statusCode: 413, statusMessage: '圖片太大' });
    const mime = sniffImageType(body);
    if (!mime) throw createError({ statusCode: 415, statusMessage: '只收 JPG、PNG、WebP' });
    const mediaPath = mediaRelativePath(`share-${share.id}`, mime, new Date());
    await writeMedia(readConfig().mediaDir, mediaPath, body);
    const sql = await db();
    await sql`update shares set media_path = ${mediaPath}, mime = ${mime} where id = ${share.id}`;
    return { imageUrl: `/api/shares/${share.id}/image` };
});

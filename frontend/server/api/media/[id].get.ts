// 讀照片或生成的圖。ID 是隨機 UUID、猜不到，所以不檢查是誰的：之後朋友打開分享頁也要看得到。
// 內容寫入後不會再變，讓瀏覽器與 Cloudflare 長期快取
export default defineEventHandler(async event => {
    const id = getRouterParam(event, 'id');
    if (!isUuid(id)) throw createError({ statusCode: 404 });
    const sql = await db();
    const [row] = await sql<{ media_path: string; mime: string }[]>`
        select media_path, mime from photos where id = ${id}
        union all
        select media_path, mime from creations where id = ${id} and media_path is not null
        union all
        select media_path, mime from bingo_marks where id = ${id}
        limit 1`;
    if (!row) throw createError({ statusCode: 404 });
    setResponseHeaders(event, { 'Content-Type': row.mime, 'Cache-Control': 'public, max-age=31536000, immutable' });
    return readMedia(readConfig().mediaDir, row.media_path);
});

import { randomUUID } from 'node:crypto';

// 上傳一張照片：本體是圖片原始位元組（手機已先縮到 1600px，見 app/utils/image-resize.ts），其他欄位放網址參數
const MAX_BYTES = 10 * 1024 * 1024;
const text = (value: unknown, fallback: string) => String(value ?? '').trim().slice(0, 60) || fallback;
const size = (value: unknown) => {
    const n = Number.parseInt(String(value ?? ''), 10);
    return Number.isFinite(n) && n > 0 && n <= 20000 ? n : null;
};

export default defineEventHandler(async event => {
    const query = getQuery(event);
    const tripId = query.tripId;
    if (!isTripId(tripId)) throw createError({ statusCode: 400, statusMessage: '行程不存在' });
    const body = await readRawBody(event, false);
    if (!body?.length) throw createError({ statusCode: 400, statusMessage: '沒有收到照片' });
    if (body.length > MAX_BYTES) throw createError({ statusCode: 413, statusMessage: '照片太大' });
    const mime = sniffImageType(body);
    if (!mime) throw createError({ statusCode: 415, statusMessage: '只收 JPG、PNG、WebP' });

    const device = await requireDevice(event);
    const id = randomUUID();
    const mediaPath = mediaRelativePath(id, mime, new Date());
    await writeMedia(readConfig().mediaDir, mediaPath, body);
    const title = text(query.title, '旅行照片');
    const location = text(query.location, '這趟旅行 · 我的照片');
    const demoPhotoId = typeof query.demoPhotoId === 'string' && query.demoPhotoId ? query.demoPhotoId.slice(0, 40) : null;
    // 這張照片在行程的哪一站（立體重遊靠它把作品放回去）；手機只會送 recap.ts 的站名
    const stopId = typeof query.stopId === 'string' && /^[a-z0-9-]{1,40}$/.test(query.stopId) ? query.stopId : null;
    const width = size(query.width), height = size(query.height);
    // 照片指紋（手機上算的 dHash，app/utils/image-hash.ts）：共同遊記用它收起重複的照片
    const hash = typeof query.hash === 'string' && /^[0-9a-f]{16}$/.test(query.hash) ? query.hash : null;
    const sql = await db();
    const [row] = await sql<{ created_at: Date }[]>`
        insert into photos (id, device_id, trip_id, title, location, demo_photo_id, stop_id, media_path, mime, width, height, hash)
        values (${id}, ${device}, ${tripId}, ${title}, ${location}, ${demoPhotoId}, ${stopId}, ${mediaPath}, ${mime}, ${width}, ${height}, ${hash})
        returning created_at`;
    // 讓 worker 標類別（食物／風景／人物，共同遊記的趣味統計用）；排不進去就算了，照片照樣收下
    await withTimeout(creationQueue().add('tag', { photoId: id }, { jobId: `tag-${id}` }), 3000, '排入佇列').catch(() => {});
    return { id, url: `/api/media/${id}`, tripId, title, location, demoPhotoId, stopId, width, height, createdAt: row!.created_at };
});

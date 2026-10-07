import { randomUUID } from 'node:crypto';
import { isRealStyle, photoById } from '../../app/data/creation.ts';

// 建立一件生成工作：檢查每日上限 → 寫進 creations（queued）→ 排進佇列，立刻回傳 id，手機再輪詢進度。
// 來源是評審上傳的照片（photoId）或內建的示範照片（demoPhotoId），兩者擇一
export default defineEventHandler(async event => {
    const body = await readBody<Record<string, unknown>>(event) ?? {};
    const { tripId, styleId } = body;
    if (!isTripId(tripId)) throw createError({ statusCode: 400, statusMessage: '行程不存在' });
    if (!isRealStyle(styleId)) throw createError({ statusCode: 400, statusMessage: '這種風格不需要生成' });

    const device = await requireDevice(event);
    const config = readConfig();
    const sql = await db();
    let photoId: string | null = null, demoPhotoId: string | null = null, location: string;
    if (isUuid(body.photoId)) {
        const [photo] = await sql<{ trip_id: string; location: string }[]>`select trip_id, location from photos where id = ${body.photoId} and device_id = ${device}`;
        if (!photo || photo.trip_id !== tripId) throw createError({ statusCode: 404, statusMessage: '找不到這張照片' });
        photoId = body.photoId;
        location = photo.location;
    } else {
        const demo = photoById(typeof body.demoPhotoId === 'string' ? body.demoPhotoId : undefined);
        if (!demo || demo.tripId !== tripId) throw createError({ statusCode: 404, statusMessage: '找不到這張照片' });
        demoPhotoId = demo.id;
        location = demo.location;
    }

    // 「今天」照台北時間算，評審的感覺是半夜 12 點重置，不是 UTC 的早上 8 點
    const [counts] = await sql<{ device_today: number; global_today: number }[]>`
        select count(*) filter (where device_id = ${device})::int as device_today, count(*)::int as global_today
        from creations
        where created_at >= (date_trunc('day', now() at time zone 'Asia/Taipei') at time zone 'Asia/Taipei')`;
    const decision = limitDecision({ deviceToday: counts!.device_today, globalToday: counts!.global_today }, config);
    if (decision !== 'ok') {
        setResponseStatus(event, 429);
        return { reason: decision, message: decision === 'device' ? '今天這台手機的生成次數用完了，先看看示範作品吧' : '今天的 AI 生成名額用完了，先看看示範作品吧' };
    }

    const id = randomUUID();
    await sql`
        insert into creations (id, device_id, trip_id, style_id, photo_id, demo_photo_id, location)
        values (${id}, ${device}, ${tripId}, ${styleId}, ${photoId}, ${demoPhotoId}, ${location})`;
    try {
        // jobId 用作品 id：worker 重啟時重新排入同一件不會變成兩份
        await withTimeout(creationQueue().add('create', { creationId: id }, { jobId: id }), 3000, '排入佇列');
    } catch (error) {
        // Redis 連不上：台上不能出錯，直接退回預製圖。之後就算這筆又被排進去，worker 也只接 queued 的
        await sql`update creations set status = 'fallback', error = ${String(error).slice(0, 500)}, finished_at = now() where id = ${id}`;
        return { id, status: 'fallback' };
    }
    return { id, status: 'queued' };
});

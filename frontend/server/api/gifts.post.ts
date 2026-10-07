import { shortId } from '../utils/short-id.ts';

// 送一張 eSIM：產生禮物連結（/g/短碼）。方案照 app/utils/esim.ts；真的開通要去趣的系統，這裡是示範
export default defineEventHandler(async event => {
    const body = await readBody<{ tripId?: unknown; usage?: unknown }>(event) ?? {};
    if (!isTripId(body.tripId)) throw createError({ statusCode: 400, statusMessage: '行程不存在' });
    if (body.usage !== 'light' && body.usage !== 'normal' && body.usage !== 'heavy') throw createError({ statusCode: 400, statusMessage: '方案不存在' });
    const device = await requireDevice(event);
    const sql = await db();
    const id = shortId();
    await sql`insert into gifts (id, sender_device_id, trip_id, usage) values (${id}, ${device}, ${body.tripId}, ${body.usage})`;
    return giftView((await loadGift(id))!, device);
});

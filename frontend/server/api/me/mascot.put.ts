import { isMascotId } from '../../../app/data/mascots.ts';

export default defineEventHandler(async event => {
    const body = await readBody<{ mascotId?: unknown }>(event);
    if (!isMascotId(body?.mascotId)) throw createError({ statusCode: 400, statusMessage: '請選擇有效的吉祥物造型' });
    const device = await requireDevice(event);
    const sql = await db();
    await sql`update devices set mascot_id = ${body.mascotId} where id = ${device}`;
    return { mascotId: body.mascotId };
});

export default defineEventHandler(async event => {
    const nickname = cleanNickname((await readBody<{ nickname?: unknown }>(event))?.nickname);
    if (!nickname) throw createError({ statusCode: 400, statusMessage: '請輸入暱稱' });
    const device = await requireDevice(event);
    const sql = await db();
    await sql`update devices set nickname = ${nickname} where id = ${device}`;
    return { nickname };
});

// 模擬購買（不扣款）：只能替自己買。旅伴價由前端照真的購買人數算（app/utils/commerce.ts）
export default defineEventHandler(async event => {
    const id = getRouterParam(event, 'id');
    if (!isShortId(id)) throw createError({ statusCode: 404 });
    const usage = (await readBody<{ usage?: unknown }>(event))?.usage;
    if (usage !== 'light' && usage !== 'normal' && usage !== 'heavy') throw createError({ statusCode: 400, statusMessage: '方案不存在' });
    const device = await requireDevice(event);
    const sql = await db();
    const updated = await sql`
        update group_members set paid = true, paid_usage = ${usage}, paid_at = now()
        where group_id = ${id} and device_id = ${device} and not paid`;
    if (!updated.count) {
        const [member] = await sql`select 1 from group_members where group_id = ${id} and device_id = ${device}`;
        if (!member) throw createError({ statusCode: 403, statusMessage: '你不在這趟旅伴裡' });
    }
    return groupSummary(id, device);
});

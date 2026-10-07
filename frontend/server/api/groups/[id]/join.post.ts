// 加入朋友的群組。同一趟原本在別的群組就先離開（一台裝置一趟只算一個群組）；已經在裡面就直接回傳
export default defineEventHandler(async event => {
    const id = getRouterParam(event, 'id');
    if (!isShortId(id)) throw createError({ statusCode: 404 });
    const device = await requireDevice(event);
    const sql = await db();
    const [group] = await sql<{ trip_id: string }[]>`select trip_id from trip_groups where id = ${id}`;
    if (!group) throw createError({ statusCode: 404, statusMessage: '這個邀請不存在' });
    await sql.begin(async tx => {
        const [already] = await tx`select 1 from group_members where group_id = ${id} and device_id = ${device}`;
        if (already) return;
        const [count] = await tx<{ n: number }[]>`select count(*)::int as n from group_members where group_id = ${id}`;
        if (count!.n >= MAX_MEMBERS) throw createError({ statusCode: 409, statusMessage: '這趟旅伴已經滿了' });
        await tx`
            delete from group_members where device_id = ${device}
            and group_id in (select id from trip_groups where trip_id = ${group.trip_id} and id <> ${id})`;
        await tx`insert into group_members (group_id, device_id) values (${id}, ${device})`;
    });
    return groupSummary(id, device);
});

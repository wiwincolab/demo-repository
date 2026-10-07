// 手機每 2 秒問一次進度。排隊中附上前面還有幾件，評審知道不是當機
export default defineEventHandler(async event => {
    const id = getRouterParam(event, 'id');
    if (!isUuid(id)) throw createError({ statusCode: 404 });
    const device = await requireDevice(event);
    const sql = await db();
    const [row] = await sql<{ status: CreationStatus; created_at: Date }[]>`
        select status, created_at from creations where id = ${id} and device_id = ${device}`;
    if (!row) throw createError({ statusCode: 404 });
    const status = effectiveStatus(row, new Date(), readConfig().queueStaleMs);
    let position: number | null = null;
    if (status === 'queued') {
        const [ahead] = await sql<{ n: number }[]>`select count(*)::int as n from creations where status = 'queued' and created_at < ${row.created_at}`;
        position = ahead!.n;
    }
    return { id, status, imageUrl: status === 'done' ? `/api/media/${id}` : null, position };
});

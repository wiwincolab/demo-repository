// 手機每 2 秒問一次進度。排隊中附上前面還有幾件，評審知道不是當機
export default defineEventHandler(async event => {
    const id = getRouterParam(event, 'id');
    if (!isUuid(id)) throw createError({ statusCode: 404 });
    const device = await requireDevice(event);
    const config = readConfig();
    const sql = await db();
    const [row] = await sql<{ status: CreationStatus; created_at: Date; started_at: Date | null }[]>`
        select status, created_at, started_at from creations where id = ${id} and device_id = ${device}`;
    if (!row) throw createError({ statusCode: 404 });
    const status = effectiveStatus(row, new Date(), config);
    let position: number | null = null;
    if (status === 'queued') {
        // 只算還有效的：排隊超過上限的 worker 不會再做，算進來只會把「前面還有幾件」灌水
        const [ahead] = await sql<{ n: number }[]>`
            select count(*)::int as n from creations
            where status = 'queued' and created_at < ${row.created_at}
              and created_at > now() - ${config.queueStaleMs} * interval '1 millisecond'`;
        position = ahead!.n;
    }
    return { id, status, imageUrl: status === 'done' ? `/api/media/${id}` : null, position };
});

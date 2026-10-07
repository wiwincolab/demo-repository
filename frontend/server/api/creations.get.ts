// 這台裝置在某一趟行程做過的作品（含還在排隊的），重新整理後畫面從這裡接回來
export default defineEventHandler(async event => {
    const tripId = getQuery(event).tripId;
    if (!isTripId(tripId)) throw createError({ statusCode: 400, statusMessage: '行程不存在' });
    const device = await requireDevice(event);
    const sql = await db();
    const rows = await sql<{ id: string; style_id: string; photo_id: string | null; demo_photo_id: string | null; location: string; status: CreationStatus; created_at: Date; started_at: Date | null }[]>`
        select id, style_id, photo_id, demo_photo_id, location, status, created_at, started_at from creations
        where device_id = ${device} and trip_id = ${tripId}
        order by created_at desc limit 200`;
    const now = new Date(), config = readConfig();
    return rows.map(row => {
        const status = effectiveStatus(row, now, config);
        return { id: row.id, tripId, styleId: row.style_id, photoId: row.photo_id, demoPhotoId: row.demo_photo_id, location: row.location, status, imageUrl: status === 'done' ? `/api/media/${row.id}` : null, createdAt: row.created_at };
    });
});

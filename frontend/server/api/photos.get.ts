// 這台裝置在某一趟行程上傳過的照片，新的在前
export default defineEventHandler(async event => {
    const tripId = getQuery(event).tripId;
    if (!isTripId(tripId)) throw createError({ statusCode: 400, statusMessage: '行程不存在' });
    const device = await requireDevice(event);
    const sql = await db();
    const rows = await sql<{ id: string; title: string; location: string; demo_photo_id: string | null; stop_id: string | null; width: number | null; height: number | null; created_at: Date }[]>`
        select id, title, location, demo_photo_id, stop_id, width, height, created_at from photos
        where device_id = ${device} and trip_id = ${tripId}
        order by created_at desc limit 200`;
    return rows.map(row => ({ id: row.id, url: `/api/media/${row.id}`, tripId, title: row.title, location: row.location, demoPhotoId: row.demo_photo_id, stopId: row.stop_id, width: row.width, height: row.height, createdAt: row.created_at }));
});

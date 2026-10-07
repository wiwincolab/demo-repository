import { shortId } from '../utils/short-id.ts';

// 「邀請旅伴」：回傳這台裝置在這趟的群組；還沒有就建一個（自己是第一個成員），拿到 /j/短碼 邀請連結
export default defineEventHandler(async event => {
    const tripId = (await readBody<{ tripId?: unknown }>(event))?.tripId;
    if (!isTripId(tripId)) throw createError({ statusCode: 400, statusMessage: '行程不存在' });
    const device = await requireDevice(event);
    let id = await groupIdFor(device, tripId);
    if (!id) {
        const sql = await db();
        id = shortId();
        await sql.begin(async tx => {
            await tx`insert into trip_groups (id, owner_device_id, trip_id) values (${id}, ${device}, ${tripId})`;
            await tx`insert into group_members (group_id, device_id) values (${id}, ${device})`;
        });
    }
    return groupSummary(id, device);
});

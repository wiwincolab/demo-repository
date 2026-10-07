// 這台裝置在這趟的群組（行程頁、eSIM 頁每幾秒問一次，看朋友加入、購買了沒）；沒有就是 null
export default defineEventHandler(async event => {
    const tripId = getQuery(event).tripId;
    if (!isTripId(tripId)) throw createError({ statusCode: 400, statusMessage: '行程不存在' });
    const device = await requireDevice(event);
    const id = await groupIdFor(device, tripId);
    return id ? groupSummary(id, device) : null;
});

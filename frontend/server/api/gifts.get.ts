// 這台裝置在這趟送出的禮物與領取狀態（eSIM 頁每幾秒更新，看朋友領了沒）
export default defineEventHandler(async event => {
    const tripId = getQuery(event).tripId;
    if (!isTripId(tripId)) throw createError({ statusCode: 400, statusMessage: '行程不存在' });
    const device = await requireDevice(event);
    return (await giftsSentBy(device, tripId)).map(row => giftView(row, device));
});

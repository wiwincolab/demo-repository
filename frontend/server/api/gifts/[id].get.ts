// 禮物頁看到的：誰送的、哪一趟、什麼方案、領了沒。公開，伺服器端產生頁面與 LINE 預覽也會讀
export default defineEventHandler(async event => {
    const id = getRouterParam(event, 'id');
    if (!isShortId(id)) throw createError({ statusCode: 404 });
    const row = await loadGift(id);
    if (!row) throw createError({ statusCode: 404, statusMessage: '這份禮物不存在' });
    const device = getCookie(event, DEVICE_COOKIE);
    return giftView(row, isDeviceId(device) ? device : '');
});

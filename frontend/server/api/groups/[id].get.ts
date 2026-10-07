// 邀請頁（/j/短碼）看到的：誰邀請、哪一趟、已經有誰加入。公開，伺服器端產生頁面與 LINE 預覽也會讀
export default defineEventHandler(async event => {
    const id = getRouterParam(event, 'id');
    if (!isShortId(id)) throw createError({ statusCode: 404 });
    const device = getCookie(event, DEVICE_COOKIE);
    const summary = await groupSummary(id, isDeviceId(device) ? device : '');
    if (!summary) throw createError({ statusCode: 404, statusMessage: '這個邀請不存在' });
    return summary;
});

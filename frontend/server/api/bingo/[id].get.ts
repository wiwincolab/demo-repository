// Bingo 卡的最新狀態（頁面每 3 秒問一次，看旅伴完成了哪幾格、AI 判斷結果）
export default defineEventHandler(async event => {
    const id = getRouterParam(event, 'id');
    if (!isShortId(id)) throw createError({ statusCode: 404 });
    const device = getCookie(event, DEVICE_COOKIE);
    const view = await loadBoardView(id, isDeviceId(device) ? device : '');
    if (!view) throw createError({ statusCode: 404, statusMessage: '找不到這張 Bingo' });
    return view;
});

// 分享的作品圖：公開（朋友的落地頁、LINE／FB 連結預覽都要讀），寫入後不再變，長期快取
export default defineEventHandler(async event => {
    const share = await loadShare(getRouterParam(event, 'id'));
    if (!share?.media_path || !share.mime) throw createError({ statusCode: 404 });
    setResponseHeaders(event, { 'Content-Type': share.mime, 'Cache-Control': 'public, max-age=31536000, immutable' });
    return readMedia(readConfig().mediaDir, share.media_path);
});

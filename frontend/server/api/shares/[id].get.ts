// 朋友打開分享連結看到的內容：公開、不需要 cookie（伺服器端產生頁面與 LINE 預覽也會讀）
export default defineEventHandler(async event => {
    const share = await loadShare(getRouterParam(event, 'id'));
    if (!share) throw createError({ statusCode: 404, statusMessage: '這個分享不存在' });
    return {
        id: share.id,
        kind: share.kind,
        tripId: share.trip_id,
        tripTitle: tripTitle(share.trip_id),
        nickname: share.nickname || '一位旅人',
        location: share.location,
        styleId: share.style_id,
        caption: share.caption,
        imageUrl: share.media_path ? `/api/shares/${share.id}/image` : null,
        stops: publicStops(share.trip_id, share.stop_ids),
        createdAt: share.created_at,
    };
});

// 共同遊記（/journal 頁每幾秒問一次）：依台北日期分天的照片（重複的收起來）、每日卡片、誰拍了什麼的趣味統計
export default defineEventHandler(async event => {
    const tripId = getQuery(event).tripId;
    if (!isTripId(tripId)) throw createError({ statusCode: 400, statusMessage: '行程不存在' });
    const device = await requireDevice(event);
    const journal = await loadJournal(device, tripId);
    const cards = await dailyCards(journal.scope, tripId);
    const days = [...new Set(journal.kept.map(item => item.day))].sort().reverse().map(day => ({
        day,
        items: journal.kept.filter(item => item.day === day).map(item => ({
            id: item.id, kind: item.kind, url: `/api/media/${item.id}`, title: item.title, tag: item.tag,
            nickname: item.nickname || '旅伴', me: item.owner === device,
        })),
        card: cards.find(card => card.day === day) ?? null,
    }));
    return { days, hidden: journal.hidden, stats: journal.stats };
});

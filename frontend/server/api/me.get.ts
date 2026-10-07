// 這台裝置的暱稱（分享卡、旅伴名單用）。沒取過是 null，畫面會先問
export default defineEventHandler(async event => {
    const device = await requireDevice(event);
    const sql = await db();
    const [row] = await sql<{ nickname: string | null }[]>`select nickname from devices where id = ${device}`;
    return { nickname: row?.nickname ?? null };
});

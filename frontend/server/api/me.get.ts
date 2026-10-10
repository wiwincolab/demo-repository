// 這台裝置的暱稱（分享卡、旅伴名單用）。沒取過是 null，畫面會先問
export default defineEventHandler(async event => {
    const device = await requireDevice(event);
    const sql = await db();
    const [row] = await sql<{ nickname: string | null; mascot_id: string | null }[]>`select nickname, mascot_id from devices where id = ${device}`;
    return { nickname: row?.nickname ?? null, mascotId: row?.mascot_id ?? null };
});

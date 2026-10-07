import { randomUUID } from 'node:crypto';

// 完成一格：上傳照片（手機已縮到 1600px）→ 這格狀態 checking → 排進佇列讓 worker 看照片判斷。
// 只有這張卡的主人或同組旅伴能交；同一格重交就換掉自己上一張。Redis 連不上就直接記成 noted（算完成）
export default defineEventHandler(async event => {
    const id = getRouterParam(event, 'id');
    const cell = Number(getRouterParam(event, 'cell'));
    if (!isShortId(id) || !Number.isInteger(cell) || cell < 0 || cell > 8) throw createError({ statusCode: 404 });
    const device = await requireDevice(event);
    const sql = await db();
    const [board] = await sql<{ id: string; group_id: string | null; device_id: string | null }[]>`select id, group_id, device_id from bingo_boards where id = ${id}`;
    if (!board) throw createError({ statusCode: 404, statusMessage: '找不到這張 Bingo' });
    const allowed = board.group_id
        ? (await sql`select 1 from group_members where group_id = ${board.group_id} and device_id = ${device}`).length > 0
        : board.device_id === device;
    if (!allowed) throw createError({ statusCode: 403, statusMessage: '加入這趟旅伴才能一起玩' });

    const body = await readRawBody(event, false);
    if (!body?.length || body.length > 10 * 1024 * 1024) throw createError({ statusCode: 413, statusMessage: '照片太大' });
    const mime = sniffImageType(body);
    if (!mime) throw createError({ statusCode: 415, statusMessage: '只收 JPG、PNG、WebP' });
    const markId = randomUUID();
    const mediaPath = mediaRelativePath(markId, mime, new Date());
    await writeMedia(readConfig().mediaDir, mediaPath, body);
    await sql.begin(async tx => {
        await tx`delete from bingo_marks where board_id = ${id} and cell = ${cell} and device_id = ${device}`;
        await tx`insert into bingo_marks (id, board_id, cell, device_id, media_path, mime) values (${markId}, ${id}, ${cell}, ${device}, ${mediaPath}, ${mime})`;
    });
    try {
        await withTimeout(creationQueue().add('bingo', { markId }, { jobId: `bingo-${markId}` }), 3000, '排入佇列');
    } catch {
        await sql`update bingo_marks set status = 'noted', comment = '已記下，AI 晚點再看', checked_at = now() where id = ${markId}`;
    }
    return loadBoardView(id, device);
});

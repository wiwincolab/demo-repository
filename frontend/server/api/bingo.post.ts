import { tripItineraries, tripSummaries } from '../../app/data/trips.ts';
import { shortId } from '../utils/short-id.ts';

// 打開這趟的 Bingo：在旅伴群組裡就整組共用一張，否則個人一張；還沒有就出題建立。
// 出題由 Gemini 依景點寫 6 題（12 秒內），失敗用每趟手寫的備用題；中間一欄固定「到哪都能拍」
export default defineEventHandler(async event => {
    const tripId = (await readBody<{ tripId?: unknown }>(event))?.tripId;
    if (!isTripId(tripId)) throw createError({ statusCode: 400, statusMessage: '行程不存在' });
    const device = await requireDevice(event);
    const groupId = await groupIdFor(device, tripId);
    const existing = await findBoard(device, tripId, groupId);
    if (existing) return loadBoardView(existing.id, device);

    const trip = tripSummaries.find(item => item.id === tripId)!;
    const stops = tripItineraries[tripId].flatMap(day => day.stops)
        .filter((stop, index, all) => all.findIndex(other => other.name === stop.name) === index)
        .map(stop => ({ name: stop.name, note: stop.note }));
    let tasks = fallbackTasks[tripId], source = 'preset';
    const started = Date.now();
    try {
        const generated = parseTasks(await writeJson(readConfig(), tasksPrompt(trip.title, stops), TASKS_SCHEMA, 12_000));
        if (generated) { tasks = generated; source = 'ai'; }
    } catch (error) {
        console.warn(`[api] stage=bingo_tasks result=fallback error=${error instanceof Error ? error.message.slice(0, 160) : error}`);
    }
    console.info(`[api] stage=bingo_tasks result=${source} ms=${Date.now() - started}`);

    const sql = await db();
    const id = shortId();
    try {
        await sql`
            insert into bingo_boards (id, trip_id, group_id, device_id, cells, source)
            values (${id}, ${tripId}, ${groupId}, ${groupId ? null : device}, ${sql.json(assembleCells(tasks) as never)}, ${source})`;
    } catch {
        // 同一組的旅伴同時打開：另一個人先建好了，用他那張
        const board = await findBoard(device, tripId, groupId);
        if (board) return loadBoardView(board.id, device);
        throw createError({ statusCode: 500, statusMessage: 'Bingo 沒有建立成功' });
    }
    return loadBoardView(id, device);
});

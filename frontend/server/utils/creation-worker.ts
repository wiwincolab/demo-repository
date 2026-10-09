import { Worker } from 'bullmq';
import type { TripId } from '../../app/data/trips.ts';
import type { AppConfig } from './config.ts';
import { db } from './db.ts';
import { writeJson, type SourceImage } from './gemini.ts';
import { DAILY_SCHEMA, dailyPrompt, parsePicks, parseTag, TAG_SCHEMA, tagPrompt, type DailyPicks } from './journal.ts';
import { tripTitle } from './share.ts';
import { readMedia } from './media.ts';
import { creationQueue, QUEUE_NAME, redisConnection, type CreationJob } from './queue.ts';

// 佇列的 worker：只在 CHICTRIP_ROLE=worker 的 pod 裡跑（server/plugins/worker.ts）。
// 只做照片標類別與每日卡片；AI 創作的成品是預製圖或手機上合成的示範圖，不經過這裡。
// 任何一步失敗都退回不需要 AI 的版本，不讓評審看到錯誤畫面

// Redis 不存檔，Redis 重啟後排隊中的工作會不見，資料表裡卻還是 queued：從資料表補回佇列。
// jobId 用卡片 id，還在佇列裡的不會變成兩份。太久沒做的退回（第一張當代表、不配文字），還在時間內的補回佇列
async function requeueWaiting(config: AppConfig) {
    const sql = await db();
    await sql`
        update daily_cards set status = 'fallback', picks = ${sql.json(fallbackPicks as never)}, finished_at = now()
        where status = 'queued' and created_at <= now() - ${config.queueStaleMs} * interval '1 millisecond'`;
    const cards = await sql<{ id: string }[]>`
        select id from daily_cards where status = 'queued' and created_at > now() - ${config.queueStaleMs} * interval '1 millisecond'`;
    for (const { id } of cards) await creationQueue().add('daily', { cardId: id }, { jobId: `daily-${id}` });
    return cards.length;
}

// 照片標類別（食物／風景／人物／其他），共同遊記的趣味統計用。失敗就留空，不影響任何畫面
export async function processPhotoTag(config: AppConfig, id: string) {
    const sql = await db();
    const [photo] = await sql<{ media_path: string; mime: SourceImage['mime'] }[]>`select media_path, mime from photos where id = ${id} and tag is null`;
    if (!photo) return;
    try {
        const image = { bytes: await readMedia(config.mediaDir, photo.media_path), mime: photo.mime, width: null, height: null };
        const tag = parseTag(await writeJson(config, tagPrompt, TAG_SCHEMA, 20_000, image));
        if (tag) await sql`update photos set tag = ${tag} where id = ${id}`;
        console.info(`[worker] stage=photo_tag result=${tag ?? 'invalid'}`);
    } catch (error) {
        console.warn(`[worker] stage=photo_tag result=error error=${error instanceof Error ? error.message.slice(0, 160) : error}`);
    }
}

// 每日卡片：當天的照片依序送給 Flash，挑出代表、食物、意外並配字。失敗就退回（第一張當代表、不配文字），畫面照樣有卡片
export const fallbackPicks: DailyPicks = { title: '今天的旅行', cover: 0, food: null, surprise: null, coverCaption: '', foodCaption: '', surpriseCaption: '' };
export async function processDailyCard(config: AppConfig, id: string) {
    const sql = await db();
    const [card] = await sql<{ trip_id: TripId; media_ids: string[] }[]>`select trip_id, media_ids from daily_cards where id = ${id} and status = 'queued'`;
    if (!card) return;
    const started = Date.now();
    try {
        const rows = await sql<{ id: string; media_path: string; mime: SourceImage['mime'] }[]>`
            select id, media_path, mime from photos where id = any(${card.media_ids})`;
        const ordered = card.media_ids.map(mediaId => rows.find(row => row.id === mediaId)).filter((row): row is NonNullable<typeof row> => !!row);
        const images = await Promise.all(ordered.map(async row => ({ bytes: await readMedia(config.mediaDir, row.media_path), mime: row.mime, width: null, height: null })));
        const picks = parsePicks(await writeJson(config, dailyPrompt(tripTitle(card.trip_id), images.length), DAILY_SCHEMA, config.jobTimeoutMs, images), images.length);
        if (!picks) throw new Error('挑照片的結果格式不對');
        // 「今日美食」只認標成食物的照片：10/7 實測當天沒有食物照，模型還是硬挑了奈良的鹿當美食
        const tags = await sql<{ id: string; tag: string | null }[]>`select id, tag from photos where id = any(${card.media_ids})`;
        const foodTag = picks.food === null ? null : tags.find(row => row.id === ordered[picks.food!]?.id)?.tag;
        if (picks.food !== null && foodTag !== 'food') { picks.food = null; picks.foodCaption = ''; }
        await sql`update daily_cards set status = 'done', picks = ${sql.json(picks as never)}, finished_at = now() where id = ${id} and status = 'queued'`;
        console.info(`[worker] stage=daily_card result=done photos=${images.length} ms=${Date.now() - started}`);
    } catch (error) {
        await sql`update daily_cards set status = 'fallback', picks = ${sql.json(fallbackPicks as never)}, finished_at = now() where id = ${id} and status = 'queued'`;
        console.warn(`[worker] stage=daily_card result=fallback ms=${Date.now() - started} error=${error instanceof Error ? error.message.slice(0, 160) : error}`);
    }
}

// worker 啟動時把 Redis 裡不見的每日卡片補回來
async function recoverOnStart(config: AppConfig) {
    const count = await requeueWaiting(config);
    if (count) console.info(`[worker] 重新排入 ${count} 件`);
}

const warn = (label: string) => (error: unknown) => console.warn(`[worker] ${label}：${error instanceof Error ? error.message : error}`);

export function startCreationWorker(config: AppConfig) {
    const handlers: Record<string, (job: { data: CreationJob }) => Promise<void>> = {
        tag: job => processPhotoTag(config, job.data.photoId!),
        daily: job => processDailyCard(config, job.data.cardId!),
    };
    // 拿掉生圖之前排進來的 create 工作沒有對應的處理，直接略過
    const worker = new Worker<CreationJob>(QUEUE_NAME, async job => { await handlers[job.name]?.(job); }, {
        connection: redisConnection(config.redisUrl),
        concurrency: config.workerConcurrency,
    });
    worker.on('error', error => console.warn(`[worker] Redis 連線失敗：${error.message}`));
    recoverOnStart(config).catch(warn('接回排隊中的工作失敗'));
    // 只有 Redis 重啟（worker 沒重啟）時也要補回：每分鐘對一次資料表
    const timer = setInterval(() => requeueWaiting(config).catch(warn('補回佇列失敗')), 60_000);
    console.info(`[worker] 開始處理佇列 ${QUEUE_NAME}（同時 ${config.workerConcurrency} 件，看照片 ${config.textModel}）`);
    return { close: async () => { clearInterval(timer); await worker.close(); } };
}

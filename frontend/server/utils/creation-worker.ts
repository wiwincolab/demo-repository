import { Worker } from 'bullmq';
import { photoById, type CreationId } from '../../app/data/creation.ts';
import type { TripId } from '../../app/data/trips.ts';
import type { AppConfig } from './config.ts';
import { db } from './db.ts';
import { analyzePhoto, generateStyledImage, type SourceImage } from './gemini.ts';
import { buildPrompt, nearestAspect, needsAnalysis, STYLE_ASPECT } from './creation-prompts.ts';
import { mediaRelativePath, readMedia, sniffImageType, writeMedia } from './media.ts';
import { creationQueue, QUEUE_NAME, redisConnection, type CreationJob } from './queue.ts';
import { withTimeout } from './timeout.ts';
import { tripStartDate } from './trips.ts';

// 生成佇列的 worker：只在 CHICTRIP_ROLE=worker 的 pod 裡跑（server/plugins/worker.ts）。
// 任何一步失敗都把作品標成 fallback，手機改顯示預製圖，不讓評審看到錯誤畫面
interface CreationRow { id: string; style_id: CreationId; trip_id: TripId; photo_id: string | null; demo_photo_id: string | null; location: string }

async function loadSource(config: AppConfig, row: CreationRow): Promise<SourceImage> {
    const sql = await db();
    if (row.photo_id) {
        const [photo] = await sql<{ media_path: string; mime: SourceImage['mime']; width: number | null; height: number | null }[]>`
            select media_path, mime, width, height from photos where id = ${row.photo_id}`;
        if (!photo) throw new Error('找不到上傳的照片');
        return { bytes: await readMedia(config.mediaDir, photo.media_path), mime: photo.mime, width: photo.width, height: photo.height };
    }
    // 示範照片在 web（Nginx）的映像裡，api／worker 的映像沒有，從叢集內的 web 抓
    const demo = photoById(row.demo_photo_id ?? undefined);
    if (!demo) throw new Error(`找不到示範照片 ${row.demo_photo_id}`);
    const response = await fetch(new URL(`/assets/memory/${demo.source}`, config.assetOrigin), { signal: AbortSignal.timeout(10_000) });
    if (!response.ok) throw new Error(`示範照片下載失敗（${response.status}）`);
    const bytes = new Uint8Array(await response.arrayBuffer());
    const mime = sniffImageType(bytes);
    if (!mime) throw new Error('示範照片格式不認得');
    return { bytes, mime, width: null, height: null };
}

export async function processCreation(config: AppConfig, id: string) {
    const sql = await db();
    // 只接還在排隊上限內的：超過的手機已經顯示示範圖（limits.ts 的 effectiveStatus），再生成既花錢、重新整理後又說法不一
    const [row] = await sql<CreationRow[]>`
        update creations set status = 'running', started_at = now()
        where id = ${id} and status = 'queued' and created_at > now() - ${config.queueStaleMs} * interval '1 millisecond'
        returning id, style_id, trip_id, photo_id, demo_photo_id, location`;
    if (!row) {
        await sql`update creations set status = 'fallback', error = '排隊太久，沒有生成', finished_at = now() where id = ${id} and status = 'queued'`;
        return;
    }
    const started = Date.now();
    try {
        const source = await loadSource(config, row);
        const style = row.style_id as 'sticker' | 'photo' | 'ticket' | 'pin';
        const analysis = needsAnalysis(style) ? await withTimeout(analyzePhoto(config, source, row.location), config.jobTimeoutMs, '看照片') : null;
        const prompt = buildPrompt(style, analysis, { startDate: tripStartDate(row.trip_id) });
        const aspect = style === 'photo' ? nearestAspect(source.width, source.height) : STYLE_ASPECT[style];
        const image = await withTimeout(generateStyledImage(config, prompt, source, aspect), config.jobTimeoutMs, '生圖');
        const mediaPath = mediaRelativePath(id, image.mime, new Date());
        await writeMedia(config.mediaDir, mediaPath, image.bytes);
        await sql`update creations set status = 'done', media_path = ${mediaPath}, mime = ${image.mime}, finished_at = now() where id = ${id}`;
        console.info(`[worker] stage=creation result=done style=${style} ms=${Date.now() - started} id=${id}`);
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await sql`update creations set status = 'fallback', error = ${message.slice(0, 500)}, finished_at = now() where id = ${id}`;
        console.warn(`[worker] stage=creation result=fallback style=${row.style_id} ms=${Date.now() - started} id=${id} error=${message.slice(0, 200)}`);
    }
}

// Redis 不存檔，Redis 重啟後排隊中的工作會不見，資料表裡卻還是 queued：從資料表補回佇列。
// jobId 就是作品 id，還在佇列裡的不會變成兩份；超過排隊上限的 processCreation 不會接
async function requeueWaiting(config: AppConfig) {
    const sql = await db();
    // 已經超過排隊上限的（手機早就顯示示範圖）順便在資料表標成 fallback，資料表與畫面說法一致
    await sql`
        update creations set status = 'fallback', error = '排隊太久，沒有生成', finished_at = now()
        where status = 'queued' and created_at <= now() - ${config.queueStaleMs} * interval '1 millisecond'`;
    const rows = await sql<{ id: string }[]>`
        select id from creations where status = 'queued' and created_at > now() - ${config.queueStaleMs} * interval '1 millisecond'`;
    for (const { id } of rows) await creationQueue().add('create', { creationId: id }, { jobId: id });
    return rows.length;
}

// worker 啟動時：只有一個 worker（replicas: 1、Recreate），running 的一定是上一個 worker 做到一半就停掉的，放回佇列重做
async function recoverOnStart(config: AppConfig) {
    const sql = await db();
    await sql`update creations set status = 'queued', started_at = null where status = 'running'`;
    const count = await requeueWaiting(config);
    if (count) console.info(`[worker] 重新排入 ${count} 件`);
}

const warn = (label: string) => (error: unknown) => console.warn(`[worker] ${label}：${error instanceof Error ? error.message : error}`);

export function startCreationWorker(config: AppConfig) {
    const worker = new Worker<CreationJob>(QUEUE_NAME, job => processCreation(config, job.data.creationId), {
        connection: redisConnection(config.redisUrl),
        concurrency: config.workerConcurrency,
    });
    worker.on('error', error => console.warn(`[worker] Redis 連線失敗：${error.message}`));
    recoverOnStart(config).catch(warn('接回排隊中的工作失敗'));
    // 只有 Redis 重啟（worker 沒重啟）時也要補回：每分鐘對一次資料表
    const timer = setInterval(() => requeueWaiting(config).catch(warn('補回佇列失敗')), 60_000);
    console.info(`[worker] 開始處理佇列 ${QUEUE_NAME}（同時 ${config.workerConcurrency} 件，生圖 ${config.imageModel}、看照片 ${config.textModel}）`);
    return { close: async () => { clearInterval(timer); await worker.close(); } };
}

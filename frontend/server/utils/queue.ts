import { Queue } from 'bullmq';
import { readConfig } from './config.ts';

// 生成工作排在 Redis（BullMQ，Node 版的 RQ），由 worker（server/plugins/worker.ts）一張張做。
// 工作本身只帶 creationId，內容與狀態都在 Postgres 的 creations
export const QUEUE_NAME = 'creations';
export interface CreationJob { creationId: string }

// BullMQ 要求 maxRetriesPerRequest 為 null：Redis 斷線時由 BullMQ 自己重連，不讓單一指令失敗就丟錯
export function redisConnection(url: string) {
    const parsed = new URL(url);
    return { host: parsed.hostname, port: Number(parsed.port || 6379), maxRetriesPerRequest: null };
}

let queue: Queue<CreationJob> | undefined;

export function creationQueue() {
    // 失敗不自動重試：重試等於讓評審多等一輪，直接退回預製圖。完成與失敗紀錄各留 1,000 筆方便查問題
    queue ??= new Queue<CreationJob>(QUEUE_NAME, {
        connection: redisConnection(readConfig().redisUrl),
        defaultJobOptions: { attempts: 1, removeOnComplete: 1000, removeOnFail: 1000 },
    });
    // 沒掛 error 事件時，Redis 斷線期間每次重連都印整段錯誤堆疊；改成一行，log 看得出原因又不洗版
    queue.on('error', error => console.warn(`[queue] Redis 連線失敗：${error.message}`));
    return queue;
}

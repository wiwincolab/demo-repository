// 每台裝置、全站每天能生成幾張（values.yaml 的 DEVICE_DAILY_LIMIT、GLOBAL_DAILY_LIMIT）。
// 一張 1K 圖 US$0.0336（Gemini 官方定價頁），全站 1,000 張約 US$34／天，是決賽當天花費的上限
export type CreationStatus = 'queued' | 'running' | 'done' | 'fallback';

export function limitDecision(counts: { deviceToday: number; globalToday: number }, limits: { deviceDailyLimit: number; globalDailyLimit: number }) {
    if (counts.deviceToday >= limits.deviceDailyLimit) return 'device' as const;
    if (counts.globalToday >= limits.globalDailyLimit) return 'global' as const;
    return 'ok' as const;
}

// 製作中最多多久：看照片、生圖各有一次 JOB_TIMEOUT_MS，再加 30 秒讀檔寫檔的餘裕。超過代表 worker 掛了
export const runningLimitMs = (jobTimeoutMs: number) => jobTimeoutMs * 2 + 30_000;

// 讀取時決定畫面要顯示什麼，不讓評審一直轉圈：
// - 排隊超過 QUEUE_STALE_MS：當作退回預製圖。worker 也不會再接這件（creation-worker.ts 接工作時同樣檢查），前後說法一致
// - 製作中從「開始做」算起，超過 runningLimitMs：worker 多半掛了，當作退回
export function effectiveStatus(row: { status: CreationStatus; created_at: Date; started_at: Date | null }, now: Date, limits: { queueStaleMs: number; jobTimeoutMs: number }): CreationStatus {
    if (row.status === 'queued' && now.getTime() - row.created_at.getTime() > limits.queueStaleMs) return 'fallback';
    const started = row.started_at ?? row.created_at;
    if (row.status === 'running' && now.getTime() - started.getTime() > runningLimitMs(limits.jobTimeoutMs)) return 'fallback';
    return row.status;
}

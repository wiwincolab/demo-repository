// 每台裝置、全站每天能生成幾張（values.yaml 的 DEVICE_DAILY_LIMIT、GLOBAL_DAILY_LIMIT）。
// 一張 1K 圖 US$0.0336（Gemini 官方定價頁），全站 1,000 張約 US$34／天，是決賽當天花費的上限
export type CreationStatus = 'queued' | 'running' | 'done' | 'fallback';

export function limitDecision(counts: { deviceToday: number; globalToday: number }, limits: { deviceDailyLimit: number; globalDailyLimit: number }) {
    if (counts.deviceToday >= limits.deviceDailyLimit) return 'device' as const;
    if (counts.globalToday >= limits.globalDailyLimit) return 'global' as const;
    return 'ok' as const;
}

// Redis 不存檔：Redis 重啟時排隊中的工作會消失，資料表裡就一直是 queued。
// 讀取時超過 QUEUE_STALE_MS 就當作退回預製圖，不讓評審的畫面一直轉圈
export function effectiveStatus(row: { status: CreationStatus; created_at: Date }, now: Date, staleMs: number): CreationStatus {
    const pending = row.status === 'queued' || row.status === 'running';
    return pending && now.getTime() - row.created_at.getTime() > staleMs ? 'fallback' : row.status;
}

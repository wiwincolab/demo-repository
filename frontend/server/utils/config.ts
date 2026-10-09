// 伺服器設定：K8s 由 Helm 給環境變數（deploy/helm/chictrip），本機開發的預設值對到 frontend/docker-compose.yml。
// 模型與參數是 values.yaml 的 config，改完推 main 就生效；金鑰在 Secret
export interface AppConfig {
    role: 'api' | 'worker';
    databaseUrl: string;
    redisUrl: string;
    mediaDir: string;
    geminiApiKey: string;
    textModel: string;
    workerConcurrency: number;
    jobTimeoutMs: number;
    queueStaleMs: number;
}

// 填錯或填 0 都退回預設值：並行或逾時設成 0，佇列一件都做不成，寧可沿用預設
const positiveInt = (value: string | undefined, fallback: number) => {
    const n = Number.parseInt(value ?? '', 10);
    return Number.isFinite(n) && n > 0 ? n : fallback;
};

export function readConfig(env: Record<string, string | undefined> = process.env): AppConfig {
    return {
        // 同一個映像：api 收請求，worker 另外跑照片標類別與每日卡片的佇列（deploy/helm/chictrip/templates/worker.yaml）
        role: env.CHICTRIP_ROLE === 'worker' ? 'worker' : 'api',
        databaseUrl: env.DATABASE_URL || 'postgres://chictrip:chictrip@127.0.0.1:5434/chictrip',
        // 6379 是 MEDDEMO 本機的 Redis，這裡用 6380
        redisUrl: env.REDIS_URL || 'redis://127.0.0.1:6380',
        mediaDir: env.MEDIA_DIR || '.data/media',
        geminiApiKey: env.GEMINI_API_KEY || '',
        textModel: env.TEXT_MODEL || 'gemini-3.5-flash-lite',
        workerConcurrency: positiveInt(env.WORKER_CONCURRENCY, 4),
        jobTimeoutMs: positiveInt(env.JOB_TIMEOUT_MS, 90_000),
        queueStaleMs: positiveInt(env.QUEUE_STALE_MS, 300_000),
    };
}

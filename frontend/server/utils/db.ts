import postgres from 'postgres';

// 連線網址由部署的 Helm chart 給（deploy/helm/chictrip/templates/_helpers.tpl）；
// 本機開發的預設值對到 frontend/docker-compose.yml 的資料庫
const fallbackUrl = 'postgres://chictrip:chictrip@127.0.0.1:5434/chictrip';

let sql: ReturnType<typeof postgres> | undefined;

export function useDb() {
    // 第一次用到才連線：靜態建置（GitHub Pages）與預先產生頁面時不會碰資料庫。
    // connect_timeout 壓短，資料庫掛掉時健康檢查幾秒內就回失敗，不會卡住 readinessProbe
    sql ??= postgres(process.env.DATABASE_URL || fallbackUrl, { max: 5, connect_timeout: 5, idle_timeout: 60 });
    return sql;
}

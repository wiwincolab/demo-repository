import postgres from 'postgres';
import { readConfig } from './config.ts';
import { migrate } from './migrate.ts';

let sql: ReturnType<typeof postgres> | undefined;
let ready: Promise<ReturnType<typeof postgres>> | undefined;

export function useDb() {
    // 第一次用到才連線：靜態建置（GitHub Pages）與預先產生頁面時不會碰資料庫。
    // connect_timeout 壓短，資料庫掛掉時健康檢查幾秒內就回失敗，不會卡住 readinessProbe
    // onnotice：資料表升級的「已存在、略過」這類提示不是錯誤，不要洗版 log
    sql ??= postgres(readConfig().databaseUrl, { max: 5, connect_timeout: 5, idle_timeout: 60, onnotice: () => {} });
    return sql;
}

// 要讀寫資料表的地方都用這個：資料表升級跑完才回傳。健康檢查也走這裡，升級沒完成 pod 就不會接流量。
// 失敗時清掉，下一個請求再試一次，不會永遠卡在第一次的錯誤
export function db() {
    ready ??= migrate(useDb()).then(() => useDb(), error => {
        ready = undefined;
        throw error;
    });
    return ready;
}

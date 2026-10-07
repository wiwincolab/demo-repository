// 部署的 readinessProbe 與 CI 最後的健康檢查都打這裡。
// 回應帶 app 名稱：care-vm 上 CARE、MEDDEMO 共用同一個 Traefik，路由設錯時別人的 /health 一樣是 200，
// 要看到這個名稱才算真的打到 chicTrip（MEDDEMO 踩過）
export default defineEventHandler(async event => {
    try {
        await useDb()`select 1`;
        return { status: 'ok', app: 'chictrip' };
    } catch {
        setResponseStatus(event, 503);
        return { status: 'db-unavailable', app: 'chictrip' };
    }
});

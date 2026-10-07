// 這個網站有沒有後端：GCP 版（chictrip.jamessu2016.com）有，GitHub Pages 版沒有。
// 只在瀏覽器問一次 /health；看到 chicTrip 自己的回應才算有，資料庫掛掉（503）也當作沒有，整套退回原本的模擬。
// pending 放在模組層：好幾個元件同時問時只發一次請求（只在瀏覽器用，不會在伺服器端被不同請求共用）
let pending: Promise<boolean> | undefined;

export function useApi() {
    const available = useState<boolean | null>('api-available', () => null);
    async function check() {
        if (available.value !== null) return available.value;
        if (import.meta.server) return false;
        pending ??= $fetch<{ status: string; app: string }>('/health', { retry: 0, timeout: 4000 })
            .then(response => response.status === 'ok' && response.app === 'chictrip', () => false)
            .then(result => (available.value = result));
        return pending;
    }
    return { available, check };
}

// 外部服務（Gemini、Redis）卡住時不能讓請求或工作一直等：逾時就丟錯，呼叫端改走預製圖
export function withTimeout<T>(work: Promise<T>, ms: number, label: string): Promise<T> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} 逾時（${ms}ms）`)), ms);
    });
    return Promise.race([work, timeout]).finally(() => clearTimeout(timer));
}

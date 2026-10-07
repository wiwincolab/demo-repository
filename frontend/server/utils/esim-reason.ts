// AI 流量顧問的推薦理由：方案與價格由規則決定（app/utils/esim-advisor.ts 的 recommendUsage、app/utils/esim.ts），
// Gemini 只用評審自己的回答與這趟的景點，寫一兩句「為什麼適合你」。
// 不讓它寫任何數字：價格、GB 畫面上已經有，模型一寫數字就可能寫錯，所以有數字就整段不用（acceptReason）
export interface ReasonInput { tripTitle: string; stops: string[]; answers: string[]; tier: string; unlimited: boolean }

export function reasonPrompt(input: ReasonInput) {
    return [
        `旅客要去「${input.tripTitle.replace(/。$/, '')}」，會經過：${input.stops.slice(0, 6).join('、')}。`,
        `他自己說的上網習慣：${input.answers.map(answer => `「${answer}」`).join('；')}。`,
        `我們建議「${input.tier}」使用量的${input.unlimited ? '吃到飽' : '每日定量'}方案。`,
        '用繁體中文寫一到兩句、六十字以內，像朋友提醒一樣說明為什麼這樣選剛好，要提到他的習慣或一個具體景點。',
        '不要寫任何數字、價格、GB 或天數，不要提到其他品牌，只輸出這段話本身。',
    ].join('\n');
}

export function acceptReason(text: string) {
    const cleaned = text.trim().replace(/^[「"']+|[」"']+$/g, '').trim();
    if (!cleaned || cleaned.length > 120 || /[0-9０-９]/.test(cleaned)) return null;
    return cleaned;
}

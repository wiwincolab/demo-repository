// 分享貼文的文案：Gemini 用評審的口吻寫，命題要求的「自動生成文案」。
// 不給它價格、日期、人名，也要求不要捏造；失敗時用原本 Threads 視窗的範本（app/components/ThreadsComposer.vue）
export function captionPrompt(location: string, styleName: string) {
    return [
        `你是旅人本人，要在 Threads 或 IG 分享一張旅行回憶作品：在「${location}」拍的照片，用去趣 App 的 AI 做成了「${styleName}」風格的數位作品（不是實體商品）。`,
        '用繁體中文寫 2 到 3 句，口語、溫暖、第一人稱，像跟朋友聊天；最後一行放兩個 hashtag，其中一個是 #去趣。',
        '不要寫價格、日期、人名，不要捏造沒提到的景點、天氣或經歷。只輸出貼文本身，不要加引號或說明。',
    ].join('\n');
}

export function fallbackCaption(location: string) {
    return `把 ${location.split(' · ')[0]} 捨不得忘記的一刻，留成一張回憶。\n\n同一個地方，不同的旅行作品。你會選哪一種？\n#旅行回憶 #去趣`;
}

// 模型偶爾會把整段包在引號或 markdown 裡；去掉之後限 300 字（Threads 上限 500，留空間給連結）
export function cleanCaption(text: string) {
    return text.replace(/^```\w*\n?|```$/g, '').replace(/^[「"']+|[」"']+$/g, '').trim().slice(0, 300);
}

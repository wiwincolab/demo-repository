import { dayLabel, pickedUrl, type Journal } from './journal-api.ts';

// 旅行長圖（PDF 第 1 點的遊記）：每一天的卡片（代表照片＋標題與一句話＋食物、意外兩張小圖）接著旅伴統計，
// 1080 寬、長度看天數。產生 data URL 交給 ShareSheet 分享，或直接下載
const colors = { blue: '#009fe8', blueDark: '#007eb8', tint: '#eaf7ff', ink: '#242c32', muted: '#6c7880', paper: '#f5f7f9', yellow: '#ffd83e' };
const font = '-apple-system, BlinkMacSystemFont, "PingFang TC", "Microsoft JhengHei", sans-serif';
const W = 1080, PAD = 60, COVER_H = 640, THUMB = 300;

const loadImage = (src: string | null) => new Promise<HTMLImageElement | null>(resolve => {
    if (!src) return resolve(null);
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
});

function cover(ctx: CanvasRenderingContext2D, image: HTMLImageElement, x: number, y: number, w: number, h: number, radius: number) {
    ctx.save();
    ctx.beginPath(); ctx.roundRect(x, y, w, h, radius); ctx.clip();
    const scale = Math.max(w / image.naturalWidth, h / image.naturalHeight);
    const iw = image.naturalWidth * scale, ih = image.naturalHeight * scale;
    ctx.drawImage(image, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih);
    ctx.restore();
}

export function longImageHeight(dayCount: number, titleCount: number) {
    return 260 + dayCount * (COVER_H + THUMB + 300) + 120 + titleCount * 64 + 140;
}

export async function renderJournalImage(journal: Journal, tripTitle: string, maxDays = 5) {
    const days = journal.days.filter(day => day.card?.picks).slice(0, maxDays).reverse();
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = longImageHeight(days.length, journal.stats.titles.length);
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = colors.paper; ctx.fillRect(0, 0, W, canvas.height);
    ctx.fillStyle = colors.ink; ctx.font = `800 64px ${font}`; ctx.fillText('我們的旅行紀錄', PAD, 130);
    ctx.fillStyle = colors.muted; ctx.font = `500 36px ${font}`;
    ctx.fillText(`${tripTitle.replace(/。$/, '')} · ${journal.stats.members.map(m => m.nickname).join('、')}`.slice(0, 40), PAD, 190);

    let y = 260;
    for (const day of days) {
        const card = day.card!, picks = card.picks!;
        const [main, food, surprise] = await Promise.all([pickedUrl(card, picks.cover), pickedUrl(card, picks.food), pickedUrl(card, picks.surprise)].map(loadImage));
        ctx.fillStyle = colors.blueDark; ctx.font = `700 32px ${font}`; ctx.fillText(dayLabel(day.day), PAD, y);
        ctx.fillStyle = colors.ink; ctx.font = `800 52px ${font}`; ctx.fillText(picks.title, PAD, y + 66);
        if (main) cover(ctx, main, PAD, y + 100, W - PAD * 2, COVER_H, 28);
        ctx.fillStyle = colors.ink; ctx.font = `500 34px ${font}`; ctx.fillText(picks.coverCaption, PAD, y + 100 + COVER_H + 56);
        let x = PAD;
        for (const [image, caption, label] of [[food, picks.foodCaption, '今日美食'], [surprise, picks.surpriseCaption, '今日意外']] as const) {
            if (!image) continue;
            cover(ctx, image, x, y + 100 + COVER_H + 90, THUMB, THUMB, 20);
            ctx.fillStyle = colors.blueDark; ctx.font = `700 26px ${font}`; ctx.fillText(label, x + THUMB + 24, y + 100 + COVER_H + 140);
            ctx.fillStyle = colors.ink; ctx.font = `500 28px ${font}`; ctx.fillText(caption.slice(0, 11), x + THUMB + 24, y + 100 + COVER_H + 184);
            ctx.fillText(caption.slice(11, 22), x + THUMB + 24, y + 100 + COVER_H + 222);
            x += W / 2 - PAD / 2;
        }
        y += COVER_H + THUMB + 300;
    }
    ctx.fillStyle = colors.ink; ctx.font = `800 44px ${font}`; ctx.fillText('旅伴稱號', PAD, y + 40);
    ctx.font = `500 36px ${font}`;
    journal.stats.titles.forEach((title, i) => {
        ctx.fillStyle = colors.yellow; ctx.fillRect(PAD, y + 76 + i * 64, 14, 40);
        ctx.fillStyle = colors.ink; ctx.fillText(`${title.title}：${title.nickname}（${title.count}）`, PAD + 32, y + 108 + i * 64);
    });
    ctx.fillStyle = colors.blue; ctx.font = `italic 800 40px ${font}`; ctx.fillText('去趣 chicTrip', PAD, canvas.height - 60);
    return canvas.toDataURL('image/jpeg', 0.88);
}

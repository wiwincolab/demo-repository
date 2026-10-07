import { encode } from 'uqr';

// IG／LINE 限動尺寸的分享圖卡（1080×1920）：作品、地點、誰的旅行、掃了就能打開分享頁的 QR。
// 在手機上用 canvas 畫，不經過伺服器；顏色與字型跟網站一致（app/assets/css/base.css）
export const STORY = { width: 1080, height: 1920 } as const;
const colors = { blue: '#009fe8', blueDark: '#007eb8', tint: '#eaf7ff', ink: '#242c32', muted: '#6c7880', paper: '#f5f7f9' };
const font = '-apple-system, BlinkMacSystemFont, "PingFang TC", "Microsoft JhengHei", sans-serif';

// 作品放在上方 920×1080 的框裡、維持比例置中
export function storyLayout(imageWidth: number, imageHeight: number) {
    const box = { x: 80, y: 220, width: 920, height: 1080 };
    const scale = Math.min(box.width / imageWidth, box.height / imageHeight);
    const width = Math.round(imageWidth * scale), height = Math.round(imageHeight * scale);
    return { x: box.x + Math.round((box.width - width) / 2), y: box.y + Math.round((box.height - height) / 2), width, height };
}

const loadImage = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('作品圖讀不到'));
    image.src = src;
});

function drawQr(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number) {
    const { data } = encode(text);
    const cell = size / data.length;
    ctx.fillStyle = '#fff';
    ctx.fillRect(x - 16, y - 16, size + 32, size + 32);
    ctx.fillStyle = colors.ink;
    data.forEach((row, r) => row.forEach((dark, c) => { if (dark) ctx.fillRect(x + c * cell, y + r * cell, Math.ceil(cell), Math.ceil(cell)); }));
}

export async function renderStoryCard(input: { artwork: string; location: string; nickname: string; url: string }) {
    const canvas = document.createElement('canvas');
    canvas.width = STORY.width;
    canvas.height = STORY.height;
    const ctx = canvas.getContext('2d')!;
    const background = ctx.createLinearGradient(0, 0, 0, STORY.height);
    background.addColorStop(0, colors.tint);
    background.addColorStop(1, colors.paper);
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, STORY.width, STORY.height);

    ctx.fillStyle = colors.ink;
    ctx.font = `800 64px ${font}`;
    ctx.fillText('去趣', 80, 140);
    ctx.fillStyle = colors.blue;
    ctx.font = `italic 800 56px ${font}`;
    ctx.fillText('chicTrip', 230, 140);

    const art = await loadImage(input.artwork);
    const place = storyLayout(art.naturalWidth, art.naturalHeight);
    ctx.save();
    ctx.shadowColor = 'rgba(36,44,50,.18)';
    ctx.shadowBlur = 40;
    ctx.shadowOffsetY = 16;
    ctx.drawImage(art, place.x, place.y, place.width, place.height);
    ctx.restore();

    ctx.fillStyle = colors.ink;
    ctx.font = `800 68px ${font}`;
    ctx.fillText(input.location.split(' · ').pop()!.slice(0, 14), 80, 1430);
    ctx.fillStyle = colors.muted;
    ctx.font = `500 40px ${font}`;
    ctx.fillText(`${input.nickname} 的旅行回憶`, 80, 1500);

    drawQr(ctx, input.url, 96, 1580, 240);
    ctx.fillStyle = colors.ink;
    ctx.font = `700 46px ${font}`;
    ctx.fillText('掃描看我的旅行', 400, 1680);
    ctx.fillStyle = colors.blueDark;
    ctx.font = `500 34px ${font}`;
    ctx.fillText('存成你的行程，也做一張', 400, 1740);

    return new Promise<Blob>((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('圖卡產生失敗')), 'image/png'));
}

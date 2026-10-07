import { cellPhoto, type BingoBoard } from './bingo-api.ts';

// 連成一線後分享用的 Bingo 圖卡（1080×1350，IG 貼文比例）：九格照片或題目、連成的線、誰完成幾格。
// 產生 data URL 交給 ShareSheet（它再疊上限動版型與 QR）
const colors = { blue: '#009fe8', blueDark: '#007eb8', tint: '#eaf7ff', ink: '#242c32', muted: '#6c7880', yellow: '#ffd83e', line: '#e8edf0' };
const font = '-apple-system, BlinkMacSystemFont, "PingFang TC", "Microsoft JhengHei", sans-serif';

export const BINGO_GRID = { x: 60, y: 200, cell: 300, gap: 30 };
export const cellOrigin = (index: number) => ({
    x: BINGO_GRID.x + (index % 3) * (BINGO_GRID.cell + BINGO_GRID.gap),
    y: BINGO_GRID.y + Math.floor(index / 3) * (BINGO_GRID.cell + BINGO_GRID.gap),
});

const loadImage = (src: string) => new Promise<HTMLImageElement | null>(resolve => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
});

function wrap(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, width: number, lineHeight: number) {
    let line = '', row = 0;
    for (const char of text) {
        if (ctx.measureText(line + char).width > width) { ctx.fillText(line, x, y + row++ * lineHeight); line = char; } else line += char;
    }
    ctx.fillText(line, x, y + row * lineHeight);
}

export async function renderBingoCard(board: BingoBoard, title: string) {
    const canvas = document.createElement('canvas');
    canvas.width = 1080; canvas.height = 1350;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = colors.tint; ctx.fillRect(0, 0, 1080, 1350);
    ctx.fillStyle = colors.ink; ctx.font = `800 64px ${font}`; ctx.fillText('旅行 Bingo', 60, 120);
    ctx.fillStyle = colors.muted; ctx.font = `500 34px ${font}`; ctx.fillText(title.replace(/。$/, ''), 60, 172);

    const photos = await Promise.all(board.cells.map(cell => {
        const mark = cellPhoto(cell);
        return mark && (mark.status === 'pass' || mark.status === 'noted') ? loadImage(mark.photoUrl) : Promise.resolve(null);
    }));
    const { cell: size } = BINGO_GRID;
    board.cells.forEach((cell, i) => {
        const { x, y } = cellOrigin(i);
        ctx.save();
        ctx.beginPath(); ctx.roundRect(x, y, size, size, 28); ctx.clip();
        const photo = photos[i];
        if (photo) {
            const scale = Math.max(size / photo.naturalWidth, size / photo.naturalHeight);
            const w = photo.naturalWidth * scale, h = photo.naturalHeight * scale;
            ctx.drawImage(photo, x + (size - w) / 2, y + (size - h) / 2, w, h);
            ctx.fillStyle = 'rgba(0,0,0,.38)'; ctx.fillRect(x, y + size - 70, size, 70);
            ctx.fillStyle = '#fff'; ctx.font = `700 28px ${font}`; ctx.fillText(`✓ ${cell.title}`.slice(0, 11), x + 18, y + size - 24);
        } else {
            ctx.fillStyle = '#fff'; ctx.fillRect(x, y, size, size);
            ctx.fillStyle = colors.muted; ctx.font = `700 34px ${font}`;
            wrap(ctx, cell.title, x + 24, y + 70, size - 48, 44);
        }
        ctx.restore();
    });
    // 連成的線：從第一格中心畫到最後一格中心
    ctx.strokeStyle = colors.yellow; ctx.lineWidth = 22; ctx.lineCap = 'round';
    for (const line of board.lines) {
        const a = cellOrigin(line[0]!), b = cellOrigin(line[2]!);
        ctx.beginPath(); ctx.moveTo(a.x + size / 2, a.y + size / 2); ctx.lineTo(b.x + size / 2, b.y + size / 2); ctx.stroke();
    }
    ctx.fillStyle = colors.ink; ctx.font = `600 34px ${font}`;
    ctx.fillText(board.leaderboard.slice(0, 4).map(p => `${p.nickname} ${p.count} 格`).join('　'), 60, 1290);
    return canvas.toDataURL('image/jpeg', 0.9);
}

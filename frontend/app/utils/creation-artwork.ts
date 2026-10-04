import type { CreationWork } from '../data/creation';

/** A local template renderer for the demo, producing the same PNG for every action. */
export async function renderDemoArtwork(work: CreationWork, source: string): Promise<string> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const loaded = new Image();
    loaded.onload = () => resolve(loaded);
    loaded.onerror = () => reject(new Error('Cannot load the selected photo'));
    loaded.src = source;
  });
  const canvas = document.createElement('canvas');
  canvas.width = 1000; canvas.height = 800;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#f4f1e9'; ctx.fillRect(0, 0, 1000, 800);
  function frame(x: number, y: number, w: number, h: number, radius = 16) {
    ctx.beginPath(); ctx.roundRect(x, y, w, h, radius); ctx.fill();
  }
  function photo(x: number, y: number, w: number, h: number, radius = 12) {
    ctx.save(); ctx.beginPath(); ctx.roundRect(x, y, w, h, radius); ctx.clip();
    const sourceHeight = image.naturalHeight * (work.sourceCrop ? .67 : 1);
    const scale = Math.max(w / image.naturalWidth, h / sourceHeight);
    const sw = w / scale, sh = h / scale;
    ctx.drawImage(image, (image.naturalWidth - sw) / 2, (sourceHeight - sh) / 2, sw, sh, x, y, w, h);
    ctx.restore();
  }
  function label(text: string, x: number, y: number, size = 24, color = '#285565') {
    ctx.font = `600 ${size}px sans-serif`; ctx.fillStyle = color; ctx.fillText(text, x, y);
  }
  ctx.shadowColor = '#1c414329'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 12;
  if (work.styleId === 'ticket') {
    ctx.fillStyle = '#fff9e8'; frame(90, 180, 820, 420, 24);
    ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
    photo(115, 205, 480, 370);
    ctx.strokeStyle = '#b7a990'; ctx.setLineDash([8, 10]); ctx.beginPath(); ctx.moveTo(635, 195); ctx.lineTo(635, 585); ctx.stroke(); ctx.setLineDash([]);
    label('MEMORY', 670, 285, 28); label('PASS', 670, 325, 28);
    label(work.location.split(' · ')[0] || work.location, 670, 400, 22);
    label('CHICTRIP · 2026', 670, 445, 14, '#927753');
    ctx.fillStyle = '#285565'; for (let i = 0; i < 35; i++) ctx.fillRect(675 + i * 5, 490, i % 3 ? 2 : 4, 50);
  } else if (work.styleId === 'pin') {
    ctx.fillStyle = '#cfb46e'; frame(240, 120, 520, 540, 140);
    ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
    ctx.fillStyle = '#f7ecd6'; frame(256, 136, 488, 508, 126);
    photo(275, 156, 450, 380, 110);
    ctx.textAlign = 'center'; label(work.location.split(' · ')[0] || work.location, 500, 596, 28); ctx.textAlign = 'start';
  } else if (work.styleId === 'sticker') {
    for (const [x, y, w, h, rotation] of [[90, 115, 525, 370, -.055], [660, 160, 235, 230, .07], [190, 550, 300, 140, .06], [585, 465, 260, 230, -.07]]) {
      ctx.save(); ctx.translate(x!, y!); ctx.rotate(rotation!);
      ctx.fillStyle = '#fff'; frame(-12, -12, w! + 24, h! + 24, 22);
      ctx.shadowBlur = 0; ctx.shadowOffsetY = 0; photo(0, 0, w!, h!, 14); ctx.restore();
    }
    ctx.shadowBlur = 0; label('LITTLE PIECES OF A TRIP', 92, 65, 18, '#87754e');
  } else if (work.styleId === 'scene') {
    ctx.save(); ctx.translate(140, 105); ctx.transform(1, .12, -.16, 1, 0, 0);
    ctx.fillStyle = '#e5d8b9'; frame(-16, -16, 746, 525, 18);
    ctx.shadowBlur = 0; photo(0, 0, 714, 490); ctx.restore();
    ctx.fillStyle = '#81a58b'; frame(180, 660, 640, 34, 12);
    ctx.shadowBlur = 0; label('A LITTLE WORLD · CHICTRIP', 290, 740, 18);
  } else {
    ctx.fillStyle = '#fff'; frame(95, 75, 810, 650, 6);
    ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
    ctx.filter = work.styleId === 'photo' ? 'saturate(1.12) contrast(1.04)' : 'none';
    photo(120, 100, 760, 530, 2); ctx.filter = 'none';
    label(work.location, 130, 682, 22);
    if (work.styleId === 'companion') {
      ctx.fillStyle = '#efd25d'; frame(716, 455, 128, 130, 30);
      ctx.fillStyle = '#1398b8'; frame(704, 452, 34, 140, 18);
      ctx.fillStyle = '#fff'; frame(728, 480, 40, 48, 24); frame(774, 480, 40, 48, 24);
      ctx.fillStyle = '#273f43'; frame(751, 497, 12, 15, 8); frame(795, 497, 12, 15, 8);
      label('一起到這裡', 696, 624, 19);
    }
  }
  return canvas.toDataURL('image/png');
}

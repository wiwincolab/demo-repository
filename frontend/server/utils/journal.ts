import { hamming } from '../../app/utils/image-hash.ts';

// 共同遊記與每日卡片（social loop 的 ②：把旅行做成作品）。
// 「哪一天」照台北時間的上傳日期分：真的在旅行時，每天傳的照片自然落在那一天
export type PhotoTag = 'food' | 'scenery' | 'people' | 'other';

export const taipeiDate = (date: Date) => new Date(date.getTime() + 8 * 3600_000).toISOString().slice(0, 10);

// 同一天、指紋差不到 maxDistance 位元的視為重複（連拍、同一張傳兩次），只留第一張
export function dedupe<T extends { hash: string | null; day: string }>(photos: T[], maxDistance: number) {
    const kept: T[] = [];
    for (const photo of photos) {
        const duplicate = photo.hash && kept.some(other => other.day === photo.day && other.hash && hamming(other.hash, photo.hash!) <= maxDistance);
        if (!duplicate) kept.push(photo);
    }
    return { kept, hidden: photos.length - kept.length };
}

// 趣味統計：每個稱號給領先的人；沒人拍過那一類就不給
export function memberStats(photos: { owner: string; nickname: string | null; tag: PhotoTag | null }[], me: string) {
    const people = new Map<string, { nickname: string; me: boolean; photos: number; food: number; scenery: number; people: number }>();
    for (const photo of photos) {
        if (!people.has(photo.owner)) people.set(photo.owner, { nickname: photo.nickname || '旅伴', me: photo.owner === me, photos: 0, food: 0, scenery: 0, people: 0 });
        const person = people.get(photo.owner)!;
        person.photos++;
        if (photo.tag === 'food' || photo.tag === 'scenery' || photo.tag === 'people') person[photo.tag]++;
    }
    const members = [...people.values()].sort((a, b) => b.photos - a.photos || Number(b.me) - Number(a.me));
    const lead = (key: 'photos' | 'food' | 'scenery' | 'people') => [...members].sort((a, b) => b[key] - a[key])[0];
    const titles = ([['photos', '拍最多張'], ['food', '最愛拍食物'], ['scenery', '風景攝影師'], ['people', '人像擔當']] as const)
        .map(([key, title]) => ({ key, title, leader: lead(key) }))
        .filter(item => item.leader && item.leader[item.key] > 0)
        .map(item => ({ title: item.title, nickname: item.leader!.nickname, count: item.leader![item.key] }));
    return { members, titles };
}

export const tagPrompt = '這是一張旅行照片。判斷主角是哪一類：food（食物飲料）、scenery（風景建築街景）、people（人物合照自拍）、other（其他）。';
export const TAG_SCHEMA = { type: 'object', properties: { tag: { type: 'string', enum: ['food', 'scenery', 'people', 'other'] } }, required: ['tag'] };
export function parseTag(text: string): PhotoTag | null {
    try {
        const tag = JSON.parse(text)?.tag;
        return ['food', 'scenery', 'people', 'other'].includes(tag) ? tag : null;
    } catch { return null; }
}

// 每日卡片：從當天的照片（依序編號 0..n-1）挑出代表、食物、意外，各配一句
export function dailyPrompt(tripTitle: string, count: number) {
    return [
        `這是「${tripTitle.replace(/。$/, '')}」旅行中同一天拍的 ${count} 張照片，依序編號 0 到 ${count - 1}。`,
        '幫這一天做一張回憶卡：cover＝最能代表今天的一張；food＝最好吃的那一張食物照（沒有食物照就填 -1）；surprise＝最意外、最有故事的一張（沒有就填 -1，不要跟 cover 同一張）。',
        'title：今天的標題，繁體中文 12 字以內；三個 caption 各一句、20 字以內、像朋友聊天。只描述照片裡看得到的，不要評論人的外貌，不要編地名或日期。',
    ].join('\n');
}
export const DAILY_SCHEMA = {
    type: 'object',
    properties: { title: { type: 'string' }, cover: { type: 'integer' }, food: { type: 'integer' }, surprise: { type: 'integer' }, coverCaption: { type: 'string' }, foodCaption: { type: 'string' }, surpriseCaption: { type: 'string' } },
    required: ['title', 'cover', 'food', 'surprise', 'coverCaption', 'foodCaption', 'surpriseCaption'],
};
export interface DailyPicks { title: string; cover: number; food: number | null; surprise: number | null; coverCaption: string; foodCaption: string; surpriseCaption: string }

const short = (value: unknown, max: number) => typeof value === 'string' ? [...value.trim()].slice(0, max).join('') : '';
export function parsePicks(text: string, count: number): DailyPicks | null {
    let raw: Record<string, unknown>;
    try { raw = JSON.parse(text); } catch { return null; }
    const index = (value: unknown) => Number.isInteger(value) && (value as number) >= 0 && (value as number) < count ? value as number : null;
    const cover = index(raw.cover);
    if (cover === null) return null;
    const food = index(raw.food);
    const surprise = index(raw.surprise) === cover ? null : index(raw.surprise);
    return { title: short(raw.title, 14) || '今天的旅行', cover, food, surprise, coverCaption: short(raw.coverCaption, 24), foodCaption: food === null ? '' : short(raw.foodCaption, 24), surpriseCaption: surprise === null ? '' : short(raw.surpriseCaption, 24) };
}

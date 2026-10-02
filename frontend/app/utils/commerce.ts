import type { Member, Usage } from '../types/trip.ts';
export const plans = {
    light: { name: '每日 1GB 高速上網', price: 199, range: '2–4', desc: '共 5GB 高速額度 · 每日重置', reason: '導航與聊天為主，照片盡量回飯店再上傳。' },
    normal: { name: '每日 2GB 高速上網', price: 299, range: '5–8', desc: '共 10GB 高速額度 · 每日重置', reason: '照片上傳、導航與社群；住宿有 Wi-Fi。' },
    heavy: { name: '每日 5GB 高速上網', price: 499, range: '15–22', desc: '共 25GB 高速額度 · 每日重置', reason: '影片或熱點使用較多，仍需留意公平使用與熱點限制。' }
} satisfies Record<Usage, {
    name: string;
    price: number;
    range: string;
    desc: string;
    reason: string;
}>;
export function groupPrice(members: Member[]) {
    const buyers = members.filter(m => m.paid);
    const base = buyers.reduce((sum, m) => sum + m.price, 0);
    const saving = buyers.length >= 4 ? buyers.length * 20 : 0;
    return { count: buyers.length, base, saving, total: base - saving };
}
export function unusedChips(gb: number) { return Math.min(30, Math.max(0, Math.min(10, gb)) * 10); }
export function isMemberList(value: unknown): value is Member[] {
    return Array.isArray(value) && value.length >= 1 && value.length <= 8 &&
        value.every(m => typeof m?.name === 'string' && m.name.length <= 40 && typeof m.paid === 'boolean' && [199, 299, 499].includes(m.price));
}

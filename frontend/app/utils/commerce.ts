import type { Member } from '../types/trip.ts';
import { verifiedEsimPrices } from '../data/esim-catalog.ts';
export function groupPrice(members: Member[]) {
    const buyers = members.filter(m => m.paid);
    const base = buyers.reduce((sum, m) => sum + m.price, 0);
    const saving = buyers.length >= 4 ? buyers.length * 20 : 0;
    return { count: buyers.length, base, saving, total: base - saving };
}
export function unusedChips(gb: number) { return Math.min(30, Math.max(0, Math.min(10, gb)) * 10); }
export function isMemberList(value: unknown): value is Member[] {
    return Array.isArray(value) && value.length >= 1 && value.length <= 8 &&
        value.every(m => typeof m?.name === 'string' && m.name.length <= 40 && typeof m.paid === 'boolean' && [...verifiedEsimPrices, 199, 299, 499].includes(m.price));
}

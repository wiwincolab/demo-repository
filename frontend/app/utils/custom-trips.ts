import type { TripId, TripSummary, TripTransport } from '../data/trips.ts';
import type { TripDay } from '../types/trip.ts';
import type { PoiRegion } from '../types/poi.ts';

export const customTripsKey = 'chictrip-created-trips-v1';
export const transportLabels: Record<TripTransport, string> = { 'public-transit': '大眾運輸', driving: '開車', walking: '步行' };
export interface NewTripInput { title: string; startDate: string; endDate: string; transport: TripTransport }
export function dateDay(value: string): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return NaN;
  const stamp = Date.parse(value + 'T00:00:00Z');
  return Number.isFinite(stamp) && new Date(stamp).toISOString().slice(0, 10) === value ? stamp / 86400000 : NaN;
}
export function tripDates(startDate: string, endDate: string) {
  const dayCount = dateDay(endDate) - dateDay(startDate) + 1;
  return Number.isInteger(dayCount) && dayCount >= 1 && dayCount <= 30 ? dayCount : 0;
}
export function newTripError(input: NewTripInput): string {
  if (!input.title.trim()) return '請為這趟旅行取個名字。';
  if (input.title.trim().length > 60) return '行程名稱請在 60 字以內。';
  if (!Number.isFinite(dateDay(input.startDate)) || !Number.isFinite(dateDay(input.endDate))) return '請選擇有效的出發與結束日期。';
  if (input.endDate < input.startDate) return '結束日期不能早於出發日期。';
  if (!tripDates(input.startDate, input.endDate)) return '一次可建立 1 至 30 天的行程。';
  if (!Object.hasOwn(transportLabels, input.transport)) return '請選擇主要交通方式。';
  return '';
}
export function createCustomTrip(input: NewTripInput, region: PoiRegion, id: `custom-${string}`, cover: {src: string; source?: string; credit?: string}): TripSummary {
  const error = newTripError(input);
  if (error) throw new Error(error);
  if (!region.file || region.bbox.length !== 4 || !region.bbox.every(Number.isFinite)) throw new Error('請選擇旅遊地區。');
  const [w, s, e, n] = region.bbox as [number, number, number, number];
  return {
    id, title: input.title.trim(), location: region.name,
    country: region.country === 'KR' ? 'korea' : region.country === 'TW' ? 'taiwan' : 'japan',
    startDate: input.startDate, endDate: input.endDate, dayCount: tripDates(input.startDate, input.endDate),
    dateLabel: input.startDate.replaceAll('-', '.') + ' — ' + input.endDate.replaceAll('-', '.'),
    status: 'draft', statusLabel: '規劃中', companions: [],
    cover: cover.src, coverSource: cover.source, coverCredit: cover.credit,
    summary: `${region.name}，從第一個景點開始安排。`, english: region.country + ' / MY JOURNEY',
    transport: input.transport, destination: {regionId: region.id, center: [(w + e) / 2, (s + n) / 2], bounds: [...region.bbox]},
  };
}
export function emptyTripDays(trip: TripSummary): TripDay[] {
  return Array.from({length: trip.dayCount}, (_, i) => ({area: `${trip.location} · 第 ${i + 1} 天`, english: trip.english, transport: `主要交通：${transportLabels[trip.transport || 'public-transit']}`, stops: []}));
}
export function restoreCustomTrips(value: unknown): TripSummary[] {
  if (!Array.isArray(value)) return [];
  const ids = new Set<TripId>();
  return value.filter((t): t is TripSummary => {
    if (!t || typeof t !== 'object' || typeof t.id !== 'string' || !/^custom-[a-zA-Z0-9-]{8,80}$/.test(t.id) || ids.has(t.id)) return false;
    if (typeof t.title !== 'string' || typeof t.startDate !== 'string' || typeof t.endDate !== 'string' || newTripError(t) || t.dayCount !== tripDates(t.startDate, t.endDate)) return false;
    if (!['japan', 'korea', 'taiwan'].includes(t.country) || typeof t.location !== 'string' || !t.location || typeof t.english !== 'string' || !Array.isArray(t.companions) || t.companions.length) return false;
    const d = t.destination, prefix = {japan: 'jp-', korea: 'kr-', taiwan: 'tw-'}[t.country as 'japan' | 'korea' | 'taiwan'];
    if (!d || typeof d.regionId !== 'string' || !d.regionId.startsWith(prefix) || !Array.isArray(d.bounds) || d.bounds.length !== 4 || !d.bounds.every(Number.isFinite) || d.bounds[0] >= d.bounds[2] || d.bounds[1] >= d.bounds[3]) return false;
    if (!Array.isArray(d.center) || d.center.length !== 2 || !d.center.every(Number.isFinite) || d.center[0] < d.bounds[0] || d.center[0] > d.bounds[2] || d.center[1] < d.bounds[1] || d.center[1] > d.bounds[3]) return false;
    if (typeof t.cover !== 'string' || !/^(?:assets\/|poi\/|https?:\/\/)/.test(t.cover) || t.cover.length > 2048) return false;
    ids.add(t.id); return true;
  }).slice(0, 100).map(t => ({...t, status: 'draft', statusLabel: '規劃中'}));
}

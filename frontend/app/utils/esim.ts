import type { TripDay, Usage } from '../types/trip.ts';
import { unusedChips } from './commerce.ts';
import { officialEsimPlans, esimPriceSource } from '../data/esim-catalog.ts';

export const usageOptions = [
  { value: 'light' as Usage, title: '導航、傳訊息', detail: '照片回飯店再傳', range: '輕量使用' },
  { value: 'normal' as Usage, title: '拍照、滑社群', detail: '隨手上傳照片與限動', range: '日常使用' },
  { value: 'heavy' as Usage, title: '追影片、開熱點', detail: '影音或分享網路給其他裝置', range: '大量使用' },
];
export function esimPlan(usage: Usage, dayCount: number) {
  const tripDays = Math.max(1, dayCount);
  const days: 3|5 = tripDays <= 3 ? 3 : 5;
  const offer = officialEsimPlans[usage];
  const [low, high] = { light: [.4, .8], normal: [1, 1.6], heavy: [3, 4.4] }[usage];
  return { ...offer, days, tripDays, price: offer.prices[days], originalPrice: offer.original[days],
    available: tripDays <= 5, totalGB: offer.dailyGB * tripDays,
    low: Math.ceil(low! * tripDays), high: Math.ceil(high! * tripDays),
    range: `${Math.ceil(low! * tripDays)}–${Math.ceil(high! * tripDays)}`,
    desc: offer.unlimited ? '每日 10GB 高速，用盡後降至 256kbps；隔日重置' : '每日額度重置，用盡後降速；流量不跨日累積',
    source: offer.unlimited ? esimPriceSource.unlimited : esimPriceSource.daily,
  };
}
export function stopEstimates(days: TripDay[], usage: Usage) {
  const factor = { light: .7, normal: 1, heavy: 1.6 }[usage];
  return days.map(day => ({ ...day, stops: day.stops.map(stop => ({ ...stop,
    estimate: stop.range.map(value => Math.round(value * factor)),
  })) }));
}
export function esimQuote(price: number, buyers: number, alreadyPaid = false) {
  const countAfterPurchase = buyers + (alreadyPaid ? 0 : 1);
  const discount = countAfterPurchase >= 4 ? 20 : 0;
  return { discount, total: price - discount, countAfterPurchase };
}
export function rewardPreview(totalGB: number) {
  // Fixed demonstration settlement, deliberately separate from pre-trip estimates.
  const remainingGB = Math.round(totalGB * .26 * 10) / 10;
  return { remainingGB, usedGB: Math.round((totalGB - remainingGB) * 10) / 10, points: Math.floor(unusedChips(remainingGB)) };
}

import type { TripDay, Usage } from '../types/trip.ts';
import { plans, unusedChips } from './commerce.ts';

export const usageOptions = [
  { value: 'light' as Usage, title: '導航、傳訊息', detail: '照片回飯店再傳', range: '輕量使用' },
  { value: 'normal' as Usage, title: '拍照、滑社群', detail: '隨手上傳照片與限動', range: '日常使用' },
  { value: 'heavy' as Usage, title: '追影片、開熱點', detail: '影音或分享網路給其他裝置', range: '大量使用' },
];
export function esimPlan(usage: Usage, dayCount: number) {
  const days = Math.max(1, dayCount);
  const capacity = { light: 1, normal: 2, heavy: 5 }[usage] * days;
  const [low, high] = { light: [.4, .8], normal: [1, 1.6], heavy: [3, 4.4] }[usage];
  return { ...plans[usage], days, totalGB: capacity, low: Math.ceil(low! * days), high: Math.ceil(high! * days),
    name: `${capacity}GB 旅程總量`, range: `${Math.ceil(low! * days)}–${Math.ceil(high! * days)}`,
    desc: `${days} 天內彈性使用，不每日歸零` };
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

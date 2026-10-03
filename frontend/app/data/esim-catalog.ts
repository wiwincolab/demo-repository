import type { Usage } from '../types/trip.ts';

// Manually verified in the official product selector, not extrapolated per-day prices.
export const esimPriceSource = {
  checkedAt: '2026-10-03', carrier: 'Docomo (IIJ)', network: '4G',
  daily: 'https://www.chictrip.com.tw/esim/japan/daily-data',
  unlimited: 'https://www.chictrip.com.tw/esim/japan/unlimited',
};
export const officialEsimPlans = {
  light: { label: '輕度', name: '每日 1GB', dailyGB: 1, unlimited: false, prices: { 3: 81, 5: 123 }, original: { 3: 95, 5: 145 }, reason: '導航、查店家與傳訊息，照片回飯店再上傳。' },
  normal: { label: '中度', name: '每日 2GB', dailyGB: 2, unlimited: false, prices: { 3: 130, 5: 208 }, original: { 3: 153, 5: 245 }, reason: '途中上傳照片、使用社群，偶爾看短影片。' },
  heavy: { label: '重度', name: '標準吃到飽', dailyGB: 10, unlimited: true, prices: { 3: 246, 5: 395 }, original: { 3: 289, 5: 465 }, reason: '長時間影音或分享熱點，保留較多高速流量。' },
} satisfies Record<Usage, { label: string; name: string; dailyGB: number; unlimited: boolean; prices: Record<3|5,number>; original: Record<3|5,number>; reason: string }>;

export const verifiedEsimPrices = Object.values(officialEsimPlans).flatMap(p => Object.values(p.prices));

import type { TripId } from '../data/trips.ts';
import type { Usage } from '../types/trip.ts';

// 送 eSIM 給朋友（frontend/server/api/gifts）。只有 GCP 版有；真的開通要去趣的系統，這裡到「領取＋示範 QR」為止
export interface Gift { id: string; url: string; tripId: TripId; tripTitle: string; usage: Usage; sender: string; mine: boolean; claimed: boolean; claimedByMe: boolean; claimedBy: string | null; claimedAt: string | null; canClaim: boolean; createdAt: string }

export const sendGift = (tripId: TripId, usage: Usage) => $fetch<Gift>('/api/gifts', { method: 'POST', body: { tripId, usage } });
export const listSentGifts = (tripId: TripId) => $fetch<Gift[]>('/api/gifts', { query: { tripId } });
export const claimGift = (id: string) => $fetch<Gift>(`/api/gifts/${id}/claim`, { method: 'POST' });

// 示範用的安裝碼：長得像 eSIM 的 LPA 字串，但伺服器位址是不存在的 example，掃了也裝不起來
export const demoActivationCode = (id: string) => `LPA:1$demo.esim.example$CHICTRIP-DEMO-${id.toUpperCase()}`;

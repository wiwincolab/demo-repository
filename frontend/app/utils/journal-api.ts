import type { TripId } from '../data/trips.ts';

// 共同遊記與每日卡片（frontend/server/api/journal）。只有 GCP 版有後端
export interface DailyPicks { title: string; cover: number; food: number | null; surprise: number | null; coverCaption: string; foodCaption: string; surpriseCaption: string }
export interface JournalItem { id: string; url: string; title: string; tag: 'food' | 'scenery' | 'people' | 'other' | null; nickname: string; me: boolean }
export interface DailyCard { id: string; day: string; status: 'queued' | 'done' | 'fallback'; mediaIds: string[]; picks: DailyPicks | null }
export interface JournalDay { day: string; items: JournalItem[]; card: DailyCard | null }
export interface Journal {
    days: JournalDay[];
    hidden: number;
    stats: { members: { nickname: string; me: boolean; photos: number; food: number; scenery: number; people: number }[]; titles: { title: string; nickname: string; count: number }[] };
}

export const getJournal = (tripId: TripId) => $fetch<Journal>('/api/journal', { query: { tripId } });
export const makeDailyCard = (tripId: TripId, day: string) => $fetch<{ id: string; status: string }>(`/api/journal/days/${day}`, { method: 'POST', body: { tripId } });

// 卡片挑到的照片（picks 的編號對到 mediaIds）
export const pickedUrl = (card: DailyCard, index: number | null) => index === null || !card.mediaIds[index] ? null : `/api/media/${card.mediaIds[index]}`;
export const dayLabel = (day: string) => { const [, m, d] = day.split('-'); return `${Number(m)} 月 ${Number(d)} 日`; };

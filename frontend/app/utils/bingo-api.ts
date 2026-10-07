import type { TripId } from '../data/trips.ts';

// 旅行 Bingo（frontend/server/api/bingo）。只有 GCP 版有後端；Pages 版的 Bingo 頁只顯示說明
export type MarkStatus = 'checking' | 'pass' | 'fail' | 'noted';
export interface BingoMark { nickname: string; me: boolean; status: MarkStatus; comment: string; photoUrl: string }
export interface BingoCell { index: number; title: string; hint: string; anywhere: boolean; done: boolean; marks: BingoMark[] }
export interface BingoBoard { id: string; tripId: TripId; source: string; cells: BingoCell[]; lines: number[][]; leaderboard: { nickname: string; me: boolean; count: number }[] }

export const openBoard = (tripId: TripId) => $fetch<BingoBoard>('/api/bingo', { method: 'POST', body: { tripId } });
export const getBoard = (id: string) => $fetch<BingoBoard>(`/api/bingo/${id}`);
export const submitCell = (id: string, cell: number, photo: Blob) =>
    $fetch<BingoBoard>(`/api/bingo/${id}/cells/${cell}`, { method: 'POST', body: photo, headers: { 'Content-Type': 'image/jpeg' } });

// 這一格要秀的照片：先找通過的（自己的優先），再找判斷中的
export function cellPhoto(cell: BingoCell) {
    const ranked = [...cell.marks].sort((a, b) => score(b) - score(a));
    return ranked[0];
}
const score = (mark: BingoMark) => (mark.status === 'pass' || mark.status === 'noted' ? 4 : mark.status === 'checking' ? 2 : 0) + (mark.me ? 1 : 0);

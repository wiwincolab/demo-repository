import type { TripId } from '../data/trips.ts';
import type { Usage } from '../types/trip.ts';

// 真的旅伴群組（frontend/server/api/groups）。只有 GCP 版有；Pages 版維持「模擬一位朋友加入」
export interface GroupMember { nickname: string; mascotId?: string | null; paid: boolean; usage: Usage | null; me: boolean; owner: boolean }
export interface GroupSummary { id: string; url: string; tripId: TripId; tripTitle: string; ownerNickname: string; members: GroupMember[] }

export const getMyGroup = (tripId: TripId) => $fetch<GroupSummary | null>('/api/groups/mine', { query: { tripId } });
export const ensureGroup = (tripId: TripId) => $fetch<GroupSummary>('/api/groups', { method: 'POST', body: { tripId } });
export const getGroup = (id: string) => $fetch<GroupSummary>(`/api/groups/${id}`);
export const joinGroup = (id: string) => $fetch<GroupSummary>(`/api/groups/${id}/join`, { method: 'POST' });
export const buyInGroup = (id: string, usage: Usage) => $fetch<GroupSummary>(`/api/groups/${id}/buy`, { method: 'POST', body: { usage } });

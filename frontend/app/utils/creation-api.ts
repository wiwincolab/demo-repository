import { photoById, workForPhoto, type CreationId, type CreationPhoto, type CreationWork } from '../data/creation.ts';
import type { TripId } from '../data/trips.ts';

// AI 創作的後端（frontend/server/api）。只有 GCP 版有後端；GitHub Pages 版打不到，useApi() 偵測後整套維持原本的模擬
export type CreationStatus = 'queued' | 'running' | 'done' | 'fallback';
export interface ServerPhoto { id: string; url: string; tripId: TripId; title: string; location: string; demoPhotoId: string | null; width: number | null; height: number | null; createdAt: string }
export interface ServerCreation { id: string; tripId: TripId; styleId: CreationId; photoId: string | null; demoPhotoId: string | null; location: string; status: CreationStatus; imageUrl: string | null; createdAt: string }
interface CreationProgress { id: string; status: CreationStatus; imageUrl: string | null; position: number | null }

export function statusText(status: CreationStatus, position?: number | null) {
    if (status === 'queued') return position ? `排隊中，前面還有 ${position} 件` : '下一件就輪到你';
    return 'AI 正在製作…';
}

// 上傳的照片沿用它取自的示範照片的風格與裁切（「也可以先試試這些照片」挑的那張）
export function photoFromServer(photo: ServerPhoto): CreationPhoto {
    const template = photoById(photo.demoPhotoId ?? undefined);
    return { id: photo.id, tripId: photo.tripId, title: photo.title, location: photo.location, source: photo.url, styles: template ? [...template.styles] : [], sourceCrop: template?.sourceCrop, demoPhotoId: photo.demoPhotoId ?? undefined };
}

// 資料表的一筆作品 → 畫面用的作品。還在排隊的不算（頁面另外輪詢），找不到原照的也先不顯示
export function workFromServer(creation: ServerCreation, findUploaded: (id: string) => CreationPhoto | undefined): CreationWork | null {
    if (creation.status !== 'done' && creation.status !== 'fallback') return null;
    const photo = creation.photoId ? findUploaded(creation.photoId) : photoById(creation.demoPhotoId ?? undefined);
    if (!photo) return null;
    const work: CreationWork = { ...workForPhoto(photo, creation.styleId), id: `server-${creation.id}`, tripId: creation.tripId, createdAt: creation.createdAt, serverId: creation.id };
    if (creation.status === 'done' && creation.imageUrl) return { ...work, renderedImage: creation.imageUrl, preset: false };
    return { ...work, fallback: true };
}

export const uploadPhoto = (tripId: TripId, blob: Blob, meta: { title: string; location: string; demoPhotoId?: string; width: number; height: number }) =>
    $fetch<ServerPhoto>('/api/photos', { method: 'POST', query: { tripId, ...meta }, body: blob, headers: { 'Content-Type': 'image/jpeg' } });
export const listPhotos = (tripId: TripId) => $fetch<ServerPhoto[]>('/api/photos', { query: { tripId } });
export const listCreations = (tripId: TripId) => $fetch<ServerCreation[]>('/api/creations', { query: { tripId } });
export const requestCreation = (body: { tripId: TripId; styleId: CreationId; photoId?: string; demoPhotoId?: string }) =>
    $fetch<{ id: string; status: CreationStatus }>('/api/creations', { method: 'POST', body });

// 每 2 秒問一次，直到做好或退回。伺服器排隊超過 5 分鐘一定回 fallback，所以不會無限等；
// 連續三次連不上就當作退回，評審不會卡在轉圈
export async function pollCreation(id: string, onStatus: (status: CreationStatus, position: number | null) => void, cancelled: () => boolean): Promise<CreationProgress> {
    let failures = 0;
    for (;;) {
        try {
            const progress = await $fetch<CreationProgress>(`/api/creations/${id}`);
            failures = 0;
            if (progress.status === 'done' || progress.status === 'fallback' || cancelled()) return progress;
            onStatus(progress.status, progress.position);
        } catch {
            if (++failures >= 3) return { id, status: 'fallback', imageUrl: null, position: null };
        }
        if (cancelled()) return { id, status: 'fallback', imageUrl: null, position: null };
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
}

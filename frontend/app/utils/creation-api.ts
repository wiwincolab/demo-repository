import { photoById, type CreationPhoto } from '../data/creation.ts';
import type { TripId } from '../data/trips.ts';

// AI 創作的後端（frontend/server/api）只存照片：作品一律是預製圖或手機上合成的示範圖，不在伺服器生成。
// 只有 GCP 版有後端；GitHub Pages 版打不到，useApi() 偵測後照片只留在這支手機
export interface ServerPhoto { id: string; url: string; tripId: TripId; title: string; location: string; demoPhotoId: string | null; stopId: string | null; width: number | null; height: number | null; createdAt: string }

// 上傳的照片沿用它取自的示範照片的風格與裁切（「也可以先試試這些照片」挑的那張）
export function photoFromServer(photo: ServerPhoto): CreationPhoto {
    const template = photoById(photo.demoPhotoId ?? undefined);
    return { id: photo.id, tripId: photo.tripId, title: photo.title, location: photo.location, source: photo.url, styles: template ? [...template.styles] : [], sourceCrop: template?.sourceCrop, demoPhotoId: photo.demoPhotoId ?? undefined, stopId: photo.stopId ?? undefined };
}

export const uploadPhoto = (tripId: TripId, blob: Blob, meta: { title: string; location: string; demoPhotoId?: string; stopId?: string; width: number; height: number; hash?: string }) =>
    $fetch<ServerPhoto>('/api/photos', { method: 'POST', query: { tripId, ...meta }, body: blob, headers: { 'Content-Type': 'image/jpeg' } });
export const listPhotos = (tripId: TripId) => $fetch<ServerPhoto[]>('/api/photos', { query: { tripId } });

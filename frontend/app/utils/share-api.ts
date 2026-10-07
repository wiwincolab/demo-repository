import type { TripId } from '../data/trips.ts';

// 分享循環的後端（frontend/server/api/shares 等）。只有 GCP 版有；Pages 版不會呼叫到這裡（useApi 判斷）
export interface PublicStop { id: number; day: number; name: string; short: string; at: number[]; photo: string }
export interface PublicShare { id: string; kind: 'creation' | 'trip'; tripId: TripId; tripTitle: string; nickname: string; location: string; styleId: string | null; caption: string; imageUrl: string | null; stops: PublicStop[]; createdAt: string }
export interface SavedTrip { shareId: string; stopIds: number[]; title: string; from: string }

export const getMe = () => $fetch<{ nickname: string | null }>('/api/me');
export const setNickname = (nickname: string) => $fetch<{ nickname: string }>('/api/me', { method: 'PUT', body: { nickname } });
export const requestCaption = (body: { location: string; styleId?: string }) => $fetch<{ caption: string; ai: boolean }>('/api/captions', { method: 'POST', body });
export const createShare = (body: { kind: 'creation' | 'trip'; tripId: TripId; styleId?: string; location: string; stopIds: number[]; caption: string }) =>
    $fetch<{ id: string; url: string }>('/api/shares', { method: 'POST', body });
export const uploadShareImage = (id: string, blob: Blob) => $fetch<{ imageUrl: string }>(`/api/shares/${id}/image`, { method: 'PUT', body: blob, headers: { 'Content-Type': blob.type || 'image/png' } });
export const getShare = (id: string) => $fetch<PublicShare>(`/api/shares/${id}`);
export const shareEvent = (id: string, event: 'view' | 'create') => $fetch(`/api/shares/${id}/events`, { method: 'POST', body: { event } });
export const saveShare = (id: string, title?: string) => $fetch<{ tripId: TripId; title: string }>(`/api/shares/${id}/save`, { method: 'POST', body: { title } });
export const getSavedTrip = (tripId: TripId) => $fetch<SavedTrip | null>('/api/saved-trips', { query: { tripId } });

// 作品可能是伺服器上的圖、網站內建素材或手機上合成的 data URL，一律讀成 Blob 再上傳
export const blobFrom = async (src: string) => (await fetch(src)).blob();

// 手機叫出系統分享選單（IG、LINE、Threads 都在裡面）；不支援分享檔案的瀏覽器改成下載圖卡＋複製文字與連結
export async function shareStory(card: Blob, text: string, url: string): Promise<'shared' | 'saved' | 'cancelled'> {
    const file = new File([card], 'chictrip-story.png', { type: 'image/png' });
    if (navigator.canShare?.({ files: [file] })) {
        try {
            await navigator.share({ files: [file], text: `${text}\n${url}` });
            return 'shared';
        } catch (error) {
            if ((error as DOMException).name === 'AbortError') return 'cancelled';
        }
    }
    const link = document.createElement('a');
    link.href = URL.createObjectURL(card);
    link.download = 'chictrip-story.png';
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 10_000);
    try { await navigator.clipboard.writeText(`${text}\n${url}`); } catch { /* 沒有剪貼簿權限：畫面上的連結可以手動複製 */ }
    return 'saved';
}

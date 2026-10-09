import { tripSummaries, type TripId } from '../../app/data/trips.ts';

// 以共用行程目錄驗證行程；上傳的照片與作品掛在對應行程
export const isTripId = (value: unknown): value is TripId => tripSummaries.some(trip => trip.id === value);

import { tripSummaries, type TripId } from '../../app/data/trips.ts';

// 以共用行程目錄驗證行程；上傳的照片與作品掛在對應行程
export const isTripId = (value: unknown): value is TripId => tripSummaries.some(trip => trip.id === value);

// 票根上的日期只能用真的有的資料（memory-formats.json 的票根規則），這裡是行程出發日
export const tripStartDate = (id: TripId) => tripSummaries.find(trip => trip.id === id)!.startDate;

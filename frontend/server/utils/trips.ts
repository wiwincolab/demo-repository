import { tripSummaries, type TripId } from '../../app/data/trips.ts';

// 目前只有三趟示範行程（東京、關西、富士山）；評審上傳的照片與作品都掛在其中一趟
export const isTripId = (value: unknown): value is TripId => tripSummaries.some(trip => trip.id === value);

// 票根上的日期只能用真的有的資料（memory-formats.json 的票根規則），這裡是行程出發日
export const tripStartDate = (id: TripId) => tripSummaries.find(trip => trip.id === id)!.startDate;

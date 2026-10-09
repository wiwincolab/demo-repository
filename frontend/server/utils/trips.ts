import { tripSummaries, type TripId } from '../../app/data/trips.ts';

// 目前只有三趟示範行程（東京、關西、富士山）；評審上傳的照片與作品都掛在其中一趟
export const isTripId = (value: unknown): value is TripId => tripSummaries.some(trip => trip.id === value);

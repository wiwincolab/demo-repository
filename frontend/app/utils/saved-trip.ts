import { tripItineraries, type TripId } from '../data/trips.ts';
import type { TripDay } from '../types/trip.ts';

// 從朋友的分享存下來的行程：只留朋友公開的景點，依原本的天數與順序；整天都沒留到的那天拿掉
export function savedDays(tripId: TripId, stopIds: number[]): TripDay[] {
    const keep = new Set(stopIds);
    return structuredClone(tripItineraries[tripId])
        .map(day => ({ ...day, stops: day.stops.filter(stop => keep.has(stop.id)) }))
        .filter(day => day.stops.length > 0);
}

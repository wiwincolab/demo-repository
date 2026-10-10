import type { Stop, TripDay } from '../types/trip';
import photos from './stop-photos.json' with { type: 'json' };

/** 依旅行社團體行程改編的經典路線；由 trips.ts 整合進主頁，時刻與車程為規劃估算。 */
export type ClassicCountry = 'japan' | 'korea' | 'taiwan';
export interface ClassicRoute {
  id: string; country: ClassicCountry; region: string; title: string; english: string;
  dayCount: number; summary: string;
  reference: { name: string; url: string; note: string };
  days: TripDay[];
}

/** 同一景點的去程／返程共用實景照片；新景點需先補入照片及來源。 */
export function stopPhoto(place: string, routeSource: string): Stop['photo'] {
  const name = place.replace(/・返程$/, '');
  const photo = (photos as Record<string, Stop['photo']>)[name];
  if (!photo) throw new Error(`Missing itinerary photo: ${place} (${routeSource})`);
  return { ...photo, alt: `${place}實景` };
}

export function stopsFrom(source: string) {
  return (id: number, day: number, name: string, at: [number, number], time: string, stay: string, note: string, transit: string, range = [40, 90]): Stop =>
    ({ id, day, name, short: name, at, time, stay, note, transit, range, photo: stopPhoto(name, source) });
}

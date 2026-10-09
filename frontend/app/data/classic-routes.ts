import type { Stop, TripDay } from '../types/trip';

/** 依旅行社團體行程改編的經典路線；由 trips.ts 整合進主頁，時刻與車程為規劃估算。 */
export type ClassicCountry = 'japan' | 'korea' | 'taiwan';
export interface ClassicRoute {
  id: string; country: ClassicCountry; region: string; title: string; english: string;
  dayCount: number; summary: string;
  reference: { name: string; url: string; note: string };
  days: TripDay[];
}

/** 照片尚未挑選：app 暫用明示的路線示意圖，實景照片待挑選，source 先指向改編的原行程。 */
export const pendingPhoto = (place: string, source: string): Stop['photo'] => ({
  src: '', alt: `${place}實景`, source, credit: '照片待補', license: '', licenseUrl: '', objectPosition: '50% 50%',
});

export function stopsFrom(source: string) {
  return (id: number, day: number, name: string, at: [number, number], time: string, stay: string, note: string, transit: string, range = [40, 90]): Stop =>
    ({ id, day, name, short: name, at, time, stay, note, transit, range, photo: pendingPhoto(name, source) });
}

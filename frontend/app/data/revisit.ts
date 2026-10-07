import { buildRecapStops, photoForStop, type RecapStop } from './recap.ts';
import { journeyStops, type JourneyState } from './journey.ts';
import { tripSummaries, tripItineraries, type TripId } from './trips.ts';
import type { CreationWork } from './creation.ts';
import { lastYearStops } from './revisit-history.ts';
import { reserveSouvenirs } from './revisit-souvenirs.ts';
import type { StickerKit } from './creation-motifs';

export type RevisitScope = 'kansai' | 'fuji' | 'year' | 'last-year';
export type RevisitVehicle = 'plane' | 'bus' | 'train-front' | 'car-taxi-front' | 'tram-front';
export interface RevisitStop extends Omit<RecapStop, 'tripId'> {
  tripId: TripId | 'last-year';
  coords: [number, number];
  bearing: number;
  zoom: number;
  short: string;
  sticker?: CreationWork;
  sourceNote?: string;
  souvenirs: RevisitSouvenir[];
  groupId?: string;
  groupLabel?: string;
  english?: string;
  transport?: { vehicle: RevisitVehicle; label: string };
  /** The trip photo a visitor can turn into their own souvenir of this stop. */
  photoId?: string;
}
export interface RevisitSouvenir {
  id: string; kind: 'sticker' | 'pin' | 'ticket'; title: string; image: string;
  x: number; y: number; demo: boolean;
  kit?: StickerKit;
}
/** Explicit presentation fixtures. These never write to a visitor's saved collection. */
const demoSouvenirs: Record<string, RevisitSouvenir> = {
  nara: { id:'demo-nara-sticker',kind:'sticker',title:'小鹿，靠得好近',image:'assets/memory/journey/nara-sticker.png',x:40,y:49,demo:true },
  kyoto: { id:'demo-kiyomizu-pin',kind:'pin',title:'清水舞台的綠意',image:'assets/memory/revisit/kiyomizu-pin.png',x:72,y:61,demo:true },
  'fuji-blue': { id:'demo-fuji-ticket',kind:'ticket',title:'富士山的藍調時刻',image:'assets/memory/fuji-ticket.png',x:51,y:39,demo:true },
};
export const revisitScopes = [
  { id: 'kansai' as const, title: '關西，和朋友一起。', label: '關西旅行', subtitle: '2026.04.03 — 04.07', english: 'KANSAI, JAPAN' },
  { id: 'fuji' as const, title: '富士山，藍調時刻。', label: '富士山旅行', subtitle: '2026.02.14 — 02.15', english: 'FUJI, JAPAN' },
  { id: 'year' as const, title: '今年的旅遊回憶', label: '今年的旅遊回憶', subtitle: '2026 · 富士山與關西，兩趟旅行', english: 'YOUR YEAR IN PLACES' },
  { id: 'last-year' as const, title: '去年旅行重遊', label: '去年旅行重遊 · 2025', subtitle: '2025.04.03 — 04.14 · 大阪、首爾與香港', english: 'YOUR 2025 IN PLACES' },
];
export interface RevisitLeg {
  vehicle: RevisitVehicle | null; label: string; chapter: boolean;
  from: [number, number]; to: [number, number];
}
export function revisitLeg(target: RevisitStop, previous?: RevisitStop): RevisitLeg | null {
  if (previous?.id === target.id) return null;
  if (target.tripId === 'last-year') return {
    vehicle: previous ? target.transport?.vehicle || 'train-front' : 'plane',
    from: previous?.coords || [121.2328,25.0797], to: target.coords, chapter:false,
    label: !previous ? `台灣 → ${target.groupLabel} · 飛機` : target.transport?.vehicle === 'plane'
      ? `${previous.groupLabel} → ${target.groupLabel} · 飛機`
      : `${target.transport?.label || '市內交通'} · ${previous.short} → ${target.short}`,
  };
  if(previous && previous.tripId !== target.tripId)return {
    vehicle:null,from:previous.coords,to:target.coords,chapter:true,
    label:`${previous.date.slice(5,7)} 月 → ${target.date.slice(5,7)} 月 · 另一趟旅行`,
  };
  if (!previous) return {
    vehicle:'plane', from:[121.2328,25.0797],
    to:target.tripId==='kansai'?[135.244,34.435]:[139.7798,35.5494],
    label:target.tripId==='kansai'?'桃園 → 關西空港 · 再轉車前往景點':'桃園 → 東京羽田 · 再轉車前往富士山',
    chapter:false,
  };
  return {vehicle:target.id==='usj'?'train-front':'bus',from:previous.coords,to:target.coords,
    label:target.id==='usj'?'JR 電車 · 大阪市區 → 環球影城':`旅行專車 · ${previous.short} → ${target.short}`,chapter:false};
}
export function revisitScope(value: unknown): RevisitScope {
  return value === 'fuji' || value === 'year' || value === 'last-year' ? value : 'kansai';
}
const views: Record<string, [number, number]> = {
  kobe: [16.1, -28], amanohashidate: [13.3, 25], ine: [15.5, -30],
  kyoto: [16.3, 32], nara: [15.5, -18], dotonbori: [16.8, -28], usj: [16.1, 30], 'fuji-blue': [13.2, -15],
};
export function buildRevisitStops(scope: RevisitScope, works: CreationWork[], state: JourneyState, demo = false): RevisitStop[] {
  if (scope === 'last-year') return lastYearStops().map(stop=>({...stop,souvenirs:demo?reserveSouvenirs(stop.source):[]}));
  const ids: TripId[] = scope === 'year'
    ? tripSummaries.filter(trip => trip.status === 'completed' && trip.startDate.startsWith('2026')).map(trip => trip.id)
    : [scope];
  return buildRecapStops(ids, works, state).map(stop => {
    const place = journeyStops.find(item => item.id === stop.id);
    const view = views[stop.id] || [15.5, 0];
    const fixture = demoSouvenirs[stop.id];
    const saved = fixture && stop.works.find(work => work.styleId === fixture.kind);
    // AI or locally rendered works keep the photo in `image`; what the visitor made is `renderedImage`.
    const workImage = (work: CreationWork) => work.renderedImage || `assets/memory/${work.image}`;
    const primary: RevisitSouvenir[] = fixture && (saved || demo)
      ? [{ ...fixture, ...(saved ? { id:saved.id, image:workImage(saved), demo:false } : {}) }] : [];
    for(const work of stop.works){
      if(!['sticker','pin','ticket'].includes(work.styleId)||primary.some(item=>item.kind===work.styleId))continue;
      primary.push({id:work.id,kind:work.styleId as RevisitSouvenir['kind'],title:work.title,image:workImage(work),x:30,y:70,demo:false});
    }
    const souvenirs=[...primary,...(demo?reserveSouvenirs(stop.source).filter(item=>!primary.some(existing=>existing.kind===item.kind)):[])];
    return {
      ...stop, coords: place?.coords || tripItineraries.fuji[0]!.stops[1]!.at as [number, number],
      short: place?.short || '富士山', zoom: view[0]!, bearing: view[1]!,
      caption: stop.id === 'nara' ? '在公園裡停下來，看鹿慢慢走過。' : stop.id === 'usj'
        ? '蘑菇餐廳、城堡和山丘，都留在這張照片裡。' : stop.caption,
      // A preset asset is not evidence that this user has collected it.
      sticker: stop.id === 'nara' ? stop.works.find(work => work.styleId === 'sticker') : undefined,
      sourceNote: stop.id === 'nara' ? '奈良 AI 示範照片' : stop.id === 'fuji-blue' ? '富士山示範影像 · 位置為周邊示意' : undefined,
      souvenirs, photoId: photoForStop(stop.id),
    };
  });
}

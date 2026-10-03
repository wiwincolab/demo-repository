import original from './content.json' with { type: 'json' };
import { kansaiDays, kansaiRainAlternative } from './kansai.ts';
import type { Stop, TripDay } from '../types/trip';

export type TripId = 'tokyo' | 'kansai' | 'fuji';
export interface TripSummary {
  id: TripId; title: string; location: string; dateLabel: string; startDate: string;
  status: 'upcoming' | 'completed'; statusLabel: string; cover: string;
  companions: string[]; dayCount: number; summary: string; english: string;
}
export const tripSummaries: TripSummary[] = [
  { id:'tokyo',title:'東京，慢慢玩。',location:'東京',dateLabel:'2026.10.12 — 10.16',startDate:'2026-10-12',status:'upcoming',statusLabel:'即將出發',cover:'assets/photos/sensoji.jpg',companions:['小宇','小庭','阿哲'],dayCount:5,summary:'淺草、原宿與上野，留一點時間慢慢逛。',english:'TOKYO' },
  { id:'kansai',title:'關西，和朋友一起。',location:'神戶・海之京都・奈良・大阪',dateLabel:'2026.04.03 — 04.07',startDate:'2026-04-03',status:'completed',statusLabel:'旅行已結束',cover:'assets/memory/journey/usj-source.png',companions:['James','Betty','小宇'],dayCount:5,summary:'神戶港、天橋立與伊根，走過京都奈良，最後留一整天給環球影城。',english:'KANSAI' },
  { id:'fuji',title:'富士山，藍調時刻。',location:'富士山周邊',dateLabel:'2026.02.14 — 02.15',startDate:'2026-02-14',status:'completed',statusLabel:'旅行已結束',cover:'assets/memory/fuji-editorial.png',companions:['小庭','阿哲'],dayCount:2,summary:'看山、喝咖啡，把天色變藍的那刻留下來。',english:'FUJI' },
];
export function isTripId(value: unknown): value is TripId { return typeof value === 'string' && tripSummaries.some(trip => trip.id === value); }
export const plannerStorageKey = (id: TripId) => `chictrip-circle-planner-v2-${id}`;

function photo(src: string, alt: string): Stop['photo'] { return {src,alt,source:'',credit:'旅行示範素材',license:'素材來源見原型說明',licenseUrl:'',objectPosition:'50% 50%'}; }
function makeStop(id: number, day: number, name: string, at: [number,number], time: string, note: string, image: string, stay='停留 60 分鐘'): Stop {
  return {id,day,name,short:name,at,time,note,stay,range:[40,90],photo:photo(image,name+'・旅行示範照片')};
}
const fuji='assets/memory/fuji-editorial.png';
export const tripItineraries: Record<TripId, TripDay[]> = {
  tokyo: structuredClone(original.days),
  kansai: kansaiDays,
  fuji: [
    {area:'富士山周邊・看山與咖啡',english:'FUJI / BLUE HOUR',stops:[
      makeStop(0,0,'河口湖',[138.755,35.517],'13:00','沿著湖邊散步，等雲慢慢散開。',fuji,'停留 90 分鐘'),
      makeStop(1,0,'富士山周邊咖啡店',[138.805,35.485],'16:30','喝杯熱飲，拍下遠處的山和變藍的天空。',fuji)]},
    {area:'河口湖・返程前',english:'KAWAGUCHIKO / RETURN',stops:[
      makeStop(2,1,'河口湖',[138.755,35.517],'10:00','離開前再看一次山，收好這趟的小回憶。',fuji)]},
  ],
};
export const tripAlternatives: Record<TripId, Stop> = {
  tokyo: {...structuredClone(original.days[4]!.stops[0]!),id:1,day:0,time:'12:00',note:'雨天替代：室內展覽，交通與開館時間待查核'},
  kansai: kansaiRainAlternative,
  fuji: makeStop(1,0,'河口湖美術館',[138.7691,35.523],'16:30','雨天替代：室內展覽，交通與開館時間待查核。',fuji),
};

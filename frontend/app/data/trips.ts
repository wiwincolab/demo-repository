import original from './content.json' with { type: 'json' };
import type { Stop, TripDay } from '../types/trip';

export type TripId = 'tokyo' | 'kansai' | 'fuji';
export interface TripSummary {
  id: TripId; title: string; location: string; dateLabel: string; startDate: string;
  status: 'upcoming' | 'completed'; statusLabel: string; cover: string;
  companions: string[]; dayCount: number; summary: string; english: string;
}
export const tripSummaries: TripSummary[] = [
  { id:'tokyo',title:'東京，慢慢玩。',location:'東京',dateLabel:'2026.10.12 — 10.16',startDate:'2026-10-12',status:'upcoming',statusLabel:'即將出發',cover:'assets/photos/sensoji.jpg',companions:['小宇','小庭','阿哲'],dayCount:5,summary:'淺草、原宿與上野，留一點時間慢慢逛。',english:'TOKYO' },
  { id:'kansai',title:'關西，和朋友一起。',location:'大阪・奈良・京都',dateLabel:'2026.04.03 — 04.07',startDate:'2026-04-03',status:'completed',statusLabel:'旅行已結束',cover:'assets/memory/journey/usj-source.png',companions:['James','Betty','小宇'],dayCount:5,summary:'環球影城玩一整天，再去奈良和京都散步。',english:'KANSAI' },
  { id:'fuji',title:'富士山，藍調時刻。',location:'富士山周邊',dateLabel:'2026.02.14 — 02.15',startDate:'2026-02-14',status:'completed',statusLabel:'旅行已結束',cover:'assets/memory/fuji-editorial.png',companions:['小庭','阿哲'],dayCount:2,summary:'看山、喝咖啡，把天色變藍的那刻留下來。',english:'FUJI' },
];
export function isTripId(value: unknown): value is TripId { return typeof value === 'string' && tripSummaries.some(trip => trip.id === value); }
export const plannerStorageKey = (id: TripId) => `chictrip-circle-planner-v2-${id}`;

function photo(src: string, alt: string): Stop['photo'] { return {src,alt,source:'',credit:'旅行示範素材',license:'素材來源見原型說明',licenseUrl:'',objectPosition:'50% 50%'}; }
function makeStop(id: number, day: number, name: string, at: [number,number], time: string, note: string, image: string, stay='停留 60 分鐘'): Stop {
  return {id,day,name,short:name,at,time,note,stay,range:[40,90],photo:photo(image,name+'・旅行示範照片')};
}
const osaka='atlas-assets/scenes/1.jpg', usj='assets/memory/journey/usj-source.png', nara='assets/memory/journey/nara-source.png', kyoto='assets/memory/references/kyoto-shrine-source.png', fuji='assets/memory/fuji-editorial.png';
export const tripItineraries: Record<TripId, TripDay[]> = {
  tokyo: structuredClone(original.days),
  kansai: [
    {area:'抵達大阪・難波',english:'NAMBA / OSAKA',stops:[
      makeStop(0,0,'難波',[135.5011,34.6651],'14:00','放好行李，先熟悉附近街道。',osaka),
      makeStop(1,0,'道頓堀',[135.5013,34.6687],'17:00','在戎橋集合，沿著河邊找晚餐。',osaka,'停留 90 分鐘')]},
    {area:'大阪環球影城',english:'UNIVERSAL STUDIOS / OSAKA',stops:[
      makeStop(2,1,'大阪環球影城',[135.4325,34.6679],'09:00','和朋友一起走進超級任天堂世界。',usj,'停留 8 小時'),
      makeStop(3,1,'道頓堀',[135.5013,34.6687],'19:30','回到大阪，一起吃晚餐、整理今天的照片。',osaka)]},
    {area:'奈良・鹿公園',english:'NARA',stops:[
      makeStop(4,2,'奈良公園',[135.843,34.685],'10:30','和鹿保持距離，慢慢走、慢慢拍。',nara,'停留 120 分鐘'),
      makeStop(5,2,'浮見堂',[135.8398,34.6795],'14:00','走到池塘邊，休息一下再回大阪。',nara)]},
    {area:'京都・嵐山',english:'ARASHIYAMA / KYOTO',stops:[
      makeStop(6,3,'野宮神社',[135.6741,35.0177],'10:00','走過黑木鳥居，在樹影下停一會。',kyoto),
      makeStop(7,3,'嵐山竹林',[135.6719,35.0173],'12:00','從神社旁的小路繼續散步。',kyoto,'停留 45 分鐘')]},
    {area:'大阪・返程前',english:'OSAKA / RETURN',stops:[
      makeStop(8,4,'難波',[135.5011,34.6651],'10:00','買好伴手禮，確認回程交通。',osaka)]},
  ],
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
  kansai: makeStop(1,0,'難波商場',[135.5016,34.661],'17:00','雨天替代：在商場逛街吃飯，營業時間待查核。',osaka,'停留 90 分鐘'),
  fuji: makeStop(1,0,'河口湖美術館',[138.7691,35.523],'16:30','雨天替代：室內展覽，交通與開館時間待查核。',fuji),
};

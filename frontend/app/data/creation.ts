import type { TripId } from './trips';
export type CreationId = 'sticker' | 'photo' | 'ticket' | 'pin' | 'scene' | 'companion';
export interface CreationStyle {
  id: CreationId; name: string; english: string; caption: string; image: string;
  location: string; source: string; sourceCrop?: boolean; interactive?: string; preset?: boolean;
}
export const creationStyles: CreationStyle[] = [
  { id: 'sticker', name: '貼紙卡', english: 'Little pieces of a trip', caption: '把沿途的小細節，收進六枚貼紙。', image: 'fuji-sticker.png', location: '富士山 · 藍調時刻', source: 'fuji-editorial.png', sourceCrop: true, interactive: '揭起貼紙' },
  { id: 'photo', name: '專業攝影', english: 'Through a different lens', caption: '保留真實風景，讓光線與色彩說故事。', image: 'references/usj-nintendo-source.png', location: '大阪 · 超級任天堂世界', source: 'references/usj-nintendo-source.png', interactive: '欣賞光影' },
  { id: 'ticket', name: '旅行票根', english: 'A ticket back to that day', caption: '把日期和那天的風景，留在一張旅行票根裡。', image: 'fuji-ticket.png', location: '富士山 · 藍調時刻', source: 'fuji-editorial.png', sourceCrop: true, interactive: '抽出旅行票根' },
  { id: 'pin', name: '琺瑯徽章', english: 'A place close to your heart', caption: '把喜歡的景點，做成一枚值得收藏的小徽章。', image: 'kyoto-pin-test.png', location: '京都 · 野宮神社', source: 'references/kyoto-shrine-source.png', interactive: '翻看徽章' },
  { id: 'scene', name: '場景積木', english: 'Build your way back', caption: '轉一轉、點亮窗燈，把風景放回眼前。', image: 'fuji-diorama-v2.png', location: '富士山 · 藍調時刻', source: 'fuji-editorial.png', sourceCrop: true, interactive: '拼回這片風景' },
  { id: 'companion', name: '景點限定旅伴', english: 'Dressed for this adventure', caption: '換上這一站的穿搭，讓去趣旅伴陪你合照。', image: 'usj-companion-test.png', location: '大阪 · 超級任天堂世界', source: 'references/usj-nintendo-source.png', interactive: '與旅伴互動' },
];
export const creationFriends = [
  { id: 'yu', name: '小宇', initial: '宇', color: '#e7f2e9', trip: '關西春日旅行', date: '2026.04.03 — 04.07', companion: true },
  { id: 'ting', name: '小庭', initial: '庭', color: '#f5ebdf', trip: '關西春日旅行', date: '2026.04.03 — 04.07', companion: true },
  { id: 'lin', name: '阿霖', initial: '霖', color: '#e9e8f5', trip: '透過旅行認識的朋友', date: '', companion: false },
];
export interface CreationWork {
  id: string; styleId: CreationId; title: string; image: string; location: string;
  creator: string; createdAt: string; receivedFrom?: string; exchangeId?: string;
  tripId: TripId; photoId?: string; source?: string; sourceCrop?: boolean; sourceTripId?: TripId; preset?: boolean; renderedImage?: string;
}
export function makeExample(style: CreationStyle, creator = '你', suffix = ''): CreationWork {
  const photo = creationPhotos.find(p => p.styles.includes(style.id) && p.source === style.source)!;
  return { id: `${creator}-${style.id}${suffix}`, styleId: style.id, title: style.name, image: style.image, location: style.location, creator, createdAt: '2026-04-08T10:30:00+08:00',tripId:photo.tripId,photoId:photo.id,source:photo.source,sourceCrop:photo.sourceCrop,preset:true };
}
export type ExchangeStatus = 'pending' | 'accepted' | 'declined' | 'cancelled';
export interface CreationExchange {
  id: string; friendId: string; outgoing: CreationWork; incoming: CreationWork;
  note: string; reply: string; direction: 'sent' | 'received'; status: ExchangeStatus;
  createdAt: string; resolvedAt?: string; tripId: TripId;
}
export const styleById = (id: CreationId) => creationStyles.find(style => style.id === id)!;

export interface CreationPhoto {
  id: string; tripId: TripId; title: string; location: string; source: string;
  sourceCrop?: boolean; styles: CreationId[]; featured?: 'usj'; note?: string; referenceOnly?: boolean; demoPhotoId?: string;
}
export const creationPhotos: CreationPhoto[] = [
  {id:'usj-scene',tripId:'kansai',title:'蘑菇餐廳前',location:'大阪 · 超級任天堂世界',source:'journey/usj-source.png',styles:['scene'],featured:'usj'},
  {id:'usj-panorama',tripId:'kansai',title:'園區全景',location:'大阪 · 超級任天堂世界',source:'references/usj-nintendo-source.png',styles:['photo','companion']},
  {id:'kyoto-shrine',tripId:'kansai',title:'樹影下的鳥居',location:'京都 · 野宮神社',source:'references/kyoto-shrine-source.png',styles:['pin'],referenceOnly:true,note:'先前京都示範素材，非這次五日路線'},
  {id:'nara-deer',tripId:'kansai',title:'奈良公園的鹿',location:'奈良 · 鹿公園',source:'journey/nara-source.png',styles:['sticker'],note:'AI 示範照片'},
  {id:'kiyomizu',tripId:'kansai',title:'清水舞台的綠意',location:'京都 · 清水寺',source:'../photos/kansai/kiyomizu.jpg',styles:['pin']},
  {id:'fuji-blue',tripId:'fuji',title:'富士山的藍調時刻',location:'富士山 · 藍調時刻',source:'fuji-editorial.png',sourceCrop:true,styles:['sticker','ticket','scene']},
];
export const photosForTrip = (id: TripId | null) => creationPhotos.filter(photo => photo.tripId === id && !photo.referenceOnly);
export const photoById = (id?: string) => creationPhotos.find(photo=>photo.id===id);
export function styleForPhoto(photo: CreationPhoto, id: CreationId): CreationStyle {
  if (photo.demoPhotoId) {
    const template = photoById(photo.demoPhotoId);
    if (template) return { ...styleForPhoto(template, id), location: photo.location, source: photo.source, sourceCrop: photo.sourceCrop };
  }
  const base=styleById(id);
  const hasPreset=photo.styles.includes(id);
  const override=photo.id==='nara-deer'&&id==='sticker'?{image:'journey/nara-sticker.png',interactive:'揭起貼紙'}:photo.id==='usj-scene'&&id==='scene'?{image:'journey/usj-scene-preview.png',interactive:'走進這個場景'}:photo.id==='kiyomizu'&&id==='pin'?{image:'revisit/kiyomizu-pin.png'}:{};
  return {...base,...override,image:hasPreset?({...base,...override}.image):photo.source,location:photo.location,source:photo.source,sourceCrop:photo.sourceCrop,interactive:!hasPreset&&id==='scene'?'轉動場景預覽':({...base,...override}.interactive),preset:hasPreset};
}
export function workForPhoto(photo:CreationPhoto,id:CreationId,creator='你',suffix=''):CreationWork {
  const style=styleForPhoto(photo,id);
  return {id:`${photo.tripId}-${photo.id}-${id}-${creator}${suffix}`,tripId:photo.tripId,photoId:photo.id,source:photo.source,sourceCrop:photo.sourceCrop,styleId:id,title:style.name,image:style.image,location:photo.location,creator,createdAt:new Date().toISOString(),preset:style.preset};
}

/** Preserve legacy works in the trip of their source, never the currently selected trip. */
export function restoreCreationWork(value: unknown): CreationWork | undefined {
  if(!value || typeof value!=='object')return;
  const work=value as CreationWork;
  if(typeof work.id!=='string'||typeof work.creator!=='string'||typeof work.createdAt!=='string')return;
  const photo=photoById(work.photoId)||creationPhotos.find(p=>p.styles.includes(work.styleId)&&styleForPhoto(p,work.styleId)?.image===work.image);
  if(!photo || styleForPhoto(photo,work.styleId)?.image!==work.image)return;
  const tripId=(['tokyo','kansai','fuji'] as string[]).includes(work.tripId)?work.tripId:photo.tripId;
  return {...work,tripId,photoId:photo.id,source:photo.source,sourceCrop:photo.sourceCrop,preset:styleForPhoto(photo,work.styleId).preset};
}

export function creationFriendsForTrip(id: TripId|null) {
  const group = id==='kansai'
    ? [{id:'james',name:'James',initial:'J',color:'#e7efde',trip:'關西春日旅行',date:'2026.04.03 — 04.07',companion:true},{id:'betty',name:'Betty',initial:'B',color:'#ece9f4',trip:'關西春日旅行',date:'2026.04.03 — 04.07',companion:true}]
    : id==='fuji'
      ? [{...creationFriends[0]!,trip:'富士山藍調小旅行',date:'2026.02.14 — 02.15'}]
      : id==='tokyo'
        ? creationFriends.slice(0,2).map(friend=>({...friend,trip:'東京 5 日旅行',date:'2026.10.12 — 10.16'})) : [];
  return [...group,creationFriends[2]!];
}

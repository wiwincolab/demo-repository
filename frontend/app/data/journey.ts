export interface JourneyStop {
  id: string; name: string; short: string; location: string; format: string; formatLabel: string;
  image: string; source: string; coords: [number, number]; date: string; caption: string;
}
/** A disclosed demo itinerary, not dates or location metadata inferred from the uploaded photo. */
export const journeyStops: JourneyStop[] = [
  {id:'kobe',name:'神戶港',short:'神戶',location:'神戶・Harborland',format:'photo',formatLabel:'旅行照片',image:'assets/photos/kansai/kobe-night.jpg',source:'assets/photos/kansai/kobe-night.jpg',coords:[135.1865,34.6801],date:'04.03',caption:'第一晚在港邊吃飯，等到對岸的燈亮了才回飯店。'},
  {id:'amanohashidate',name:'天橋立',short:'天橋立',location:'海之京都・傘松公園',format:'photo',formatLabel:'旅行照片',image:'assets/photos/kansai/amanohashidate.jpg',source:'assets/photos/kansai/amanohashidate.jpg',coords:[135.196,35.582],date:'04.04',caption:'坐登山電車上山，原來那條沙洲真的橫過整片海。'},
  {id:'ine',name:'伊根舟屋',short:'伊根',location:'海之京都・伊根灣',format:'photo',formatLabel:'旅行照片',image:'assets/photos/kansai/ine-cruise.jpg',source:'assets/photos/kansai/ine-cruise.jpg',coords:[135.2884,35.6748],date:'04.04',caption:'船慢慢繞過海灣，大家靠著欄杆看岸邊的舟屋。'},
  {id:'kyoto',name:'清水寺',short:'京都',location:'京都・東山',format:'photo',formatLabel:'旅行照片',image:'assets/photos/kansai/kiyomizu.jpg',source:'assets/photos/kansai/kiyomizu.jpg',coords:[135.785,34.9949],date:'04.05',caption:'早上先走清水寺，下山時再到坡道旁的小店買點心。'},
  {id:'nara',name:'奈良公園',short:'奈良',location:'奈良・鹿公園',format:'sticker',formatLabel:'貼紙卡',image:'assets/memory/journey/nara-sticker.png',source:'assets/memory/journey/nara-source.png',coords:[135.843,34.685],date:'04.05',caption:'用奈良小鹿的 AI 示範素材，留下這趟旅行的貼紙收藏。'},
  {id:'dotonbori',name:'道頓堀',short:'道頓堀',location:'大阪・戎橋',format:'photo',formatLabel:'攝影收藏',image:'atlas-assets/scenes/1.jpg',source:'atlas-assets/scenes/1.jpg',coords:[135.5013,34.6687],date:'04.05',caption:'走過橋的時候，把街道和招牌一起拍了下來。'},
  {id:'usj',name:'大阪環球影城',short:'環球影城',location:'超級任天堂世界',format:'scene',formatLabel:'場景積木',image:'assets/memory/journey/usj-scene-preview.png',source:'assets/memory/journey/usj-source.png',coords:[135.4325,34.6679],date:'04.06',caption:'把蘑菇餐廳、城堡和山丘，留在同一座小場景裡。'},
];

export interface JourneyState {
  usjCreated: boolean; usjSaved: boolean; note: string; friendAccepted: boolean;
  friendPlaced: boolean; friendReply: string; savedAt: string; exchangedAt: string;
}
export const emptyJourney = (): JourneyState => ({usjCreated:false,usjSaved:false,note:'',friendAccepted:false,friendPlaced:false,friendReply:'',savedAt:'',exchangedAt:''});
export function restoreJourney(value: unknown): JourneyState {
  const result=emptyJourney();
  if(!value || typeof value!=='object')return result;
  const v=value as Record<string,unknown>;
  result.usjCreated=v.usjCreated===true;
  result.usjSaved=result.usjCreated&&v.usjSaved===true;
  result.friendAccepted=result.usjSaved&&v.friendAccepted===true;
  result.friendPlaced=result.friendAccepted&&v.friendPlaced===true;
  for(const key of ['note','friendReply','savedAt','exchangedAt'] as const) if(typeof v[key]==='string')result[key]=v[key].slice(0,key==='savedAt'||key==='exchangedAt'?40:240);
  return result;
}

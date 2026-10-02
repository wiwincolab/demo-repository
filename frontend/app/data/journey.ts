export interface JourneyStop {
  id: string; name: string; short: string; location: string; format: string; formatLabel: string;
  image: string; source: string; coords: [number, number]; date: string; caption: string;
}
/** A disclosed demo itinerary, not dates or location metadata inferred from the uploaded photo. */
export const journeyStops: JourneyStop[] = [
  {id:'usj',name:'大阪環球影城',short:'環球影城',location:'超級任天堂世界',format:'scene',formatLabel:'場景積木',image:'assets/memory/journey/usj-scene-preview.png',source:'assets/memory/journey/usj-source.png',coords:[135.4325,34.6679],date:'04.04',caption:'把蘑菇餐廳、城堡和山丘，留在同一座小場景裡。'},
  {id:'dotonbori',name:'道頓堀',short:'道頓堀',location:'大阪・戎橋',format:'photo',formatLabel:'攝影收藏',image:'atlas-assets/scenes/1.jpg',source:'atlas-assets/scenes/1.jpg',coords:[135.5013,34.6687],date:'04.04',caption:'走過橋的時候，把街道和招牌一起拍了下來。'},
  {id:'nara',name:'奈良公園',short:'奈良',location:'奈良・鹿公園',format:'sticker',formatLabel:'貼紙卡',image:'assets/memory/journey/nara-sticker.png',source:'assets/memory/journey/nara-source.png',coords:[135.843,34.685],date:'04.05',caption:'照片裡的鹿，變成這趟旅行的一張貼紙。'},
  {id:'kyoto',name:'野宮神社',short:'京都',location:'京都・嵐山',format:'pin',formatLabel:'琺瑯徽章',image:'assets/memory/kyoto-pin-test.png',source:'assets/memory/references/kyoto-shrine-source.png',coords:[135.6741,35.0177],date:'04.06',caption:'把黑木鳥居和樹影，收進一枚小徽章。'},
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

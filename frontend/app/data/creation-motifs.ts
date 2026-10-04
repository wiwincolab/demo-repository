import type { CreationWork } from './creation';

export interface StickerKit {
  sheet: string; width: number; height: number; title: string;
  motifs: { name: string; box: string }[];
}
const fujiKit: StickerKit = {
  sheet: 'assets/memory/motion/stickers.png', width:1536,height:1024,title:'富士山的藍調時刻',
  motifs:['富士山','咖啡店','杉樹','街燈','雲霧','咖啡'].map((name,i)=>({name,box:['20 172 580 292','600 176 514 288','1124 28 389 475','183 503 212 488','458 667 654 237','1172 513 278 474'][i]!})),
};
const naraKit: StickerKit = {
  sheet:'assets/memory/motion/nara-stickers.png',width:1536,height:1024,title:'奈良公園的春日',
  motifs:['散步的小鹿','小鹿的耳朵','池邊涼亭','櫻花枝','池水與石頭','步道圍欄'].map((name,i)=>({name,box:['75 20 375 565','510 110 490 430','995 100 540 450','20 610 515 330','545 625 500 335','1080 605 445 340'][i]!})),
};
/** Use independent motifs when they exist; a composed photo stays its own paper sticker. */
export function stickerKit(work?: Pick<CreationWork,'photoId'|'image'|'location'|'preset'>):StickerKit {
  if(!work || work.image==='fuji-sticker.png')return fujiKit;
  if(work.image==='journey/nara-sticker.png')return naraKit;
  return {sheet:`assets/memory/${work.image}`,width:1000,height:1000,title:work.location,motifs:[{name:'這一站的風景',box:'0 0 1000 1000'}]};
}

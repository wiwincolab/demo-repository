import { japanMascots } from './japan-mascots.ts';
import { taiwanMascots } from './taiwan-mascots.ts';
import { koreaMascots } from './korea-mascots.ts';

const japanCollection = [
  { id: 'usj', name: '樂園探險家', place: '大阪・超級任天堂世界', trip: '關西', image: 'assets/memory/usj-companion-test.png', outfit: '紅帽・吊帶褲・冒險地圖', description: '地圖拿好了，今天想先玩哪一區？', color: '#f8ede3' },
  { id: 'fuji', name: '富士山看山派', place: '富士山・河口湖', trip: '富士山', image: 'assets/mascots/fuji.png', outfit: '雪山毛帽・登山背心・熱飲杯', description: '穿暖一點，陪你等雲後面的富士山。', color: '#e9f1f6' },
  { id: 'nara', name: '奈良散步家', place: '奈良公園', trip: '關西', image: 'assets/mascots/nara.png', outfit: '鹿耳帽・斑點斗篷・散步小包', description: '收好公園地圖，沿著樹蔭慢慢走。', color: '#eef1e6' },
  { id: 'asakusa', name: '淺草祭典客', place: '東京・淺草寺', trip: '東京', image: 'assets/mascots/asakusa.png', outfit: '靛藍法被・白頭巾・小提燈', description: '穿過雷門，去老街找一份喜歡的點心。', color: '#f8e9e6' },
  { id: 'ine', name: '伊根海邊客', place: '京都・伊根舟屋', trip: '關西', image: 'assets/mascots/ine.png', outfit: '海色工作服・水手帽・小木船', description: '看舟屋倒映在水裡，在海邊多待一會。', color: '#e6f0ee' },
  { id: 'kobe', name: '神戶港水手', place: '神戶港', trip: '關西', image: 'assets/mascots/kobe.png', outfit: '海軍外套・條紋領巾・港塔明信片', description: '晚餐過後，陪你沿著港邊等燈亮。', color: '#ecedf4' },
  ...japanMascots,
] as const;
export const mascots = [
  ...japanCollection.map(mascot => ({ ...mascot, country: '日本' as const })),
  ...taiwanMascots,
  ...koreaMascots,
] as const;
export type MascotId = typeof mascots[number]['id'];
export function isMascotId(value: unknown): value is MascotId { return mascots.some(mascot => mascot.id === value); }

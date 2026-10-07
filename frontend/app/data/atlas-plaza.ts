export const atlasParkZones = [
  {
    id: 'cities', number: '01', name: '立體地圖穿梭', short: '旅行出發站', english: 'DEPARTURE STATION',
    x: 25, y: 24, color: '#087d9e', image: 'cities.png',
    title: '下一站，回到那一天。',
    description: '跟著飛機與列車，從世界地圖走進熟悉的街道。每次抵達，都是一段旅行的開始。',
    tags: ['立體城市', '沿途回憶'],
    destination: '/atlas?view=cities', action: '出發漫遊',
  },
  {
    // 跟創作的「場景積木」分開命名：小鎮是做好的九景展示，你做的積木不會放進來
    id: 'town', number: '02', name: '九景小鎮', short: '3D 小鎮展示', english: 'NINE-SCENE TOWN',
    x: 75, y: 24, color: '#9e562e', image: 'town.png',
    title: '九段風景，連成一座小鎮。',
    description: '富士山、京都到首爾，日本與韓國的九個風景透過街道連在一起。轉個角度看街區，再等路燈慢慢亮起。',
    tags: ['九景小鎮', '旋轉探索', '日夜光影'],
    destination: '/town', action: '進入小鎮',
  },
  {
    id: 'wardrobe', number: '03', name: '去趣旅伴換裝', short: '旅伴換裝屋', english: 'TRAVEL COMPANION',
    x: 75, y: 76, color: '#8b641a', image: 'wardrobe.png',
    title: '今天，穿哪一趟旅行？',
    description: '六套景點限定穿搭，挑一套讓去趣吉祥物陪你出門。每一頂帽子、每一件小配件，都來自一個旅行地點。',
    tags: ['景點穿搭', '去趣吉祥物'],
    destination: '/wardrobe', action: '挑選我的吉祥物',
  },
  {
    id: 'collection', number: '04', name: '旅行收集冊', short: '旅行收藏館', english: 'THE TRAVEL COLLECTION',
    x: 25, y: 76, color: '#39785d', image: 'collection.png',
    title: '那些捨不得丟的小東西。',
    description: '一張貼紙、一枚徽章、一段票根。翻開自己的收藏，也記得哪一件是和朋友交換來的。',
    tags: ['貼紙', '琺瑯徽章', '旅行票根'],
    destination: '/collection', action: '翻開收集冊',
  },
] as const;
export type AtlasParkZone = typeof atlasParkZones[number];

// Height in the 330px-wide precinct drawing. Shared by its ground, scenery and hit area.
export const atlasPlazaElevations: Record<AtlasParkZone['id'], number> = {
  cities: 40,
  town: 70,
  collection: 12,
  wardrobe: 28,
};

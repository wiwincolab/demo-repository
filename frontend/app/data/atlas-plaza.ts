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
    id: 'town', number: '02', name: '場景積木世界', short: '回憶小鎮', english: 'LITTLE MEMORY TOWN',
    x: 75, y: 24, color: '#9e562e', image: 'town.png',
    title: '讓不同旅行，成為鄰居。',
    description: '山邊的咖啡店、奈良的小徑、環球影城的小世界。把喜歡的場景放在一起，慢慢長成你的小鎮。',
    tags: ['旅行場景', '一起造鎮'],
    destination: '', action: '',
  },
  {
    id: 'wardrobe', number: '03', name: '去趣旅伴換裝', short: '旅伴換裝屋', english: 'TRAVEL COMPANION',
    x: 75, y: 76, color: '#8b641a', image: 'wardrobe.png',
    title: '今天，穿哪一趟旅行？',
    description: '讓去趣吉祥物換上旅途中收集的穿搭。每一頂帽子、每一件小配件，都有一個去過的地方。',
    tags: ['景點穿搭', '去趣吉祥物'],
    destination: '', action: '',
  },
  {
    id: 'collection', number: '04', name: '旅行收集冊', short: '旅行收藏館', english: 'THE TRAVEL COLLECTION',
    x: 25, y: 76, color: '#39785d', image: 'collection.png',
    title: '那些捨不得丟的小東西。',
    description: '一張貼紙、一枚徽章、一段票根。翻開自己的收藏，也記得哪一件是和朋友交換來的。',
    tags: ['貼紙', '琺瑯徽章', '旅行票根'],
    destination: '/atlas?view=journey', action: '查看旅程收藏',
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

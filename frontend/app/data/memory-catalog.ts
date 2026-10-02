import spec from './memory-formats.json' with { type: 'json' };
export const memoryCatalog = [
    { id: 'sticker', formatId: 'sticker', name: '收藏貼紙卡', title: '把風景，收藏成一張卡。', subtitle: '手作 × 六枚貼紙', ratio: '橫式 3:2', image: 'fuji-sticker.png', location: '富士山周邊 · 藍調時刻', description: '一幅手作風景，六枚屬於這趟旅行的貼紙。' },
    { id: 'editorial', formatId: 'postcard', name: '攝影詩頁', title: '一半風景，一半詩', subtitle: '照片 × 留白插畫', ratio: '直式 3:4', image: 'fuji-editorial.png', location: '富士山周邊 · 藍調時刻', description: '把真實留在上半頁，把感受畫成下半頁。' },
    { id: 'ticket', formatId: 'ticket', name: '藍調旅行票根', title: '留一張，回到那個傍晚。', subtitle: '雙色 × 孔版印刷', ratio: '直式 3:4', image: 'fuji-ticket.png', location: '富士山周邊 · 藍調時刻', description: '雙色孔版印刷，留住富士山下的一點暖光。' },
    { id: 'enamel', formatId: 'pin', name: '景點琺瑯徽章', title: '把喜歡的地方，別在身邊。', subtitle: '金屬描邊 × 限定收藏', ratio: '方形 1:1', image: 'kyoto-pin-test.png', location: '京都 · 神社回憶範例', description: '將鳥居、綠蔭與石徑，濃縮成一枚景點限定徽章。' },
    { id: 'scene', formatId: 'diorama', name: '場景積木', title: '把那一天，拼回眼前。', subtitle: '紙藝 × 場景搭建', ratio: '方形 1:1', image: 'fuji-diorama-v2.png', location: '富士山周邊 · 藍調時刻', description: '以統一的紙藝材質，收藏富士山、咖啡店與暖光。' },
    { id: 'companion', formatId: 'companion', name: '景點限定旅伴', title: '去趣旅伴，也一起出發。', subtitle: '景點穿搭 × 吉祥物', ratio: '方形 1:1', image: 'usj-companion-test.png', location: '大阪 · 環球影城範例', description: '讓吉祥物的穿著、道具與動作呼應景點，成為故事的一部分。' }
];
export const generationFormats = spec;

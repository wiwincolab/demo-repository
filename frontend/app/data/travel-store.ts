export type StoreCategory = 'flights' | 'tours' | 'shopping';

export const storeCategories = [
  { id: 'all', label: '全部' },
  { id: 'esim', label: 'eSIM' },
  { id: 'flights', label: '機票' },
  { id: 'tours', label: '行程' },
  { id: 'shopping', label: '購物' },
] as const;

// Public booking links checked on 2026-10-12. These are outbound booking
// entries, not an inventory feed or a connection to the user's Hotai account.
// KKday's existing chicTrip referral comes from the official promotion page:
// https://www.chictrip.com.tw/blog/country/world/chictripkkday_promo
export const chictripKkdayUrl = 'https://www.kkday.com/zh-tw?cid=21657&ud1=blog&ud2=promocode';
export const storeServices: {
  id: string;
  category: StoreCategory;
  provider: string;
  title: string;
  description: string;
  action: string;
  url: string;
  icon: 'plane' | 'package' | 'route' | 'ticket' | 'bag';
}[] = [
  {
    id: 'trip-flights', category: 'flights', provider: 'Trip.com',
    title: '下一趟旅行，從機票開始',
    description: '選擇出發地、目的地與日期，查詢航班與票價。',
    action: '查詢與預訂機票', url: 'https://tw.trip.com/flights/', icon: 'plane',
  },
  {
    id: 'kkday-flights', category: 'flights', provider: 'KKday',
    title: '機票與機加酒，一起準備',
    description: '瀏覽機票、航空自由行與機加酒方案，挑選適合的出發安排。',
    action: '選購機票與機加酒',
    url: 'https://www.kkday.com/zh-tw/product/productlist/?count=10&currency=TWD&page=1&product_categories=CATEGORY_073%2CCATEGORY_077%2CCATEGORY_075%2CCATEGORY_074%2CCATEGORY_076%2CCATEGORY_053%2CCATEGORY_054&sort=prec&cid=21657&ud1=blog&ud2=promocode',
    icon: 'package',
  },
  {
    id: 'kkday-tours', category: 'tours', provider: 'KKday',
    title: '把想玩的行程，先訂下來',
    description: '一日遊、特色團與在地體驗，從目的地找下一段旅程。',
    action: '選購旅遊行程', url: chictripKkdayUrl, icon: 'route',
  },
  {
    id: 'trip-activities', category: 'tours', provider: 'Trip.com',
    title: '景點門票與當地體驗',
    description: '探索景點、活動與一日遊，安排這趟旅行的精彩時刻。',
    action: '預訂門票與體驗', url: 'https://tw.trip.com/things-to-do/', icon: 'ticket',
  },
  {
    id: 'hotaigo', category: 'shopping', provider: 'HOTAI購',
    title: '和泰商城，備齊旅行好物',
    description: '旅行用品、生活選物與票券，到 HOTAI購官方商城選購。',
    action: '前往 HOTAI購', url: 'https://www.hotaigo.com.tw/', icon: 'bag',
  },
];

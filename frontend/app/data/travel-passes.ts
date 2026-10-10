import type { Point } from '../utils/map.ts';
import { regionalTravelPasses } from './regional-travel-passes.ts';

export type TravelPassCountry = 'JP' | 'KR' | 'TW';
export type TravelPassKind = 'rail' | 'transport' | 'attractions' | 'bundle' | 'stored-value';
export const passCountries: { id: TravelPassCountry; name: string }[] = [
  { id: 'JP', name: '日本' }, { id: 'KR', name: '韓國' }, { id: 'TW', name: '台灣' },
];
export const passKindLabels: Record<TravelPassKind, string> = {
  rail: '鐵路周遊券', transport: '交通票券', attractions: '景點旅遊卡', bundle: '交通／景點套票', 'stored-value': '儲值旅遊卡',
};

export interface TravelPass {
  id: string; name: string; english: string; region: string; trips: string[];
  image: string; imageClass?: string; source: string; imageSource: string; credit: string;
  coverageUrl: string; coverage: string; exclusions: string; areas: Point[][];
  checkedAt: string;
  country: TravelPassCountry; regionKeys: string[]; kind: TravelPassKind;
  imageKind: 'ticket' | 'map' | 'promotion' | 'operator';
}
// Areas are deliberately labelled planning approximations. A transport network
// or a list of partner venues is not a polygon granting benefits to every place.
export const travelPasses: TravelPass[] = [
  {
    id: 'tokyo-subway', name: '東京地鐵券', english: 'Tokyo Subway Ticket', region: '東京', trips: ['tokyo', 'kanto'],
    country: 'JP', regionKeys: ['關東'], kind: 'transport', imageKind: 'ticket',
    image: 'assets/passes/tokyo-subway.jpg',
    source: 'https://www.tokyometro.jp/tst/en/index.html',
    imageSource: 'https://content.linktivity.io/supplier-link/tokyometro/XH1OZ_583860ea-ad51-40d9-a16e-c132892a7807.jpg', credit: 'Tokyo Metro／都營地下鐵官方票券販售網站',
    coverageUrl: 'https://www.kotsu.metro.tokyo.jp/eng/maps/',
    coverage: '東京 Metro 與都營地下鐵全線，24／48／72 小時。地圖以東京市區主要地鐵沿線作為規劃範圍。',
    exclusions: 'JR、百合海鷗線、私鐵直通區段及景點門票不包含；機場、舞濱與富士山不在這個規劃區域。',
    areas: [[[139.60,35.64],[139.67,35.58],[139.77,35.59],[139.84,35.66],[139.86,35.77],[139.80,35.83],[139.67,35.84],[139.60,35.76]]],
    checkedAt: '2026-10-10',
  },
  {
    id: 'osaka-amazing', name: '大阪周遊券', english: 'OSAKA AMAZING PASS', region: '大阪', trips: ['kansai', 'kansai-classic'],
    country: 'JP', regionKeys: ['關西'], kind: 'attractions', imageKind: 'promotion',
    image: 'assets/passes/osaka-amazing.png',
    source: 'https://osaka-amazing-pass.com/en/howto_about_1day.html',
    imageSource: 'https://osaka-amazing-pass.com/resource/img/top_slide_2b_en.png', credit: 'SURUTTO KANSAI 大阪周遊券官方網站',
    coverageUrl: 'https://osaka-amazing-pass.com/en/service_about_train.html',
    coverage: '1 日／2 日版：Osaka Metro、市營巴士指定路線，以及大阪市內部分私鐵區段；另有指定合作景點。',
    exclusions: '不含 JR 與環球影城門票。京都、奈良、神戶與關西機場不屬於一般版的規劃範圍；機場版另有規則。',
    areas: [[[135.43,34.60],[135.56,34.60],[135.60,34.68],[135.55,34.76],[135.48,34.78],[135.42,34.71]]],
    checkedAt: '2026-10-10',
  },
  {
    id: 'discover-seoul', name: '首爾旅遊卡', english: 'Discover Seoul Pass', region: '首爾・部分京畿設施', trips: ['seoul'],
    country: 'KR', regionKeys: ['首都圈'], kind: 'attractions', imageKind: 'ticket',
    image: 'assets/passes/discover-seoul.png', imageClass: 'seoul-leaflet',
    source: 'https://www.discoverseoulpass.com/app/guide',
    imageSource: 'https://kr.object.gov-ncloudstorage.com/discoverseoulpass/m/pdf/dsp-leaflet/dsp-leaflet-eng.pdf', credit: 'Discover Seoul Pass 官方手冊',
    coverageUrl: 'https://www.discoverseoulpass.com/app/spot/index/list?lang=2',
    coverage: '首爾合作景點，另含南怡島、愛寶樂園等指定設施。Pick 3、主題樂園版與限時版的可用景點／次數各有不同。',
    exclusions: '地圖圈的是合作設施周邊的規劃區域，區域內其他景點不代表免費。實體卡交通功能需另外儲值。',
    areas: [
      [[126.90,37.50],[127.08,37.50],[127.14,37.56],[127.08,37.64],[126.96,37.66],[126.90,37.60]],
      [[127.186,37.280],[127.220,37.280],[127.220,37.310],[127.186,37.310]],
      [[127.512,37.782],[127.540,37.782],[127.540,37.806],[127.512,37.806]],
    ], checkedAt: '2026-10-10',
  },
  {
    id: 'visit-busan', name: '釜山旅遊卡', english: 'VISIT BUSAN PASS', region: '釜山・指定慶尚合作設施', trips: ['busan'],
    country: 'KR', regionKeys: ['釜山／慶尚'], kind: 'attractions', imageKind: 'ticket',
    image: 'assets/passes/visit-busan.png',
    source: 'https://visitbusanpass.com/visitBusanPass/',
    imageSource: 'https://visitbusanpass.com/_nuxt/img/signiture-time.a592fb1.png', credit: 'VISIT BUSAN PASS 官方網站',
    coverageUrl: 'https://visitbusanpass.com/attractions',
    coverage: '釜山合作景點，主要集中南浦洞・松島、影島、海雲台與機張；另有慶州、統營等指定折扣設施。24／48 小時與 BIG3／BIG5 方案規則不同。',
    exclusions: '慶州世界與統營指定設施屬折扣，不是免費或涵蓋整個城市。合作點以黃色標記為準；實體卡搭地鐵、公車需另外儲值。',
    areas: [
      [[128.98,35.04],[129.09,35.04],[129.09,35.13],[128.98,35.13]],
      [[129.10,35.13],[129.24,35.13],[129.24,35.23],[129.10,35.23]],
    ], checkedAt: '2026-10-10',
  },
  ...regionalTravelPasses,
];
export function findTravelPass(passId: unknown) {
  return typeof passId === 'string' ? travelPasses.find(pass => pass.id === passId) : undefined;
}
export function travelPassRegions(country: TravelPassCountry | '' = '') {
  return [...new Set(travelPasses.filter(pass => !country || pass.country === country).flatMap(pass => pass.regionKeys))];
}
function normalized(value: string) {
  return value.normalize('NFKC').toLocaleLowerCase().replace(/周遊卷/g, '周遊券').replace(/\s+/g, ' ').trim();
}
export function filterTravelPasses({ country = '', region = '', query = '' }: { country?: TravelPassCountry | ''; region?: string; query?: string } = {}) {
  const terms = normalized(query).split(' ').filter(Boolean);
  return travelPasses.filter(pass => {
    if (country && pass.country !== country || region && !pass.regionKeys.includes(region)) return false;
    const text = normalized([pass.name, pass.english, pass.region, ...pass.regionKeys, pass.coverage, passKindLabels[pass.kind], passCountries.find(c => c.id === pass.country)?.name || ''].join(' '));
    return terms.every(term => text.includes(term));
  });
}

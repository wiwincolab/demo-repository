import esimSpecsSnapshot from './esim-store-specs.json' with { type: 'json' };

export type EsimProductKind = 'daily-data' | 'unlimited' | 'fixed-data';
export interface EsimProduct {
  id: string;
  name: string;
  destination: string;
  destinationCode: string;
  kind: EsimProductKind;
  carrier: string;
  price: number;
  originalPrice: number;
  tags: string[];
  image: string;
  source: string;
}

export const esimStoreSource = {
  checkedAt: '2026-10-10',
  url: 'https://www.chictrip.com.tw/esim/productlist',
  customerService: 'https://lin.ee/PYj7EEa',
  help: 'https://www.chictrip.com.tw/esim/question',
};
export const esimKindLabels: Record<EsimProductKind, string> = {
  'daily-data': '每日流量', unlimited: '吃到飽', 'fixed-data': '總量型',
};

// Official storefront order and starting prices, read from all three public pages.
type ProductRow = [id: string, destination: string, code: string, kind: EsimProductKind, carrier: string, price: number, originalPrice: number, tags?: string[]];
const rows: ProductRow[] = [
  ['ae63f61d-8cdf-4ae4-8f1a-6ef0b74f4e4e', '日本', 'japan', 'unlimited', 'Softbank、Docomo、KDDI', 81, 95],
  ['8704d020-6615-4146-84a7-4a064b0cc2ef', '日本', 'japan', 'daily-data', 'Softbank、Docomo', 30, 35, ['支援熱點分享']],
  ['d7e3fb42-987e-40eb-908c-20735bc438df', '韓國', 'korea', 'unlimited', '不限電信商', 65, 76],
  ['bb83bbdd-9f1c-42df-9a87-03a85516a62b', '泰國', 'thailand', 'unlimited', 'TRUE', 37, 44, ['支援Chatgpt']],
  ['cf6a5f7c-6206-4f19-ba97-87a830102800', '韓國', 'korea', 'daily-data', '不限電信商', 22, 26, ['支援熱點分享']],
  ['30808c59-a0da-4b74-b438-5b3baf0e2436', '港澳', 'hongkong-macau', 'unlimited', '多國通用', 65, 76],
  ['58733484-b804-4fe8-ba3d-b5a8abd32968', '中國', 'china', 'unlimited', '不限電信商', 72, 85, ['免翻牆', '可使用LINE']],
  ['3ef3718c-74b1-4d2d-ab1c-31bf3ca6fba8', '中國', 'china', 'daily-data', '不限電信商', 22, 26, ['免翻牆', '可使用LINE', '支援熱點分享']],
  ['ed3b383a-5434-4e7d-93ec-b7d5874cd72f', '印尼', 'indonesia', 'daily-data', '多國通用', 22, 26],
  ['d3220944-ef0d-46ae-9e0d-c591a2a5810c', '越南', 'vietnam', 'daily-data', '不限電信商', 30, 35],
  ['4f8b99a5-8b5f-44ae-b14a-6a1cc46f8c92', '歐洲', 'europe', 'daily-data', '多國通用', 22, 26, ['支援熱點分享']],
  ['e7f271bb-6fba-4625-b509-427ede953583', '東南亞', 'southeast-asia', 'daily-data', '多國通用', 22, 26, ['支援熱點分享']],
  ['16c35058-c41a-4c51-b4c6-a8689c477c02', '關島賽班', 'guam-saipan', 'daily-data', '多國通用', 37, 44, ['支援熱點分享']],
  ['6c60aceb-e199-428d-96c3-82e591c1fa85', '中港澳', 'china-hongkong-macau', 'daily-data', '多國通用', 22, 26, ['支援熱點分享']],
  ['38bc0794-d039-48e9-b591-858dd58cb5dc', '澳洲', 'australia', 'unlimited', 'Optus', 65, 76],
  ['1f6905c1-866b-412e-b6b0-216123c7e064', '中港澳', 'china-hongkong-macau', 'unlimited', '多國通用', 65, 76],
  ['55345416-5e56-4065-9f5e-554c2e4f72d3', '越南', 'vietnam', 'unlimited', '不限電信商', 94, 111],
  ['9f63e9aa-0ead-4fc3-8e61-053f68283c39', '歐洲', 'europe', 'unlimited', '多國通用', 81, 95, ['支援Chatgpt']],
  ['c4839a63-39bd-4521-8b65-c4eea5fdc22b', '澳洲', 'australia', 'daily-data', 'Optus', 22, 26, ['支援熱點分享']],
  ['6b91ed0c-f29c-42d5-a3bd-99d6ede10266', '美國', 'unitedstates', 'unlimited', '不限電信商', 72, 85, ['支援Chatgpt']],
  ['006f3a03-b5bc-4d83-898b-993e8c6e29dd', '港澳', 'hongkong-macau', 'daily-data', '多國通用', 22, 26],
  ['ad685d91-00d0-4e74-83e6-c229bfa9c9c7', '美國', 'unitedstates', 'daily-data', '不限電信商', 30, 35, ['支援熱點分享', '支援Chatgpt']],
  ['5a2b556a-fc04-45b2-bb70-0a43c327f593', '菲律賓', 'philippines', 'daily-data', '不限電信商', 22, 26, ['支援熱點分享']],
  ['9c65e237-c88b-4c22-aa2d-818823d49711', '菲律賓', 'philippines', 'unlimited', '不限電信商', 94, 111],
  ['435af083-d58c-4f52-96ee-6d378c86977b', '東南亞', 'southeast-asia', 'unlimited', '多國通用', 72, 85],
  ['ad47975d-131d-4ad4-a31e-eb0d579f21be', '紐澳', 'australia-newzealand', 'daily-data', '多國通用', 30, 35],
  ['a03cca04-ade9-4b8b-81eb-cb4ccb71e8a1', '日韓', 'japan-korea', 'unlimited', '多國通用', 94, 111],
  ['2f08a5b8-0bf9-4c37-b8c8-1ff450c926c6', '日韓', 'japan-korea', 'daily-data', '多國通用', 37, 44, ['支援熱點分享']],
  ['e7856da5-54bc-49b4-9896-9c4a548e915d', '印尼', 'indonesia', 'unlimited', '多國通用', 72, 85],
  ['819713d3-16f4-43bb-9ea8-9d7a7e61bcbe', '南美', 'south-america', 'daily-data', '多國通用', 51, 60, ['支援熱點分享', '支援Chatgpt']],
  ['1ea8460d-01f7-4170-b37b-a3a0c0c4cc59', '亞洲', 'asia', 'daily-data', '多國通用', 30, 35, ['支援熱點分享']],
  ['1f057086-3ef7-4a1c-9955-7e5cad41221a', '紐澳', 'australia-newzealand', 'unlimited', '多國通用', 94, 111],
  ['13de5f1b-c886-4adb-97b1-fcbec71e8c4a', '亞洲', 'asia', 'unlimited', '多國通用', 94, 111],
  ['aa224435-ab90-46f8-851c-9f9f2eaee37c', '非洲', 'africa', 'daily-data', '多國通用', 43, 51, ['支援熱點分享', '支援Chatgpt']],
  ['2f67820c-3581-4c50-b29d-3f073efa8fb9', '土耳其', 'turkey', 'unlimited', 'Türk Telekom', 72, 85],
  ['0cb33f76-37b5-43c0-8354-5f1a075fba64', '美加墨', 'unitedstates-canada-mexico', 'daily-data', '多國通用', 51, 60, ['支援熱點分享', '支援Chatgpt']],
  ['58d0fe0b-6eb5-4c18-9878-cb3cedd007d5', '斯里蘭卡', 'srilanka', 'unlimited', 'Mobitel', 151, 178],
  ['c1a145d2-4e24-40ff-b353-ad16e5d5f77a', '關島賽班', 'guam-saipan', 'unlimited', '多國通用', 159, 187],
  ['e902a2e2-142c-4ce1-b7da-4e2ab8cc6a00', '美加墨', 'unitedstates-canada-mexico', 'unlimited', '多國通用', 217, 255, ['支援Chatgpt']],
  ['b1f420b4-89c3-41b2-9f33-6349f2366d87', '斯里蘭卡', 'srilanka', 'daily-data', 'Mobitel', 37, 44],
  ['745253f3-585c-4d43-b0fb-eb715f7a431c', '非洲', 'africa', 'unlimited', '多國通用', 173, 204, ['支援Chatgpt']],
  ['945000f0-2d6d-4920-8b54-2dbdea16687d', '土耳其', 'turkey', 'daily-data', 'Türk Telekom', 30, 35, ['支援熱點分享']],
  ['83a18679-b758-426a-b673-13e68a02800f', '印度', 'india', 'daily-data', '不限電信商', 43, 51],
  ['34607815-8ff7-4477-9f21-ae9d7a5eff03', '柬埔寨', 'cambodia', 'daily-data', '不限電信商', 30, 35, ['支援熱點分享']],
  ['f9da8cbb-e319-42ca-8193-8be70394c88f', '柬埔寨', 'cambodia', 'unlimited', '不限電信商', 87, 102],
  ['6d1cbe61-e8e1-4a96-bcd9-f84837813d03', '埃及', 'egypt', 'daily-data', 'Etisalat', 43, 51, ['支援熱點分享']],
  ['9ab379b9-b61b-4492-9d13-e0112269d062', '阿聯酋', 'unitedarabemirates', 'daily-data', 'DU', 43, 51, ['支援熱點分享']],
  ['cddabe60-e849-47d9-a86e-b361d75b6fa4', '阿聯酋', 'unitedarabemirates', 'unlimited', 'DU', 173, 204],
  ['e120846a-b630-4f34-b975-3ac3383a8d0b', '阿曼', 'oman', 'unlimited', 'Ooredoo', 217, 255],
  ['4576a227-97ce-48b0-b6ab-76ba7639449d', '阿曼', 'oman', 'daily-data', 'Ooredoo', 51, 60, ['支援熱點分享']],
  ['39f50a86-6a8d-45c9-bb97-2b3170e36237', '冰島', 'iceland', 'unlimited', 'Vodafone', 81, 95, ['支援Chatgpt']],
  ['65cf1775-9589-48fa-b188-ded0f3f6ed4b', '孟加拉', 'bangladesh', 'unlimited', 'Banglalink Digital', 116, 136],
  ['e01c82ce-25a6-4809-b03d-8780e32795e3', '孟加拉', 'bangladesh', 'daily-data', 'Banglalink Digital', 30, 35, ['支援熱點分享']],
  ['e5ecc33b-5e50-43ff-b28b-d8f2be9c7df4', '埃及', 'egypt', 'unlimited', 'Etisalat', 173, 204],
  ['a086a431-8fab-47b2-9e99-f470e3ba895a', '寮國', 'laos', 'unlimited', 'ETL', 173, 204],
  ['b6b998ad-7e69-4913-97a9-5971e9d21f9f', '寮國', 'laos', 'daily-data', 'ETL', 43, 51, ['支援熱點分享']],
  ['a5ddbd88-9069-4bef-880f-7eb635b6eeae', '馬爾地夫', 'maldives', 'fixed-data', 'Dhiraagu', 1783, 2098, ['支援Chatgpt']],
  ['4c838e3b-8509-41ad-b7bb-eb6bcba3705e', '冰島', 'iceland', 'daily-data', 'Vodafone', 22, 26, ['支援熱點分享', '支援Chatgpt']],
  ['44d30a70-08be-4062-b47e-f5fc11ad62ba', '沙烏地阿拉伯', 'saudiarabia', 'daily-data', 'STC', 43, 51],
  ['1c24b401-a8d8-460e-802f-57d62ca20432', '沙烏地阿拉伯', 'saudiarabia', 'unlimited', 'STC', 173, 204],
  ['b3cac7fc-23a0-4552-a574-4b9422a053b7', '南美', 'south-america', 'unlimited', '多國通用', 252, 296, ['支援Chatgpt']],
];

export const esimProducts: EsimProduct[] = rows.map(([id, destination, destinationCode, kind, carrier, price, originalPrice, tags = []]) => ({
  id, destination, destinationCode, kind, carrier, price, originalPrice,
  name: `${destination}eSIM${destination === '關島賽班' ? '  ' : ' '}| ${esimKindLabels[kind]} | ${carrier}`,
  tags: ['全館85折', ...tags],
  image: `assets/esim/${id}.jpg`,
  source: `https://www.chictrip.com.tw/esim/${destinationCode}/${kind}`,
}));

export const esimDestinations = [...new Map(esimProducts.map(p => [p.destinationCode, { code: p.destinationCode, name: p.destination }])).values()];

export interface EsimProductSpecs { volumes: string[]; carriers: string[]; days: number[] }
// Each group is the complete option list shown by that product, not a SKU matrix.
export const esimProductSpecs: Record<string, EsimProductSpecs> = esimSpecsSnapshot.products;

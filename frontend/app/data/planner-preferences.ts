export const plannerKeywords = [
  { id: 'food', title: '咖啡與甜點', tag: '美食', detail: '優先考慮咖啡店、甜點與小吃，留一段停下來吃東西的時間。', source: '示範偏好，可自行選用', input: /美食|甜點|小吃|咖啡/, place: /咖啡|甜點|小吃|商店|橫町|美食/, defaultOn: true },
  { id: 'nature', title: '自然景觀', tag: '景點', detail: '喜歡河岸、公園、湖景和可以慢慢看風景的地方。', source: '示範偏好，可自行選用', input: /自然|風景|景觀|拍照/, place: /公園|湖|山|河|港|觀景|風景|晴空塔/, defaultOn: true },
  { id: 'culture', title: '老街與文化', tag: '景點', detail: '把寺廟、老街和展覽放進候選，走進當地的生活與歷史。', source: '示範偏好，可自行選用', input: /老街|文化|寺廟|歷史/, place: /寺|博物館|美術館|老街|文化|歷史/, defaultOn: true },
  { id: 'play', title: '樂園與體驗', tag: '玩樂', detail: '考慮主題樂園、遊樂設施、手作或其他體驗活動。', source: '示範偏好，可自行選用', input: /樂園|遊樂|體驗|手作/, place: /樂園|環球|遊樂|體驗|手作|任天堂/, defaultOn: false },
  { id: 'shopping', title: '購物與逛街', tag: '購物', detail: '把商場、商店街與市場列入推薦的候選景點。', source: '示範偏好，可自行選用', input: /購物|逛街/, place: /商場|商店|購物|橫町|市場/, defaultOn: false },
] as const;
export type PlannerKeywordId = typeof plannerKeywords[number]['id'];
export const plannerPreferenceStorageKey = 'chictrip-planner-keywords-v1';
export function validPlannerKeywords(value: unknown): PlannerKeywordId[] {
  return Array.isArray(value) ? plannerKeywords.filter(k => value.includes(k.id)).map(k => k.id) : [];
}

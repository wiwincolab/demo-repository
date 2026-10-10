import { plannerKeywords, type PlannerKeywordId } from '../data/planner-preferences.ts';

export const memoryCategories = [
  ...plannerKeywords.map(keyword => ({ id: keyword.id, title: keyword.title })),
  { id: 'style', title: '旅行方式' },
  { id: 'other', title: '其他喜好' },
] as const;
export type MemoryCategoryId = PlannerKeywordId | 'style' | 'other';
export type PreferencePolarity = 'like' | 'avoid';
export interface PreferenceSuggestion {
  label: string;
  categoryId: MemoryCategoryId | null;
  polarity: PreferencePolarity;
  evidence: string;
}
export interface PersonalPreference extends PreferenceSuggestion {
  id: string;
  categoryId: MemoryCategoryId;
}
export const preferenceInputLimit = 500;
export const personalPreferenceLimit = 40;
export const suggestionLimit = 8;
export const isMemoryCategory = (value: unknown): value is MemoryCategoryId => memoryCategories.some(category => category.id === value);
export const isPlannerCategory = (value: MemoryCategoryId): value is PlannerKeywordId => plannerKeywords.some(keyword => keyword.id === value);
export const preferenceIdentity = (value: Pick<PreferenceSuggestion, 'label' | 'categoryId' | 'polarity'>) => `${value.categoryId}:${value.polarity}:${value.label.trim().toLowerCase().replace(/\s+/g, '')}`;
const negative = /不喜歡|不愛|不想|不要|不喝|不吃|不去|避開|討厭|害怕|怕人|怕高/;
const positive = /喜歡|愛喝|愛吃|愛逛|熱愛|偏好|想要|想去|習慣|希望|喜愛/;
const uncertain = /如果|假如|可能|或許|不確定|不知道|(?:朋友|他|她)(?:很|最|也)?喜歡|推薦|幫我|忽略|指令|分類|怎麼|如何|嗎|[?？]/;
const patterns: Record<MemoryCategoryId, RegExp> = {
  food: /咖啡|甜點|小吃|美食|抹茶|拿鐵|拉麵|壽司|燒肉|海鮮|素食|吃辣|不吃辣|餐廳|麵包|蛋糕|冰淇淋|奶茶|coffee|dessert|vegan|food/i,
  nature: /自然|風景|景觀|河岸|公園|湖景|海邊|沙灘|森林|登山|健行|花海|賞櫻|日落|夕陽|山景|nature|hiking|beach/i,
  culture: /老街|文化|寺廟|歷史|展覽|美術館|博物館|藝術|神社|古蹟|建築|museum|art|culture/i,
  play: /樂園|遊樂|體驗|手作|迪士尼|環球|刺激|雲霄飛車|遊戲|水族館|動物園|disney|theme park/i,
  shopping: /購物|逛街|商場|商店街|市場|買衣服|選物|精品|伴手禮|shopping|shop/i,
  style: /慢慢|悠閒|步調|行程|早起|晚起|人多|人潮|擁擠|預算|省錢|奢華|獨旅|跟團|自助|開車|搭車|交通|走路|步行|住宿|飯店|拍照|攝影|無障礙|輪椅|親子|slow travel|crowd/i,
  other: /星座|閱讀|音樂|寵物|瑜伽|電影|小說|書籍|貓|狗/,
};

// Static hosting and unavailable AI still support clear statements. Ambiguous
// personal interests outside the travel branches belong to "other". Questions
// and other people's tastes are not recorded as the visitor's preferences.
export function interpretPreferenceText(raw: string): PreferenceSuggestion[] {
  const text = raw.trim().slice(0, preferenceInputLimit);
  const clauses = text.split(/[，,。；;、\n]|但是|不過|而且|以及|還有|但|和|與/).map(clause => clause.trim()).filter(Boolean);
  let polarity: PreferencePolarity = 'like', stated = false, attributable = false;
  const result: PreferenceSuggestion[] = [];
  for (const clause of clauses) {
    if (negative.test(clause)) { polarity = 'avoid'; stated = true; attributable = !uncertain.test(clause); }
    else if (positive.test(clause)) { polarity = 'like'; stated = true; attributable = !uncertain.test(clause); }
    if (uncertain.test(clause)) attributable = false;
    const categoryIds = memoryCategories.filter(category => patterns[category.id].test(clause)).map(category => category.id);
    const label = clause.replace(/^(?:我|自己)?(?:也|還|很|特別|比較|最)*(?:不喜歡|不愛|不想|不要|討厭|避開|喜歡|熱愛|偏好|喜愛|希望|想要)\s*/, '').trim().slice(0, 28);
    if (!label) continue;
    if (!stated || !attributable) continue;
    const categories = categoryIds.length ? categoryIds : ['other' as const];
    for (const categoryId of categories) result.push({ label, categoryId, polarity, evidence: clause.slice(0, 160) });
    if (result.length >= suggestionLimit) break;
  }
  return uniqueSuggestions(result).slice(0, suggestionLimit);
}

export function automaticallyCategorizePreferences(items: PreferenceSuggestion[]) {
  return items.filter(item => !uncertain.test(item.evidence)).map(item => ({ ...item, categoryId: item.categoryId ?? 'other' as const }));
}

function uniqueSuggestions(items: PreferenceSuggestion[]) {
  return items.filter((item, index) => items.findIndex(other => preferenceIdentity(other) === preferenceIdentity(item)) === index);
}

// Treat model output and saved browser data as untrusted. The quoted evidence
// must occur in the submitted text; the model cannot create a travel history.
export function validPreferenceSuggestions(value: unknown, input: string): PreferenceSuggestion[] | null {
  if (!Array.isArray(value) || value.length > suggestionLimit) return null;
  const result: PreferenceSuggestion[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== 'object') return null;
    const item = entry as Partial<PreferenceSuggestion>;
    if (typeof item.label !== 'string' || !item.label.trim() || item.label.trim().length > 28 ||
      !(item.categoryId === null || isMemoryCategory(item.categoryId)) ||
      !['like', 'avoid'].includes(item.polarity ?? '') || typeof item.evidence !== 'string' ||
      !item.evidence.trim() || item.evidence.length > 160 || !input.includes(item.evidence.trim())) return null;
    if (item.polarity === 'like' && negative.test(item.evidence)) return null;
    result.push({ label: item.label.trim(), categoryId: item.categoryId!, polarity: item.polarity!, evidence: item.evidence.trim() });
  }
  return uniqueSuggestions(result);
}

export function validPersonalPreferences(value: unknown): PersonalPreference[] {
  if (!Array.isArray(value)) return [];
  const result: PersonalPreference[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== 'object' || typeof entry.id !== 'string' || !/^personal-[a-zA-Z0-9-]{1,80}$/.test(entry.id) || !isMemoryCategory(entry.categoryId)) continue;
    const accepted = validPreferenceSuggestions([{ label: entry.label, categoryId: entry.categoryId, polarity: entry.polarity, evidence: entry.evidence }], typeof entry.evidence === 'string' ? entry.evidence : '');
    if (!accepted?.[0] || result.some(item => item.id === entry.id || preferenceIdentity(item) === preferenceIdentity(entry))) continue;
    result.push({ ...accepted[0], id: entry.id, categoryId: entry.categoryId });
    if (result.length >= personalPreferenceLimit) break;
  }
  return result;
}

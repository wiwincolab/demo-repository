import type { Stop, TripDay } from '../types/trip.ts';
import { recommendPlaces, refineSelection, rainPlanDetailsFor, type Recommendation } from './planner.ts';

export function plannedDay(days: TripDay[], day: number, stops: Stop[]): TripDay[] {
  if (!Number.isInteger(day) || day < 0 || day >= days.length || !stops.length || stops.length > 8) return days;
  if (!stops.every(s => Number.isSafeInteger(s.id) && typeof s.name === 'string' && s.at?.length === 2 && s.at.every(Number.isFinite) && /^\d{2}:\d{2}$/.test(s.time) && s.photo && typeof s.photo.src === 'string' && Array.isArray(s.range))) return days;
  return days.map((d, i) => i === day ? { ...d, stops: stops.map(s => ({ ...s, day })) } : d);
}
export function restorePlannedDays(days: TripDay[], stored: {saved?:{day?:number;stops?:Stop[]};savedDays?:Record<string,{day?:number;stops?:Stop[]}>} | null): TripDay[] {
  let restored=days;
  for(const plan of [...Object.values(stored?.savedDays || {}),stored?.saved])if(plan && Array.isArray(plan.stops))restored=plannedDay(restored,plan.day ?? 0,plan.stops);
  return restored;
}
const distance = (a: Stop, b: Stop) => Math.hypot((a.at[0]! - b.at[0]!) * 90, (a.at[1]! - b.at[1]!) * 111);
export function conversationPlan(pool: Stop[], current: Stop[], text: string, keywordIds: string[] = []) {
  const all = [...new Map([...pool, ...current].map(p => [p.id, p])).values()];
  let edited = current.map(s => ({ ...s })), changes: string[] = [];
  const explicit = refineSelection(all, current.map(s => s.id), text);
  if (explicit.changes.length) { edited = explicit.ids.flatMap(id => { const p = all.find(p => p.id === id); return p ? [p] : []; }); changes.push(...explicit.changes); }
  if (/下雨|雨天|改.*室內/.test(text)) {
    const used = new Set<number>();
    edited = edited.map(s => {
      if (/博物館|美術館|水族館|咖啡|商場|室內/.test(s.name)) { used.add(s.id); return s; }
      const replacement = all.filter(p => !used.has(p.id) && /博物館|美術館|水族館|咖啡|商場|室內/.test(p.name) && distance(p, s) <= 8)
        .sort((a,b) => Number(!!b.photo.src)-Number(!!a.photo.src) || distance(a,s)-distance(b,s))[0];
      if (!replacement) return s;
      used.add(replacement.id); changes.push(`${s.name}改為${replacement.name}`); return { ...replacement, time: s.time };
    });
  }
  if (/咖啡/.test(text) && /加|多|想喝|想去/.test(text) && !edited.some(s => /咖啡/.test(s.name))) {
    const coffee = all.filter(p => /咖啡/.test(p.name) && edited.some(s => distance(s,p) <= 5)).sort((a,b) => Number(!!b.photo.src)-Number(!!a.photo.src))[0];
    if (coffee) { edited.push(coffee); changes.push(`加入${coffee.name}`); }
  }
  let limit = Math.min(8, edited.length);
  if (/少一站|悠閒|輕鬆|慢慢/.test(text)) { limit = Math.max(1, limit - 1); changes.push('減少一站，留更多休息時間'); }
  const requested = text.match(/(?:最多|只排|安排|排)\s*([1-8一二兩三四五六七八])\s*(?:個|站)/);
  if (requested) { limit = Number(requested[1]) || ({一:1,二:2,兩:2,三:3,四:4,五:5,六:6,七:7,八:8}[requested[1] as '一']); changes.push(`最多安排${limit}站`); }
  if (/晚.*出發|晚.*開始|下午|不想早起/.test(text)) changes.push('下午一點開始');
  const supported = changes.length || /小時|預算|美食|老街|自然|室內|重新安排|安排這一天/.test(text);
  if (!edited.length) return { stops: current as Recommendation[], notes: [], changed: false, message: '這樣會移除所有景點，請留一站或告訴我想加入哪裡。' };
  if (!supported) return { stops: current as Recommendation[], notes: [], changed: false, message: '可以告訴我想加入或移除哪個景點、改室內、下午出發，或一天玩幾小時。' };
  const editedIds = new Set(edited.map(s=>s.id));
  const result = recommendPlaces([...edited,...all.filter(s=>!editedIds.has(s.id))], edited.map(s => s.id), /晚.*出發|晚.*開始/.test(text) ? text + '，下午出發' : text, limit, 0, keywordIds, true);
  if (!result.stops.length) return { ...result, changed: false, message: '目前資料沒有能符合這次需求的安排，原草案已保留。' };
  return { ...result, changed: true, message: `${changes.join('、') || '依照你的需求調整時間與偏好'}。請先查看前後比較，採用後回到行程主頁。` };
}
export function initialConversationStops(stops: Stop[], pool: Stop[]): Recommendation[] {
  return stops.map(s => ({ ...s, outside: false, reason: '沿用目前旅程，可在下方對話調整。', travelMinutes: 0, ...rainPlanDetailsFor(s, pool) }));
}

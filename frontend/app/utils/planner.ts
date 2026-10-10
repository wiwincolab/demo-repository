import { plannerKeywords, validPlannerKeywords } from '../data/planner-preferences.ts';
import type { Stop } from '../types/trip';

export interface Recommendation extends Stop { outside: boolean; reason: string; travelMinutes: number; rainPlan: string }
// Explicit place edits are separate from preference matching: mentioning a category
// must not silently promote all gray markers into the selected set.
export function refineSelection(places: Stop[], ids: number[], text: string) {
  const selected = new Set(ids);
  const changes: string[] = [];
  for (const clause of text.split(/[,，。;；\n]/).filter(Boolean)) {
    const remove = /不要|不想去|不去|排除|移除|刪除|取消|拿掉/.test(clause);
    const add = /加入|加上|加進|納入|想去|要去|也去|保留/.test(clause);
    if (!remove && !add) continue;
    for (const place of places) {
      if (!clause.includes(place.name)) continue;
      if (remove) selected.delete(place.id);
      else selected.add(place.id);
      changes.push(`${remove ? '移除' : '加入'}${place.name}`);
    }
  }
  return { ids: [...selected], changes };
}

const isIndoor = (p: Stop) => /博物館|美術館|水族館|咖啡|商場|室內/.test(p.name);
export function rainPlanFor(place: Stop, places: Stop[]): string {
  if (isIndoor(place)) return `保留${place.name}，以室內活動為主；出發前確認開放時間與交通。`;
  const distance = (p: Stop) => Math.hypot((p.at[0]! - place.at[0]!) * 90, (p.at[1]! - place.at[1]!) * 111);
  const backup = places.filter(p => p.id !== place.id && isIndoor(p) && distance(p) <= 25)
    .sort((a, b) => distance(a) - distance(b))[0];
  return backup
    ? `可改去${backup.name}（室內替代候選）；若已安排該站，可延長停留。距離、營業與預約需確認，替換後需重排交通與時間。`
    : '改為住宿處室內休息，暫緩戶外活動；目前資料沒有可確認的室內替代景點，待補充後再安排。';
}

export function recommendPlaces(places: Stop[], ids: number[], text: string, limit: number, extension: number, keywordIds: string[] = [], selectedOnly = false) {
  const numerals: Record<string, number> = { 一: 1, 二: 2, 兩: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 };
  const number = (value: string): number => {
    if (value === '半') return .5;
    if (value.includes('十')) { const [tens, units] = value.split('十'); return (tens ? numerals[tens] || 0 : 1) * 10 + (units ? numerals[units] || 0 : 0); }
    return numerals[value] ?? Number(value);
  };
  const hours = text.match(/([\d.]+|[一二兩三四五六七八九十半]+)\s*(?:個)?小時/);
  const available = hours ? Math.min(540, number(hours[1]!) * 60) : 540;
  const extra = text.match(/(?:多搭|多走|圈外|額外)[^，。\n\d一二兩三四五六七八九十]{0,12}(\d+|[一二兩三四五六七八九十]+)\s*分鐘/);
  const outsideLimit = /(?:不要|不想|不接受|不去|不考慮)圈外|只[在去逛].*圈內/.test(text) ? 0 : extra ? number(extra[1]!) : extension;
  const excluded = plannerKeywords.filter(k => text.split(/[，。；、\n]/).some(part => /不要|不想|不去|不喜歡|避開|不考慮/.test(part) && k.input.test(part)));
  const allowed = plannerKeywords.filter(k => !excluded.some(e => e.id === k.id));
  const interests = allowed.filter(k => k.input.test(text));
  const requestedProfile = plannerKeywords.filter(k => validPlannerKeywords(keywordIds).includes(k.id));
  const profile = allowed.filter(k => requestedProfile.some(p => p.id === k.id));
  const indoor = /雨天|下雨|室內/.test(text);
  const anchors = places.filter(p => ids.includes(p.id));
  const travel = (a: Stop, b: Stop) => {
    const km = Math.hypot((a.at[0]! - b.at[0]!) * 90, (a.at[1]! - b.at[1]!) * 111);
    return km < 0.05 ? 0 : Math.ceil((km < 1.3 ? km / 0.065 : km / 18 * 60 + 12) / 5) * 5;
  };
  const matches = (p: Stop) => interests.filter(i => i.place.test(p.name)).map(i => i.id === 'food' ? '美食與甜點' : i.title);
  if (!anchors.length) return { stops: [], notes: ['請先圈選主要遊玩範圍'] };
  const candidates = places.filter(p => !excluded.some(k => k.place.test(p.name))).filter(p => !indoor || /博物館|美術館|咖啡|晴空塔|商場|室內/.test(p.name + p.note)).map(p => ({
    place: p, outside: !ids.includes(p.id), matched: matches(p), profileMatches: profile.filter(k => k.place.test(p.name)).map(k => k.title),
    nearby: anchors.length ? Math.min(...anchors.map(a => travel(a, p))) : Infinity,
  })).filter(p => !p.outside || (!selectedOnly && outsideLimit > 0 && p.nearby <= outsideLimit && (p.matched.length > 0 || p.profileMatches.length > 0)))
    .sort((a,b) => (b.matched.length * 6 + b.profileMatches.length * 2 - Number(b.outside)) - (a.matched.length * 6 + a.profileMatches.length * 2 - Number(a.outside)) || a.nearby - b.nearby);
  const stops: Recommendation[] = [];
  let elapsed = 0;
  const start = /下午|不想早起/.test(text) ? 13 * 60 : 10 * 60;
  for (const candidate of candidates) {
    if (stops.length >= limit) break;
    const p = candidate.place;
    const stayHours = p.stay.match(/([\d.]+|[一二兩三四五六七八九十半]+)\s*(?:個)?小時/);
    const stayMinutes = p.stay.match(/(\d+)\s*分鐘/);
    const minutes = stayHours || stayMinutes ? (stayHours ? number(stayHours[1]!) * 60 : 0) + Number(stayMinutes?.[1] || 0) : 60;
    const last = stops.at(-1);
    const transit = last ? travel(last, p) : candidate.outside ? candidate.nearby : 0;
    if (elapsed + transit + minutes > available || start + elapsed + transit + minutes > 24 * 60) continue;
    elapsed += transit;
    const reason = `${candidate.outside ? `圈外推薦：距圈內景點交通約 ${candidate.nearby} 分鐘（示範估算）。` : '已選取景點。'}${candidate.matched.length ? `符合你的${candidate.matched.join('、')}偏好。` : '依照你選取的景點安排。'}${candidate.profileMatches.length ? `參考你選用的偏好關鍵字：${candidate.profileMatches.join('、')}。` : ''}`;
    const clock = start + elapsed;
    stops.push({ ...p, time: `${String(Math.floor(clock / 60)).padStart(2, '0')}:${String(clock % 60).padStart(2, '0')}`, outside: candidate.outside, reason, travelMinutes: transit, rainPlan: rainPlanFor(p, places.filter(q => !excluded.some(k => k.place.test(q.name)))) });
    elapsed += minutes;
  }
  const budget = text.match(/(?:預算|最多花|花費)[^，。\n]{0,8}?([\d,]+)\s*(元|日圓|日幣|円)?/);
  const pass = /周遊[券卷]|交通[券卷]|pass/i.test(text);
  const notes = [hours ? `可用時間 ${available / 60} 小時` : '示範可用時間 9 小時', selectedOnly ? '僅安排已選取景點；可用文字加入灰色景點' : `圈外交通上限 ${outsideLimit} 分鐘`, `預估交通與停留共 ${elapsed} 分鐘（未含用餐、返程）`];
  if (profile.length) notes.push(`本次參考偏好關鍵字：${profile.map(k => k.title).join('、')}；額外條件優先於偏好`);
  if (excluded.length) notes.push(`依本次條件排除：${excluded.map(k => k.title).join('、')}`);
  if (budget) notes.push(`已記下預算 ${budget[1]}${budget[2] || '（幣別待確認）'}；景點缺少費用資料，尚無法驗證總花費`);
  if (pass) notes.push('已記下周遊券需求；請補充票券名稱，涵蓋路線與優惠待查核');
  return { stops, notes };
}

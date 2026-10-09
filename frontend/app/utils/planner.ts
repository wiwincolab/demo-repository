import { plannerKeywords, validPlannerKeywords } from '../data/planner-preferences.ts';
import type { Stop } from '../types/trip';

export interface Recommendation extends Stop { outside: boolean; reason: string; travelMinutes: number }
export function recommendPlaces(places: Stop[], ids: number[], text: string, limit: number, extension: number, keywordIds: string[] = []) {
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
  })).filter(p => !p.outside || (outsideLimit > 0 && p.nearby <= outsideLimit && (p.matched.length > 0 || p.profileMatches.length > 0)))
    .sort((a,b) => (b.matched.length * 6 + b.profileMatches.length * 2 - Number(b.outside)) - (a.matched.length * 6 + a.profileMatches.length * 2 - Number(a.outside)) || a.nearby - b.nearby);
  const stops: Recommendation[] = [];
  let elapsed = 0;
  const start = /下午|不想早起/.test(text) ? 13 * 60 : 10 * 60;
  for (const candidate of candidates) {
    if (stops.length >= limit) break;
    const p = candidate.place;
    const minutes = Number(p.stay.match(/(\d+)\s*分鐘/)?.[1] || 60);
    const last = stops.at(-1);
    const transit = last ? travel(last, p) : candidate.outside ? candidate.nearby : 0;
    if (elapsed + transit + minutes > available || start + elapsed + transit + minutes > 24 * 60) continue;
    elapsed += transit;
    const reason = `${candidate.outside ? `圈外推薦：距圈內景點交通約 ${candidate.nearby} 分鐘（示範估算）。` : '圈內景點。'}${candidate.matched.length ? `符合你的${candidate.matched.join('、')}偏好。` : '位於你主要想逛的範圍。'}${candidate.profileMatches.length ? `參考你選用的偏好關鍵字：${candidate.profileMatches.join('、')}。` : ''}`;
    const clock = start + elapsed;
    stops.push({ ...p, time: `${String(Math.floor(clock / 60)).padStart(2, '0')}:${String(clock % 60).padStart(2, '0')}`, outside: candidate.outside, reason, travelMinutes: transit });
    elapsed += minutes;
  }
  const budget = text.match(/(?:預算|最多花|花費)[^，。\n]{0,8}?([\d,]+)\s*(元|日圓|日幣|円)?/);
  const pass = /周遊[券卷]|交通[券卷]|pass/i.test(text);
  const notes = [hours ? `可用時間 ${available / 60} 小時` : '示範可用時間 9 小時', `圈外交通上限 ${outsideLimit} 分鐘`, `預估交通與停留共 ${elapsed} 分鐘（未含用餐、返程）`];
  if (profile.length) notes.push(`本次參考偏好關鍵字：${profile.map(k => k.title).join('、')}；額外條件優先於偏好`);
  if (excluded.length) notes.push(`依本次條件排除：${excluded.map(k => k.title).join('、')}`);
  if (budget) notes.push(`已記下預算 ${budget[1]}${budget[2] || '（幣別待確認）'}；景點缺少費用資料，尚無法驗證總花費`);
  if (pass) notes.push('已記下周遊券需求；請補充票券名稱，涵蓋路線與優惠待查核');
  return { stops, notes };
}

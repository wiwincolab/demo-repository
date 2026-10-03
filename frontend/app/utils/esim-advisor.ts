import type { Usage } from '../types/trip.ts';
export type AnswerLevel = 0 | 1 | 2;
export interface AdvisorAnswer { level: AnswerLevel; text: string; source: 'preset' | 'text' }
export const advisorQuestions = [
  { title: '旅行時，你最常用網路做什麼？', hint: '先從你平常的習慣開始，不用知道自己用幾 GB。', options: ['導航、查餐廳、傳訊息', '上傳照片、發限動、滑社群', '看影片、直播或處理工作'], placeholder: '例如：主要找路，晚上回飯店才傳照片' },
  { title: '在外面時，會看多少影片？', hint: '短影音和串流，通常是流量差異最大的地方。', options: ['幾乎不看，或只用 Wi-Fi 看', '偶爾滑一下，每天半小時內', '每天超過一小時，或經常直播'], placeholder: '例如：搭車會看 YouTube，大概一小時' },
  { title: '需要把網路分享出去嗎？', hint: '例如給朋友、平板或筆電使用。', options: ['只給自己的手機使用', '偶爾給朋友查資料', '經常開熱點給筆電或其他人'], placeholder: '例如：會開熱點給筆電工作、開視訊' },
];

export function interpretAdvisorAnswer(step: number, raw: string): AnswerLevel | null {
  const text = raw.trim().toLowerCase();
  if (!text) return null;
  // Negation is checked per clause so “不看影片，但會開熱點工作” isn't read as no usage.
  const clauses = text.split(/[，,。；;！!？?]|但是|不過|但|所以/).map(s => s.trim());
  const scores: number[] = [];
  for (const original of clauses) {
    let clause = original;
    if (step === 1 && /(?:不超過|不到|少於|最多).*(?:半小時|30\s*分)/.test(clause)) { scores.push(1); continue; }
    if (/wifi|wi-fi|飯店|酒店/.test(clause) && /才|只|回|用|連/.test(clause) && !/不|沒/.test(clause)) { scores.push(0); continue; }
    // Remove only a negated activity, not the remainder (e.g. 不用導航只看影片).
    clause = clause.replace(/(?:幾乎不|不太|不會|不用|不需要|不|沒有)(?:會|需要|用|看|開|分享|上傳|滑)?(?:導航|影片|影音|熱點|照片|社群|直播|視訊|筆電|電腦)/g, () => { scores.push(0); return ''; });
    if (/^(?:幾乎不看|不太看|不太會|不會|不用|不需要|沒有|從不|不看|不開|不分享)$/.test(clause)) { scores.push(0); continue; }
    if (step === 0) {
      if (/直播|追劇|影片|youtube|netflix|筆電|工作|視訊|熱點/.test(clause)) scores.push(2);
      else if (/照片|限動|社群|ig|instagram|上傳|打卡/.test(clause)) scores.push(1);
      else if (/導航|找路|地圖|訊息|line|餐廳|查資料|店家/.test(clause)) scores.push(0);
    } else if (step === 1) {
      if (/一小時|[1-9]\s*小時|60\s*分|直播|追劇|整天|很多|經常|一直/.test(clause)) scores.push(2);
      else if (/半小時|30\s*分|偶爾|一下|短影音|影片|youtube|抖音|tiktok/.test(clause)) scores.push(1);
      else if (/零|0\s*分|從不/.test(clause)) scores.push(0);
    } else {
      if (/筆電|電腦|工作|視訊|每天|經常|整天|多台/.test(clause)) scores.push(2);
      else if (/偶爾|朋友|分享|熱點|平板/.test(clause)) scores.push(1);
      else if (/自己|一台|單人|個人/.test(clause)) scores.push(0);
    }
  }
  return scores.length ? Math.max(...scores) as AnswerLevel : null;
}
export function recommendUsage(answers: AdvisorAnswer[]): Usage {
  if (answers.length !== 3) throw new Error('Three answers are required');
  const total = answers.reduce((sum, answer) => sum + answer.level, 0);
  return answers.some(a => a.level === 2) || total >= 4 ? 'heavy' : total >= 1 ? 'normal' : 'light';
}

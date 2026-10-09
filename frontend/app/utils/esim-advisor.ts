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

export const advisorMemoryKey = 'chictrip-esim-advisor-memory-v1';
export interface AdvisorMemory { answers: AdvisorAnswer[]; savedAt: string }
export function readAdvisorMemory(value: unknown): AdvisorMemory | null {
  if (!value || typeof value !== 'object') return null;
  const memory = value as Partial<AdvisorMemory>;
  if (typeof memory.savedAt !== 'string' || !Number.isFinite(Date.parse(memory.savedAt)) || !Array.isArray(memory.answers) || memory.answers.length !== 3) return null;
  if (!memory.answers.every(a => a && [0,1,2].includes(a.level) && typeof a.text === 'string' && a.text.length <= 280 && ['preset','text'].includes(a.source))) return null;
  return { savedAt: memory.savedAt, answers: memory.answers.map(a => ({level:a.level,text:a.text,source:a.source})) };
}
export function journeyQuestions(preferences: string[] = [], previous: AdvisorMemory | null = null) {
  const scene = preferences.includes('food') ? '找到一間喜歡的咖啡店' : preferences.includes('nature') ? '遇見一片漂亮的風景' : preferences.includes('culture') ? '走進喜歡的老街' : preferences.includes('play') ? '遇到喜歡的樂園角色' : preferences.includes('shopping') ? '逛到喜歡的特色小店' : '遇到值得記錄的旅行瞬間';
  return [
    { ...advisorQuestions[0]!, chapter: '記錄旅途', title: `${scene}，你會？`, hint: '照片怎麼分享，比拍了幾張更影響流量。', options: ['先收藏，回到 Wi-Fi 再上傳', '現場傳照片、發幾則限動', '直接開直播，分享整段風景'], captions: ['網路留給找路、查店家與聯絡', '邊玩邊分享，讓朋友跟上旅程', '即時影音，也可能隨時處理工作'], source: preferences.length ? '依已保存的旅行偏好調整情境' : '從你的旅行日常開始' },
    { ...advisorQuestions[1]!, chapter: '移動空檔', title: previous ? '上次的搭車習慣，這趟也一樣嗎？' : '搭車的空檔，你想怎麼過？', hint: '用行動網路看多久，是這一題的關鍵。', options: ['看窗外，影片先下載好', '滑一下短影音，半小時內', '追劇或看直播，每天一小時以上'], captions: ['離線內容、聽已下載的音樂', '每天少量串流，打發移動時間', '長時間串流，預留更多高速流量'], source: previous ? `上次回答：${previous.answers[1]!.text}` : '想像從飯店出發後的移動時間' },
    { ...advisorQuestions[2]!, chapter: '一起連線', title: previous ? '這次還是同樣的連線方式嗎？' : '這趟旅行，誰會用你的網路？', hint: '同行不一定要共用網路，照實際安排選就好。', options: ['自己的手機，各自有網路', '偶爾開熱點，幫朋友查資料', '經常連筆電、工作或分享熱點'], captions: ['專心照顧自己的旅途', '需要時幫旅伴一把', '多裝置上網，需要較多餘裕'], source: previous ? `上次回答：${previous.answers[2]!.text}` : '確認手機以外的連線需求' },
  ];
}

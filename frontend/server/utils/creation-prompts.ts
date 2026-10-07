import formats from '../../app/data/memory-formats.json' with { type: 'json' };
import contract from '../../app/data/creation-format-contract.json' with { type: 'json' };
import type { CreationId } from '../../app/data/creation.ts';

// 四種真的生成的風格。prompt 範本與比例直接讀 scott 定的格式規格（app/data/memory-formats.json、
// creation-format-contract.json），這裡不另外抄一份，規格改了生成跟著改。
// 範本裡的 {{sourceAnchors}} 這類空格要先看過照片才填得出來，所以分兩步：Flash 看照片（analysisPrompt）→ 生圖模型
type RealStyle = 'sticker' | 'photo' | 'ticket' | 'pin';

export interface PhotoAnalysis {
    sourceAnchors: string;
    sixMotifs: string[];
    threeKeywords: string[];
    mainLandmark: string;
    supportingCues: string[];
    placeName: string;
}

const formatById = (id: string) => formats.formats.find(f => f.id === id) as { promptTemplate: string; aspectRatio: string };
const templates: Record<RealStyle, string> = {
    sticker: formatById('sticker').promptTemplate,
    ticket: formatById('ticket').promptTemplate,
    pin: formatById('pin').promptTemplate,
    photo: (contract.formats.find(f => f.id === 'photo') as { promptTemplate: string }).promptTemplate,
};
export const STYLE_ASPECT = {
    sticker: formatById('sticker').aspectRatio,
    ticket: formatById('ticket').aspectRatio,
    pin: formatById('pin').aspectRatio,
} as const;

// 規格的共同規則（memory-formats.json 的 globalRules）：不捏造照片與上下文沒有的日期、人物、地標
const globalRule = 'Do not invent dates, people or landmarks that are not in the source photo or stated here.';

export const needsAnalysis = (styleId: CreationId) => styleId !== 'photo';

export function analysisPrompt(location: string) {
    return [
        `This travel photo was taken at: ${location}.`,
        'Describe only what is actually visible, in short plain English, for an illustrator who will redraw it.',
        'sourceAnchors: one sentence (max 30 words) naming the 2-3 most recognizable visual elements and where they are in the frame.',
        'sixMotifs: exactly 6 distinct objects or details visible in the photo that would work as separate stickers (2-5 words each).',
        'threeKeywords: exactly 3 single English words in Title Case that sum up the scene.',
        'mainLandmark: the main subject or landmark (short phrase).',
        'supportingCues: up to 2 short phrases for secondary visual cues.',
        'placeName: a short English place name (max 4 words) for a ticket title, based on the stated location if the photo is consistent with it.',
    ].join('\n');
}

export const ANALYSIS_SCHEMA = {
    type: 'object',
    properties: {
        sourceAnchors: { type: 'string' },
        sixMotifs: { type: 'array', items: { type: 'string' } },
        threeKeywords: { type: 'array', items: { type: 'string' } },
        mainLandmark: { type: 'string' },
        supportingCues: { type: 'array', items: { type: 'string' } },
        placeName: { type: 'string' },
    },
    required: ['sourceAnchors', 'sixMotifs', 'threeKeywords', 'mainLandmark', 'supportingCues', 'placeName'],
};

const cleanText = (value: unknown, max: number) => typeof value === 'string' ? value.trim().slice(0, max) : '';
const cleanList = (value: unknown) => Array.isArray(value) ? value.map(item => cleanText(item, 60)).filter(Boolean) : [];

// 模型多給的只取需要的數量；少給或缺欄位就當失敗，讓這件作品退回預製圖
export function parseAnalysis(text: string): PhotoAnalysis | null {
    let raw: Record<string, unknown>;
    try {
        raw = JSON.parse(text);
    } catch {
        return null;
    }
    const result = {
        sourceAnchors: cleanText(raw.sourceAnchors, 300),
        sixMotifs: cleanList(raw.sixMotifs).slice(0, 6),
        threeKeywords: cleanList(raw.threeKeywords).slice(0, 3),
        mainLandmark: cleanText(raw.mainLandmark, 80),
        supportingCues: cleanList(raw.supportingCues).slice(0, 2),
        placeName: cleanText(raw.placeName, 60),
    };
    const complete = result.sourceAnchors && result.mainLandmark && result.placeName && result.sixMotifs.length === 6 && result.threeKeywords.length === 3;
    return complete ? result : null;
}

export function buildPrompt(styleId: RealStyle, analysis: PhotoAnalysis | null, meta: { startDate: string }) {
    if (styleId === 'photo') return templates.photo;
    if (!analysis) throw new Error(`${styleId} 需要先分析照片`);
    const values: Record<string, string> = {
        sourceAnchors: analysis.sourceAnchors,
        sixMotifs: analysis.sixMotifs.join('; '),
        threeKeywords: analysis.threeKeywords.join(' · '),
        mainLandmark: analysis.mainLandmark,
        supportingCues: analysis.supportingCues.join(', ') || 'none',
        verifiedTitle: analysis.placeName,
        // 票根只放真的有的資料：行程出發日（memory-formats.json 的票根規則）
        verifiedMetadataOrBlank: meta.startDate.replaceAll('-', '.'),
    };
    const filled = templates[styleId].replace(/\{\{(\w+)\}\}/g, (_, key: string) => values[key] ?? '');
    return `${filled} ${globalRule}`;
}

// 專業攝影保留原圖比例：從生圖模型支援的比例裡挑最接近的；示範照片不知道尺寸時用 4:3
const supported = ['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9'] as const;
export function nearestAspect(width: number | null, height: number | null) {
    if (!width || !height) return '4:3';
    const target = Math.log(width / height);
    const ratio = (value: string) => {
        const [w, h] = value.split(':').map(Number);
        return Math.log(w! / h!);
    };
    return supported.reduce((best, item) => Math.abs(ratio(item) - target) < Math.abs(ratio(best) - target) ? item : best);
}

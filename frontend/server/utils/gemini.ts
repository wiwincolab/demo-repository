import { GoogleGenAI } from '@google/genai';
import type { AppConfig } from './config.ts';
import type { ImageMime } from './media.ts';

// 所有 Gemini 呼叫集中在這裡（只有文字與看照片；AI 創作的成品一律用預製圖或本機合成，不呼叫生圖模型）。
// 用新版 interactions API；store: false：評審的照片不留在 Google 的互動紀錄裡。
// 不設 temperature：Gemini 3 官方要求用預設值，壓低反而容易重複輸出
export interface SourceImage { bytes: Uint8Array; mime: ImageMime; width: number | null; height: number | null }

let client: GoogleGenAI | undefined;
const ai = (config: AppConfig) => {
    if (!config.geminiApiKey) throw new Error('沒有設定 GEMINI_API_KEY');
    client ??= new GoogleGenAI({ apiKey: config.geminiApiKey });
    return client;
};
const imageInput = (image: SourceImage) => ({ type: 'image' as const, mime_type: image.mime, data: Buffer.from(image.bytes).toString('base64') });
// maxRetries: 0：SDK 遇到 429 會照回應裡的等待時間再試，10/7 本機實測預設要白等 40 秒、只重試一次也要 65 秒才失敗。
// 現場寧可馬上改用範本。逾時交給 SDK 才會真的中斷請求、不在背景繼續吃額度

// 短文字（貼文文案、推薦理由）：api 直接呼叫、不排隊，純文字幾秒就回來；呼叫端自己準備失敗時的範本
export async function writeText(config: AppConfig, prompt: string, timeoutMs = 15_000) {
    const interaction = await ai(config).interactions.create({
        model: config.textModel,
        store: false,
        input: [{ type: 'text', text: prompt }],
    }, { maxRetries: 0, timeout: timeoutMs });
    const text = (interaction.output_text ?? '').trim();
    if (!text) throw new Error('模型沒有回傳文字');
    return text;
}

// 照 JSON schema 回答（照片分類、每日卡片挑照片）；有照片就依序一起送。回傳原始文字，呼叫端自己驗證格式
export async function writeJson(config: AppConfig, prompt: string, schema: Record<string, unknown>, timeoutMs: number, images: SourceImage | SourceImage[] = []) {
    const list = Array.isArray(images) ? images : [images];
    const interaction = await ai(config).interactions.create({
        model: config.textModel,
        store: false,
        input: [...list.map(imageInput), { type: 'text', text: prompt }],
        response_format: { type: 'text', mime_type: 'application/json', schema },
    }, { maxRetries: 0, timeout: timeoutMs });
    return interaction.output_text ?? '';
}

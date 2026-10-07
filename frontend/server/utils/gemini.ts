import { GoogleGenAI } from '@google/genai';
import type { AppConfig } from './config.ts';
import { ANALYSIS_SCHEMA, analysisPrompt, parseAnalysis, type PhotoAnalysis } from './creation-prompts.ts';
import { sniffImageType, type ImageMime } from './media.ts';

// 所有 Gemini 呼叫集中在這裡。用新版 interactions API（官方生圖文件只剩這種寫法），
// store: false：評審的照片不留在 Google 的互動紀錄裡。
// 不設 temperature：Gemini 3 官方要求用預設值，壓低反而容易重複輸出
export interface SourceImage { bytes: Uint8Array; mime: ImageMime; width: number | null; height: number | null }

let client: GoogleGenAI | undefined;
const ai = (config: AppConfig) => {
    if (!config.geminiApiKey) throw new Error('沒有設定 GEMINI_API_KEY');
    client ??= new GoogleGenAI({ apiKey: config.geminiApiKey });
    return client;
};
const imageInput = (image: SourceImage) => ({ type: 'image' as const, mime_type: image.mime, data: Buffer.from(image.bytes).toString('base64') });
// 不重試：SDK 遇到 429 會照回應裡的等待時間再試，10/7 本機實測預設要白等 40 秒、只重試一次也要 65 秒才失敗。
// 現場寧可馬上退回預製圖。逾時交給 SDK 才會真的中斷請求、不在背景繼續吃額度
const requestOptions = (config: AppConfig) => ({ maxRetries: 0, timeout: config.jobTimeoutMs });

export async function analyzePhoto(config: AppConfig, image: SourceImage, location: string): Promise<PhotoAnalysis> {
    const interaction = await ai(config).interactions.create({
        model: config.textModel,
        store: false,
        input: [imageInput(image), { type: 'text', text: analysisPrompt(location) }],
        response_format: { type: 'text', mime_type: 'application/json', schema: ANALYSIS_SCHEMA },
    }, requestOptions(config));
    const analysis = parseAnalysis(interaction.output_text ?? '');
    if (!analysis) throw new Error(`照片分析的格式不對：${(interaction.output_text ?? '').slice(0, 200)}`);
    return analysis;
}

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

// 照 JSON schema 回答（Bingo 出題、看照片判斷任務）；有照片就一起送。回傳原始文字，呼叫端自己驗證格式
export async function writeJson(config: AppConfig, prompt: string, schema: Record<string, unknown>, timeoutMs: number, image?: SourceImage) {
    const interaction = await ai(config).interactions.create({
        model: config.textModel,
        store: false,
        input: image ? [imageInput(image), { type: 'text', text: prompt }] : [{ type: 'text', text: prompt }],
        response_format: { type: 'text', mime_type: 'application/json', schema },
    }, { maxRetries: 0, timeout: timeoutMs });
    return interaction.output_text ?? '';
}

export async function generateStyledImage(config: AppConfig, prompt: string, image: SourceImage, aspectRatio: string) {
    // 1K：一張 US$0.0336，手機畫面與分享卡都夠用；2K 價格多五成
    const interaction = await ai(config).interactions.create({
        model: config.imageModel,
        store: false,
        input: [{ type: 'text', text: prompt }, imageInput(image)],
        response_format: { type: 'image', aspect_ratio: aspectRatio, image_size: '1K' },
    }, requestOptions(config));
    const data = interaction.output_image?.data;
    if (!data) throw new Error(`模型沒有回傳圖片：${(interaction.output_text ?? '').slice(0, 200)}`);
    const bytes = Buffer.from(data, 'base64');
    const mime = sniffImageType(bytes);
    if (!mime) throw new Error('模型回傳的不是 JPG／PNG／WebP');
    return { bytes, mime };
}

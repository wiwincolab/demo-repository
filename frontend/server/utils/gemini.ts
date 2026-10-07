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

export async function analyzePhoto(config: AppConfig, image: SourceImage, location: string): Promise<PhotoAnalysis> {
    const interaction = await ai(config).interactions.create({
        model: config.textModel,
        store: false,
        input: [imageInput(image), { type: 'text', text: analysisPrompt(location) }],
        response_format: { type: 'text', mime_type: 'application/json', schema: ANALYSIS_SCHEMA },
    });
    const analysis = parseAnalysis(interaction.output_text ?? '');
    if (!analysis) throw new Error(`照片分析的格式不對：${(interaction.output_text ?? '').slice(0, 200)}`);
    return analysis;
}

export async function generateStyledImage(config: AppConfig, prompt: string, image: SourceImage, aspectRatio: string) {
    // 1K：一張 US$0.0336，手機畫面與分享卡都夠用；2K 價格多五成
    const interaction = await ai(config).interactions.create({
        model: config.imageModel,
        store: false,
        input: [{ type: 'text', text: prompt }, imageInput(image)],
        response_format: { type: 'image', aspect_ratio: aspectRatio, image_size: '1K' },
    });
    const data = interaction.output_image?.data;
    if (!data) throw new Error(`模型沒有回傳圖片：${(interaction.output_text ?? '').slice(0, 200)}`);
    const bytes = Buffer.from(data, 'base64');
    const mime = sniffImageType(bytes);
    if (!mime) throw new Error('模型回傳的不是 JPG／PNG／WebP');
    return { bytes, mime };
}

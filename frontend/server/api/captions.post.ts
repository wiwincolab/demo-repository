import { creationStyles } from '../../app/data/creation.ts';

// 「AI 幫我寫」：同步呼叫 Flash，15 秒內沒回來就用範本，按鈕不會卡住
export default defineEventHandler(async event => {
    const body = await readBody<{ location?: unknown; styleId?: unknown }>(event) ?? {};
    const location = String(body.location ?? '').trim().slice(0, 60) || '這趟旅行';
    const styleName = creationStyles.find(style => style.id === body.styleId)?.name ?? '旅行作品';
    await requireDevice(event);
    const started = Date.now();
    try {
        const caption = cleanCaption(await writeText(readConfig(), captionPrompt(location, styleName)));
        console.info(`[api] stage=caption result=ai ms=${Date.now() - started}`);
        return { caption, ai: true };
    } catch (error) {
        console.warn(`[api] stage=caption result=fallback ms=${Date.now() - started} error=${error instanceof Error ? error.message.slice(0, 160) : error}`);
        return { caption: fallbackCaption(location), ai: false };
    }
});

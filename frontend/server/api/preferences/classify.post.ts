import { interpretPreferenceText, preferenceInputLimit } from '../../../app/utils/preference-memory.ts';
import { parsePreferenceResponse, preferencePrompt, preferenceResponseSchema } from '../../utils/preference-classifier.ts';
import { readConfig } from '../../utils/config.ts';
import { writeJson } from '../../utils/gemini.ts';

// Classification is stateless: preferences are saved by the browser only. It
// does not require the photo database or write a profile on the server.
export default defineEventHandler(async event => {
  setResponseHeader(event, 'Cache-Control', 'no-store');
  const body = await readBody<{ text?: unknown }>(event);
  if (typeof body?.text !== 'string' || !body.text.trim() || body.text.length > preferenceInputLimit) {
    throw createError({ statusCode: 400, statusMessage: '請輸入一到五百字的個人喜好' });
  }
  const text = body.text.trim();
  const config = readConfig();
  if (config.geminiApiKey) {
    try {
      const preferences = parsePreferenceResponse(await writeJson(config, preferencePrompt(text), preferenceResponseSchema, 12_000), text);
      if (preferences) return { preferences, mode: 'ai' as const };
    } catch { /* No statement or credential is written to logs. */ }
  }
  return { preferences: interpretPreferenceText(text), mode: 'local' as const };
});

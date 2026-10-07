import { tripItineraries, tripSummaries } from '../../../app/data/trips.ts';
import { recommendUsage, type AdvisorAnswer } from '../../../app/utils/esim-advisor.ts';
import { esimPlan } from '../../../app/utils/esim.ts';

// AI 流量顧問的推薦理由（有後端時）：方案照規則重算一次（不信任前端傳來的結果），Gemini 只寫理由；
// 12 秒內沒回來、或理由裡有數字，就用方案原本的說明
export default defineEventHandler(async event => {
    const body = await readBody<{ tripId?: unknown; answers?: unknown }>(event) ?? {};
    if (!isTripId(body.tripId)) throw createError({ statusCode: 400, statusMessage: '行程不存在' });
    const answers = Array.isArray(body.answers) ? body.answers.filter((a): a is AdvisorAnswer => [0, 1, 2].includes(a?.level) && typeof a?.text === 'string') : [];
    if (answers.length !== 3) throw createError({ statusCode: 400, statusMessage: '需要三個回答' });
    await requireDevice(event);

    const trip = tripSummaries.find(item => item.id === body.tripId)!;
    const usage = recommendUsage(answers);
    const plan = esimPlan(usage, trip.dayCount);
    const stops = tripItineraries[trip.id].flatMap(day => day.stops).map(stop => stop.name);
    const started = Date.now();
    try {
        const prompt = reasonPrompt({ tripTitle: trip.title, stops, answers: answers.map(a => a.text.slice(0, 120)), tier: plan.label, unlimited: plan.unlimited });
        const reason = acceptReason(await writeText(readConfig(), prompt, 12_000));
        console.info(`[api] stage=esim_reason result=${reason ? 'ai' : 'rejected'} ms=${Date.now() - started}`);
        if (reason) return { usage, reason, ai: true };
    } catch (error) {
        console.warn(`[api] stage=esim_reason result=fallback ms=${Date.now() - started} error=${error instanceof Error ? error.message.slice(0, 160) : error}`);
    }
    return { usage, reason: plan.reason, ai: false };
});

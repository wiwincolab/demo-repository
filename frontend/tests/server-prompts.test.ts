import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseAnalysis, buildPrompt, nearestAspect, needsAnalysis, STYLE_ASPECT, type PhotoAnalysis } from '../server/utils/creation-prompts.ts';

const contract = JSON.parse(readFileSync(new URL('../app/data/creation-format-contract.json', import.meta.url), 'utf8'));
const analysis: PhotoAnalysis = {
    sourceAnchors: 'a brown deer at left, a gray-roof pavilion over a pond at right',
    sixMotifs: ['full deer', 'deer head', 'pavilion', 'cherry branch', 'pond rock', 'rope fence'],
    threeKeywords: ['Spring', 'Deer', 'Pond'],
    mainLandmark: 'Ukimido pavilion',
    supportingCues: ['pond', 'cherry blossoms'],
    placeName: 'Nara Park',
};
const json = (value: unknown) => JSON.stringify(value);

test('analysis must have six motifs, three keywords and every text field', () => {
    assert.deepEqual(parseAnalysis(json(analysis)), analysis);
    assert.equal(parseAnalysis(json({ ...analysis, sixMotifs: analysis.sixMotifs.slice(0, 5) })), null);
    assert.equal(parseAnalysis(json({ ...analysis, mainLandmark: '' })), null);
    assert.equal(parseAnalysis('not json'), null);
    // 多給的只取需要的數量，不因為模型多寫一個就整件退回
    const extra = parseAnalysis(json({ ...analysis, sixMotifs: [...analysis.sixMotifs, 'lantern'], supportingCues: ['a', 'b', 'c'] }));
    assert.equal(extra?.sixMotifs.length, 6);
    assert.equal(extra?.supportingCues.length, 2);
});

test('style prompts are filled from the analysis with no placeholders left', () => {
    for (const style of ['sticker', 'ticket', 'pin'] as const) {
        const prompt = buildPrompt(style, analysis, { startDate: '2026-04-03' });
        assert.doesNotMatch(prompt, /\{\{/);
    }
    assert.match(buildPrompt('sticker', analysis, { startDate: '2026-04-03' }), /full deer; deer head; pavilion; cherry branch; pond rock; rope fence/);
    assert.match(buildPrompt('ticket', analysis, { startDate: '2026-04-03' }), /Nara Park/);
    assert.match(buildPrompt('ticket', analysis, { startDate: '2026-04-03' }), /2026\.04\.03/);
    assert.match(buildPrompt('pin', analysis, { startDate: '2026-04-03' }), /Ukimido pavilion/);
});

test('professional photo uses the contract template and needs no analysis', () => {
    const photo = contract.formats.find((f: { id: string }) => f.id === 'photo').promptTemplate;
    assert.equal(buildPrompt('photo', null, { startDate: '2026-04-03' }), photo);
    assert.equal(needsAnalysis('photo'), false);
    assert.equal(needsAnalysis('sticker'), true);
    assert.throws(() => buildPrompt('pin', null, { startDate: '2026-04-03' }));
});

test('card formats keep their fixed ratio and photos keep the closest supported one', () => {
    assert.equal(STYLE_ASPECT.sticker, '3:2');
    assert.equal(STYLE_ASPECT.ticket, '3:4');
    assert.equal(STYLE_ASPECT.pin, '1:1');
    assert.equal(nearestAspect(1600, 1200), '4:3');
    assert.equal(nearestAspect(1080, 1920), '9:16');
    assert.equal(nearestAspect(1600, 1066), '3:2');
    assert.equal(nearestAspect(null, null), '4:3');
});

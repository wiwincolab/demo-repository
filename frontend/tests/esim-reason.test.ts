import test from 'node:test';
import assert from 'node:assert/strict';
import { reasonPrompt, acceptReason } from '../server/utils/esim-reason.ts';

const input = {
    tripTitle: '關西，和朋友一起。',
    stops: ['北野異人館街', '天橋立', '伊根舟屋', '奈良公園', '環球影城'],
    answers: ['上傳照片、發限動、滑社群', '偶爾滑一下，每天半小時內', '只給自己的手機使用'],
    tier: '中度',
    unlimited: false,
};

test('the prompt carries the trip stops and the visitor’s own answers but no prices', () => {
    const prompt = reasonPrompt(input);
    for (const text of [...input.stops, ...input.answers, '中度']) assert.ok(prompt.includes(text), text);
    assert.match(prompt, /不要寫任何數字/);
    assert.doesNotMatch(prompt, /NT\$|\d+ ?GB/);
});

test('AI reasons with any digit are rejected so no price or data amount is invented', () => {
    assert.equal(acceptReason('你會在奈良公園拍很多照片，每天 2GB 剛好。'), null);
    assert.equal(acceptReason('一天要價２０８元'), null);
    assert.equal(acceptReason(''), null);
    assert.equal(acceptReason('「你會在奈良公園拍很多照片上傳限動，選每日定量剛好夠用。」'), '你會在奈良公園拍很多照片上傳限動，選每日定量剛好夠用。');
    assert.equal(acceptReason('長'.repeat(300)), null);
});

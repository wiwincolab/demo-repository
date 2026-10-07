import test from 'node:test';
import assert from 'node:assert/strict';
import { storyLayout } from '../app/utils/story-card.ts';
import { captionPrompt, cleanCaption, fallbackCaption } from '../server/utils/captions.ts';

test('artwork keeps its ratio inside the story card box', () => {
    // 3:2 貼紙卡：寬度撐滿 920
    assert.deepEqual(storyLayout(1500, 1000), { x: 80, y: 454, width: 920, height: 613 });
    // 3:4 票根：高度撐滿 1080、水平置中
    assert.deepEqual(storyLayout(900, 1200), { x: 135, y: 220, width: 810, height: 1080 });
});

test('the caption prompt forbids prices and invented details, and asks for #去趣', () => {
    const prompt = captionPrompt('奈良 · 鹿公園', '貼紙卡');
    assert.match(prompt, /奈良 · 鹿公園/);
    assert.match(prompt, /#去趣/);
    assert.match(prompt, /不要寫價格/);
});

test('captions are unwrapped from quotes or code fences and capped at 300 characters', () => {
    assert.equal(cleanCaption('「鹿比我還餓。」'), '鹿比我還餓。');
    assert.equal(cleanCaption('```\n鹿比我還餓\n```'), '鹿比我還餓');
    assert.equal(cleanCaption('字'.repeat(400)).length, 300);
});

test('the fallback caption names the place and keeps the brand hashtag', () => {
    const caption = fallbackCaption('奈良 · 鹿公園');
    assert.match(caption, /^把 奈良 /);
    assert.match(caption, /#去趣$/);
});

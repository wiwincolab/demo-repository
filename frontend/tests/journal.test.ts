import test from 'node:test';
import assert from 'node:assert/strict';
import { dHashFromGray, hamming } from '../app/utils/image-hash.ts';
import { taipeiDate, dedupe, memberStats, parseTag, parsePicks } from '../server/utils/journal.ts';

test('the fingerprint compares each pixel with its right neighbour', () => {
    const rising = Array.from({ length: 72 }, (_, i) => i % 9);           // 每列由暗到亮：全部 0
    const falling = Array.from({ length: 72 }, (_, i) => 8 - (i % 9));    // 每列由亮到暗：全部 1
    assert.equal(dHashFromGray(rising), '0000000000000000');
    assert.equal(dHashFromGray(falling), 'ffffffffffffffff');
    assert.equal(hamming('0000000000000000', 'ffffffffffffffff'), 64);
    assert.equal(hamming('00000000000000ff', '0000000000000000'), 8);
});

test('days follow Taipei time, not UTC', () => {
    assert.equal(taipeiDate(new Date('2026-10-07T15:59:00Z')), '2026-10-07');
    assert.equal(taipeiDate(new Date('2026-10-07T16:01:00Z')), '2026-10-08');
});

test('near-identical photos from the same day collapse into the first one', () => {
    const photos = [
        { id: 'a', hash: '0000000000000000', day: '2026-10-07' },
        { id: 'b', hash: '0000000000000003', day: '2026-10-07' },  // 只差 2 位元：同一張連拍
        { id: 'c', hash: 'ffffffffffffffff', day: '2026-10-07' },
        { id: 'd', hash: '0000000000000000', day: '2026-10-08' },  // 不同天就不算重複
        { id: 'e', hash: null, day: '2026-10-07' },               // 沒有指紋的照片照常保留
    ];
    const { kept, hidden } = dedupe(photos, 6);
    assert.deepEqual(kept.map(p => p.id), ['a', 'c', 'd', 'e']);
    assert.equal(hidden, 1);
});

test('stats give each fun title to whoever leads it, and skip titles nobody earned', () => {
    const photos = [
        { owner: 'me', nickname: '小安', tag: 'food' }, { owner: 'me', nickname: '小安', tag: 'food' },
        { owner: 'b', nickname: '阿哲', tag: 'scenery' }, { owner: 'b', nickname: '阿哲', tag: 'people' }, { owner: 'b', nickname: '阿哲', tag: null },
    ];
    const stats = memberStats(photos, [{ owner: 'b', nickname: '阿哲' }], 'me');
    assert.deepEqual(stats.titles.map(t => `${t.title}:${t.nickname}`), ['拍最多張:阿哲', '最愛拍食物:小安', '風景攝影師:阿哲', '人像擔當:阿哲', 'Bingo 達人:阿哲']);
    // 沒人拍過的類別不給稱號
    assert.ok(!memberStats([{ owner: 'me', nickname: '小安', tag: 'scenery' }], [], 'me').titles.some(t => t.title === '最愛拍食物'));
    assert.deepEqual(stats.members.map(m => [m.nickname, m.photos, m.me]), [['阿哲', 3, false], ['小安', 2, true]]);
});

test('tags and daily picks must be valid, picks within range', () => {
    assert.equal(parseTag('{"tag":"food"}'), 'food');
    assert.equal(parseTag('{"tag":"cat"}'), null);
    const picks = parsePicks('{"title":"奈良好熱鬧","cover":2,"food":0,"surprise":5,"coverCaption":"鹿在搶仙貝","foodCaption":"抹茶冰","surpriseCaption":"轉角有貓"}', 4);
    assert.equal(picks?.cover, 2);
    assert.equal(picks?.food, 0);
    assert.equal(picks?.surprise, null);   // 5 超出 4 張照片的範圍，當作沒挑
    assert.equal(parsePicks('{"title":"x","cover":9}', 4), null);  // 代表照片挑錯就整張不用
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { longImageHeight } from '../app/utils/journal-card.ts';
import { dayLabel, pickedUrl, type DailyCard } from '../app/utils/journal-api.ts';

test('the long image grows with the number of days and titles', () => {
    assert.ok(longImageHeight(3, 4) > longImageHeight(1, 4));
    assert.equal(longImageHeight(2, 3) - longImageHeight(1, 3), 640 + 300 + 300);
});

test('day labels read naturally in Chinese', () => {
    assert.equal(dayLabel('2026-10-07'), '10 月 7 日');
});

test('picked photos map back to the media ids of that card', () => {
    const card: DailyCard = { id: 'c', day: '2026-10-07', status: 'done', mediaIds: ['a', 'b'], picks: null };
    assert.equal(pickedUrl(card, 1), '/api/media/b');
    assert.equal(pickedUrl(card, null), null);
    assert.equal(pickedUrl(card, 5), null);
});

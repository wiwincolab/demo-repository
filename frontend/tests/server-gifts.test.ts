import test from 'node:test';
import assert from 'node:assert/strict';
import { giftView } from '../server/utils/gifts.ts';

const row = { id: 'abcd2345', trip_id: 'kansai' as const, usage: 'normal' as const, sender_device_id: 'sender', sender_nickname: '小安', claimed_device_id: null, claimer_nickname: null, claimed_at: null, created_at: new Date('2026-10-07T10:00:00Z') };

test('the sender sees their own gift as unclaimed and cannot claim it', () => {
    const view = giftView(row, 'sender');
    assert.equal(view.mine, true);
    assert.equal(view.claimed, false);
    assert.equal(view.canClaim, false);
    assert.equal(view.url, '/g/abcd2345');
});

test('a friend can claim an unclaimed gift; after that nobody else can', () => {
    assert.equal(giftView(row, 'friend').canClaim, true);
    const claimed = { ...row, claimed_device_id: 'friend', claimer_nickname: '阿哲', claimed_at: new Date('2026-10-07T10:05:00Z') };
    assert.equal(giftView(claimed, 'friend').claimedByMe, true);
    assert.equal(giftView(claimed, 'other').canClaim, false);
    assert.equal(giftView(claimed, 'sender').claimedBy, '阿哲');
});

test('names fall back when nobody has set a nickname', () => {
    const view = giftView({ ...row, sender_nickname: null, claimed_device_id: 'x', claimed_at: new Date() }, 'sender');
    assert.equal(view.sender, '一位旅人');
    assert.equal(view.claimedBy, '朋友');
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { memberView, MAX_MEMBERS } from '../server/utils/groups.ts';

const at = (s: number) => new Date(Date.UTC(2026, 9, 7, 10, 0, s));
const rows = [
    { device_id: 'owner', nickname: '小安', paid: true, paid_usage: 'normal', joined_at: at(0), owner: true },
    { device_id: 'b', nickname: null, paid: false, paid_usage: null, joined_at: at(20), owner: false },
    { device_id: 'me', nickname: '阿哲', paid: false, paid_usage: null, joined_at: at(10), owner: false },
];

test('the viewer is listed first so pages can keep treating members[0] as "you"', () => {
    const view = memberView(rows, 'me');
    assert.deepEqual(view.map(m => m.nickname), ['阿哲', '小安', '旅伴']);
    assert.deepEqual(view.map(m => m.me), [true, false, false]);
    assert.equal(view[1]!.owner, true);
    assert.equal(view[1]!.usage, 'normal');
});

test('someone outside the group sees members in join order', () => {
    assert.deepEqual(memberView(rows, 'stranger').map(m => m.nickname), ['小安', '阿哲', '旅伴']);
});

test('a group holds at most eight people, like the existing demo', () => {
    assert.equal(MAX_MEMBERS, 8);
});

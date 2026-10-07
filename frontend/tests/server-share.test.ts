import test from 'node:test';
import assert from 'node:assert/strict';
import { shortId, isShortId } from '../server/utils/short-id.ts';
import { publicStops, cleanNickname } from '../server/utils/share.ts';
import { tripItineraries } from '../app/data/trips.ts';
import { migrations } from '../server/utils/migrations.ts';

test('share codes are 8 easy-to-read characters', () => {
    const ids = new Set(Array.from({ length: 200 }, () => shortId()));
    assert.equal(ids.size, 200);
    for (const id of ids) {
        assert.ok(isShortId(id), id);
        assert.doesNotMatch(id, /[01ilo]/);
    }
    assert.ok(!isShortId('abc'));
    assert.ok(!isShortId('../../x1'));
});

test('public stops keep itinerary order, drop unknown ids and duplicates', () => {
    const all = tripItineraries.kansai.flatMap(day => day.stops);
    const [a, b, c] = [all[0]!, all[2]!, all[4]!];
    const stops = publicStops('kansai', [c.id, a.id, 9999, a.id, b.id]);
    assert.deepEqual(stops.map(s => s.id), [a.id, b.id, c.id]);
    assert.ok(stops.every(s => typeof s.name === 'string' && typeof s.day === 'number'));
});

test('nicknames are trimmed to 12 characters and empty ones rejected', () => {
    assert.equal(cleanNickname('  小安  '), '小安');
    assert.equal(cleanNickname('一二三四五六七八九十十一十二'), '一二三四五六七八九十十一');
    assert.equal(cleanNickname('   '), null);
    assert.equal(cleanNickname(42), null);
});

test('the share loop migration comes after the first one and creates its tables', () => {
    assert.equal(migrations[1]?.name, '002_share_loop');
    for (const table of ['shares', 'share_events', 'saved_trips', 'trip_groups', 'group_members', 'gifts'])
        assert.match(migrations[1]!.sql, new RegExp(`create table ${table} \\(`));
});

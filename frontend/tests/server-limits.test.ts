import test from 'node:test';
import assert from 'node:assert/strict';
import { limitDecision, effectiveStatus, runningLimitMs } from '../server/utils/limits.ts';
import { withTimeout } from '../server/utils/timeout.ts';
import { isRealStyle } from '../app/data/creation.ts';

const limits = { deviceDailyLimit: 20, globalDailyLimit: 1000 };

test('a device can make 20 a day and the whole site 1000', () => {
    assert.equal(limitDecision({ deviceToday: 19, globalToday: 500 }, limits), 'ok');
    assert.equal(limitDecision({ deviceToday: 20, globalToday: 500 }, limits), 'device');
    assert.equal(limitDecision({ deviceToday: 3, globalToday: 1000 }, limits), 'global');
    // 兩個都滿時回報裝置的：評審看到「你今天的次數用完了」比較好懂
    assert.equal(limitDecision({ deviceToday: 25, globalToday: 1200 }, limits), 'device');
});

test('work stuck in the queue past the stale limit is shown as the demo fallback', () => {
    const now = new Date('2026-10-07T10:00:00Z');
    const ago = (s: number) => new Date(now.getTime() - s * 1000);
    const limits = { queueStaleMs: 300_000, jobTimeoutMs: 90_000 };
    assert.equal(effectiveStatus({ status: 'queued', created_at: ago(10), started_at: null }, now, limits), 'queued');
    assert.equal(effectiveStatus({ status: 'queued', created_at: ago(301), started_at: null }, now, limits), 'fallback');
    assert.equal(effectiveStatus({ status: 'done', created_at: ago(9999), started_at: ago(9990) }, now, limits), 'done');
});

test('work being made counts from when it started, so a long queue wait does not cut it off', () => {
    const now = new Date('2026-10-07T10:00:00Z');
    const ago = (s: number) => new Date(now.getTime() - s * 1000);
    const limits = { queueStaleMs: 300_000, jobTimeoutMs: 90_000 };
    // 排了 4 分半才開始做、做了 2 分鐘：還在 worker 自己的逾時範圍內（看照片＋生圖各 90 秒）
    assert.equal(effectiveStatus({ status: 'running', created_at: ago(390), started_at: ago(120) }, now, limits), 'running');
    // 開始做之後超過兩次逾時再加 30 秒餘裕：worker 多半掛了
    assert.equal(effectiveStatus({ status: 'running', created_at: ago(400), started_at: ago(211) }, now, limits), 'fallback');
    assert.equal(runningLimitMs(90_000), 210_000);
});

test('only the four 2D styles are generated for real', () => {
    for (const id of ['sticker', 'photo', 'ticket', 'pin']) assert.ok(isRealStyle(id));
    for (const id of ['scene', 'companion', 'other']) assert.ok(!isRealStyle(id));
});

test('withTimeout rejects slow work and passes fast work through', async () => {
    assert.equal(await withTimeout(Promise.resolve(7), 50, 'fast'), 7);
    await assert.rejects(withTimeout(new Promise(() => {}), 20, 'slow'), /slow 逾時/);
});

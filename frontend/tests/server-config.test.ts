import test from 'node:test';
import assert from 'node:assert/strict';
import { readConfig } from '../server/utils/config.ts';

test('defaults match the local docker compose and the agreed limits', () => {
    const config = readConfig({});
    assert.equal(config.role, 'api');
    assert.equal(config.databaseUrl, 'postgres://chictrip:chictrip@127.0.0.1:5434/chictrip');
    assert.equal(config.redisUrl, 'redis://127.0.0.1:6380');
    assert.equal(config.deviceDailyLimit, 20);
    assert.equal(config.globalDailyLimit, 1000);
    assert.equal(config.workerConcurrency, 4);
    assert.equal(config.jobTimeoutMs, 90_000);
    assert.equal(config.queueStaleMs, 300_000);
    assert.equal(config.imageModel, 'gemini-3.1-flash-lite-image');
    assert.equal(config.textModel, 'gemini-3.5-flash-lite');
});

test('worker role and numeric overrides come from the environment', () => {
    const config = readConfig({ CHICTRIP_ROLE: 'worker', DEVICE_DAILY_LIMIT: '5', WORKER_CONCURRENCY: '2' });
    assert.equal(config.role, 'worker');
    assert.equal(config.deviceDailyLimit, 5);
    assert.equal(config.workerConcurrency, 2);
});

test('invalid numbers fall back to defaults instead of disabling limits', () => {
    const config = readConfig({ DEVICE_DAILY_LIMIT: 'abc', GLOBAL_DAILY_LIMIT: '0', JOB_TIMEOUT_MS: '-5' });
    assert.equal(config.deviceDailyLimit, 20);
    assert.equal(config.globalDailyLimit, 1000);
    assert.equal(config.jobTimeoutMs, 90_000);
});

test('an empty model setting keeps the default model', () => {
    assert.equal(readConfig({ IMAGE_MODEL: '' }).imageModel, 'gemini-3.1-flash-lite-image');
});

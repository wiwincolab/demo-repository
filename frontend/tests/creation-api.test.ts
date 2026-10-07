import test from 'node:test';
import assert from 'node:assert/strict';
import { fitWithin } from '../app/utils/image-resize.ts';
import { statusText, photoFromServer, workFromServer } from '../app/utils/creation-api.ts';

test('photos shrink to 1600px on the long side and small ones stay as they are', () => {
    assert.deepEqual(fitWithin(4000, 3000, 1600), { width: 1600, height: 1200 });
    assert.deepEqual(fitWithin(3024, 4032, 1600), { width: 1200, height: 1600 });
    assert.deepEqual(fitWithin(800, 600, 1600), { width: 800, height: 600 });
});

test('the waiting screen says where the work is in the queue', () => {
    assert.equal(statusText('queued', 3), '排隊中，前面還有 3 件');
    assert.equal(statusText('queued', 0), '下一件就輪到你');
    assert.equal(statusText('running'), 'AI 正在製作…');
});

const serverPhoto = { id: '3f2b8c1e-9a4d-4e6f-8b7a-1c2d3e4f5a6b', url: '/api/media/3f2b8c1e-9a4d-4e6f-8b7a-1c2d3e4f5a6b', tripId: 'kansai' as const, title: '奈良', location: '奈良 · 鹿公園', demoPhotoId: 'nara-deer', stopId: 'nara', width: 1600, height: 1200, createdAt: '2026-10-07T08:00:00.000Z' };

test('an uploaded photo keeps the styles of the demo photo it came from', () => {
    const photo = photoFromServer(serverPhoto);
    assert.equal(photo.source, serverPhoto.url);
    assert.deepEqual(photo.styles, ['sticker']);
    assert.equal(photo.demoPhotoId, 'nara-deer');
});

test('a finished server creation becomes a work showing the generated image', () => {
    const photo = photoFromServer(serverPhoto);
    const work = workFromServer({ id: 'a1b2c3d4-0000-4000-8000-000000000001', tripId: 'kansai', styleId: 'pin', photoId: serverPhoto.id, demoPhotoId: null, location: '奈良 · 鹿公園', status: 'done', imageUrl: '/api/media/a1b2c3d4-0000-4000-8000-000000000001', createdAt: '2026-10-07T08:01:00.000Z' }, () => photo);
    assert.equal(work?.renderedImage, '/api/media/a1b2c3d4-0000-4000-8000-000000000001');
    assert.equal(work?.serverId, 'a1b2c3d4-0000-4000-8000-000000000001');
    assert.equal(work?.preset, false);
    assert.ok(!work?.fallback);
});

test('a fallback creation is marked so the page can label it as a demo image', () => {
    const work = workFromServer({ id: 'a1b2c3d4-0000-4000-8000-000000000002', tripId: 'fuji', styleId: 'sticker', photoId: null, demoPhotoId: 'fuji-blue', location: '富士山 · 藍調時刻', status: 'fallback', imageUrl: null, createdAt: '2026-10-07T08:02:00.000Z' }, () => undefined);
    assert.equal(work?.fallback, true);
    assert.equal(work?.renderedImage, undefined);
    assert.equal(work?.image, 'fuji-sticker.png');
});

test('creations still in the queue or with a missing photo are not shown yet', () => {
    const queued = { id: 'a1b2c3d4-0000-4000-8000-000000000003', tripId: 'fuji' as const, styleId: 'pin' as const, photoId: null, demoPhotoId: 'fuji-blue', location: '', status: 'queued' as const, imageUrl: null, createdAt: '' };
    assert.equal(workFromServer(queued, () => undefined), null);
    assert.equal(workFromServer({ ...queued, status: 'done', photoId: '3f2b8c1e-9a4d-4e6f-8b7a-1c2d3e4f5a6b', demoPhotoId: null }, () => undefined), null);
});

test('the stop an upload was filed under comes back from the server and goes onto its works', () => {
    const photo = photoFromServer(serverPhoto);
    assert.equal(photo.stopId, 'nara');
    const work = workFromServer({ id: 'a1b2c3d4-0000-4000-8000-000000000002', tripId: 'kansai', styleId: 'ticket', photoId: serverPhoto.id, demoPhotoId: null, location: '奈良 · 鹿公園', status: 'done', imageUrl: '/api/media/a1b2c3d4-0000-4000-8000-000000000002', createdAt: '2026-10-07T08:02:00.000Z' }, () => photo);
    assert.equal(work?.stopId, 'nara');
    assert.equal(photoFromServer({ ...serverPhoto, stopId: null }).stopId, undefined);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { fitWithin } from '../app/utils/image-resize.ts';
import { photoFromServer } from '../app/utils/creation-api.ts';
import { workForPhoto } from '../app/data/creation.ts';

test('photos shrink to 1600px on the long side and small ones stay as they are', () => {
    assert.deepEqual(fitWithin(4000, 3000, 1600), { width: 1600, height: 1200 });
    assert.deepEqual(fitWithin(3024, 4032, 1600), { width: 1200, height: 1600 });
    assert.deepEqual(fitWithin(800, 600, 1600), { width: 800, height: 600 });
});

const serverPhoto = { id: '3f2b8c1e-9a4d-4e6f-8b7a-1c2d3e4f5a6b', url: '/api/media/3f2b8c1e-9a4d-4e6f-8b7a-1c2d3e4f5a6b', tripId: 'kansai' as const, title: '奈良', location: '奈良 · 鹿公園', demoPhotoId: 'nara-deer', stopId: 'nara', width: 1600, height: 1200, createdAt: '2026-10-07T08:00:00.000Z' };

test('an uploaded photo keeps the styles of the demo photo it came from', () => {
    const photo = photoFromServer(serverPhoto);
    assert.equal(photo.source, serverPhoto.url);
    assert.deepEqual(photo.styles, ['sticker']);
    assert.equal(photo.demoPhotoId, 'nara-deer');
});

test('the stop an upload was filed under comes back from the server and goes onto its works', () => {
    const photo = photoFromServer(serverPhoto);
    assert.equal(photo.stopId, 'nara');
    assert.equal(workForPhoto(photo, 'ticket').stopId, 'nara');
    assert.equal(photoFromServer({ ...serverPhoto, stopId: null }).stopId, undefined);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { creationStyles, photosForTrip, photoById, styleForPhoto, workForPhoto, restoreCreationWork } from '../app/data/creation.ts';

test('legacy Fuji works retain their source trip; received works retain both trip and origin', () => {
  const legacy = { id: 'old-sticker', creator: '你', createdAt: '2026-04-08', styleId: 'sticker', image: 'fuji-sticker.png', title: '貼紙卡', location: '富士山' };
  assert.equal(restoreCreationWork(legacy)?.tripId, 'fuji');
  assert.equal(restoreCreationWork(legacy)?.photoId, 'fuji-blue');
  const received = { ...restoreCreationWork(legacy)!, tripId: 'kansai', sourceTripId: 'fuji', receivedFrom: 'lin' };
  assert.equal(restoreCreationWork(received)?.tripId, 'kansai');
  assert.equal(restoreCreationWork(received)?.sourceTripId, 'fuji');
});

test('photo-first previews cannot silently substitute a different destination', () => {
  assert.equal(photosForTrip('tokyo').length, 0);
  const fuji = photoById('fuji-blue')!;
  for (const styleId of fuji.styles) {
    const work = workForPhoto(fuji, styleId);
    assert.equal(work.source, fuji.source);
    assert.equal(work.tripId, 'fuji');
  }
  assert.equal(styleForPhoto(fuji, 'pin'), undefined);
  assert.throws(() => workForPhoto(fuji, 'pin'));
  const nara = workForPhoto(photoById('nara-deer')!, 'sticker');
  assert.notEqual(nara.image, creationStyles[0]!.image);
  assert.equal(restoreCreationWork({ ...nara, image: 'fuji-sticker.png' }), undefined);
});

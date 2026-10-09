import test from 'node:test';
import assert from 'node:assert/strict';
import { demoExchangeWork, exchangeOffers, isExampleWork, creationStyles, photosForTrip, photoById, styleForPhoto, workForPhoto, restoreCreationWork, type CreationPhoto } from '../app/data/creation.ts';

test('legacy Fuji works retain their source trip; received works retain both trip and origin', () => {
  const legacy = { id: 'old-sticker', creator: '你', createdAt: '2026-04-08', styleId: 'sticker', image: 'fuji-sticker.png', title: '貼紙卡', location: '富士山' };
  assert.equal(restoreCreationWork(legacy)?.tripId, 'fuji');
  assert.equal(restoreCreationWork(legacy)?.photoId, 'fuji-blue');
  const received = { ...restoreCreationWork(legacy)!, tripId: 'kansai', sourceTripId: 'fuji', receivedFrom: 'lin' };
  assert.equal(restoreCreationWork(received)?.tripId, 'kansai');
  assert.equal(restoreCreationWork(received)?.sourceTripId, 'fuji');
});

test('uploaded photos support all six demo outputs, while sample uploads retain their exact preset source', () => {
  const uploaded: CreationPhoto = { id: 'upload-test', tripId: 'tokyo', title: '我的照片', location: '東京 · 我的照片', source: 'blob:test-photo', styles: [] };
  for (const style of creationStyles) {
    const work = workForPhoto(uploaded, style.id);
    assert.equal(work.source, uploaded.source);
    assert.equal(work.image, uploaded.source);
    assert.equal(work.tripId, 'tokyo');
    assert.equal(work.preset, false);
  }
  const sample: CreationPhoto = { ...uploaded, source: 'references/usj-nintendo-source.png', styles: ['photo', 'companion'], demoPhotoId: 'usj-panorama' };
  const companion = workForPhoto(sample, 'companion');
  assert.equal(companion.image, 'usj-companion-test.png');
  assert.equal(companion.source, sample.source);
  assert.equal(companion.tripId, 'tokyo');
  assert.equal(companion.photoId, 'upload-test');
});

test('every photo offers six styles without silently substituting a different destination', () => {
  assert.equal(photosForTrip('tokyo').length, 3);
  const fuji = photoById('fuji-blue')!;
  for (const styleId of creationStyles.map(style => style.id)) {
    const work = workForPhoto(fuji, styleId);
    assert.equal(work.source, fuji.source);
    assert.equal(work.tripId, 'fuji');
  }
  assert.equal(styleForPhoto(fuji, 'pin').preset, false);
  assert.equal(workForPhoto(fuji, 'pin').image, fuji.source);
  const nara = workForPhoto(photoById('nara-deer')!, 'sticker');
  assert.notEqual(nara.image, creationStyles[0]!.image);
  assert.equal(restoreCreationWork({ ...nara, image: 'fuji-sticker.png' }), undefined);
});


test('demo galleries use curated photos and exchange can start before a work is created', () => {
  assert.deepEqual(photosForTrip('tokyo').map(photo => photo.id), ['tokyo-asakusa', 'tokyo-shibuya', 'tokyo-skytree']);
  for (const tripId of ['tokyo', 'kansai', 'fuji'] as const) {
    const starter = demoExchangeWork(tripId);
    assert.equal(starter.tripId, tripId);
    assert.equal(starter.sourceTripId, 'fuji');
    assert.equal(starter.photoId, 'fuji-blue');
    assert.equal(isExampleWork(starter), false, 'the demo copy can be offered in the exchange flow');
    const offers = exchangeOffers(tripId, '示範旅伴');
    assert(offers.length > 0, `${tripId} needs an exchange offer`);
    assert(offers.every(work => work.preset && work.creator === '示範旅伴'));
    assert(photosForTrip(tripId).every(photo => !/^(blob:|data:|https?:|\/api\/media)/.test(photo.source)));
  }
  assert(exchangeOffers('tokyo', '小宇').every(work => work.tripId === 'kansai'), 'fallback offers retain their actual source trip');
});

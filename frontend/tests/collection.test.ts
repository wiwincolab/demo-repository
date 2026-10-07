import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCollectionEntries, collectedWorks, collectionOpeningOrder } from '../app/data/collection.ts';
import { exampleCreator, photoById, workForPhoto, type CreationWork } from '../app/data/creation.ts';

test('catalogue examples never become owned works and never leak across trips',()=>{
  const saved:CreationWork[]=[];
  const kansai=buildCollectionEntries('kansai',saved);
  assert.equal(saved.length,0);
  assert.equal(kansai.filter(item=>item.collected).length,0);
  assert.ok(kansai.every(item=>item.work.tripId==='kansai'));
  assert.equal(kansai.filter(item=>item.work.styleId==='sticker').length,6);
  assert.equal(kansai.find(item=>item.work.styleId==='pin')?.work.photoId,'kiyomizu');
  assert.equal(buildCollectionEntries('tokyo',saved).length,0);
  assert.equal(buildCollectionEntries(null,saved).length,0);
});

test('the latest own work replaces its example without duplicating a sticker set',()=>{
  const photo=photoById('nara-deer')!;
  const newer=workForPhoto(photo,'sticker','你','-new');
  const older=workForPhoto(photo,'sticker','你','-old');
  const entries=buildCollectionEntries('kansai',[newer,older]);
  const stickers=entries.filter(item=>item.work.styleId==='sticker');
  assert.equal(stickers.length,6);
  assert.ok(stickers.every(item=>item.collected&&item.work.id===newer.id));
  assert.equal(new Set(stickers.map(item=>item.id)).size,6);
});

test('a received copy belongs to the exchange trip and retains its original trip and provenance',()=>{
  const received={...workForPhoto(photoById('fuji-blue')!,'ticket','阿霖'),id:'received-1',tripId:'kansai' as const,sourceTripId:'fuji' as const,receivedFrom:'lin',exchangeId:'exchange-1'};
  const entry=buildCollectionEntries('kansai',[received]).find(item=>item.work.receivedFrom==='lin')!;
  assert.equal(entry.work.sourceTripId,'fuji');
  assert.equal(entry.work.exchangeId,'exchange-1');
  assert.equal(entry.work.image,'fuji-ticket.png');
  assert.equal(entry.collected,true);
  assert.equal(buildCollectionEntries('fuji',[received]).some(item=>item.collected),false);
});

test('uploaded rendered stickers use their own PNG instead of borrowing Fuji or Nara motifs',()=>{
  const work:CreationWork={id:'upload-1',photoId:'upload-1',tripId:'tokyo',styleId:'sticker',title:'我的貼紙',image:'blob:photo',source:'blob:photo',renderedImage:'data:image/png;base64,local',preset:false,location:'東京 · 我的照片',creator:'你',createdAt:'2026-10-04'};
  const entries=buildCollectionEntries('tokyo',[work]);
  assert.equal(entries.length,1);
  assert.equal(entries[0]?.kit,undefined);
  assert.equal(entries[0]?.work.renderedImage,work.renderedImage);
});

test('the opening spread introduces each available format without losing the remaining stickers',()=>{
  const entries=buildCollectionEntries('kansai',[]),ordered=collectionOpeningOrder(entries);
  assert.equal(ordered.length,entries.length);
  assert.equal(new Set(ordered.map(item=>item.id)).size,entries.length);
  assert.deepEqual(ordered.slice(0,5).map(item=>item.work.styleId),['sticker','pin','photo','scene','companion']);
});

test('every page counts the same collection: own and received works, never examples, remakes once',()=>{
  const photo=photoById('kiyomizu')!;
  const remade=workForPhoto(photo,'pin','你','-new'), first=workForPhoto(photo,'pin','你','-old');
  const example=workForPhoto(photo,'pin',exampleCreator);
  const received={...workForPhoto(photoById('fuji-blue')!,'ticket','阿霖'),id:'received-2',tripId:'kansai' as const,sourceTripId:'fuji' as const,receivedFrom:'lin'};
  const fuji=workForPhoto(photoById('fuji-blue')!,'sticker');
  const counted=collectedWorks('kansai',[remade,example,first,received,fuji]);
  assert.deepEqual(counted.map(work=>work.id),[remade.id,received.id]);
  assert.equal(collectedWorks(null,[remade]).length,0);
  const entries=buildCollectionEntries('kansai',[example]);
  assert.equal(entries.filter(item=>item.collected).length,0,'an example saved by mistake still is not a collection');
});

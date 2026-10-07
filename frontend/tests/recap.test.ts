import test from 'node:test';
import assert from 'node:assert/strict';
import { buildRecapStops, photoForStop, stopForPhoto, stopsForTrip } from '../app/data/recap.ts';
import { emptyJourney, journeyStops } from '../app/data/journey.ts';
import { photoById, workForPhoto } from '../app/data/creation.ts';

test('recap orders completed trips by travel date and excludes the upcoming Tokyo trip',()=>{
  const stops=buildRecapStops(['tokyo','fuji','kansai'],[],emptyJourney());
  assert.deepEqual(stops.map(stop=>stop.id),['fuji-blue','kobe','amanohashidate','ine','kyoto','nara','dotonbori','usj']);
  assert.deepEqual(stops.map(stop=>stop.date),['2026-02-14','2026-04-03','2026-04-04','2026-04-04','2026-04-05','2026-04-05','2026-04-05','2026-04-06']);
  assert(!stops.some(stop=>stop.tripId==='tokyo'));
  assert.deepEqual(buildRecapStops(['kansai','tokyo','fuji'],[],emptyJourney()).map(stop=>stop.id),stops.map(stop=>stop.id));
  assert.deepEqual(buildRecapStops(['tokyo'],[],emptyJourney()),[]);
});

test('several formats and photos at USJ remain one stop, with duplicate works removed',()=>{
  const photo=workForPhoto(photoById('usj-panorama')!,'photo');
  const companion=workForPhoto(photoById('usj-panorama')!,'companion');
  const scene=workForPhoto(photoById('usj-scene')!,'scene');
  const state={...emptyJourney(),usjCreated:true,usjSaved:true};
  const stops=buildRecapStops(['kansai'],[photo,companion,scene,{...photo}],state);
  assert.equal(stops.length,7);
  const usj=stops.filter(stop=>stop.id==='usj');
  assert.equal(usj.length,1);
  assert.equal(usj[0]!.works.length,3);
  assert.deepEqual(new Set(usj[0]!.works.map(work=>work.styleId)),new Set(['photo','companion','scene']));
});

test('an unsaved scene stays a photo and cannot introduce an unaccepted friend',()=>{
  const scene=workForPhoto(photoById('usj-scene')!,'scene');
  const unsaved=buildRecapStops(['kansai'],[scene],{...emptyJourney(),usjCreated:true,friendAccepted:true,friendPlaced:true}).find(stop=>stop.id==='usj')!;
  assert.equal(unsaved.interaction,'photo');
  assert.equal(unsaved.format,'旅行照片');
  assert.equal(unsaved.image,unsaved.source);
  assert.equal(unsaved.friend,undefined);
  const saved={...emptyJourney(),usjCreated:true,usjSaved:true};
  assert.equal(buildRecapStops(['kansai'],[],saved).find(stop=>stop.id==='usj')!.friend,undefined);
  assert.equal(buildRecapStops(['kansai'],[],{...saved,friendAccepted:true}).find(stop=>stop.id==='usj')!.friend?.name,'James');
});

test('cross-trip received souvenirs do not become visited stops or works at those stops',()=>{
  const fuji=workForPhoto(photoById('fuji-blue')!,'sticker','小庭');
  const receivedInKansai={...fuji,id:'received-fuji-in-kansai',tripId:'kansai' as const,sourceTripId:'fuji' as const,receivedFrom:'小庭'};
  const incompatibleOrigin={...fuji,id:'foreign-origin',sourceTripId:'kansai' as const,receivedFrom:'James'};
  const ownUsj=workForPhoto(photoById('usj-panorama')!,'photo');
  const stops=buildRecapStops(['kansai'],[receivedInKansai,ownUsj],emptyJourney());
  assert.deepEqual(stops.map(stop=>stop.id),['kobe','amanohashidate','ine','kyoto','nara','dotonbori','usj']);
  assert.deepEqual(stops.flatMap(stop=>stop.works.map(work=>work.id)),[ownUsj.id]);
  const fujiStop=buildRecapStops(['fuji'],[incompatibleOrigin],emptyJourney())[0]!;
  assert.equal(fujiStop.works.length,0);
  assert.equal(fujiStop.format,'旅行照片');
});

test('every Kansai stop has its own trip photo, so a souvenir can be made where it was seen',()=>{
  for(const stop of journeyStops){
    const photo=photoById(photoForStop(stop.id));
    assert(photo,`${stop.id} needs a photo to create from`);
    assert.equal(photo.tripId,'kansai');
    assert.equal(stopForPhoto(photo.id),stop.id);
    assert.equal(new URL('assets/memory/'+photo.source,'https://x/').pathname,'/'+stop.source,'the photo is the one the revisit shows');
  }
  assert.deepEqual(stopsForTrip('kansai').map(stop=>stop.id),journeyStops.map(stop=>stop.id));
  assert.deepEqual(stopsForTrip('fuji').map(stop=>stop.id),['fuji-blue']);
  assert.deepEqual(stopsForTrip('tokyo'),[]);
});

test('an uploaded photo filed under a stop puts its works at that stop and nowhere else',()=>{
  const upload={id:'upload-1',tripId:'kansai' as const,title:'我的神戶',location:'神戶・Harborland',source:'blob:kobe',styles:[],stopId:'kobe'};
  const work={...workForPhoto(upload,'pin'),renderedImage:'data:image/png;base64,pin'};
  assert.equal(work.stopId,'kobe');
  const stops=buildRecapStops(['kansai'],[work],emptyJourney());
  assert.deepEqual(stops.filter(stop=>stop.works.length).map(stop=>stop.id),['kobe']);
  const unfiled={...workForPhoto({...upload,stopId:undefined},'pin'),id:'unfiled'};
  assert(buildRecapStops(['kansai'],[unfiled],emptyJourney()).every(stop=>!stop.works.length));
});

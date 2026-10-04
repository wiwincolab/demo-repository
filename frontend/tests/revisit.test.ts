import test from 'node:test';
import assert from 'node:assert/strict';
import { buildRevisitStops, revisitScope, revisitLeg } from '../app/data/revisit.ts';
import { emptyJourney, journeyStops } from '../app/data/journey.ts';
import { photoById, workForPhoto } from '../app/data/creation.ts';
import { advanceRevisitClock } from '../app/utils/revisit-clock.ts';
import { existsSync } from 'node:fs';
import { createRevisitRun } from '../app/utils/revisit-run.ts';
import reserve from '../app/data/revisit-assets.json' with {type:'json'};

test('revisit uses the current seven Kansai places, dates and coordinates', () => {
  const stops = buildRevisitStops('kansai', [], emptyJourney());
  assert.deepEqual(stops.map(stop => stop.id), ['kobe','amanohashidate','ine','kyoto','nara','dotonbori','usj']);
  assert.deepEqual(stops.map(stop => stop.coords), journeyStops.map(stop => stop.coords));
  assert.deepEqual(stops.map(stop => stop.date), ['2026-04-03','2026-04-04','2026-04-04','2026-04-05','2026-04-05','2026-04-05','2026-04-06']);
  assert(stops.every(stop => stop.source && !stop.sticker && !stop.friend));
});
test('year follows completed travel chronology and excludes upcoming Tokyo', () => {
  const stops = buildRevisitStops('year', [], emptyJourney());
  assert.equal(stops.length, 8);
  assert.equal(stops[0]!.id, 'fuji-blue');
  assert.deepEqual([...new Set(stops.map(stop => stop.tripId))], ['fuji','kansai']);
  assert.equal(revisitScope('tokyo'), 'kansai');
});
test('only an actually saved Nara sticker gets an interaction, regardless of other styles', () => {
  const nara = workForPhoto(photoById('nara-deer')!, 'sticker');
  const companion = workForPhoto(photoById('usj-panorama')!, 'companion');
  const scene = workForPhoto(photoById('usj-scene')!, 'scene');
  const stops = buildRevisitStops('kansai', [nara, companion, scene], {...emptyJourney(), usjCreated: true, usjSaved: true});
  assert.deepEqual(stops.filter(stop => stop.sticker).map(stop => stop.id), ['nara']);
  assert.equal(stops.find(stop => stop.id === 'nara')!.sticker!.id, nara.id);
  assert.equal(stops.find(stop => stop.id === 'usj')!.sticker, undefined);
  assert.equal(buildRevisitStops('kansai', [{...nara, sourceTripId:'fuji'}], emptyJourney()).find(stop => stop.id === 'nara')!.sticker, undefined);
});
test('friend details need an accepted existing exchange and never appear from asset availability', () => {
  const state = {...emptyJourney(), usjCreated:true, usjSaved:true};
  assert(!buildRevisitStops('kansai', [], state).some(stop => stop.friend));
  assert.equal(buildRevisitStops('kansai', [], {...state, friendAccepted:true}).find(stop => stop.id === 'usj')!.friend?.name, 'James');
});
test('presentation fixtures match their original stop and do not modify personal saved works', () => {
  const works = [workForPhoto(photoById('fuji-blue')!, 'ticket')];
  const before = structuredClone(works);
  const demo = buildRevisitStops('year', works, emptyJourney(), true);
  assert(demo.every(stop=>stop.souvenirs.length>0 && stop.souvenirs.length<=3));
  assert.equal(demo[0]!.souvenirs[0]!.demo, false);
  assert.equal(demo.find(stop=>stop.id==='kyoto')!.souvenirs[0]!.image,'assets/memory/revisit/kiyomizu-pin.png');
  assert.deepEqual(works, before);
  assert(buildRevisitStops('year', [], emptyJourney(), false).every(stop=>!stop.souvenirs.length));
});
test('ten-second photo clock preserves remaining time through interactions and cannot run below zero', () => {
  let remaining = advanceRevisitClock(10, 3.25, true);
  assert.equal(remaining,6.75);
  remaining = advanceRevisitClock(remaining, 30, false);
  assert.equal(remaining,6.75);
  remaining = advanceRevisitClock(remaining, 6.5, true);
  assert.equal(remaining,.25);
  assert.equal(advanceRevisitClock(remaining, 1, true),0);
});

test('transport follows local routes and treats different journeys as separate departures', () => {
  const stops = buildRevisitStops('year', [], emptyJourney());
  assert.equal(revisitLeg(stops[0]!)!.vehicle, 'plane');
  const chapter = revisitLeg(stops[1]!, stops[0]!);
  assert.equal(chapter!.chapter, true);
  assert.equal(chapter!.vehicle, null);
  assert.deepEqual(chapter!.from, stops[0]!.coords);
  assert.deepEqual(chapter!.to, stops[1]!.coords);
  assert.equal(revisitLeg(stops[2]!,stops[1]!)!.vehicle,'bus');
  assert.equal(revisitLeg(stops[7]!,stops[6]!)!.vehicle,'train-front');
  assert.equal(revisitLeg(stops[7]!,stops[7]!),null);
});

test('last year restores all old Japan, Korea and Hong Kong photos without mixing 2026 trips', () => {
  const past=buildRevisitStops('last-year',[],emptyJourney(),true);
  assert.equal(revisitScope('last-year'),'last-year');
  assert.equal(past.length,12);
  assert.equal(new Set(past.map(stop=>stop.id)).size,12);
  assert.deepEqual([...new Set(past.map(stop=>stop.groupLabel))],['大阪','首爾','香港']);
  assert(past.every(stop=>stop.date.startsWith('2025-') && stop.tripId==='last-year'));
  assert(past.every(stop=>existsSync(new URL('../public/'+stop.source,import.meta.url))));
  assert(past.every(stop=>stop.souvenirs.length && !stop.friend && !stop.works.length));
  assert(buildRevisitStops('last-year',[],emptyJourney(),false).every(stop=>!stop.souvenirs.length));
  assert(past[5]!.sourceNote?.includes('非實際場次或店面'));
  const current=buildRevisitStops('year',[],emptyJourney());
  assert(current.every(stop=>stop.date.startsWith('2026-')));
});

test('photo hotspots reference the exact original, available local assets and bounded playable crops',()=>{
  const stops=[...buildRevisitStops('year',[],emptyJourney(),true),...buildRevisitStops('last-year',[],emptyJourney(),true)];
  for(const stop of stops)for(const object of stop.souvenirs){
    assert(existsSync(new URL('../public/'+object.image,import.meta.url)),object.image);
    assert(object.x>0&&object.x<100&&object.y>0&&object.y<100);
    if(!object.id.startsWith('reserve-'))continue;
    const source=reserve.find(row=>row.styles.some(style=>style.image===object.image))!;
    assert.equal(source.source,stop.source,'another photograph is never borrowed for a hotspot');
    if(object.kit)for(const motif of object.kit.motifs){
      const [x,y,width,height]=motif.box.split(' ').map(Number);
      assert(x!>=0&&y!>=0&&width!>0&&height!>0&&x!+width!<=object.kit.width+1&&y!+height!<=object.kit.height+1);
    }
  }
  const unavailable=stops.find(stop=>stop.source==='atlas-assets/scenes/2.jpg')!;
  assert.deepEqual(unavailable.souvenirs.map(item=>item.kind),['sticker']);
});

test('a superseded transport cancels camera and delay callbacks exactly once, while the new leg can arrive',async()=>{
  const old=createRevisitRun(),events:string[]=[];
  old.own(()=>events.push('old camera detached'));
  const obsoleteArrival=old.wait(100).then(active=>{if(active)events.push('wrong arrival');return active;});
  old.cancel();old.cancel();
  const next=createRevisitRun();
  assert.equal(await obsoleteArrival,false);
  assert.equal(await next.wait(1),true);
  assert.equal(await old.wait(0),false);
  assert.deepEqual(events,['old camera detached']);
});

test('last-year continuous overseas travel retains flights, metro, taxi and tram', () => {
  const stops=buildRevisitStops('last-year',[],emptyJourney());
  const legs=stops.map((stop,i)=>revisitLeg(stop,stops[i-1])!);
  assert.deepEqual(legs.map(leg=>leg.vehicle),['plane','train-front','train-front','train-front','plane','train-front','bus','train-front','plane','car-taxi-front','tram-front','train-front']);
  assert(legs.every(leg=>!leg.chapter));
  assert.deepEqual(legs[4]!.from,stops[3]!.coords);
  assert(legs[4]!.label.includes('大阪 → 首爾'));
  assert(legs[8]!.label.includes('首爾 → 香港'));
});

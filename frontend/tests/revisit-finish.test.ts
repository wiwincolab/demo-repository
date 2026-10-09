import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildRevisitStops } from '../app/data/revisit.ts';
import { emptyJourney } from '../app/data/journey.ts';
import { photoById, workForPhoto } from '../app/data/creation.ts';
import { buildRevisitSummary } from '../app/utils/revisit-summary.ts';
import { createRevisitRun } from '../app/utils/revisit-run.ts';
import { waitForRevisitTiles } from '../app/utils/revisit-tiles.ts';

test('summary records only seen places and unique opened objects; demo previews never become owned works',()=>{
  const stops=buildRevisitStops('kansai',[],emptyJourney(),true);
  const nara=stops.find(stop=>stop.id==='nara')!, usj=stops.find(stop=>stop.id==='usj')!;
  const opened=new Set([nara.souvenirs[0]!.id,usj.souvenirs[0]!.id]);
  opened.add(nara.souvenirs[0]!.id);
  const partial=buildRevisitSummary(stops,new Set(['nara']),opened);
  assert.deepEqual(partial.photos.map(stop=>stop.id),['nara']);
  assert.equal(partial.opened.length,1); assert.equal(partial.owned.length,0);
  assert.equal(partial.total,7); assert.equal(partial.opened[0]!.demo,true);
});
test('full annual replay and photo-only replay are valid summaries without creating collections',()=>{
  const stops=buildRevisitStops('year',[],emptyJourney(),false);
  const result=buildRevisitSummary(stops,new Set(stops.map(stop=>stop.id)),new Set());
  assert.equal(result.photos.length,8); assert.deepEqual(result.groups,['富士山','關西']);
  assert.equal(result.opened.length,0); assert.equal(result.owned.length,0);
  assert.equal(buildRevisitSummary(stops,new Set(),new Set()).photos.length,0);
});
test('existing saved works stay distinct from demo previews and are counted once per seen source',()=>{
  const work=workForPhoto(photoById('nara-deer')!,'sticker');
  const stops=buildRevisitStops('kansai',[work,work],emptyJourney(),true);
  const unseen=buildRevisitSummary(stops,new Set(['usj']),new Set());
  assert.equal(unseen.owned.length,0);
  const result=buildRevisitSummary(stops,new Set(['nara']),new Set([work.id]));
  assert.equal(result.owned.length,1);assert.equal(result.owned[0]!.id,work.id);
  assert.equal(result.opened[0]!.demo,false);
});
function tileMap(){
  const loaded=new Set<string>(), listeners=new Map<string,Set<()=>void>>();
  return {loaded,listeners,isSourceLoaded:(id:string)=>loaded.has(id),
    on:(event:string,fn:()=>void)=>{if(!listeners.has(event))listeners.set(event,new Set());listeners.get(event)!.add(fn);},
    off:(event:string,fn:()=>void)=>listeners.get(event)?.delete(fn),
    fire:(event='sourcedata')=>listeners.get(event)?.forEach(fn=>fn()),
    count:()=>[...listeners.values()].reduce((n,items)=>n+items.size,0)};
}
test('partial tiles cannot complete readiness; finishing removes listeners',async()=>{
  const map=tileMap(),run=createRevisitRun();
  let complete=false;
  const ready=waitForRevisitTiles(map,['satellite','aerial'],run,100).then(value=>{complete=true;return value;});
  map.loaded.add('satellite');map.fire();await Promise.resolve();assert.equal(complete,false);
  map.loaded.add('aerial');map.fire();await Promise.resolve();assert.equal(complete,false);
  map.fire('render');await Promise.resolve();assert.equal(complete,false);
  map.fire('render');assert.equal(await ready,true);assert.equal(map.count(),0);
});
test('slow imagery and cancelled legs release the waiter; a later event cannot arrive in the old leg',async()=>{
  const map=tileMap(),old=createRevisitRun();
  const result=waitForRevisitTiles(map,['aerial'],old,100);old.cancel();
  assert.equal(await result,false);assert.equal(map.count(),0);
  map.loaded.add('aerial');map.fire();
  assert.equal(await waitForRevisitTiles(map,['missing'],createRevisitRun(),2),false);
  assert.equal(map.count(),0);
});

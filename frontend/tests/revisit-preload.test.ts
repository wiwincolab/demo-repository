import test from 'node:test';
import assert from 'node:assert/strict';
import { preloadRevisitAssets, revisitPreloadUrls, revisitRegionUrl } from '../app/utils/revisit-preload.ts';
import { createRevisitRun } from '../app/utils/revisit-run.ts';
import { buildRevisitStops } from '../app/data/revisit.ts';
import { emptyJourney } from '../app/data/journey.ts';
import aerial from '../app/data/revisit-aerial.json' with {type:'json'};
import regional from '../app/data/revisit-regional.json' with {type:'json'};

test('Kansai preparation contains every local tile, photo and interactive artifact, without another trip',()=>{
  const stops=buildRevisitStops('kansai',[],emptyJourney(),true),asset=(url:string)=>'/demo/'+url;
  const urls=revisitPreloadUrls(stops,asset);
  assert.equal(urls.length,new Set(urls).size);
  for(const stop of stops){
    assert(urls.includes(asset(stop.source)));
    stop.souvenirs.forEach(item=>assert(urls.includes(asset(item.image))));
    aerial.find(item=>item.id===stop.id)!.tiles.forEach(url=>assert(urls.includes(asset(url))));
    regional.find(item=>item.id===stop.id)!.tiles.forEach(url=>assert(urls.includes(revisitRegionUrl(asset(url)))));
  }
  assert(!urls.some(url=>url.includes('/fuji-blue/')));
  assert(urls.includes(asset('assets/memory/motion/nara-stickers.png')));
  assert(urls.some(url=>url.includes('terrarium/12/')));
});
test('preparation waits for complete bodies, limits concurrency, and reports unsuccessful responses',async()=>{
  let inFlight=0, peak=0, bodies=0;
  const reports:any[]=[];
  const fetcher=(async (url:any)=>{
    inFlight++;peak=Math.max(peak,inFlight);
    await new Promise(resolve=>setTimeout(resolve,3));
    return {ok:url!=='bad',status:404,arrayBuffer:async()=>{await new Promise(resolve=>setTimeout(resolve,3));bodies++;inFlight--;return new ArrayBuffer(1);}};
  }) as typeof fetch;
  assert.equal(await preloadRevisitAssets(['a','a','b','c'],createRevisitRun(),value=>reports.push(value),fetcher,2),true);
  assert.equal(peak,2);assert.equal(bodies,3);assert.deepEqual(reports.at(-1),{done:3,total:3,failed:0,active:false});
  assert.equal(await preloadRevisitAssets(['bad'],createRevisitRun(),value=>reports.push(value),fetcher),false);
  assert.equal(reports.at(-1).failed,1);
});
test('switching journey aborts its downloads and does not publish stale progress',async()=>{
  const run=createRevisitRun(),reports:any[]=[];
  let started=0, aborted=0;
  const fetcher=(async (_url:any,options:any)=>new Promise((_resolve,reject)=>{
    started++;options.signal.addEventListener('abort',()=>{aborted++;reject(new Error('aborted'));});
  })) as typeof fetch;
  const preparation=preloadRevisitAssets(['a','b','c'],run,value=>reports.push(value),fetcher,2);
  run.cancel();assert.equal(await preparation,false);
  assert.equal(started,2);assert.equal(aborted,2);assert.equal(reports.length,1);
});

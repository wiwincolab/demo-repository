import test from 'node:test';
import assert from 'node:assert/strict';
import { japanClassicRoutes } from '../app/data/classic-japan.ts';
import { koreaClassicRoutes } from '../app/data/classic-korea.ts';
import { taiwanClassicRoutes } from '../app/data/classic-taiwan.ts';

const routes=[...japanClassicRoutes,...koreaClassicRoutes,...taiwanClassicRoutes];
const bounds={japan:[123,24,146,46],korea:[124,33,131,39],taiwan:[118,21.8,122.1,26.4]} as const;
const minutes=(time:string)=>{const [h,m]=time.split(':').map(Number);return h!*60+m!;};

test('covers Japan, Korea and Taiwan with uniquely identified routes',()=>{
  for(const country of ['japan','korea','taiwan'] as const) assert(routes.some(route=>route.country===country),country);
  assert.equal(new Set(routes.map(route=>route.id)).size,routes.length);
});

test('each route has its advertised days with sequential stop ids on the right day',()=>{
  for(const route of routes){
    const stops=route.days.flatMap(day=>day.stops);
    assert.equal(route.days.length,route.dayCount,route.id);
    assert.deepEqual(stops.map(stop=>stop.id),stops.map((_,index)=>index),`${route.id}: ids must run 0..n`);
    route.days.forEach((day,index)=>{
      assert(day.stops.length>0,`${route.id} day ${index}`);
      assert(day.stops.every(stop=>stop.day===index),`${route.id} day ${index}`);
      const times=day.stops.map(stop=>{assert.match(stop.time,/^\d{2}:\d{2}$/);return minutes(stop.time);});
      assert.deepEqual(times,[...times].sort((a,b)=>a-b),`${route.id} day ${index}: times must ascend`);
    });
  }
});

test('places every stop inside its own country',()=>{
  for(const route of routes){
    const [west,south,east,north]=bounds[route.country];
    for(const stop of route.days.flatMap(day=>day.stops)){
      const [lng,lat]=stop.at;
      assert(lng!>west&&lng!<east&&lat!>south&&lat!<north,`${route.id}: ${stop.name} ${stop.at}`);
    }
  }
});

test('preserves agency route references alongside separately credited scene photos',()=>{
  for(const route of routes){
    assert.match(route.reference.url,/^https:\/\/(tour|trip)\.settour\.com\.tw\//,route.id);
    for(const stop of route.days.flatMap(day=>day.stops)){
      assert.match(stop.photo.source,/^https:\/\//,`${route.id}: ${stop.name}`);
      assert.match(stop.photo.src,/^assets\/photos\/classic\/.+\.webp$/);
      assert.ok(stop.photo.credit);
      assert.ok(stop.photo.license);
    }
  }
});

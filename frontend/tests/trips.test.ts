import test from 'node:test';
import assert from 'node:assert/strict';
import { tripSummaries, tripItineraries, tripAlternatives, plannerStorageKey } from '../app/data/trips.ts';

test('each trip has a complete, independently identified route for its advertised days',()=>{
  for(const trip of tripSummaries){
    const days=tripItineraries[trip.id],stops=days.flatMap(day=>day.stops);
    assert.equal(days.length,trip.dayCount,trip.id);
    assert.equal(new Set(stops.map(stop=>stop.id)).size,stops.length,`${trip.id}: stop ids must be unique`);
    days.forEach((day,index)=>{assert(day.stops.length>0);assert(day.stops.every(stop=>stop.day===index));});
    assert.notEqual(tripAlternatives[trip.id].name,days[0]!.stops[1]!.name);
  }
});

test('Kansai and Fuji contain their own destinations rather than Tokyo coordinates or draft keys',()=>{
  const kansai=tripItineraries.kansai.flatMap(day=>day.stops),fuji=tripItineraries.fuji.flatMap(day=>day.stops);
  assert(kansai.some(stop=>stop.name==='大阪環球影城'));
  assert(kansai.some(stop=>stop.name==='清水寺'));
  assert(kansai.every(stop=>stop.at[0]!>135&&stop.at[0]!<136&&stop.at[1]!>34&&stop.at[1]!<36));
  assert(fuji.some(stop=>stop.name==='河口湖'));
  assert(fuji.every(stop=>stop.at[0]!>138&&stop.at[0]!<139&&stop.at[1]!>35&&stop.at[1]!<36));
  assert.equal(new Set(tripSummaries.map(trip=>plannerStorageKey(trip.id))).size,tripSummaries.length);
});

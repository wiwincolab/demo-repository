import test from 'node:test';
import assert from 'node:assert/strict';
import {createCustomTrip,emptyTripDays,newTripError,restoreCustomTrips,tripDates} from '../app/utils/custom-trips.ts';
import {plannedDay,restorePlannedDays} from '../app/utils/planner-chat.ts';
import {tripItineraries} from '../app/data/trips.ts';
import type {PoiRegion} from '../app/types/poi.ts';
const region:PoiRegion={id:'kr-busan',name:'釜山',country:'KR',bbox:[128.85,35,129.3,35.4],status:'ready',count:367,photoCount:123,fetchedAt:null,file:'regions/kr-busan.json'};
const input={title:'  釜山，慢慢玩。  ',startDate:'2026-12-30',endDate:'2027-01-01',transport:'public-transit' as const};
test('new journeys create independent empty days with destination, dates and transport',()=>{
  const trip=createCustomTrip(input,region,'custom-test-journey',{src:'poi/photos/busan.jpg'});
  assert.equal(trip.title,'釜山，慢慢玩。');assert.equal(trip.dayCount,3);assert.equal(trip.country,'korea');
  assert.equal(trip.destination?.regionId,'kr-busan');
  const days=emptyTripDays(trip);assert.equal(days.length,3);assert(days.every(d=>d.stops.length===0));
  assert.equal(new Set(days.map(d=>d.area)).size,3);assert.notEqual(days[0]?.stops,days[1]?.stops);
  const stop=structuredClone(tripItineraries.tokyo[0]!.stops[0]!);
  const planned=plannedDay(days,1,[stop]);assert.equal(planned[0]?.stops.length,0);assert.equal(planned[1]?.stops[0]?.day,1);
  const reloaded=emptyTripDays(restoreCustomTrips(JSON.parse(JSON.stringify([trip])))[0]!);
  const restored=restorePlannedDays(reloaded,{savedDays:{1:{day:1,stops:planned[1]!.stops}}});
  assert.deepEqual(restored,planned);assert.equal(days[1]?.stops.length,0);
});
test('dates reject reversed ranges, impossible dates and oversized journeys',()=>{
  assert.equal(tripDates('2028-02-28','2028-03-01'),3);
  assert.equal(tripDates('2027-02-29','2027-03-01'),0);
  assert(newTripError({...input,endDate:'2026-12-29'}));
  assert(newTripError({...input,startDate:'2026-12-01',endDate:'2027-01-01'}));
  assert(newTripError({...input,title:' '}));
});
test('stored journeys recover independently and discard corrupt or duplicated records',()=>{
  const trip=createCustomTrip(input,region,'custom-test-journey',{src:'poi/photos/busan.jpg'});
  assert.equal(restoreCustomTrips([trip,trip,{...trip,id:'tokyo'},{...trip,id:'custom-invalid-date',dayCount:10},{...trip,id:'custom-invalid-region',destination:{...trip.destination,regionId:'jp-tokyo'}}]).length,1);
  assert.deepEqual(restoreCustomTrips(null),[]);
  assert.equal(restoreCustomTrips([{...trip,cover:'javascript:alert(1)'}]).length,0);
});

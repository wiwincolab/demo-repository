import test from 'node:test';
import assert from 'node:assert/strict';
import { tripSummaries, type TripSummary } from '../app/data/trips.ts';
import { dateNumber, addDays, scheduledTrips, tripsOnDate, tripEnd, monthWeeks, weekSegments, shiftMonth } from '../app/utils/trip-calendar.ts';
const makeTrip=(id:string,startDate:string,dayCount:number)=>({...tripSummaries[0]!,id,startDate,dayCount}) as TripSummary;
test('calendar includes dated trips only and never invents dates for drafts',()=>{
 assert.deepEqual(scheduledTrips(tripSummaries).map(t=>t.id),['fuji','kansai','tokyo']);
 assert.deepEqual(scheduledTrips([makeTrip('bad','2026-02-30',2),makeTrip('blank','',3)]),[]);
 assert.equal(dateNumber('2026-2-3'),null);
});
test('trip dates are inclusive and independent of timezone, including year and leap-day boundaries',()=>{
 const t=makeTrip('cross','2026-12-30',4);
 assert.equal(tripEnd(t),'2027-01-02');
 assert.equal(tripsOnDate([t],'2027-01-02').length,1);
 assert.equal(tripsOnDate([t],'2027-01-03').length,0);
 assert.equal(addDays('2028-02-28',1),'2028-02-29');
 assert.equal(shiftMonth('2026-12',1),'2027-01');
 assert.equal(shiftMonth('2026-01',-1),'2025-12');
});
test('month grid contains full Sunday-to-Saturday weeks and every day of month',()=>{
 const weeks=monthWeeks('2026-10');
 assert.equal(weeks[0]![0],'2026-09-27');
 assert.equal(weeks.at(-1)!.at(-1),'2026-10-31');
 assert.equal(weeks.flat().filter(d=>d.startsWith('2026-10')).length,31);
 assert.equal(monthWeeks('2026-08').length,6);
});
test('multi-day events split across weeks and overlapping trips occupy separate lanes',()=>{
 const weeks=monthWeeks('2026-10');
 const trips=[makeTrip('a','2026-10-02',5),makeTrip('b','2026-10-03',2),makeTrip('c','2026-09-29',1)];
 const first=weekSegments(trips,weeks[0]!);
 const a=first.find(s=>s.trip.id==='a')!,b=first.find(s=>s.trip.id==='b')!;
 assert.equal(a.start,5);assert.equal(a.end,6);assert.equal(a.continuesAfter,true);
 assert.notEqual(a.lane,b.lane);
 const continuation=weekSegments(trips,weeks[1]!).find(s=>s.trip.id==='a')!;
 assert.equal(continuation.start,0);assert.equal(continuation.end,2);assert.equal(continuation.continuesBefore,true);
});

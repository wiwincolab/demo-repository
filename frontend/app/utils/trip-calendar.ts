import type { TripSummary } from '../data/trips.ts';
const dayMs = 86_400_000;
export function dateNumber(value: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const stamp = Date.parse(value + 'T00:00:00Z');
  return Number.isFinite(stamp) && new Date(stamp).toISOString().slice(0,10) === value ? stamp : null;
}
export function dateKey(stamp: number) { return new Date(stamp).toISOString().slice(0,10); }
export function addDays(date: string, days: number) { const stamp = dateNumber(date); if (stamp === null) throw new Error('Invalid date'); return dateKey(stamp + days * dayMs); }
export function scheduledTrips(trips: TripSummary[]) {
  return trips.filter(t => dateNumber(t.startDate) !== null && Number.isInteger(t.dayCount) && t.dayCount > 0).sort((a,b)=>a.startDate.localeCompare(b.startDate)||a.id.localeCompare(b.id));
}
export function tripEnd(trip: TripSummary) { return addDays(trip.startDate,trip.dayCount-1); }
export function tripsOnDate(trips: TripSummary[], date: string) { return scheduledTrips(trips).filter(t=>t.startDate<=date && tripEnd(t)>=date); }
export function tripDayIndex(trip: TripSummary, date: string) { return Math.round((dateNumber(date)!-dateNumber(trip.startDate)!)/dayMs); }
export function monthWeeks(month: string) {
  const first = dateNumber(month+'-01');
  if(first === null) throw new Error('Invalid month');
  const current = new Date(first);
  const last = Date.UTC(current.getUTCFullYear(),current.getUTCMonth()+1,0);
  const start = first-current.getUTCDay()*dayMs;
  const count = Math.ceil(((last-start)/dayMs+1)/7);
  return Array.from({length:count},(_,week)=>Array.from({length:7},(_,day)=>dateKey(start+(week*7+day)*dayMs)));
}
export function shiftMonth(month: string, delta: number) {
  const stamp = dateNumber(month+'-01'); if(stamp===null)throw new Error('Invalid month');
  const date = new Date(stamp); return dateKey(Date.UTC(date.getUTCFullYear(),date.getUTCMonth()+delta,1)).slice(0,7);
}
export function weekSegments(trips: TripSummary[], week: string[]) {
  const lanes: number[] = [];
  return scheduledTrips(trips).filter(t=>t.startDate<=week[6]! && tripEnd(t)>=week[0]!).map(trip=>{
    const start = Math.max(0,tripDayIndex({ ...trip, startDate:week[0]! },trip.startDate));
    const end = Math.min(6,tripDayIndex({ ...trip, startDate:week[0]! },tripEnd(trip)));
    let lane = lanes.findIndex(last=>last<start);
    if(lane<0)lane=lanes.length;
    lanes[lane]=end;
    return {trip,start,end,lane,continuesBefore:trip.startDate<week[0]!,continuesAfter:tripEnd(trip)>week[6]!};
  });
}

import type { RevisitStop } from '../data/revisit.ts';

/** Session activity is separate from ownership: previewing a demo never creates a collection. */
export function buildRevisitSummary(stops: RevisitStop[], seen: ReadonlySet<string>, opened: ReadonlySet<string>) {
  const photos = stops.filter(stop => seen.has(stop.id));
  const souvenirs = photos.flatMap(stop => stop.souvenirs.filter(item => opened.has(item.id)).map(item => ({...item, place:stop.short})));
  const unique = <T extends {id:string}>(items: T[]) => [...new Map(items.map(item => [item.id,item])).values()];
  return { photos, opened: unique(souvenirs), owned: unique(photos.flatMap(stop => stop.works)),
    groups: [...new Set(photos.map(stop => stop.groupLabel || (stop.tripId==='fuji'?'富士山':'關西')))], total: stops.length };
}

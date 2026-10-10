import type { Stop } from '../types/trip.ts';
/** Maps URLs expect latitude,longitude; itinerary coordinates use longitude,latitude. */
export function directionsUrl(from: Pick<Stop, 'at'>, to: Pick<Stop, 'at'>): string {
  const params = new URLSearchParams({ api: '1', origin: `${from.at[1]},${from.at[0]}`, destination: `${to.at[1]},${to.at[0]}` });
  return `https://www.google.com/maps/dir/?${params}`;
}

import type { Stop } from '../types/trip.ts';
import type { TripTransport } from '../data/trips.ts';
/** Maps URLs expect latitude,longitude; itinerary coordinates use longitude,latitude. */
export function directionsUrl(from: Pick<Stop, 'at'>, to: Pick<Stop, 'at'>, transport?: TripTransport): string {
  const params = new URLSearchParams({ api: '1', origin: `${from.at[1]},${from.at[0]}`, destination: `${to.at[1]},${to.at[0]}` });
  if(transport)params.set('travelmode',transport==='public-transit'?'transit':transport);
  return `https://www.google.com/maps/dir/?${params}`;
}

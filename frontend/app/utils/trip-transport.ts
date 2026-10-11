import type { TripTransport } from '../data/trips.ts';
import type { Stop } from '../types/trip.ts';

export const tripTransportLabels: Record<TripTransport, string> = {'public-transit': '大眾運輸', driving: '開車', walking: '步行'};
export interface TransportSettings { major: TripTransport; legs: Record<string, TripTransport> }
export function isTripTransport(value: unknown): value is TripTransport { return value === 'public-transit' || value === 'driving' || value === 'walking'; }
export function transportLegKey(from: Pick<Stop, 'id' | 'day'>, to: Pick<Stop, 'id' | 'day'>) { return `${from.day}:${from.id}:${to.day}:${to.id}`; }
export function restoreTransportSettings(value: unknown, fallback: TripTransport = 'public-transit'): TransportSettings {
  const stored = value && typeof value === 'object' ? value as Partial<TransportSettings> : {};
  const legs: TransportSettings['legs'] = {};
  if (stored.legs && typeof stored.legs === 'object') for (const [key, mode] of Object.entries(stored.legs).slice(0,1000)) {
    if (/^\d{1,2}:-?\d{1,16}:\d{1,2}:-?\d{1,16}$/.test(key) && isTripTransport(mode)) legs[key] = mode;
  }
  return {major: isTripTransport(stored.major) ? stored.major : fallback, legs};
}
export function legTransport(settings: TransportSettings, from: Pick<Stop, 'id' | 'day'>, to: Pick<Stop, 'id' | 'day'>): TripTransport {
  return settings.legs[transportLegKey(from,to)] || settings.major;
}

import { tripSummaries, tripItineraries, type TripId } from '~/data/trips';
import { customTripsKey, restoreCustomTrips, emptyTripDays, createCustomTrip, type NewTripInput } from '~/utils/custom-trips';
import type { PoiRegion } from '~/types/poi';
import type { TripSummary } from '~/data/trips';

export function useTripLibrary() {
  const customTrips = useState<TripSummary[]>('created-trips-v1', () => []);
  const loaded = useState('created-trips-ready-v1', () => false);
  const trips = computed(() => [...customTrips.value, ...tripSummaries]);
  function load() {
    if (!import.meta.client || loaded.value) return;
    try { customTrips.value = restoreCustomTrips(JSON.parse(localStorage.getItem(customTripsKey) || '[]')); } catch {}
    loaded.value = true;
  }
  onMounted(load);
  const findTrip = (id: unknown) => trips.value.find(t => t.id === id);
  function hasTrip(id: unknown): id is TripId { return !!findTrip(id); }
  function initialDays(id: TripId) {
    const trip = findTrip(id);
    return tripItineraries[id] || (trip ? emptyTripDays(trip) : []);
  }
  function create(input: NewTripInput, region: PoiRegion, cover: {src: string; source?: string; credit?: string}) {
    load();
    if (customTrips.value.length >= 100) throw new Error('已達這台裝置的 100 趟行程上限。');
    const trip = createCustomTrip(input, region, `custom-${crypto.randomUUID()}`, cover);
    const next = [trip, ...customTrips.value];
    try { localStorage.setItem(customTripsKey, JSON.stringify(next)); } catch { throw new Error('這台裝置暫時無法儲存行程，請確認瀏覽器儲存空間後再試。'); }
    customTrips.value = next;
    return trip;
  }
  return {trips, findTrip, hasTrip, initialDays, load, create};
}

import { creationPhotos, photoById, styleById, type CreationWork } from './creation.ts';
import { journeyStops, restoreJourney, type JourneyState } from './journey.ts';
import { tripSummaries, type TripId } from './trips.ts';

/** Dates, captions and companions are disclosed demo fixtures, not inferred photo metadata. */
export interface RecapStop {
  id: string;
  tripId: TripId;
  location: string;
  title: string;
  /** ISO calendar date of the trip moment, not the later AI creation/exchange timestamp. */
  date: string;
  /** Paths relative to public/, suitable for useAsset(). */
  source: string;
  image: string;
  format: string;
  caption: string;
  friend?: { name: string; note: string; image?: string };
  interaction: 'photo' | 'sticker' | 'pin' | 'scene' | 'companion';
  sourceCrop?: boolean;
  /** Alternate collectibles of this place stay inside this stop, not separate itinerary stops. */
  works: CreationWork[];
}

// The first photo of each stop is the one its revisit photo shows, so "make your own" starts from it.
const stopPhotoIds: Record<string, string[]> = {
  kobe: ['kobe-night'],
  amanohashidate: ['amanohashidate'],
  ine: ['ine-cruise'],
  kyoto: ['kiyomizu'],
  nara: ['nara-deer'],
  dotonbori: ['dotonbori'],
  usj: ['usj-scene', 'usj-panorama'],
  'fuji-blue': ['fuji-blue'],
};
const memoryAsset = (path: string) => `assets/memory/${path}`;

/** Places of a completed trip that an uploaded photo can be filed under. */
export function stopsForTrip(tripId: TripId | null): { id: string; name: string; location: string }[] {
  if (tripId === 'kansai') return journeyStops.map(stop => ({ id: stop.id, name: stop.name, location: stop.location }));
  if (tripId === 'fuji') return [{ id: 'fuji-blue', name: '富士山', location: photoById('fuji-blue')!.location }];
  return [];
}
export const stopForPhoto = (photoId?: string) => Object.keys(stopPhotoIds).find(id => photoId && stopPhotoIds[id]!.includes(photoId));
export const photoForStop = (stopId: string) => stopPhotoIds[stopId]?.[0];

function worksAtStop(stopId: string, tripId: TripId, allWorks: CreationWork[]): CreationWork[] {
  const ids = stopPhotoIds[stopId] || [];
  const seen = new Set<string>();
  return allWorks.filter(work => {
    // An exchanged souvenir from another trip is not evidence of visiting its place on this trip.
    if (work.tripId !== tripId || (work.sourceTripId && work.sourceTripId !== tripId) || seen.has(work.id)) return false;
    if (work.stopId) {
      if (work.stopId !== stopId) return false;
    } else {
      const photo = photoById(work.photoId) || creationPhotos.find(item => item.tripId === tripId && item.source === work.source);
      if (!photo || photo.tripId !== tripId || !ids.includes(photo.id)) return false;
    }
    seen.add(work.id);
    return true;
  }).map(work => ({ ...work }));
}

export function buildRecapStops(tripIds: TripId[], allWorks: CreationWork[], journeyState: JourneyState): RecapStop[] {
  const selected = new Set(tripIds);
  const completed = tripSummaries.filter(trip => selected.has(trip.id) && trip.status === 'completed');
  const result: RecapStop[] = [];
  const journey = restoreJourney(journeyState);

  for (const trip of completed) {
    if (trip.id === 'fuji') {
      const photo = photoById('fuji-blue')!;
      const works = worksAtStop('fuji-blue', 'fuji', allWorks);
      // Preserve the existing primary sticker; later formats remain available as alternate works.
      const primary = works.find(work => work.styleId === 'sticker') || works[0];
      const interaction: RecapStop['interaction'] = primary?.styleId === 'ticket' ? 'photo' : primary?.styleId || 'photo';
      result.push({
        id: 'fuji-blue', tripId: 'fuji', location: photo.location, title: photo.title,
        date: trip.startDate, source: memoryAsset(photo.source), sourceCrop: true,
        image: memoryAsset(primary?.image || photo.source),
        format: primary ? styleById(primary.styleId).name : '旅行照片',
        caption: trip.summary, interaction, works,
      });
    }
    if (trip.id === 'kansai') {
      const year = trip.startDate.slice(0, 4);
      for (const stop of journeyStops) {
        const isSceneSaved = stop.id === 'usj' && journey.usjCreated && journey.usjSaved;
        const photoOnly = stop.id === 'usj' && !isSceneSaved;
        const entry: RecapStop = {
          id: stop.id, tripId: 'kansai', location: stop.location, title: stop.name,
          date: `${year}-${stop.date.replace('.', '-')}`,
          source: stop.source, image: photoOnly ? stop.source : stop.image,
          format: photoOnly ? '旅行照片' : stop.formatLabel,
          caption: stop.id === 'usj'
            ? journey.note || (photoOnly ? '蘑菇餐廳、城堡和山丘，都留在這張照片裡。' : stop.caption)
            : stop.caption,
          interaction: photoOnly ? 'photo' : stop.format as RecapStop['interaction'],
          works: worksAtStop(stop.id, 'kansai', allWorks),
        };
        if (isSceneSaved && journey.friendAccepted) {
          entry.friend = {
            name: 'James',
            note: '同一天拍的照片，我把它做成了穿吊帶褲的旅伴。讓他去你的場景逛逛？',
            image: 'assets/memory/usj-companion-test.png',
          };
        }
        result.push(entry);
      }
    }
  }
  // Same-day ordering follows the itinerary: Kyoto, Nara, then Osaka at night.
  return result.sort((a, b) => a.date.localeCompare(b.date));
}

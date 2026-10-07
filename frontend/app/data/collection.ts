import { creationPhotos, workForPhoto, photoById, exampleCreator, isExampleWork, type CreationId, type CreationWork } from './creation.ts';
import { stickerKit, type StickerKit } from './creation-motifs.ts';
import type { TripId } from './trips.ts';

export const collectionCategories: { id: 'all' | CreationId; name: string; english: string; symbol: string }[] = [
  { id:'all', name:'全部', english:'TRAVEL COLLECTION', symbol:'▦' },
  { id:'sticker', name:'貼紙', english:'LITTLE TRAVEL STICKERS', symbol:'✿' },
  { id:'pin', name:'徽章', english:'ENAMEL PINS', symbol:'◈' },
  { id:'ticket', name:'票根', english:'TICKETS TO A MEMORY', symbol:'▤' },
  { id:'photo', name:'攝影', english:'TRAVEL PHOTOGRAPHS', symbol:'▧' },
  { id:'scene', name:'積木', english:'LITTLE SCENES', symbol:'⌂' },
  { id:'companion', name:'旅伴', english:'TRAVEL COMPANIONS', symbol:'✦' },
];
export interface CollectionEntry {
  id: string; title: string; work: CreationWork; collected: boolean;
  motif?: number; kit?: StickerKit;
}
const key = (work: CreationWork) => `${work.tripId}:${work.photoId || work.source}:${work.styleId}:${work.receivedFrom || 'self'}`;

/**
 * The one ownership rule every page counts with: made by you or received in an exchange, never an example.
 * Remaking the same photo in the same style replaces it (saved works are newest first).
 */
export function collectedWorks(tripId: TripId | null, saved: CreationWork[]): CreationWork[] {
  if (!tripId) return [];
  const unique = new Map<string, CreationWork>();
  for (const work of saved) if (work.tripId === tripId && !isExampleWork(work) && !unique.has(key(work))) unique.set(key(work), work);
  return [...unique.values()];
}

/** A catalogue is a view of existing examples and saved works, never another ownership store. */
export function buildCollectionEntries(tripId: TripId | null, saved: CreationWork[]): CollectionEntry[] {
  if (!tripId) return [];
  const examples = creationPhotos.filter(photo => photo.tripId === tripId && !photo.referenceOnly)
    .flatMap(photo => photo.styles.map(id => ({
      ...workForPhoto(photo,id,exampleCreator), id:`catalog-${photo.id}-${id}`, createdAt:tripId==='fuji'?'2026-02-14T17:00:00+08:00':photo.id==='usj-scene'||photo.id==='usj-panorama'?'2026-04-06T14:00:00+08:00':'2026-04-05T12:00:00+08:00',
    })));
  const unique = new Map<string, {work:CreationWork; collected:boolean}>();
  // Newest saved version replaces its example. Received copies retain their own provenance.
  for (const work of collectedWorks(tripId, saved)) unique.set(key(work), {work, collected:true});
  for (const work of examples) if (!unique.has(key(work))) unique.set(key(work), {work, collected:false});
  return [...unique.values()].flatMap(({work,collected}) => {
    const kit = work.styleId==='sticker' && work.preset!==false && !work.renderedImage
      && ['fuji-sticker.png','journey/nara-sticker.png'].includes(work.image) ? stickerKit(work) : undefined;
    if (kit) return kit.motifs.map((motif,index) => ({id:`${work.id}:${index}`,title:motif.name,work,collected,motif:index,kit}));
    const photo = photoById(work.photoId);
    return [{id:work.id,title:work.styleId==='companion'?(work.image==='usj-companion-test.png'?'樂園探險家':`${work.location.split(' · ')[0]}的旅伴`):work.styleId==='scene'?`${work.location.split(' · ')[0]}的小小世界`:photo?.title || work.title,work,collected}];
  });
}

/** A mixed opening spread; category pages keep each sticker series together. */
export function collectionOpeningOrder(entries: CollectionEntry[]): CollectionEntry[] {
  const first = collectionCategories.slice(1).flatMap(category => {
    const entry = entries.find(item => item.work.styleId===category.id);
    return entry ? [entry] : [];
  });
  const ids = new Set(first.map(entry=>entry.id));
  return [...first,...entries.filter(entry=>!ids.has(entry.id))];
}

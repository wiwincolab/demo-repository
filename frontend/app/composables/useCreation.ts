import { creationStyles, makeExample, photosForTrip, photoById, creationFriendsForTrip, isExampleWork, type CreationPhoto, type CreationWork, type CreationExchange } from '~/data/creation';
import { collectedWorks } from '~/data/collection';
import { stopForPhoto, stopsForTrip } from '~/data/recap';
import type { TripId } from '~/data/trips';
import { listPhotos, photoFromServer, uploadPhoto } from '~/utils/creation-api';
import { resizeToJpeg } from '~/utils/image-resize';

// 跨頁共用。作品一律是預製圖或本機合成的示範圖，重新整理就重來；有後端（GCP）時上傳的照片存在伺服器，重新整理接得回來
export function useCreation() {
  const { activeId } = useTripContext();
  const api = useApi();
  const asset = useAsset();
  const allWorks = useState<CreationWork[]>('creation-demo-works', () => [makeExample(creationStyles[0]!)]);
  const allExchanges = useState<CreationExchange[]>('creation-demo-exchanges', () => []);
  const uploadedPhotos = useState<CreationPhoto[]>('creation-demo-uploads', () => []);
  const synced = useState<TripId[]>('creation-synced-trips', () => []);
  const photos = computed(() => [...photosForTrip(activeId.value), ...uploadedPhotos.value.filter(photo => photo.tripId === activeId.value)]);
  const works = computed(() => allWorks.value.filter(work => work.tripId === activeId.value));
  const exchanges = computed(() => allExchanges.value.filter(exchange => exchange.tripId === activeId.value));
  const friends = computed(() => creationFriendsForTrip(activeId.value));
  const pending = computed(() => exchanges.value.filter(item => item.status === 'pending').length);
  // 「我的收藏」只有一種算法：每頁的件數都從這裡來（data/collection.ts）
  const collected = computed(() => collectedWorks(activeId.value, allWorks.value));
  const collectedFor = (tripId: TripId) => collectedWorks(tripId, allWorks.value);
  function findPhoto(id?: string) { return uploadedPhotos.value.find(photo => photo.id === id) || photoById(id); }

  // 每趟行程只向伺服器要一次這台手機的照片。先記下再發請求：好幾個元件同時呼叫時不會重複載入
  async function sync(tripId: TripId) {
    if (synced.value.includes(tripId)) return;
    synced.value.push(tripId);
    if (!(await api.check())) return;
    try {
      const knownPhotos = new Set(uploadedPhotos.value.map(photo => photo.id));
      uploadedPhotos.value.push(...(await listPhotos(tripId)).map(photoFromServer).filter(photo => !knownPhotos.has(photo.id)));
    } catch {
      synced.value = synced.value.filter(id => id !== tripId);
    }
  }
  if (import.meta.client) watch(activeId, id => { if (id) void sync(id); }, { immediate: true });

  // stopId：使用者說這張照片在哪一站；挑示範照片時沿用那張照片的站
  async function addPhoto(source: string, name: string, demoPhotoId?: string, file?: Blob, chosenStop?: string) {
    const tripId = activeId.value;
    if (!tripId) return;
    const template = photoById(demoPhotoId);
    const stop = stopsForTrip(tripId).find(item => item.id === (chosenStop || stopForPhoto(demoPhotoId)));
    const stopId = stop?.id;
    const title = name.replace(/\.[^.]+$/, '') || '旅行照片';
    const location = template?.location || stop?.location || '這趟旅行 · 我的照片';
    if (await api.check()) {
      try {
        // 範例照片也上傳一份：範例可能屬於別趟行程（伺服器只接受同一趟的示範照片），上傳後重新整理也還在
        const original = file ?? await (await fetch(source.startsWith('blob:') ? source : asset('assets/memory/' + source))).blob();
        const resized = await resizeToJpeg(original);
        const photo = photoFromServer(await uploadPhoto(tripId, resized.blob, { title, location, demoPhotoId, stopId, width: resized.width, height: resized.height, hash: resized.hash }));
        uploadedPhotos.value.unshift(photo);
        if (source.startsWith('blob:')) URL.revokeObjectURL(source);
        return photo;
      } catch {
        // 上傳失敗：退回只存在這支手機的照片
      }
    }
    const photo: CreationPhoto = { id: 'upload-' + crypto.randomUUID(), tripId, title, location, source, styles: template ? [...template.styles] : [], sourceCrop: template?.sourceCrop, demoPhotoId, stopId };
    uploadedPhotos.value.unshift(photo);
    return photo;
  }

  function save(work: CreationWork) {
    if (!activeId.value || work.tripId !== activeId.value) return;
    record(work);
  }
  // 不看目前選的行程：環球影城場景與 James 的交換固定屬於關西，從回憶地圖也會寫進來
  function record(work: CreationWork) {
    if (!allWorks.value.some(item => item.id === work.id)) allWorks.value.unshift({ ...work });
  }
  function request(friendId: string, outgoing: CreationWork, incoming: CreationWork, note: string) {
    // 範例不是你的，不能拿去換朋友的作品
    if(!activeId.value || outgoing.tripId!==activeId.value || isExampleWork(outgoing)) return null;
    const duplicate = exchanges.value.find(e => e.direction === 'sent' && e.status === 'pending' && e.friendId === friendId && e.outgoing.id === outgoing.id && e.incoming.id === incoming.id);
    if (duplicate) return duplicate;
    save(outgoing);
    const exchange: CreationExchange = { id: crypto.randomUUID(), tripId:activeId.value, friendId, outgoing: { ...outgoing }, incoming: { ...incoming }, note: note.trim(), reply: '', direction: 'sent', status: 'pending', createdAt: new Date().toISOString() };
    allExchanges.value.unshift(exchange);
    return exchange;
  }
  function resolve(id: string, status: 'accepted' | 'declined' | 'cancelled', reply = '') {
    const exchange = exchanges.value.find(e => e.id === id);
    if (!exchange || exchange.status !== 'pending') return;
    exchange.status = status;
    exchange.reply = reply.trim();
    exchange.resolvedAt = new Date().toISOString();
    if (status === 'accepted') {
      const received = { ...exchange.incoming, tripId:exchange.tripId, sourceTripId:exchange.incoming.tripId, id: `received-${exchange.id}`, exchangeId: exchange.id, receivedFrom: exchange.friendId };
      allWorks.value.unshift(received);
      if (!allWorks.value.some(item => item.id === exchange.outgoing.id)) allWorks.value.push({ ...exchange.outgoing });
    }
  }
  return { works, exchanges, allWorks, collected, collectedFor, pending, friends, photos, findPhoto, addPhoto, save, record, request, resolve };
}

export function useCreationAsset() {
  const asset = useAsset();
  return (path: string) => {
    const candidate = path.replace(/^assets\/memory\//, '');
    // 本機預覽（blob:、data:）與伺服器上的照片、作品（/api/media/…）直接用，其他是網站內建的素材
    return /^(blob:|data:image\/|\/api\/media\/)/.test(candidate) ? candidate : asset(path);
  };
}

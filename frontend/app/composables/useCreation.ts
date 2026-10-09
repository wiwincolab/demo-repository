import { creationStyles, makeExample, photosForTrip, photoById, creationFriendsForTrip, isExampleWork, type CreationPhoto, type CreationWork, type CreationExchange } from '~/data/creation';
import { collectedWorks } from '~/data/collection';
import type { TripId } from '~/data/trips';

// Demo 僅使用內建照片。創作與交換跨頁共用，重新整理後重設，不載入裝置的私人上傳。
export function useCreation() {
  const { activeId } = useTripContext();
  const allWorks = useState<CreationWork[]>('creation-demo-works', () => [makeExample(creationStyles[0]!)]);
  const allExchanges = useState<CreationExchange[]>('creation-demo-exchanges', () => []);
  const photos = computed(() => photosForTrip(activeId.value));
  const works = computed(() => allWorks.value.filter(work => work.tripId === activeId.value));
  const exchanges = computed(() => allExchanges.value.filter(exchange => exchange.tripId === activeId.value));
  const friends = computed(() => creationFriendsForTrip(activeId.value));
  const pending = computed(() => exchanges.value.filter(item => item.status === 'pending').length);
  // 「我的收藏」只有一種算法：每頁的件數都從這裡來（data/collection.ts）
  const collected = computed(() => collectedWorks(activeId.value, allWorks.value));
  const collectedFor = (tripId: TripId) => collectedWorks(tripId, allWorks.value);
  function findPhoto(id?: string) { return photoById(id); }

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
  return { works, exchanges, allWorks, collected, collectedFor, pending, friends, photos, findPhoto, save, record, request, resolve };
}

export function useCreationAsset() {
  const asset = useAsset();
  return (path: string) => {
    const candidate = path.replace(/^assets\/memory\//, '');
    // 本機預覽（blob:、data:）與伺服器上的照片、作品（/api/media/…）直接用，其他是網站內建的素材
    if (/^(blob:|data:image\/|\/api\/media\/)/.test(candidate)) return candidate;
    if (candidate.startsWith('assets/')) return asset(candidate);
    return asset(path.startsWith('assets/') ? path : `assets/memory/${path}`);
  };
}

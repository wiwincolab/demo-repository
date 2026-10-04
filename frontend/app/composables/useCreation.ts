import { creationStyles, makeExample, photosForTrip, photoById, creationFriendsForTrip, type CreationPhoto, type CreationWork, type CreationExchange } from '~/data/creation';

// Shared through navigation for recording; a full reload starts a fresh take.
export function useCreation() {
  const { activeId } = useTripContext();
  const allWorks = useState<CreationWork[]>('creation-demo-works', () => [makeExample(creationStyles[0]!)]);
  const allExchanges = useState<CreationExchange[]>('creation-demo-exchanges', () => []);
  const uploadedPhotos = useState<CreationPhoto[]>('creation-demo-uploads', () => []);
  const photos = computed(() => [...photosForTrip(activeId.value), ...uploadedPhotos.value.filter(photo => photo.tripId === activeId.value)]);
  const works = computed(() => allWorks.value.filter(work => work.tripId === activeId.value));
  const exchanges = computed(() => allExchanges.value.filter(exchange => exchange.tripId === activeId.value));
  const friends = computed(() => creationFriendsForTrip(activeId.value));
  const pending = computed(() => exchanges.value.filter(item => item.status === 'pending').length);
  function findPhoto(id?: string) { return uploadedPhotos.value.find(photo => photo.id === id) || photoById(id); }
  function addPhoto(source: string, name: string, demoPhotoId?: string) {
    if (!activeId.value) return;
    const template = photoById(demoPhotoId);
    const photo: CreationPhoto = { id: 'upload-' + crypto.randomUUID(), tripId: activeId.value, title: name.replace(/\.[^.]+$/, '') || '旅行照片', location: template?.location || '這趟旅行 · 我的照片', source, styles: template ? [...template.styles] : [], sourceCrop: template?.sourceCrop, demoPhotoId };
    uploadedPhotos.value.unshift(photo);
    return photo;
  }
  function save(work: CreationWork) {
    if (!activeId.value || work.tripId !== activeId.value) return;
    if (!allWorks.value.some(item => item.id === work.id)) allWorks.value.unshift({ ...work });
  }
  function request(friendId: string, outgoing: CreationWork, incoming: CreationWork, note: string) {
    if(!activeId.value || outgoing.tripId!==activeId.value) return null;
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
  return { works, exchanges, allWorks, pending, friends, photos, findPhoto, addPhoto, save, request, resolve };
}

export function useCreationAsset() {
  const asset = useAsset();
  return (path: string) => {
    const candidate = path.replace(/^assets\/memory\//, '');
    return /^(blob:|data:image\/)/.test(candidate) ? candidate : asset(path);
  };
}

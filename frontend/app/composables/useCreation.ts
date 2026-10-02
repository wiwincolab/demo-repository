import { creationStyles, makeExample, restoreCreationWork, creationFriendsForTrip, type CreationWork, type CreationExchange } from '~/data/creation';

// Stored globally for migration and Atlas; consumers see only the active trip.
export function useCreation() {
  const { activeId } = useTripContext();
  const allWorks = useState<CreationWork[]>('creation-works-v2', () => [makeExample(creationStyles[0]!)]);
  const allExchanges = useState<CreationExchange[]>('creation-exchanges-v2', () => []);
  const ready = useState('creation-storage-ready-v2', () => false);
  const { notify } = useDemo();
  const works = computed(() => allWorks.value.filter(work => work.tripId === activeId.value));
  const exchanges = computed(() => allExchanges.value.filter(exchange => exchange.tripId === activeId.value));
  const friends = computed(() => creationFriendsForTrip(activeId.value));
  const pending = computed(() => exchanges.value.filter(item => item.status === 'pending').length);
  const key = 'chictrip-ai-creation-v2';
  onMounted(() => {
    if (ready.value) return;
    try {
      const saved = JSON.parse(localStorage.getItem(key) || localStorage.getItem('chictrip-ai-creation-v1') || 'null');
      if ([1,2].includes(saved?.version) && Array.isArray(saved.works) && Array.isArray(saved.exchanges)) {
        allWorks.value = saved.works.map(restoreCreationWork).filter((work:CreationWork|undefined):work is CreationWork => !!work);
        allExchanges.value = saved.exchanges.flatMap((entry:CreationExchange) => {
          if(!entry || typeof entry.id!=='string') return [];
          const outgoing=restoreCreationWork(entry.outgoing), incoming=restoreCreationWork(entry.incoming);
          if(!outgoing || !incoming || !['pending','accepted','declined','cancelled'].includes(entry.status)) return [];
          return [{...entry,tripId:outgoing.tripId,outgoing,incoming}];
        });
      }
    } catch { /* Preserve existing disk records if they cannot be read. */ }
    ready.value = true;
  });
  function persist() {
    try { localStorage.setItem(key, JSON.stringify({ version: 2, works: allWorks.value, exchanges: allExchanges.value })); }
    catch { notify('本次操作已完成，但瀏覽器無法保存紀錄；請勿關閉頁面。'); }
  }
  function save(work: CreationWork) {
    if (!activeId.value || work.tripId !== activeId.value) return;
    if (!allWorks.value.some(item => item.id === work.id)) allWorks.value.unshift({ ...work });
    persist();
  }
  function request(friendId: string, outgoing: CreationWork, incoming: CreationWork, note: string) {
    if(!activeId.value || outgoing.tripId!==activeId.value) return null;
    const duplicate = exchanges.value.find(e => e.direction === 'sent' && e.status === 'pending' && e.friendId === friendId && e.outgoing.id === outgoing.id && e.incoming.id === incoming.id);
    if (duplicate) return duplicate;
    save(outgoing);
    const exchange: CreationExchange = { id: crypto.randomUUID(), tripId:activeId.value, friendId, outgoing: { ...outgoing }, incoming: { ...incoming }, note: note.trim(), reply: '', direction: 'sent', status: 'pending', createdAt: new Date().toISOString() };
    allExchanges.value.unshift(exchange);
    persist();
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
    persist();
  }
  return { works, exchanges, allWorks, pending, friends, save, request, resolve };
}

import { mascots, isMascotId, type MascotId } from '~/data/mascots';

const storageKey = 'chictrip-mascot-v1';
export function useMascot() {
  const selectedId = useState<MascotId>('mascot-choice', () => 'usj');
  const ready = useState('mascot-ready', () => false);
  onMounted(() => {
    if (ready.value) return;
    try {
      const saved = localStorage.getItem(storageKey);
      if (isMascotId(saved)) selectedId.value = saved;
    } catch { /* Selection still works in memory when storage is unavailable. */ }
    ready.value = true;
  });
  function select(id: MascotId) {
    if (!isMascotId(id)) return false;
    selectedId.value = id;
    try { localStorage.setItem(storageKey, id); return true; } catch { return false; }
  }
  return { selectedId, ready, selected: computed(() => mascots.find(m => m.id === selectedId.value)!), select };
}

import { mascots, isMascotId, type MascotId } from '~/data/mascots';

const storageKey = 'chictrip-mascot-v1';
// Serialize browser updates so a slower request cannot restore an older outfit.
let syncQueue: Promise<void> = Promise.resolve();
export function useMascot() {
  const selectedId = useState<MascotId>('mascot-choice', () => 'usj');
  const ready = useState('mascot-ready', () => false);
  const api = useApi();
  const syncStatus = useState<'idle' | 'saving' | 'saved' | 'error'>('mascot-sync-status', () => 'idle');
  function sync(id: MascotId) {
    syncStatus.value = 'saving';
    syncQueue = syncQueue.then(async () => {
      if (selectedId.value !== id) return;
      if (!(await api.check())) { syncStatus.value = 'idle'; return; }
      try {
        await $fetch('/api/me/mascot', { method: 'PUT', body: { mascotId: id }, retry: 0, timeout: 5000 });
        if (selectedId.value === id) syncStatus.value = 'saved';
      } catch { if (selectedId.value === id) syncStatus.value = 'error'; }
    });
  }
  onMounted(async () => {
    if (ready.value) return;
    let localChoice = false;
    try {
      const saved = localStorage.getItem(storageKey);
      if (isMascotId(saved)) { selectedId.value = saved; localChoice = true; }
    } catch { /* Selection still works in memory when storage is unavailable. */ }
    ready.value = true;
    const initial = selectedId.value;
    if (!(await api.check())) return;
    if (localChoice) { sync(selectedId.value); return; }
    try {
      const profile = await $fetch<{ mascotId: unknown }>('/api/me', { retry: 0, timeout: 5000 });
      // Do not overwrite a selection made while this request was pending.
      if (selectedId.value !== initial || syncStatus.value !== 'idle') return;
      if (isMascotId(profile.mascotId)) {
        selectedId.value = profile.mascotId;
        try { localStorage.setItem(storageKey, profile.mascotId); } catch {}
      } else sync(selectedId.value);
    } catch { syncStatus.value = 'error'; }
  });
  function select(id: MascotId) {
    if (!isMascotId(id)) return false;
    selectedId.value = id;
    sync(id);
    try { localStorage.setItem(storageKey, id); return true; } catch { return false; }
  }
  return { selectedId, ready, syncStatus, selected: computed(() => mascots.find(m => m.id === selectedId.value)!), select };
}

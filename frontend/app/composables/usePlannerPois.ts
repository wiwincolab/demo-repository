import type { PoiCatalog, PoiRegion, PoiSnapshot } from '~/types/poi';
import { createPoiRepository } from '~/utils/planner-poi';

export function usePlannerPois() {
  const asset = useAsset();
  const repository = createPoiRepository(url => $fetch(url, { timeout: 8000 }), asset);
  const catalog = shallowRef<PoiCatalog | null>(null), snapshots = shallowRef<PoiSnapshot[]>([]);
  const loading = ref(false), error = ref('');
  const prepared = new Map<string, PoiSnapshot>(), pending = new Map<string, Promise<void>>();
  let disposed = false;
  async function loadCatalog() {
    try { const value = await repository.catalog(); if (!disposed) catalog.value = value; }
    catch { if (!disposed) error.value = '景點目錄暫時無法載入，請重試。'; }
  }
  async function loadRegions(regions: PoiRegion[]) {
    if (disposed) return;
    error.value = '';
    // Regional snapshots, rather than a full-country payload, limit each load.
    for (let i = 0; i < regions.length && !disposed; i += 3) {
      await Promise.all(regions.slice(i, i + 3).map(region => {
        if (prepared.has(region.id)) return;
        if (!pending.has(region.id)) {
          const request = repository.region(region).then(value => {
            if (disposed) return;
            prepared.set(region.id, value); snapshots.value = [...prepared.values()];
          }).catch(() => { if (!disposed) error.value = '部分景點暫時無法載入，請重試。'; })
            .finally(() => { pending.delete(region.id); if (!disposed) loading.value = pending.size > 0; });
          pending.set(region.id, request); loading.value = true;
        }
        return pending.get(region.id);
      }));
    }
  }
  onBeforeUnmount(() => { disposed = true; });
  return { catalog, snapshots, loading, error, loadCatalog, loadRegions };
}

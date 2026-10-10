import type { PoiCatalog, PoiRegion, PoiSnapshot } from '~/types/poi';
import { createPoiRepository, createVisiblePoiLoader } from '~/utils/planner-poi';

export function usePlannerPois() {
  const asset = useAsset();
  const repository = createPoiRepository((url,signal) => $fetch(url, { timeout: 8000, signal }), asset);
  const catalog = shallowRef<PoiCatalog | null>(null), snapshots = shallowRef<PoiSnapshot[]>([]);
  const loading = ref(false), error = ref('');
  let disposed = false, revision=0;
  const loader=createVisiblePoiLoader(repository, value=>{if(!disposed)snapshots.value=value;});
  async function loadCatalog() {
    try { const value = await repository.catalog(); if (!disposed) catalog.value = value; }
    catch { if (!disposed) error.value = '景點目錄暫時無法載入，請重試。'; }
  }
  async function loadRegions(regions: PoiRegion[]) {
    if (disposed) return;
    const current=++revision;
    error.value = ''; loading.value=true;
    try {await loader.load(regions);}
    catch {if(!disposed && current===revision)error.value='部分景點暫時無法載入，請重試。';}
    finally {if(!disposed && current===revision)loading.value=false;}
  }
  onBeforeUnmount(() => { disposed = true; loader.dispose(); });
  return { catalog, snapshots, loading, error, loadCatalog, loadRegions };
}

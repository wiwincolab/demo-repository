import type { TripTransport } from '~/data/trips';
import type { Stop } from '~/types/trip';
import { isTripTransport, legTransport, restoreTransportSettings, transportLegKey, tripTransportLabels, type TransportSettings } from '~/utils/trip-transport';

export function useTripTransport() {
  const {activeId, activeTrip} = useTripContext();
  const {notify} = useDemo();
  const records = useState<Record<string, TransportSettings>>('trip-transport-settings',()=>({}));
  const loaded = useState<string[]>('trip-transport-loaded',()=>[]);
  const settings = computed(()=>records.value[activeId.value || ''] || restoreTransportSettings(null,activeTrip.value?.transport));
  function load() {
    const id = activeId.value;
    if (!import.meta.client || !id || loaded.value.includes(id)) return;
    let stored: unknown = null;
    try { stored=JSON.parse(localStorage.getItem(`chictrip-transport-v1-${id}`) || 'null'); } catch {}
    records.value[id]=restoreTransportSettings(stored,activeTrip.value?.transport);
    loaded.value=[...loaded.value,id];
  }
  function save(next: TransportSettings) {
    load();
    const id=activeId.value;
    if (!import.meta.client || !id) return;
    try {localStorage.setItem(`chictrip-transport-v1-${id}`,JSON.stringify(next));records.value[id]=next;}
    catch {notify('目前無法儲存交通選擇，請重試。');}
  }
  function changeMajor(value: unknown) {load();if(isTripTransport(value))save({...settings.value,major:value});}
  function changeLeg(from: Stop, to: Stop, value: unknown) {
    load();
    if(!isTripTransport(value) && value!=='')return;
    const legs={...settings.value.legs},key=transportLegKey(from,to);
    if(value==='')delete legs[key];else legs[key]=value;
    save({...settings.value,legs});
  }
  onMounted(load);
  watch(activeId,load);
  return {settings,labels:tripTransportLabels,changeMajor,changeLeg,modeFor:(from:Stop,to:Stop)=>legTransport(settings.value,from,to),keyFor:transportLegKey};
}

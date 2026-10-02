import { isTripId, tripSummaries, type TripId } from '~/data/trips';
import type { LocationQueryRaw } from 'vue-router';

export function useTripContext() {
  const route=useRoute();
  const activeId=useState<TripId|null>('active-trip-v1',()=>null);
  const ready=useState('active-trip-ready-v1',()=>false);
  const activeTrip=computed(()=>tripSummaries.find(trip=>trip.id===activeId.value));
  const storageKey='chictrip-active-trip-v1';
  function selectTrip(id:TripId) {
    if(!isTripId(id))return;
    activeId.value=id;
    if(import.meta.client)try{localStorage.setItem(storageKey,id);}catch{}
  }
  function fromRoute():TripId|null {
    if(route.path.startsWith('/memory/usj'))return 'kansai';
    if(isTripId(route.query.trip))return route.query.trip;
    if(route.query.journey==='kansai'&&!route.path.startsWith('/atlas'))return 'kansai';
    return null;
  }
  onMounted(()=>{
    if(ready.value)return;
    const requested=fromRoute();
    if(requested)selectTrip(requested);
    else try{const cached=localStorage.getItem(storageKey);if(isTripId(cached))activeId.value=cached;}catch{}
    ready.value=true;
  });
  watch(()=>route.fullPath,()=>{if(ready.value){const requested=fromRoute();if(requested)selectTrip(requested);}});
  function clearSelection(){activeId.value=null;if(import.meta.client)try{localStorage.removeItem(storageKey);}catch{}}
  function tripHref(path:string,query:LocationQueryRaw={}){return {path,query:{...(activeId.value?{trip:activeId.value}:{}),...query}};}
  return {activeId,activeTrip,ready,selectTrip,tripHref,clearSelection};
}

<script setup lang="ts">
import ChictripMotion from '~/components/ChictripMotion.vue';
import {tripItineraries,plannerStorageKey} from '~/data/trips';
import type { Stop } from '~/types/trip';
import type { PoiCountry } from '~/types/poi';
import { mergePlannerPlaces, poiRegionsInBounds } from '~/utils/planner-poi';
import type { Point } from '~/utils/map';
import { withinPlanningAreas, validPlanningBoundary } from '~/utils/planner-map';
import { travelPasses, filterTravelPasses, findTravelPass, passCountries, passKindLabels, travelPassRegions, type TravelPass, type TravelPassCountry } from '~/data/travel-passes';
import { benefitsForPass } from '~/data/pass-benefits';
import { passCoverageIndex, coverageExtent, withinPassCoverage, coverageStatus, displayCoverageGap, isTaiwanBundle, taiwanBundleOptions, mergeBundleCoverage, type PassCoverage } from '~/utils/pass-coverage';
import { plannerKeywords } from '~/data/planner-preferences';
import { recommendPlaces, rainPlanDetailsFor, type Recommendation } from '~/utils/planner';
import { conversationPlan, initialConversationStops, plannedDay } from '~/utils/planner-chat';
import { redeemedPlanningContext, type PointsProduct } from '~/utils/points';
const asset = useAsset();
const { notify, days: currentDays } = useDemo();
const {activeId,activeTrip,tripHref}=useTripContext();
const route=useRoute();
const planningDay=computed(()=>{const n=Number(route.query.day || 0);return Number.isInteger(n)&&n>=0&&n<currentDays.value.length?n:0;});
const {wallet:pointsWallet,ready:pointsReady}=usePointsWallet();
const itineraryPlaces = computed<Stop[]>(()=>{
  if(!activeId.value)return [];
  const trip=tripItineraries[activeId.value];
  return trip.flatMap(d=>d.stops).filter((s,i,all)=>all.findIndex(p=>p.name===s.name)===i);
});
const { catalog: poiCatalog, snapshots: poiSnapshots, loading: poiLoading, error: poiError, loadCatalog, loadRegions } = usePlannerPois();
const poiCountry = ref<PoiCountry>('JP'), poiRegionId = ref(''), mapBounds = shallowRef<number[] | null>(null);
const viewport = shallowRef<number[]>([]), savedPoiStops = ref<Stop[]>([]), pickedPoiStops = shallowRef<Stop[]>([]), inspectedId = ref<number | null>(null);
const placeListOpen = ref(false), placeQuery = ref(''), placeListLimit = ref(30), failedListPhotos = ref<string[]>([]);
const placeList = ref<HTMLDetailsElement>();
const inspectedPhotoFailed = ref(false);
watch(inspectedId,()=>{inspectedPhotoFailed.value=false;});
const pendingSavedIds = new Set<number>();
const itineraryCountry = computed<PoiCountry>(() => activeTrip.value?.country === 'korea' ? 'KR' : activeTrip.value?.country === 'taiwan' ? 'TW' : 'JP');
const poiCountries = [{id:'JP',name:'日本'},{id:'KR',name:'韓國'},{id:'TW',name:'台灣'}];
const poiRegions = computed(() => poiCatalog.value?.regions.filter(r => r.country === poiCountry.value && r.file) || []);
const loadedPois = computed(() => [...new Map(poiSnapshots.value.filter(s => s.region.country === poiCountry.value).flatMap(s => s.pois).map(p => [p.id,p])).values()]);
const places = computed(() => mergePlannerPlaces(poiCountry.value === itineraryCountry.value ? itineraryPlaces.value : [], loadedPois.value, [...savedPoiStops.value,...pickedPoiStops.value].filter(p => p.poiCountry === poiCountry.value)));
const viewportPlaces = computed(() => viewport.value.length === 4 ? places.value.filter(p=>p.at[0]!>=viewport.value[0]! && p.at[0]!<=viewport.value[2]! && p.at[1]!>=viewport.value[1]! && p.at[1]!<=viewport.value[3]!) : places.value);
const inspectedPlace = computed(() => places.value.find(p => p.id === inspectedId.value) || null);
const inspectedPoi = computed(() => loadedPois.value.find(p => p.id === inspectedPlace.value?.poiId) || null);
async function loadVisiblePois(bounds = viewport.value, zoom = 10) {
  if (!poiCatalog.value) return;
  const candidates=poiRegionsInBounds(poiRegions.value,bounds);
  const centre=[(bounds[0]!+bounds[2]!)/2,(bounds[1]!+bounds[3]!)/2];
  const nearest=[...candidates].sort((a,b)=>Math.hypot((a.bbox[0]!+a.bbox[2]!)/2-centre[0]!, (a.bbox[1]!+a.bbox[3]!)/2-centre[1]!)-Math.hypot((b.bbox[0]!+b.bbox[2]!)/2-centre[0]!, (b.bbox[1]!+b.bbox[3]!)/2-centre[1]!));
  const preferred=candidates.find(r=>r.id===poiRegionId.value);
  await loadRegions(zoom<7 ? (preferred ? [preferred] : nearest.slice(0,1)) : nearest.slice(0,3));
}
let viewportTimer: ReturnType<typeof setTimeout> | undefined;
function onViewport(bounds: number[], zoom: number) { viewport.value = bounds; clearTimeout(viewportTimer); viewportTimer=setTimeout(()=>void loadVisiblePois(bounds,zoom),120); }
function choosePoiRegion(reset = true) {
  const region = poiRegions.value.find(r => r.id === poiRegionId.value);
  if (!region) return;
  if (reset) { selectRange([]); hasRange.value = false; selectionBoundary.value = []; draft.value = []; inspectedId.value = null; }
  mapBounds.value = [...region.bbox];
  void loadRegions([region]);
}
function choosePoiCountry() { poiRegionId.value = poiRegions.value[0]?.id || ''; choosePoiRegion(); }
function initializePoiDestination() {
  if (!poiCatalog.value || !activeId.value) return;
  if (selectedPass.value && passCoverage.value) { void loadPassPois(passCoverage.value, selectedPass.value.country); return; }
  let stored: {poiCountry?: PoiCountry; poiRegionId?: string} | null = null;
  try { stored = JSON.parse(localStorage.getItem(plannerStorageKey(activeId.value)) || 'null'); } catch {}
  poiCountry.value = stored?.poiCountry && poiCountries.some(c => c.id === stored!.poiCountry) ? stored.poiCountry : itineraryCountry.value;
  const first = itineraryPlaces.value[0]?.at;
  const initial = poiRegions.value.find(r => r.id === stored?.poiRegionId) || (first && poiRegions.value.find(r => first[0]! >= r.bbox[0]! && first[0]! <= r.bbox[2]! && first[1]! >= r.bbox[1]! && first[1]! <= r.bbox[3]!)) || poiRegions.value[0];
  if (initial) { poiRegionId.value = initial.id; choosePoiRegion(false); }
}
watch(poiCatalog, initializePoiDestination);
onMounted(() => { void loadCatalog(); });
async function loadPassPois(coverage: PassCoverage | null, country: PoiCountry) {
  poiCountry.value = country;
  const extent = coverageExtent(coverage).flat();
  if (!extent.length) return;
  const bounds = extent.reduce((b,p)=>[Math.min(b[0]!,p[0]!),Math.min(b[1]!,p[1]!),Math.max(b[2]!,p[0]!),Math.max(b[3]!,p[1]!)],[Infinity,Infinity,-Infinity,-Infinity]);
  const regions = poiRegionsInBounds(poiRegions.value, bounds);
  const initial=regions.find(r=>r.id===poiRegionId.value) || regions[0];
  poiRegionId.value=initial?.id || '';
  // The viewport loader fetches nearby regions after the map moves. A national
  // ticket must not download and recluster the entire country.
  if(initial)await loadRegions([initial]);
}
const { keywordIds, enabled: useKeywords } = useTravelPreferences();
const appliedKeywords = computed(() => useKeywords.value ? keywordIds.value : []);
const appliedTitles = computed(() => plannerKeywords.filter(k => appliedKeywords.value.includes(k.id)).map(k => k.title));
const ids = ref<number[]>([]), drawing = ref(false), preferences = ref(''), pace = ref(3);
const placeChoices = computed(() => {
  const query = placeQuery.value.trim().normalize('NFKC').toLocaleLowerCase();
  const [w,s,e,n] = viewport.value;
  const centre = [(w!+e!)/2,(s!+n!)/2];
  const distance = (p: Stop) => Math.hypot((p.at[0]!-centre[0]!) * 90,(p.at[1]!-centre[1]!) * 111);
  return [...viewportPlaces.value].filter(p => !query || (p.name+p.short).normalize('NFKC').toLocaleLowerCase().includes(query)).sort((a,b) => distance(a)-distance(b) || a.id-b.id);
});
watch(placeQuery, () => { placeListLimit.value = 30; });
watch([poiCountry,poiRegionId], () => { placeQuery.value = ''; placeListLimit.value = 30; });
const selectionBoundary = ref<Point[]>([]);
const rangeIds = ref<number[]>([]), hasRange = ref(false), mapRevision = ref(0), refinement = ref(''), refinementStatus = ref('');
const selectedPassId = ref('');
const passVariant = ref('');
const passVariants = computed(() => passCoverageIndex[selectedPassId.value]?.variants || []);
const bundleCity = ref(''), bundleShuttle = ref('');
const bundleChoices = computed(() => ({city:taiwanBundleOptions.city.map(findTravelPass).filter((p):p is TravelPass=>!!p),shuttle:taiwanBundleOptions.shuttle.map(findTravelPass).filter((p):p is TravelPass=>!!p)}));
const passCountry = ref<TravelPassCountry | ''>(''), passRegion = ref(''), passQuery = ref('');
const availablePasses = computed(() => filterTravelPasses({ country: passCountry.value, region: passRegion.value, query: passQuery.value }));
const availableRegions = computed(() => travelPassRegions(passCountry.value));
watch(passCountry, () => { passRegion.value = ''; });
const selectedPass = computed(() => findTravelPass(selectedPassId.value));
const selectedBenefits = computed(() => benefitsForPass(selectedPassId.value));
const passCoverage = shallowRef<PassCoverage | null>(null), coverageLoading = ref(false), coverageError = ref('');
const coverageMetadata = computed(() => passCoverage.value?.metadata || passCoverageIndex[selectedPassId.value]);
const coverageCache = new Map<string, PassCoverage | null>();
let coverageController: AbortController | undefined;
async function loadCoverage(id:string,variant='',signal?:AbortSignal) {
  const metadata=passCoverageIndex[id];
  const file=metadata?.variants?.find(v=>v.id===variant)?.file || metadata?.file;
  const key=file || id;
  if(coverageCache.has(key))return coverageCache.get(key)!;
  const coverage=file ? await $fetch<PassCoverage>(asset('pass-coverage/compact/'+file),{signal}).catch(error=>{if(signal?.aborted)throw error;return $fetch<PassCoverage>(asset('pass-coverage/'+file),{signal});}) : null;
  if(signal?.aborted)throw signal.reason;
  coverageCache.set(key,coverage);
  if(coverageCache.size>3)coverageCache.delete(coverageCache.keys().next().value!);
  return coverage;
}
let coverageRevision = 0, selectAllForPass = false;
watch(selectedPassId, id => { bundleCity.value='';bundleShuttle.value='';passVariant.value=passCoverageIndex[id]?.variants?.[0]?.id || ''; },{flush:'sync'});
watch([selectedPassId,bundleCity,bundleShuttle,passVariant], async ([id,city,shuttle,variant]) => {
  const revision = ++coverageRevision;
  coverageController?.abort();coverageController=new AbortController();const signal=coverageController.signal;
  passCoverage.value = null; coverageError.value = ''; coverageLoading.value = !!id;
  if (!id) { coverageLoading.value = false; return; }
  try {
    let coverage = await loadCoverage(id,variant,signal);
    if (coverage && isTaiwanBundle(id)) {
      const options=await Promise.all([city ? loadCoverage(city,'',signal) : null,shuttle ? loadCoverage(shuttle,'',signal) : null]);
      coverage=mergeBundleCoverage(coverage,options[0],options[1]);
    }
    if (revision !== coverageRevision) return;
    passCoverage.value = coverage;
    await loadPassPois(coverage, selectedPass.value?.country || poiCountry.value);
    if (revision !== coverageRevision) return;
    rangeIds.value = places.value.filter(p => withinPassCoverage(p.at, coverage)).map(p => p.id);
    const allowed=new Set(rangeIds.value);
    ids.value = selectAllForPass ? [...rangeIds.value] : ids.value.filter(id => allowed.has(id));
  } catch { if (revision === coverageRevision) coverageError.value = '票券路網暫時無法載入，請查看官方範圍或自己圈選。'; }
  finally { if (revision === coverageRevision) coverageLoading.value = false; }
});
const extension = ref(0), planNotes = ref<string[]>([]);
const panel = ref<'passes' | 'saved' | null>(null);
const dirty = ref(false), error = ref('');
const routeIds = computed(() => !dirty.value ? draft.value.map(s => s.id) : []);
const busy = ref(false), draft = ref<Recommendation[]>([]);
const planningMode=ref<'ai'|'map'|'pass'>('ai'), chatText=ref('');
const messages=ref<{role:'user'|'assistant';text:string}[]>([]);
const ownedServices=computed(()=>redeemedPlanningContext(pointsWallet.value.orders,activeId.value || '',activeTrip.value?.country || 'japan',draft.value.length?draft.value:currentDays.value[planningDay.value]?.stops || []));
const resultsBox=ref<HTMLElement>();
function choosePlanningMode(mode:'ai'|'map'|'pass'){planningMode.value=mode;drawing.value=false;if(mode==='pass')panel.value='passes';}
function initialDraft(){if(!draft.value.length)draft.value=initialConversationStops(currentDays.value[planningDay.value]?.stops || [],places.value);}
onMounted(initialDraft);
let autoPlannedTrip='';
watch([activeId,pointsReady,()=>route.query.redeemed],async ([trip,ready,redeemed])=>{if(!import.meta.client||!trip||!ready||redeemed!=='1'||autoPlannedTrip===trip)return;autoPlannedTrip=trip;await nextTick();initialDraft();generate();},{immediate:true});
watch(planningDay,()=>{draft.value=[];dirty.value=false;messages.value=[];void nextTick(initialDraft);});
function serviceStop(p:PointsProduct):Stop{const code=[...p.id].reduce((n,c)=>(n*31+c.charCodeAt(0))%10000000,0);return {id:-2100000000-code,day:planningDay.value,name:p.name,short:p.brand,at:[...p.at],time:'10:00',stay:`體驗 ${p.minutes} 分鐘`,note:'已兌換的示範服務；日期、預約與使用條件待確認。',range:[p.minutes,p.minutes],photo:{src:p.image,alt:p.name+'情境參考照片',source:p.source,credit:p.credit,license:'情境參考照片',licenseUrl:p.source,objectPosition:'center'}};}
function submitChat(){
 const text=chatText.value.trim();if(!text||busy.value)return;initialDraft();messages.value.push({role:'user',text});chatText.value='';
 const result=conversationPlan(places.value,draft.value,text,appliedKeywords.value);
 if(result.changed){preferences.value=[preferences.value,text].filter(Boolean).join('，').slice(-300);draft.value=result.stops;planNotes.value=[...result.notes,...ownedServices.value.map(s=>s.note)];dirty.value=false;drawing.value=false;}
 messages.value.push({role:'assistant',text:result.message});messages.value=messages.value.slice(-12);
 void nextTick(()=>resultsBox.value?.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'}));
}
function suggestChat(text:string){chatText.value=text;submitChat();}
let generationTimer: ReturnType<typeof setTimeout> | undefined;
watch(activeId,()=>{planningMode.value='ai';messages.value=[];chatText.value='';selectAllForPass=false;clearTimeout(generationTimer);ids.value=[];rangeIds.value=[];selectionBoundary.value=[];selectedPassId.value='';hasRange.value=false;drawing.value=false;mapRevision.value++;refinement.value='';refinementStatus.value='';draft.value=[];preferences.value='';extension.value=0;dirty.value=false;error.value='';planNotes.value=[];panel.value=null;busy.value=false;savedPoiStops.value=[];pickedPoiStops.value=[];inspectedId.value=null;pendingSavedIds.clear();initializePoiDestination();void nextTick(initialDraft);});
watch(places, () => {
  if (!hasRange.value) return;
  rangeIds.value = places.value.filter(p => selectedPassId.value ? withinPassCoverage(p.at, passCoverage.value) : withinPlanningAreas(p.at, [selectionBoundary.value])).map(p => p.id);
  if(selectedPassId.value && selectAllForPass)ids.value=[...rangeIds.value];
  const restored=places.value.filter(p=>pendingSavedIds.has(p.id)).map(p=>p.id);
  if(restored.length){const wasDirty=dirty.value;restored.forEach(id=>pendingSavedIds.delete(id));ids.value=[...new Set([...ids.value,...restored])];dirty.value=wasDirty;}
});
function markDraftDirty() {
  clearTimeout(generationTimer);
  busy.value = false;
  dirty.value = !!draft.value.length;
  error.value = '';
}
watch([preferences,pace,extension,()=>appliedKeywords.value.join(',')],markDraftDirty,{flush:'sync'});
watch([ids,selectedPassId,bundleCity,bundleShuttle,passVariant],()=>{if(planningMode.value!=='ai')markDraftDirty();},{flush:'sync'});
watch([activeId,planningDay], ([id]) => {
  if (!import.meta.client || !id) return;
  try {
    const cached = JSON.parse(localStorage.getItem(plannerStorageKey(id)) || 'null');
    const stored=cached ? {...cached,saved:cached.savedDays?.[planningDay.value] || cached.saved} : null;
    if (stored?.saved?.stops?.length && (stored.saved.day ?? 0)===planningDay.value) {
      savedPoiStops.value = stored.saved.stops.filter((s: Stop) => s.poiId && s.id < 0 && s.at?.length === 2 && s.at.every(Number.isFinite));
      for(const id of stored.ids || [])if(Number.isSafeInteger(id) && id<0)pendingSavedIds.add(id);
      if (['JP','KR','TW'].includes(stored.poiCountry)) poiCountry.value = stored.poiCountry;
      ids.value = (stored.ids || stored.saved.stops.filter((s: Recommendation) => !s.outside).map((s: Recommendation) => s.id)).filter((id: number) => places.value.some(p => p.id === id));
      rangeIds.value = (stored.rangeIds || ids.value).filter((id: number) => places.value.some(p => p.id === id));
      ids.value = [...new Set([...ids.value, ...stored.saved.stops.map((s: Recommendation) => s.id)])].filter(id => places.value.some(p => p.id === id));
      selectionBoundary.value = validPlanningBoundary(stored.boundary);
      const savedPass = findTravelPass(stored.passId);
      selectedPassId.value = savedPass && passCoverageIndex[savedPass.id]?.availability !== 'expired' ? savedPass.id : '';
      if(passVariants.value.some(v=>v.id===stored.passVariant))passVariant.value=stored.passVariant;
      bundleCity.value = taiwanBundleOptions.city.includes(stored.bundleCity) ? stored.bundleCity : '';
      bundleShuttle.value = taiwanBundleOptions.shuttle.includes(stored.bundleShuttle) ? stored.bundleShuttle : '';
      hasRange.value = true;
      drawing.value = false;
      preferences.value = stored.saved.preference || '';
      extension.value = stored.extension ?? 0;
      pace.value = stored.pace ?? 3;
      draft.value = stored.saved.stops.filter((s: Recommendation) => s.at?.length===2 && s.at.every(Number.isFinite) && s.photo).map((s: Recommendation) => s.rainAlternative !== undefined ? s : ({ ...s, ...rainPlanDetailsFor(s, places.value, preferences.value) }));
      planNotes.value = stored.saved.notes || [];
      dirty.value = JSON.stringify(stored.saved.keywordIds || []) !== JSON.stringify(appliedKeywords.value);
    }
  } catch { /* A fresh draft remains available when saved data cannot be read. */ }
}, { immediate: true });
function select(value: number[]) { selectAllForPass=false; pendingSavedIds.clear(); const chosen=new Set(value); pickedPoiStops.value=places.value.filter(p=>p.poiId && chosen.has(p.id)); ids.value = value; }
function toggleListPlace(place: Stop) {
  if (drawing.value) return;
  if (!hasRange.value) {
    const [w,s,e,n] = viewport.value;
    const boundary = validPlanningBoundary([[w!,s!],[e!,s!],[e!,n!],[w!,n!]]);
    if (!boundary.length) return;
    selectRange([],boundary);
    rangeIds.value = viewportPlaces.value.map(p => p.id);
  }
  select(ids.value.includes(place.id) ? ids.value.filter(id => id !== place.id) : [...ids.value,place.id]);
}
function selectRange(value: number[], boundary: Point[] = [], selectAll = true) {
  const chosen=new Set(selectAll ? value : []); pickedPoiStops.value=places.value.filter(p=>p.poiId && chosen.has(p.id));
  pendingSavedIds.clear(); selectAllForPass=false;
  selectedPassId.value = '';
  rangeIds.value = [...value]; ids.value = selectAll ? [...value] : []; hasRange.value = true;
  if (!selectAll) {
    placeListOpen.value = true;
    void nextTick(() => { placeList.value?.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'}); });
  }
  drawing.value = false; refinementStatus.value = ''; refinement.value = '';
  selectionBoundary.value = boundary;
}
function selectPass(pass: TravelPass) {
  planningMode.value='pass';
  if (!findTravelPass(pass.id) || passCoverageIndex[pass.id]?.availability === 'expired') return;
  selectRange([]);
  selectAllForPass=true;
  selectedPassId.value = pass.id; panel.value = null;
}
function beginDrawing() {
  if (drawing.value) { drawing.value = false; return; }
  drawing.value = true;
}
function generate() {
    const baseline=planningMode.value==='ai' ? (draft.value.length?draft.value:currentDays.value[planningDay.value]?.stops || []) : places.value.filter(p=>ids.value.includes(p.id));
    if(!baseline.length){error.value='請先選擇景點或告訴我想去哪裡。';return;}
    const activities=ownedServices.value.filter(s=>s.usable && s.product.kind==='activity' && (planningMode.value==='ai' || (selectedPassId.value ? withinPassCoverage(s.product.at,passCoverage.value) : withinPlanningAreas(s.product.at,[selectionBoundary.value])))).map(s=>serviceStop(s.product));
    const pool=[...new Map([...activities,...baseline,...places.value].map(s=>[s.id,s])).values()];
    const chosen=[...activities.map(s=>s.id),...baseline.map(s=>s.id)];
    if (busy.value) return;
    busy.value = true;
    generationTimer = setTimeout(() => {
        const result = recommendPlaces(pool, chosen, preferences.value, pace.value, 0, appliedKeywords.value, true);
        if (!result.stops.length) {
            busy.value = false;
            error.value = '目前沒有符合條件的景點，試試增加時間、擴大範圍或調整喜好。';
            return;
        }
        busy.value = false;
        draft.value = result.stops;
        planNotes.value = [...result.notes,...ownedServices.value.map(s=>s.note)];
        messages.value.push({role:'assistant',text:'已安排這一天，並參考這趟旅行已兌換的服務。你可以繼續在下方微調。'});
        dirty.value = false;
        panel.value = null;
        drawing.value = false;
        notify('推薦已準備好，可在地圖與下方清單查看。');
    }, 500);
}
function save() {
    if(!activeId.value || dirty.value || !draft.value.length)return;
    try {
        let previous:{saved?:{day?:number};savedDays?:Record<string,unknown>}={};try{previous=JSON.parse(localStorage.getItem(plannerStorageKey(activeId.value)) || '{}') || {};}catch{}
        const saved={ day:planningDay.value, stops: draft.value, preference: preferences.value, keywordIds: [...appliedKeywords.value], notes: planNotes.value };
        const savedDays={...(previous.saved ? {[previous.saved.day ?? 0]:previous.saved} : {}),...previous.savedDays,[planningDay.value]:saved};
        localStorage.setItem(plannerStorageKey(activeId.value), JSON.stringify({ trip:activeId.value, poiCountry:poiCountry.value, poiRegionId:poiRegionId.value, ids: ids.value, rangeIds: rangeIds.value, boundary: selectionBoundary.value, passId: selectedPassId.value, passVariant:passVariant.value, bundleCity:bundleCity.value,bundleShuttle:bundleShuttle.value, extension: extension.value, pace: pace.value, saved,savedDays }));
    }
    catch {
        notify('瀏覽器無法儲存，請保留這份預覽。');
        return;
    }
    currentDays.value=plannedDay(currentDays.value,planningDay.value,draft.value);
    panel.value = 'saved';
    notify('草案已儲存到'+activeTrip.value?.title);
}
onBeforeUnmount(() => {clearTimeout(generationTimer);clearTimeout(viewportTimer);coverageController?.abort();});
</script>
<template>
  <section v-if="activeTrip" class="screen active planner-screen">
    <div class="mascot-perch"><div class="page-heading">
      <span class="eyebrow">{{ activeTrip.english }} / DAY PLANNER</span>
      <h1>AI 排行程</h1>
      <p>第 {{planningDay+1}} 天，想怎麼玩？選擇規劃方式，再用下方對話補充需求。</p>
      <NuxtLink to="/places">探索日韓台更多景點與照片 →</NuxtLink>
    </div><PageMascot /></div>
    <div class="range-choices" aria-label="選擇規劃方式"><button :aria-pressed="planningMode==='ai'" :class="{active:planningMode==='ai'}" @click="choosePlanningMode('ai')">✦ 自由規劃</button><button :aria-pressed="planningMode==='map'" :class="{active:planningMode==='map'}" @click="choosePlanningMode('map')">地圖圈選</button><button :aria-pressed="planningMode==='pass'" :class="{active:planningMode==='pass'}" @click="choosePlanningMode('pass')">周遊券規劃</button></div>
    <section v-if="ownedServices.length" class="planner-owned"><div class="row"><b>這趟旅行已兌換 {{ownedServices.length}} 項服務</b><NuxtLink :to="tripHref('/points')">我的服務券 →</NuxtLink></div><p v-for="service in ownedServices" :key="service.product.id"><strong>{{service.product.brand}}</strong> · {{service.note}}</p></section>
    <p v-else class="planner-shop-link">也可以先到 <NuxtLink :to="tripHref('/points')">和泰旅行商店</NuxtLink> 兌換交通、上網或體驗。</p>
    <template v-if="planningMode!=='ai'">
    <button v-if="planningMode==='map'" class="planner-draw-toggle" :aria-pressed="drawing" @click="beginDrawing">{{drawing?'取消手繪':'自己畫範圍'}}</button>
    <div class="planner-destinations">
      <label>景點國家<select v-model="poiCountry" aria-label="景點國家" @change="choosePoiCountry"><option v-for="country in poiCountries" :key="country.id" :value="country.id">{{ country.name }}</option></select></label>
      <label>景點地區<select v-model="poiRegionId" aria-label="景點地區" @change="choosePoiRegion()"><option v-for="region in poiRegions" :key="region.id" :value="region.id">{{ region.name }}</option></select></label>
    </div>
    <p class="small-note planner-poi-status" role="status">{{ poiLoading ? '正在載入附近景點與照片…' : `目前範圍 ${viewportPlaces.length.toLocaleString()} 個景點 · ${viewportPlaces.filter(p=>p.photo.src).length.toLocaleString()} 個有照片` }}<template v-if="poiError"> · {{ poiError }} <button @click="loadCatalog().then(()=>loadVisiblePois())">重試</button></template></p>
    <div v-if="selectedPass" class="selected-pass" aria-label="目前使用的票券範圍">
      <TravelPassArtwork :pass="selectedPass" />
      <span><b>{{ selectedPass.name }}</b><small>{{ selectedPass.region }} · {{ selectedPass.kind === 'stored-value' ? '合作服務・需儲值' : '路線／合作景點' }}</small></span>
      <a :href="selectedPass.coverageUrl" target="_blank" rel="noopener">官方適用範圍 ↗</a>
    </div>
    <p v-if="selectedPass" class="small-note" role="status">{{ coverageLoading ? '正在載入票券路網輪廓…' : coverageError || coverageMetadata?.note }} 放大地圖會載入附近景點；門票與交通優惠仍依票券條件。</p>
    <div v-if="passVariants.length" class="bundle-choices">
      <label>票券版本・依持有票券選擇<select v-model="passVariant"><option v-for="variant in passVariants" :key="variant.id" :value="variant.id">{{ variant.label }}</option></select></label>
    </div>
    <div v-if="isTaiwanBundle(selectedPassId)" class="bundle-choices">
      <label>都會交通・任選一<select v-model="bundleCity"><option value="">選擇已兌換項目</option><option v-for="choice in bundleChoices.city" :key="choice.id" :value="choice.id">{{ choice.name }}</option></select></label>
      <label>景區接駁・任選一<select v-model="bundleShuttle"><option value="">選擇已兌換項目</option><option v-for="choice in bundleChoices.shuttle" :key="choice.id" :value="choice.id">{{ choice.name }}</option></select></label>
    </div>
    <details v-if="coverageMetadata?.missingComponents?.length" class="coverage-gaps">
      <summary>{{ coverageStatus(coverageMetadata) }} · 查看尚未繪製／需核對的項目（{{ coverageMetadata.missingComponents.length }}）</summary>
      <ul><li v-for="gap in coverageMetadata.missingComponents" :key="gap">{{ displayCoverageGap(gap) }}</li></ul>
      <a :href="coverageMetadata.officialUrl" target="_blank" rel="noopener">核對官方區段與方案 ↗</a>
    </details>
    <CircleMap :key="activeId || ''" :places="places" :paused="!!inspectedPlace" :selected="ids" :drawing="drawing" :has-range="hasRange" :range-ids="rangeIds" :boundary="selectionBoundary" :coverage="passCoverage" :benefits="selectedBenefits" :reset-key="mapRevision" :route="routeIds" :bounds="mapBounds" @viewport="onViewport" @inspect="inspectedId=$event" @select="select" @range="selectRange" @cancel="drawing = false" />
    <details ref="placeList" class="planner-place-list" :open="placeListOpen" @toggle="placeListOpen = ($event.target as HTMLDetailsElement).open">
      <summary>用清單挑景點 <span>{{ viewportPlaces.length.toLocaleString() }} 個</span></summary>
      <div v-if="placeListOpen" class="planner-place-picker">
        <label for="place-query" class="sr-only">搜尋目前地圖內的景點</label>
        <input id="place-query" v-model="placeQuery" type="search" placeholder="搜尋目前地圖內的景點" autocomplete="off">
        <div class="planner-list-status"><span>勾選即可加入行程</span><button v-if="ids.length" type="button" :disabled="drawing" @click="select([])">清空已選</button></div>
        <div class="planner-choice-scroll" aria-label="目前地圖內的景點清單">
          <div v-for="s in placeChoices.slice(0,placeListLimit)" :key="s.id" class="planner-place-choice" :class="{selected:ids.includes(s.id)}">
            <label><input type="checkbox" :checked="ids.includes(s.id)" :disabled="drawing || (!hasRange && viewport.length !== 4)" :aria-label="'將'+s.name+'加入行程'" @change="toggleListPlace(s)"><img referrerpolicy="no-referrer" v-if="s.photo.src && !failedListPhotos.includes(s.photo.src)" :src="asset(s.photo.src)" :alt="s.photo.alt" width="48" height="48" loading="lazy" @error="failedListPhotos.push(s.photo.src)"><span v-else class="planner-list-no-photo" aria-hidden="true">景點</span><span class="planner-choice-name"><b>{{ s.name }}</b><small>{{ ids.includes(s.id) ? '已加入行程' : s.stay }}</small></span></label>
            <button type="button" :aria-label="'查看'+s.name+'照片與詳情'" @click="inspectedId=s.id">詳情</button>
          </div>
          <p v-if="!placeChoices.length" class="small-note">{{ poiLoading ? '正在載入景點…' : '這個畫面沒有符合的景點，可以移動地圖或調整搜尋。' }}</p>
          <button v-if="placeChoices.length > placeListLimit" type="button" class="planner-list-more" @click="placeListLimit += 30">顯示更多景點</button>
        </div>
      </div>
    </details>
    <p class="small-note">點選數字展開景點，放大可看名稱與照片。尚未圈選時，點選景點可查看詳情。<a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">景點 © OpenStreetMap contributors（ODbL）</a> · 照片來源與授權見景點詳情。</p>
    <p v-if="selectedPass" class="pass-range-note">{{ selectedPass.exclusions }} <template v-if="selectedBenefits.length">已標示 {{ selectedBenefits.length }} 個有確認座標的合作設施；黃色標記與定位圈協助找景點，完整名單與方案限制見官網。</template></p>
    </template>
    <div class="planning-next">
      <span>{{ planningMode==='ai' ? '第 '+(planningDay+1)+' 天 · 沿用目前旅程' : hasRange ? ids.length + ' 個景點已加入' : '先選一個想逛的範圍' }}</span>
      <button class="primary" :disabled="busy || drawing || (planningMode!=='ai' && (!hasRange || !ids.length))" @click="generate">{{busy?'正在安排…':draft.length?'AI 重新安排':'AI 安排行程'}} <span aria-hidden="true">→</span></button>
    </div>
    <p v-if="planningMode!=='ai' && hasRange && !ids.length" class="small-note empty-selection">{{ rangeIds.length ? '從清單勾選想去的景點，再產生行程。' : poiLoading ? '正在找這個範圍內的景點…' : '這裡目前沒有景點。可以移動地圖或重畫範圍。' }}</p>
    <section v-if="draft.length" ref="resultsBox" class="planner-results" aria-label="行程草案">
      <div class="row"><h2>這樣玩，你覺得呢？</h2><span class="planner-badge">{{ dirty ? '需求已變更' : '行程草案' }}</span></div>
      <p v-if="dirty" class="planner-error" role="status">需求已變更，重新安排後就能儲存。</p>
      <details class="plan-notes"><summary>時間與安排</summary><p v-for="note in planNotes" :key="note" class="small-note">{{ note }}</p></details>
      <article v-for="(s,i) in draft" :key="s.id" class="planner-card">
        <time>{{ s.time }}</time><div><h3>{{ s.name }}</h3><small>{{ s.stay }}</small><p>{{ s.reason }}</p><RainPlanCard :text="s.rainPlan" :alternative="s.rainAlternative" /><small v-if="s.travelMinutes">前一站交通約 {{ s.travelMinutes }} 分鐘 · 示範估算</small></div>
        <img referrerpolicy="no-referrer" v-if="s.photo.src" :src="asset(s.photo.src)" :alt="s.photo.alt" width="48" height="48" style="object-fit:cover;border-radius:8px">
        <ServiceRecommendations :stop="s" :next="draft[i+1]" class="planner-stop-services" />
      </article>
      <button class="primary" :disabled="dirty || busy" @click="save">儲存這份行程</button>
    </section>
    <AppSheet class="planner-poi-detail-sheet" :model-value="!!inspectedPlace" :title="inspectedPlace?.name || '景點詳情'" @update:model-value="inspectedId=null">
      <template v-if="inspectedPlace">
        <img referrerpolicy="no-referrer" v-if="inspectedPlace.photo.src && !inspectedPhotoFailed" class="planner-inspected-photo" decoding="async" width="640" height="480" :src="asset(inspectedPlace.photo.src)" :alt="inspectedPlace.photo.alt" @error="inspectedPhotoFailed=true">
        <p v-else class="small-note">{{ inspectedPhotoFailed ? '照片暫時無法載入。' : '尚未找到這個景點的照片。' }}</p>
        <p>{{ inspectedPlace.note }}</p>
        <p v-if="inspectedPlace.photo.src" class="small-note">照片：{{ inspectedPlace.photo.credit }} · <a v-if="inspectedPlace.photo.licenseUrl" :href="inspectedPlace.photo.licenseUrl" target="_blank" rel="noopener">{{ inspectedPlace.photo.license }}</a><template v-else>{{ inspectedPlace.photo.license }}</template> · <a v-if="inspectedPlace.photo.source" :href="inspectedPlace.photo.source" target="_blank" rel="noopener">原始來源 ↗</a></p>
        <a v-if="inspectedPoi" :href="inspectedPoi.source.url" target="_blank" rel="noopener">OpenStreetMap 景點來源 ↗</a>
        <a v-if="inspectedPoi?.website" :href="inspectedPoi.website" target="_blank" rel="noopener">景點官網 ↗</a>
      </template>
    </AppSheet>
    <AppSheet :model-value="!!panel" :title="panel === 'passes' ? '選擇周遊券規劃範圍' : '行程已儲存'" @update:model-value="panel = null">
      <template v-if="panel === 'passes'">
        <p class="pass-intro">日本、韓國、台灣都能選，不受目前旅程限制。相同範圍的不同天數合併在同一張卡。</p>
        <div class="pass-filters">
          <label class="pass-search"><span class="sr-only">搜尋票券名稱或城市</span><input v-model="passQuery" type="search" placeholder="搜尋票券、城市，例如九州、釜山、日月潭" maxlength="100"></label>
          <label><span class="sr-only">票券國家</span><select v-model="passCountry"><option value="">全部國家</option><option v-for="country in passCountries" :key="country.id" :value="country.id">{{ country.name }}</option></select></label>
          <label><span class="sr-only">票券地區</span><select v-model="passRegion"><option value="">全部地區</option><option v-for="region in availableRegions" :key="region" :value="region">{{ region }}</option></select></label>
        </div>
        <p class="pass-count" role="status" aria-live="polite">{{ availablePasses.length }} / {{ travelPasses.length }} 張票券與旅遊卡</p>
        <article v-for="pass in availablePasses" :key="pass.id" class="pass-option">
          <button class="pass-choice" :disabled="passCoverageIndex[pass.id]?.availability === 'expired'" :aria-pressed="selectedPassId === pass.id" @click="selectPass(pass)"><TravelPassArtwork :pass="pass" /><span><em class="pass-kind" :class="{ prepaid: pass.kind === 'stored-value' }">{{ passKindLabels[pass.kind] }}{{ pass.kind === 'stored-value' ? '・需儲值' : '' }}</em><b>{{ pass.name }}</b><small>{{ pass.english }}</small><em>{{ pass.region }}</em><em class="coverage-status">{{ coverageStatus(passCoverageIndex[pass.id]) }}</em><strong>{{ passCoverageIndex[pass.id]?.availability === 'expired' ? '官方有效日期已截止' : selectedPassId === pass.id ? '目前使用的範圍 ✓' : '套用範圍 →' }}</strong></span></button>
          <p class="pass-coverage">{{ pass.coverage }}</p>
          <details class="pass-conditions"><summary>使用限制與官方範圍</summary><p class="pass-exclusions">{{ pass.exclusions }}</p><a :href="pass.coverageUrl" target="_blank" rel="noopener">查看官方路線／合作景點 ↗</a><small class="pass-credit">圖片：{{ pass.credit }} · 資料查核 {{ pass.checkedAt }}</small></details>
        </article>
        <p v-if="!availablePasses.length" class="pass-empty">沒有符合的票券，試試其他名稱或地區。</p>
        <p class="small-note">交通券沿實際路線顯示，景點卡標示合作設施；沿線輪廓是步行規劃輔助。尚未核對的路線不畫推測邊界，可查看官方路網或自己圈選。</p>
      </template>
      <template v-else><ChictripMotion motion="happy" :size="112"/><p>已儲存到「{{ activeTrip.title }}」。</p><NuxtLink class="primary" :to="tripHref('/trip')" @click="panel = null">查看我的行程</NuxtLink></template>
    </AppSheet>
    <p v-if="error" class="planner-error" role="alert">{{error}}</p>
    <PlannerChat v-model="chatText" :busy="busy" :messages="messages" @submit="submitChat" @suggestion="suggestChat" />
  </section>
</template>
<style scoped>
.planner-destinations{display:grid;grid-template-columns:1fr 1.5fr;gap:10px;margin:18px 0 8px}.planner-destinations label{display:flex;flex-direction:column;gap:6px;color:#476d7b;font-size:12px}.planner-destinations select{width:100%;min-width:0;min-height:44px;padding:10px;border:1px solid #cfe4e9;border-radius:10px;background:#fff;color:#315869}.planner-poi-status{margin:8px 0}.planner-inspected-photo{width:100%;max-height:340px;object-fit:cover;border-radius:12px}
.bundle-choices{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px;margin-bottom:14px;color:#476d7b;font-size:12px}.bundle-choices select{display:block;width:100%;margin-top:6px;padding:10px;border:1px solid #cfe4e9;border-radius:10px;background:#fff;color:#315869}
.coverage-gaps{font-size:12px;color:#476d7b;background:#f5fafb;border-radius:10px;padding:12px;margin:0 0 12px;line-height:1.8}.coverage-gaps summary{cursor:pointer}.coverage-gaps ul{padding-left:20px;margin:8px 0}.coverage-gaps a{color:#0085a6}.coverage-status{margin-top:8px;color:#0085a6}.pass-choice:disabled{opacity:.6;cursor:default}
.planner-screen{max-width:1000px;margin:auto}.page-heading h1{font-size:clamp(24px,4vw,34px);line-height:1.4}.page-heading p{max-width:560px;line-height:1.7}.range-choices{display:flex;gap:10px;margin:18px 0 14px}.range-choices button{display:flex;align-items:center;justify-content:center;gap:9px;padding:13px 17px;border:1px solid #cfe4e9;border-radius:13px;background:#fff;color:#38768c;font-size:13px;cursor:pointer;flex:1;min-height:48px}.range-choices button.active{background:#eafaff;border-color:#009fc5;color:#0084a5}.range-choices svg{width:21px;height:21px;fill:none;stroke:currentColor;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round}.selected-pass{display:flex;align-items:center;gap:12px;background:#f3fbff;border:1px solid #d4edf3;border-radius:13px;margin-bottom:12px;padding:10px 12px}.selected-pass :deep(.pass-artwork){width:75px;flex:none}.selected-pass span b{font-size:13px;color:#21647b}.selected-pass small{display:block;font-size:10px;color:#7192a0;margin-top:4px}.selected-pass a{margin-left:auto;font-size:10px;color:#1382a1;text-decoration:none;text-align:right}.pass-range-note{font-size:10px;line-height:1.7;color:#8099a3;margin:9px 3px 0}.planning-next{display:flex;align-items:center;justify-content:space-between;gap:14px;margin:18px 0}.planning-next>span{font-size:12px;color:#708e9a}.planning-next .primary{width:auto;margin:0;min-width:152px;border-radius:13px;background:#009fc5;padding:13px 17px}.planning-next .primary:disabled{background:#edf3f5;color:#93a8b1;box-shadow:none;cursor:default}.empty-selection{margin:0 0 15px}.text-refinement,.plan-notes{font-size:12px;color:#688897;border-top:1px solid #e5edef;padding:13px 0;margin:0 0 12px}.text-refinement summary,.plan-notes summary,.rain-plan summary{cursor:pointer}.text-refinement form{display:flex;align-items:stretch;gap:8px;margin-top:12px}.text-refinement textarea{flex:1;min-height:80px;margin:0;resize:vertical}.text-refinement .secondary{width:auto;padding:10px 15px;margin:0}.text-refinement p{font-size:11px}.planner-results{margin-top:24px}.planner-results h2{font-size:21px}.planner-card h3{margin-top:3px}.rain-plan{margin:10px 0;padding:9px 11px;border-radius:9px;background:#f0f9fb;color:#45798b;font-size:11px}.rain-plan p{font-size:11px;line-height:1.7}.planner-input-label{font-size:13px;font-weight:600;display:block;margin:10px 0 12px}.memory-choice{display:flex;align-items:center;gap:6px;color:#668692;font-size:12px;margin:8px 0}.memory-choice input{accent-color:#009fc5}.pass-filters{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:15px 0 8px;position:sticky;top:0;background:#fff;padding:8px 0;z-index:1}.pass-search{grid-column:1/-1}.pass-filters input,.pass-filters select{width:100%;min-height:42px;border:1px solid #d4e9ed;border-radius:11px;background:#f8fcfd;color:#38768c;font-size:12px;padding:10px 12px;margin:0}.pass-filters input:focus,.pass-filters select:focus{outline:2px solid #009fc5;outline-offset:1px}.pass-count{font-size:11px;color:#7794a0;margin:8px 0}.pass-conditions{color:#74909c;font-size:11px;padding:5px 3px}.pass-conditions summary{cursor:pointer}.pass-conditions .pass-exclusions{margin-top:10px}.pass-choice .pass-kind{display:inline-block;padding:3px 7px;background:#e9f7fc;color:#0089ac;font-size:9px;border-radius:6px;margin-bottom:7px}.pass-choice .pass-kind.prepaid{color:#7a6500;background:#fff4c4}.pass-empty{font-size:13px;text-align:center;color:#73939f;padding:28px 12px}.pass-intro{font-size:13px;color:#638290;line-height:1.7}.pass-option{padding:16px 0;border-bottom:1px solid #e1ecef}.pass-choice{width:100%;display:grid;grid-template-columns:135px 1fr;align-items:center;gap:15px;padding:13px;text-align:left;border:1px solid #d4e9ed;border-radius:16px;background:#f8fdff;color:#276b83;cursor:pointer}.pass-choice[aria-pressed=true]{border-color:#009fc5;background:#effaff}.pass-choice span b{font-size:16px;display:block}.pass-choice small{font-size:10px;display:block;margin:4px 0 9px;color:#809ca7}.pass-choice em{font-size:11px;display:block;font-style:normal}.pass-choice strong{display:block;font-size:11px;color:#0092b5;margin-top:13px}.pass-option p{font-size:12px;line-height:1.8;color:#4d7383;margin:13px 3px 7px}.pass-option p.pass-exclusions{font-size:11px;color:#7b919b;margin-top:0}.pass-option a{font-size:11px;color:#0092b5;display:inline-block;padding:4px 3px;text-decoration:none}.pass-credit{display:block;margin:7px 3px;color:#94a5ad;font-size:9px;line-height:1.7}.range-choices button:focus-visible,.pass-choice:focus-visible{outline:3px solid #ffc500;outline-offset:3px}@media(max-width:600px){.planner-screen{padding-bottom:16px}.range-choices{gap:8px}.range-choices button{font-size:12px;padding:12px 8px}.pass-choice{grid-template-columns:105px 1fr;gap:11px}.selected-pass{gap:9px}.selected-pass a{font-size:9px}.planning-next .primary{min-width:145px;font-size:13px}.planning-next>span{font-size:11px}}
</style>
<style scoped>
.planner-screen{width:100%;min-width:0}
.planner-destinations{grid-template-columns:minmax(0,1fr) minmax(0,1.5fr)}
.planner-destinations label,.page-heading,.selected-pass>span,.planner-card>div{min-width:0}
.range-choices button{min-width:0}.range-choices svg{flex-shrink:0}
.text-refinement textarea{min-width:0}
.planner-card{grid-template-columns:42px minmax(0,1fr) 44px}
.planner-card>div,.selected-pass>span{overflow-wrap:anywhere}
.planner-place-list{margin-top:12px;border:1px solid #d6e9ec;border-radius:13px;background:#fff;color:#315869;scroll-margin-top:76px}
.planner-place-list summary{display:flex;align-items:center;justify-content:space-between;min-height:48px;padding:12px 14px;font-size:14px;font-weight:600;cursor:pointer}
.planner-place-list summary::before{content:'＋';margin-right:8px}.planner-place-list[open] summary::before{content:'−'}
.planner-place-list summary span{margin-left:auto;color:#75919c;font-size:11px;font-weight:400}
.planner-place-picker{padding:0 10px 10px}
.planner-place-picker>input{display:block;width:100%;min-width:0;min-height:46px;margin:0;padding:10px 12px;border:1px solid #cfe4e9;border-radius:10px;color:#315869;background:#f8fcfd;font-size:16px}
.planner-list-status{display:flex;align-items:center;justify-content:space-between;min-height:44px;font-size:11px;color:#75919c}
.planner-list-status button{min-height:44px;padding:8px;color:#0085a6;font-size:12px}
.planner-choice-scroll{max-height:350px;overflow:auto;overscroll-behavior:contain}
.planner-place-choice{display:flex;align-items:center;gap:6px;border-top:1px solid #e6eef1;padding:4px;border-radius:8px}
.planner-place-choice.selected{background:#effaff}
.planner-place-choice label{display:flex;align-items:center;gap:9px;flex:1;min-width:0;min-height:66px;margin:0;cursor:pointer}
.planner-place-choice input{width:22px;height:22px;flex:none;margin:0;accent-color:#008bad}
.planner-place-choice img,.planner-list-no-photo{width:48px;height:48px;border-radius:8px;object-fit:cover;flex:none}
.planner-list-no-photo{display:grid;place-items:center;background:#edf3f5;color:#8098a1;font-size:11px}
.planner-choice-name{min-width:0}.planner-choice-name b{display:block;overflow-wrap:anywhere;font-size:13px;line-height:1.5;font-weight:600}.planner-choice-name small{display:block;margin-top:3px;color:#79949e;font-size:10px}
.planner-place-choice>button{min-width:44px;min-height:44px;padding:8px 4px;color:#0085a6;font-size:12px}
.planner-list-more{width:100%;min-height:46px;background:#f0f9fb;border-radius:9px;margin-top:8px;color:#0085a6;font-size:13px}
@media(max-width:600px){.planner-screen :deep(select),.planner-screen :deep(textarea),.planner-screen :deep(input:not([type=checkbox])){font-size:16px}.range-choices button{font-size:13px;padding:12px 7px;gap:5px}.planning-next{gap:8px}.planning-next .primary{min-width:140px;min-height:48px}.selected-pass{flex-wrap:wrap}.selected-pass>span{flex:1}.selected-pass>a{min-height:44px;display:flex;align-items:center}.text-refinement form{flex-wrap:wrap}.text-refinement textarea{flex-basis:100%}.text-refinement .secondary{min-height:44px;width:100%}.planner-results h2{font-size:18px}}
</style>

<style scoped>
@media(max-width:600px){.planner-screen{box-sizing:border-box;padding-inline:max(12px,env(safe-area-inset-left)) max(12px,env(safe-area-inset-right))}.planner-screen :deep(.planner-map-panel){padding-inline:0}.planner-screen .page-heading{margin-inline:8px}.planner-screen .range-choices button{overflow-wrap:anywhere}}
</style>

<style>
.planner-poi-detail-sheet::backdrop{backdrop-filter:none}
</style>

<style scoped>
.planner-screen{padding-bottom:240px!important}.range-choices button{font-size:13px;gap:4px}.planner-owned{margin:14px 0;padding:14px;border:1px solid #d5e9ef;border-radius:14px;background:#f2fafd;color:#557c8c}.planner-owned b{font-size:13px}.planner-owned p{font-size:12px;line-height:1.7;margin:8px 0}.planner-owned a,.planner-shop-link a{font-size:12px;color:#008bad}.planner-shop-link{font-size:12px;line-height:1.7;color:#6e8d9b}.planner-draw-toggle{min-height:44px;margin:8px 0;padding:10px 14px;border:1px solid #cfe4e9;border-radius:10px;background:white;color:#38768c}.planner-results{scroll-margin-top:85px}.planner-owned .row{gap:8px;flex-wrap:wrap}
</style>

<style scoped>
.planner-stop-services{grid-column:1/-1;margin:0 0 10px}
</style>

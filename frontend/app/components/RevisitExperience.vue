<script setup lang="ts">
import { buildRevisitStops, revisitScope, revisitScopes, revisitLeg, type RevisitScope, type RevisitStop } from '~/data/revisit';
import { tripSummaries } from '~/data/trips';
import { advanceRevisitClock } from '~/utils/revisit-clock';
import { buildRevisitSummary } from '~/utils/revisit-summary';
import type { RevisitPreparation } from '~/utils/revisit-preload';
import '~/assets/css/revisit.css';

const route = useRoute(), router = useRouter(), asset = useAsset();
const { allWorks } = useCreation();
// 網址沒指定旅程時，接著目前選的那趟（已結束的才有得重遊）
const { activeId } = useTripContext();
const currentJourney = () => tripSummaries.find(trip => trip.id === activeId.value && trip.status === 'completed')?.id;
const { state: collection } = useJourneyCollection();
const scope = ref<RevisitScope>('kansai');
const demo = computed(() => route.query.demo !== '0');
const stops = computed(() => buildRevisitStops(scope.value, allWorks.value, collection.value, demo.value));
const summary = computed(() => revisitScopes.find(item => item.id === scope.value)!);
const selected = ref<string | null>(null);
const index = computed(() => stops.value.findIndex(stop => stop.id === selected.value));
const current = computed(() => stops.value[index.value]);
// Begin fetching the destination photo during travel, before its arrival sheet is mounted.
useHead(()=>({link:current.value?[{rel:'preload',as:'image',href:asset(current.value.source)}]:[]}));
const currentTrip = computed(() => tripSummaries.find(trip => trip.id === current.value?.tripId));
const phase = ref<'overview' | 'chapter' | 'moving' | 'arrived' | 'exploring' | 'completed'>('overview');
const command = ref({ token: 0, id: null as string | null, from: null as string | null, transitioning:false });
const chapter = shallowRef<{previous:RevisitStop;next:RevisitStop;token:number} | null>(null);
const leg = computed(() => current.value ? revisitLeg(current.value,stops.value.find(stop=>stop.id===command.value.from)) : null);
const mapView = ref<{ cancel: () => void; skip: () => void; retry: () => void; focus?: (id: string) => void }>();
const preparation = ref<RevisitPreparation>({ done:0, total:0, failed:0, active:true });
const waiting = ref('');
const root = ref<HTMLElement>(), panel = ref<HTMLElement>(), panelHeight = ref(280);
const { animate, reduced, gsap } = useCreationMotion(root);
const three = ref(true), compact = ref(false), unavailable = ref(false);
const detail = ref<'photo' | 'route' | 'summary' | null>(null), dialog = ref<HTMLDialogElement>();
const remaining = ref(10), manualPaused = ref(false), interactionHeld = ref(false), photoReady = ref(false);
const pageHidden = ref(false);
const approach = shallowRef<{token:number;stage:'survey'|'descending'|'framing';progress:number}|null>(null);
function approachArrival(value:NonNullable<typeof approach.value>){if(value.token===command.value.token)approach.value=value;}
const travel = ref({stage:'departing' as 'departing'|'riding'|'landing',progress:0});
let writingQuery=0;
const running = computed(() => phase.value==='arrived' && detail.value==='photo' && photoReady.value && !manualPaused.value && !interactionHeld.value && !pageHidden.value);
let clockFrame = 0, previousTime = 0;
function tick(now:number) {
  if (previousTime) {
    remaining.value = advanceRevisitClock(remaining.value,(now-previousTime)/1000,running.value);
    if (running.value && remaining.value===0) next();
  }
  previousTime=now; clockFrame=requestAnimationFrame(tick);
}
function resetSession(){ visited.value=new Set(); seen.value=new Set(); opened.value=new Set(); }
function start() { resetSession(); manualPaused.value=false; selected.value=null; go(stops.value[0]!.id); }
function closePhoto() { manualPaused.value=true; detail.value=null; if(phase.value==='completed')phase.value='exploring'; }
function dialogClosed() { if(!dialog.value?.open)detail.value=null; }
function escapeDialog(event:KeyboardEvent) {
  if(event.key==='Escape' && detail.value==='photo' && !event.defaultPrevented){event.preventDefault();closePhoto();}
}
const visited = ref(new Set<string>());
const seen = ref(new Set<string>()), opened = ref(new Set<string>());
const completion = computed(() => buildRevisitSummary(stops.value,seen.value,opened.value));
function photoLoaded(){ photoReady.value=true; if(current.value)seen.value.add(current.value.id); }
function complete(){ approach.value=null; chapter.value=null; mapView.value?.cancel(); manualPaused.value=true; interactionHeld.value=false; phase.value='completed'; detail.value='summary'; }
let observer: ResizeObserver | undefined, opener: HTMLElement | null = null;
const status = computed(() => phase.value === 'completed' ? '這趟回憶，先收在這裡' : phase.value === 'chapter' ? '正在翻到另一趟旅行' : phase.value === 'moving' ? `正在前往${current.value?.title || ''}` : phase.value === 'exploring' ? '自由探索中' : phase.value === 'arrived' ? '已抵達，慢慢看' : '選一趟旅行，再走一次');
async function writeQuery() {
  writingQuery++;
  try { await router.replace({ path: '/atlas', query: { view: 'cities', ...(['year','last-year'].includes(scope.value) ? { scope: scope.value } : { journey: scope.value }), ...(selected.value ? { stop: selected.value } : {}), ...(!demo.value?{demo:'0'}:{}) } }); }
  finally { writingQuery--; }
}
function go(id: string, updateUrl = true) {
  if (!stops.value.some(stop => stop.id === id)) return;
  if (id === selected.value) {
    if (detail.value === 'photo') return;
    if (phase.value === 'moving') {
      directPhoto();
      return;
    }
    phase.value = 'arrived';
    compact.value = false;
    detail.value = 'photo';
    mapView.value?.focus?.(id);
    return;
  }
  // Close the native modal before a new camera starts (its focus restoration may scroll).
  mapView.value?.cancel(); dialog.value?.close();
  const previous=phase.value==='moving'||phase.value==='chapter'?command.value.from:selected.value;
  const previousStop=stops.value.find(stop=>stop.id===previous);
  const target=stops.value.find(stop=>stop.id===id)!;
  chapter.value=null; approach.value=null;
  detail.value = null; compact.value = false; selected.value = id;
  remaining.value=10; photoReady.value=false; interactionHeld.value=false;
  previousTime=0;travel.value={stage:'departing',progress:0};
  const switching=!!previousStop && !!revisitLeg(target,previousStop)?.chapter;
  command.value = { token: command.value.token + 1, id, from:previous, transitioning:switching };
  phase.value = switching ? 'chapter' : 'moving';
  if(switching)chapter.value={previous:previousStop!,next:target,token:command.value.token};
  if (updateUrl) writeQuery();
  if (unavailable.value && !switching) arrive(command.value.token);
}
function finishChapter(token:number) {
  if(phase.value!=='chapter' || token!==command.value.token)return;
  chapter.value=null;phase.value='moving';
  command.value={...command.value,token:token+1,transitioning:false};
  if(unavailable.value)arrive(command.value.token);
}
async function directPhoto(){
  finishChapter(command.value.token);
  await nextTick();
  if(unavailable.value)arrive(command.value.token);else mapView.value?.skip();
}
async function arrive(token: number) {
  if (token !== command.value.token || !current.value || phase.value !== 'moving') return;
  approach.value=null;phase.value = 'arrived'; visited.value.add(current.value.id);
  detail.value='photo';
  await nextTick();
  if (token !== command.value.token || phase.value !== 'arrived') return;
  animate(duration => {
    if(dialog.value)gsap.fromTo(dialog.value,{y:32,opacity:0},{y:0,opacity:1,duration:duration(.38),ease:'power3.out',clearProps:'transform,opacity',overwrite:true});
    const content = panel.value?.querySelector('.revisit-arrival');
    if (content) {
      gsap.fromTo(content, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: duration(.45), clearProps: 'transform,opacity', overwrite: true });
    }
  });
}
function explore() { detail.value=null; dialog.value?.close(); approach.value=null; chapter.value=null;manualPaused.value=true; compact.value=true; phase.value = 'exploring'; }
function overview(updateUrl = true) {
  approach.value=null;chapter.value=null;detail.value = null; selected.value = null; compact.value = false; phase.value = 'overview';
  command.value = { token: command.value.token + 1, id: null, from:null, transitioning:false };
  if (updateUrl) writeQuery();
}
function changeScope(value: string) { scope.value = revisitScope(value); resetSession(); overview(); }
function readQuery() {
  if(writingQuery)return;
  const nextScope = revisitScope(route.query.scope === 'last-year' ? 'last-year' : route.query.scope === 'year' || route.query.scope === 'period' ? 'year' : route.query.journey ?? currentJourney());
  const changed = nextScope !== scope.value; scope.value = nextScope;
  if (changed) resetSession();
  const id = typeof route.query.stop === 'string' ? route.query.stop : null;
  if (id && stops.value.some(stop => stop.id === id)) { if (changed || id !== selected.value) go(id, false); }
  else if (changed || selected.value) overview(false);
}
function mapFailed() { approach.value=null; unavailable.value = true; if (phase.value === 'moving') arrive(command.value.token); }
function next() { if(phase.value==='moving'||phase.value==='chapter'||phase.value==='completed')return; if (index.value < stops.value.length - 1) go(stops.value[index.value + 1]!.id); else complete(); }
function keyboard(event: KeyboardEvent) {
  if (detail.value || (event.target as HTMLElement).closest('select,input,textarea,button,a')) return;
  if (event.key === 'ArrowRight') { event.preventDefault(); next(); }
  if (event.key === 'ArrowLeft' && index.value > 0) { event.preventDefault(); go(stops.value[index.value - 1]!.id); }
}
// Backgrounding suspends elapsed time, not the user's playback preference.
// Resume automatically on return; an explicit pause still remains paused.
function pauseWhenHidden() { pageHidden.value=document.hidden; previousTime=0; }
watch(() => [route.query.journey, route.query.scope, route.query.stop], readQuery);
// A resumed tab/loaded photo must never charge the time spent in transit to the photo clock.
watch(running,()=>{previousTime=0;},{flush:'sync'});
watch(detail, async value => {
  await nextTick();
  if(detail.value!==value)return;
  if (value) {
    opener = document.activeElement as HTMLElement;
    dialog.value?.close();
    // A photograph is a map sheet, not a modal that makes the whole map inert.
    if(value==='photo') dialog.value?.show(); else dialog.value?.showModal();
  } else { dialog.value?.close(); if (phase.value!=='moving'&&phase.value!=='chapter'&&opener?.isConnected) opener.focus({preventScroll:true}); }
});
onMounted(() => {
  readQuery();
  pauseWhenHidden();
  clockFrame=requestAnimationFrame(tick);
  observer = new ResizeObserver(entries => { panelHeight.value = entries[0]?.contentRect.height || 280; });
  if (panel.value) observer.observe(panel.value);
  document.addEventListener('visibilitychange', pauseWhenHidden);
});
onBeforeUnmount(() => { cancelAnimationFrame(clockFrame); observer?.disconnect(); dialog.value?.close(); document.removeEventListener('visibilitychange', pauseWhenHidden); });
</script>
<template>
  <section ref="root" class="revisit" :class="{ 'is-compact': compact, 'is-overview': !current, 'is-in-transit':phase==='moving','is-descending':!!approach }" :data-phase="phase" :data-stage="travel.stage" aria-label="立體地圖穿梭" tabindex="-1" @keydown="keyboard">
    <ClientOnly>
      <RevisitMap ref="mapView" :stops="stops" :selected="selected" :command="command" :three="three" :panel-height="panelHeight" :reduced="reduced" @select="go" @arrive="arrive" @approach="approachArrival" @explore="explore" @unavailable="mapFailed" @ready="unavailable=false" @travel="travel=$event" @prepare="preparation=$event" @waiting="waiting=$event" />
      <template #fallback><div class="revisit-map"><div class="revisit-map-status">正在展開旅行地圖…</div></div></template>
    </ClientOnly>
    <div class="revisit-vignette" aria-hidden="true" />
    <header class="revisit-header">
      <NuxtLink to="/atlas" class="revisit-back" aria-label="返回回憶廣場"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M20 12H4m6-6-6 6 6 6"/></svg></NuxtLink>
      <div class="revisit-wordmark"><span>去趣 <i>chicTrip</i></span><small>MEMORY ATLAS</small></div>
      <label class="revisit-scope"><span class="sr-only">選擇重遊旅程</span><select aria-label="選擇重遊旅程" :value="scope" @change="changeScope(($event.target as HTMLSelectElement).value)"><option v-for="item in revisitScopes" :key="item.id" :value="item.id">{{ item.label }}</option></select></label>
    </header>
    <div class="revisit-map-tools" aria-label="地圖視角">
      <button @click="overview()" aria-label="查看整趟旅行" title="整趟旅行"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 9V4h5m6 0h5v5m0 6v5h-5m-6 0H4v-5"/></svg></button>
      <button :disabled="!!approach" :aria-pressed="three" :aria-label="three ? '切換平面地圖' : '切換立體城市'" @click="three=!three">{{ three ? '3D' : '2D' }}</button>
    </div>
    <div class="revisit-status" role="status"><i :class="{'is-moving':phase==='moving'}" />{{ status }}<button v-if="phase==='exploring' && current" @click="go(current.id)">回到這一站 ↗</button></div>

    <div v-if="(preparation.active || preparation.failed || waiting) && !unavailable" class="revisit-preparation" role="status" :data-ready="!preparation.active && !preparation.failed && !waiting">
      <b>{{ preparation.active ? '正在準備這趟回憶' : preparation.failed ? '部分素材尚未就緒' : waiting }}</b>
      <template v-if="preparation.active"><progress :value="preparation.done" :max="Math.max(1,preparation.total)"/><span>{{ preparation.total ? Math.floor(preparation.done/preparation.total*100)+'%' : '準備中' }} · 地圖、照片與收藏</span></template>
      <span v-else-if="preparation.failed">網路較慢，可以重試或先看照片。</span>
      <button v-if="preparation.failed && !preparation.active" @click="mapView?.retry()">重新準備</button>
      <button v-if="!current && preparation.failed && !preparation.active" @click="mapView?.cancel();unavailable=true;start()">先看照片回憶 →</button>
      <button v-if="current && phase==='moving'" @click="mapView?.cancel();arrive(command.token)">先看這站照片 →</button>
    </div>

    <RevisitChapter v-if="chapter" :key="chapter.token" :previous="chapter.previous" :next="chapter.next" :token="chapter.token" :reduced="reduced" @done="finishChapter" @cancel="mapView?.cancel();explore()" />
    <aside ref="panel" class="revisit-panel" :class="{ 'is-moving': phase==='moving', 'is-changing-chapter':phase==='chapter' }" :inert="phase==='chapter' || !!approach" aria-label="這段旅行的照片">
      <button class="revisit-panel-handle" :aria-expanded="!compact" :aria-label="compact?'展開回憶面板':'收起回憶面板'" @click="compact=!compact"><span /></button>
      <template v-if="!current">
        <div class="revisit-intro-copy"><PageMascot /><span class="revisit-eyebrow">{{ summary.english }}</span><h1>{{ summary.title }}</h1><p>回到走過的地方，<br class="revisit-desktop-break"/>再看看那時拍下的風景。</p></div>
        <div class="revisit-intro-photo"><img :src="asset(stops[0]!.source)" :alt="stops[0]!.title" :class="{'source-crop':stops[0]!.sourceCrop}"/><span>{{ scope==='year'?'從二月的富士山開始':scope==='last-year'?'2025 · 從大阪到首爾、香港':scope==='fuji'?'那天，天色慢慢變藍':'第一站 · 神戶港' }}</span></div>
        <div class="revisit-intro-bottom"><span>{{ summary.subtitle }}</span><div class="revisit-intro-meta"><b>{{ stops.length }} 段回憶</b><span>照片・地方・那一天</span></div><button class="revisit-primary" :disabled="!unavailable && (preparation.active || !!preparation.failed)" @click="start">開始重遊 <span aria-hidden="true">↗</span></button><small>每站停留 10 秒，打開收藏時暫停。</small></div>
      </template>
      <template v-else>
        <div class="revisit-place-heading"><PageMascot /><div><span class="revisit-eyebrow">{{ current.date.replaceAll('-','.') }} <i>／</i> {{ current.english || currentTrip?.english }}</span><h1>{{ current.title }}</h1></div><span class="revisit-count">{{ String(index+1).padStart(2,'0') }}<small>/ {{ String(stops.length).padStart(2,'0') }}</small></span></div>
        <div v-if="phase==='moving' || phase==='chapter'" class="revisit-transit"><div class="revisit-transit-meta"><b>{{ travel.stage==='landing'?'抵達 · 正在看清這個地方':travel.stage==='departing'?'準備出發':leg?.vehicle==='plane'?'飛行中':'沿途，再看一次' }}</b><button @click="directPhoto">跳過移動 →</button></div><p>{{ leg?.chapter?'回憶翻頁 · 回到'+current.title:leg?.label || '正在回到這個地方' }}</p><div class="revisit-travel-progress" role="progressbar" aria-label="這一段移動進度" :aria-valuenow="Math.round(travel.progress*100)" :aria-valuemin="0" :aria-valuemax="100"><i :style="{scale:travel.progress+' 1'}"/></div></div>
        <div v-else class="revisit-arrival">
          <button class="revisit-photo" aria-label="放大這一站的照片" @click="detail='photo'"><img :src="asset(current.source)" :alt="current.title+'的回憶照片'" :class="{'source-crop':current.sourceCrop}"/><span class="revisit-photo-expand">放大照片 ↗</span></button>
          <div class="revisit-caption"><p>{{ current.caption }}</p><small v-if="current.sourceNote">{{ current.sourceNote }}</small>
            <button v-if="current.souvenirs.length" class="revisit-sticker-cue" @click="detail='photo'"><img :src="asset(current.souvenirs[0]!.image)" alt=""/><span>照片裡的小收藏<small>點照片光點，打開看看</small></span><span aria-hidden="true">↗</span></button>
          </div>
        </div>
        <footer v-if="phase!=='moving' && phase!=='chapter'" class="revisit-panel-footer"><button class="revisit-previous" :disabled="index===0" aria-label="上一站" @click="go(stops[index-1]!.id)">←</button><button class="revisit-primary" @click="next">{{ index===stops.length-1?'完成這趟重遊':'下一站 · '+stops[index+1]!.short }} <span aria-hidden="true">→</span></button></footer>
      </template>
    </aside>

    <footer class="revisit-timeline" :inert="!!approach">
      <button class="revisit-route-button" @click="detail='route'"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2Zm6-2v16m6-14v16"/></svg><span>旅程<small>{{ visited.size }} / {{ stops.length }}</small></span></button>
      <nav class="revisit-stop-strip" aria-label="跳到一段回憶"><button v-for="(stop,i) in stops" :key="stop.id" :aria-label="'前往'+stop.title" :aria-current="selected===stop.id?'step':undefined" @click="go(stop.id)"><span>{{ String(i+1).padStart(2,'0') }}</span><img :src="asset(stop.source)" alt="" :class="{'source-crop':stop.sourceCrop}"/><b>{{ stop.short }}</b><i v-if="visited.has(stop.id)" aria-label="已回顧">✓</i></button></nav>
    </footer>
    <span class="revisit-map-note">路線為回憶順序示意</span>

    <RevisitArrival v-if="approach && current && !reduced" :key="approach.token" :stop="current" :stage="approach.stage" :progress="approach.progress" />

    <dialog ref="dialog" class="revisit-dialog" :class="{'is-route':detail==='route','is-photo-room':detail==='photo','is-summary':detail==='summary'}" :aria-label="detail==='summary'?'這次重遊的回憶總結':detail==='route'?'旅程中的回憶':current?.title+'照片'" @cancel.prevent="closePhoto" @close="dialogClosed" @keydown="escapeDialog">
      <header v-if="detail==='route'"><span>{{ summary.title }}</span><button aria-label="關閉，回到地圖" @click="detail=null">×</button></header>
      <div v-if="detail==='route'" class="revisit-route-list"><p>{{ summary.subtitle }} · 依旅行順序</p><button v-for="(stop,i) in stops" :key="stop.id" @click="go(stop.id)"><span>{{ String(i+1).padStart(2,'0') }}</span><img :src="asset(stop.source)" alt="" :class="{'source-crop':stop.sourceCrop}"/><span><strong>{{ stop.title }}</strong><small>{{ stop.date.replaceAll('-','.') }}</small></span><span aria-hidden="true">↗</span></button></div>
      <RevisitPhoto v-else-if="current && detail==='photo'" :key="command.token" :stop="current" :remaining="remaining" :running="running" :last="index===stops.length-1" @loaded="photoLoaded" @discover="opened.add($event)" @hold="interactionHeld=$event" @pause="manualPaused=true" @resume="manualPaused=false" @next="next" @close="closePhoto" />
      <RevisitSummary v-else-if="detail==='summary'" :title="summary.label" :summary="completion" @replay="start" @close="closePhoto" />
    </dialog>
  </section>
</template>

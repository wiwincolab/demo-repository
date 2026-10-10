<script setup lang="ts">
import ChictripMotion from '~/components/ChictripMotion.vue';
import {tripItineraries,plannerStorageKey} from '~/data/trips';
import type { Stop } from '~/types/trip';
import { pointInPolygon, type Point } from '~/utils/map';
import { plannerKeywords } from '~/data/planner-preferences';
import { recommendPlaces, refineSelection, rainPlanFor, type Recommendation } from '~/utils/planner';
const asset = useAsset();
const { notify } = useDemo();
const {activeId,activeTrip,tripHref}=useTripContext();
const places = computed<Stop[]>(()=>{
  if(!activeId.value)return [];
  const trip=tripItineraries[activeId.value];
  return trip.flatMap(d=>d.stops).filter((s,i,all)=>all.findIndex(p=>p.name===s.name)===i);
});
const { keywordIds, enabled: useKeywords } = useTravelPreferences();
const appliedKeywords = computed(() => useKeywords.value ? keywordIds.value : []);
const appliedTitles = computed(() => plannerKeywords.filter(k => appliedKeywords.value.includes(k.id)).map(k => k.title));
const ids = ref<number[]>([]), drawing = ref(true), preferences = ref(''), pace = ref(3);
const selectionBoundary = ref<Point[]>([]);
const rangeIds = ref<number[]>([]), hasRange = ref(false), mapRevision = ref(0), refinement = ref(''), refinementStatus = ref('');
const insidePlaces = computed(() => places.value.filter(p => rangeIds.value.includes(p.id)));
const outsidePlaces = computed(() => places.value.filter(p => !rangeIds.value.includes(p.id)));
const extension = ref(0), planNotes = ref<string[]>([]), previousNotes = ref<string[]>([]);
const panel = ref<'preferences' | 'preview' | 'saved' | null>(null);
const dirty = ref(false), error = ref('');
const routeIds = computed(() => !dirty.value ? draft.value.map(s => s.id) : []);
const busy = ref(false), draft = ref<Recommendation[]>([]), previous = ref<Recommendation[]>([]);
const regions=computed(()=>activeId.value==='tokyo'?[{name:'淺草河岸範圍',ids:[0,1,2]},{name:'上野文化範圍',ids:[12,14]}]:activeId.value==='kansai'?[{name:'神戶範圍',ids:[1,2]},{name:'京都東山範圍',ids:[7,8]},{name:'奈良範圍',ids:[9]}]:[{name:'全部景點範圍',ids:places.value.map(p=>p.id)}]);
let generationTimer: ReturnType<typeof setTimeout> | undefined;
watch(activeId,()=>{clearTimeout(generationTimer);ids.value=[];rangeIds.value=[];selectionBoundary.value=[];hasRange.value=false;drawing.value=true;mapRevision.value++;refinement.value='';refinementStatus.value='';draft.value=[];previous.value=[];preferences.value='';previousNotes.value=[];extension.value=0;dirty.value=false;error.value='';planNotes.value=[];panel.value=null;busy.value=false;});
watch([ids, preferences, pace, extension, () => appliedKeywords.value.join(',')], () => {
  clearTimeout(generationTimer);
  busy.value = false;
  dirty.value = !!draft.value.length;
  error.value = '';
}, { flush: 'sync' });
watch(activeId, id => {
  if (!import.meta.client || !id) return;
  try {
    const stored = JSON.parse(localStorage.getItem(plannerStorageKey(id)) || 'null');
    if (stored?.saved?.stops?.length) {
      ids.value = (stored.ids || stored.saved.stops.filter((s: Recommendation) => !s.outside).map((s: Recommendation) => s.id)).filter((id: number) => places.value.some(p => p.id === id));
      rangeIds.value = (stored.rangeIds || ids.value).filter((id: number) => places.value.some(p => p.id === id));
      ids.value = [...new Set([...ids.value, ...stored.saved.stops.map((s: Recommendation) => s.id)])].filter(id => places.value.some(p => p.id === id));
      selectionBoundary.value = Array.isArray(stored.boundary) ? stored.boundary.filter((p: unknown) => Array.isArray(p) && p.length === 2 && p.every(Number.isFinite)) : [];
      hasRange.value = true;
      drawing.value = false;
      preferences.value = stored.saved.preference || '';
      extension.value = stored.extension ?? 0;
      pace.value = stored.pace ?? 3;
      draft.value = stored.saved.stops.filter((s: Recommendation) => places.value.some(p => p.id === s.id)).map((s: Recommendation) => ({ ...s, rainPlan: s.rainPlan || rainPlanFor(s, places.value) }));
      planNotes.value = stored.saved.notes || [];
      dirty.value = JSON.stringify(stored.saved.keywordIds || []) !== JSON.stringify(appliedKeywords.value);
    }
  } catch { /* A fresh draft remains available when saved data cannot be read. */ }
}, { immediate: true });
function select(value: number[]) { ids.value = value; }
function selectRange(value: number[], boundary: Point[] = []) {
  rangeIds.value = [...value]; ids.value = [...value]; hasRange.value = true;
  drawing.value = false; refinementStatus.value = ''; refinement.value = '';
  selectionBoundary.value = boundary;
}
function selectRegion(value: number[]) {
  const locations = places.value.filter(p => value.includes(p.id));
  if (!locations.length) return;
  const xs = locations.map(p => p.at[0]!), ys = locations.map(p => p.at[1]!);
  const west = Math.min(...xs) - .001, east = Math.max(...xs) + .001;
  const south = Math.min(...ys) - .001, north = Math.max(...ys) + .001;
  const boundary = [[west, south], [east, south], [east, north], [west, north]];
  selectRange(places.value.filter(p => pointInPolygon(p.at, boundary)).map(p => p.id), boundary);
}
function clearRange() {
  ids.value = []; rangeIds.value = []; hasRange.value = false;
  selectionBoundary.value = []; drawing.value = true; mapRevision.value++; refinement.value = ''; refinementStatus.value = '';
}
function applyRefinement() {
  const result = refineSelection(places.value, ids.value, refinement.value);
  ids.value = result.ids;
  refinementStatus.value = result.changes.length ? result.changes.join('、') + '。地圖與清單已更新。' : '未找到可套用的景點，請使用清單中的完整名稱，例如「加入' + (outsidePlaces.value[0]?.name || places.value[0]?.name || '景點名稱') + '」。';
  if (result.changes.length) refinement.value = '';
}
function openPreferences() { if (!hasRange.value || !ids.value.length) {
    notify('先圈選想去的區域，再挑選景點。');
    return;
} ; panel.value = 'preferences'; }
function generate() {
    if (!ids.value.length) { error.value = '先圈選主要遊玩區域，再挑選景點。'; return; }
    if (busy.value) return;
    busy.value = true;
    generationTimer = setTimeout(() => {
        const result = recommendPlaces(places.value, ids.value, preferences.value, pace.value, 0, appliedKeywords.value, true);
        if (!result.stops.length) {
            busy.value = false;
            error.value = '目前沒有符合條件的景點，試試增加時間、擴大範圍或調整喜好。';
            return;
        }
        busy.value = false;
        previous.value = draft.value;
        previousNotes.value = planNotes.value;
        draft.value = result.stops;
        planNotes.value = result.notes;
        dirty.value = false;
        panel.value = null;
        drawing.value = false;
        notify('推薦已準備好，可在地圖與下方清單查看。');
    }, 500);
}
function save() {
    if(!activeId.value || dirty.value || !draft.value.length)return;
    try {
        localStorage.setItem(plannerStorageKey(activeId.value), JSON.stringify({ trip:activeId.value, ids: ids.value, rangeIds: rangeIds.value, boundary: selectionBoundary.value, extension: extension.value, pace: pace.value, saved: { stops: draft.value, preference: preferences.value, keywordIds: [...appliedKeywords.value], notes: planNotes.value } }));
    }
    catch {
        notify('瀏覽器無法儲存，請保留這份預覽。');
        return;
    }
    panel.value = 'saved';
    notify('草案已儲存到'+activeTrip.value?.title);
}
function addPreference(text: string) { preferences.value = preferences.value ? preferences.value + '，' + text : text; }
onBeforeUnmount(() => clearTimeout(generationTimer));
</script>
<template>
  <section v-if="activeTrip" class="screen active">
    <div class="mascot-perch"><div class="page-heading">
      <span class="eyebrow">{{ activeTrip.english }} / DAY PLANNER</span>
      <h1>圈出想去的地方，<br>剩下的，聊聊就好。</h1>
      <p>先圈選範圍、查看景點，再用文字加入圈外地點。每一站都會附上雨天備案。</p>
    </div><PageMascot /></div>
    <aside class="planner-memory" aria-label="旅行偏好摘要">
      <div><strong>吉祥物記住的偏好</strong><p>{{ appliedTitles.length ? appliedTitles.join('、') : '這次只依圈選與額外條件推薦' }}</p></div>
      <label><input v-model="useKeywords" type="checkbox">這次套用</label>
      <NuxtLink :to="{ path: '/wardrobe', query: { view: 'preferences', trip: activeId } }">管理偏好 →</NuxtLink>
    </aside>
    <ol class="planner-steps" aria-label="規劃流程"><li :class="{ current: !hasRange }">① 圈選範圍</li><li :class="{ current: hasRange && (!draft.length || dirty) }">② 查看景點、文字微調</li><li :class="{ current: draft.length && !dirty }">③ 生成行程與雨備</li></ol>
    <div class="view-bar">
      <h2>{{ activeTrip.location }}</h2>
      <div class="segmented">
        <button :aria-pressed="drawing" @click="drawing = true">圈選</button>
        <button :aria-pressed="!drawing" :disabled="!hasRange" @click="drawing = false">點景點</button>
      </div>
    </div>
    <CircleMap :key="activeId || ''" :places="places" :selected="ids" :drawing="drawing" :boundary="selectionBoundary" :reset-key="mapRevision" :route="routeIds" @select="select" @range="selectRange" />
    <div class="planner-controls">
      <button v-for="region in regions" :key="region.name" @click="selectRegion(region.ids)">{{ region.name }}</button>
      <button @click="clearRange">清除</button>
    </div>
    <section v-if="hasRange" class="selection-results" aria-label="圈選景點">
      <h2>圈選範圍內 · {{ insidePlaces.length }} 個景點</h2>
      <p v-if="!insidePlaces.length" class="small-note">這個範圍沒有景點，可以重新圈選，或用文字加入下方景點。</p>
      <div class="map-stops">
        <button v-for="place in insidePlaces" :key="place.id" :aria-pressed="ids.includes(place.id)" @click="select(ids.includes(place.id) ? ids.filter(n => n !== place.id) : [...ids, place.id])">
          <b>{{ place.name }}</b><small>{{ ids.includes(place.id) ? '已選取' : '已移除' }} · {{ place.stay }}</small>
        </button>
      </div>
      <h3>範圍外 · {{ outsidePlaces.length }} 個景點</h3>
      <p class="small-note">灰色景點尚未選取；加入後會和圈內景點一樣顯示藍色。</p>
      <div class="map-stops">
        <button v-for="place in outsidePlaces" :key="place.id" :aria-pressed="ids.includes(place.id)" @click="select(ids.includes(place.id) ? ids.filter(n => n !== place.id) : [...ids, place.id])">
          <b>{{ place.name }}</b><small>{{ ids.includes(place.id) ? '已加入' : '未選取' }} · {{ place.stay }}</small>
        </button>
      </div>
      <label for="refinement">用文字微調景點</label>
      <textarea id="refinement" v-model="refinement" maxlength="300" :placeholder="'例如：加入' + (outsidePlaces[0]?.name || places[0]?.name || '景點名稱') + '，移除' + (insidePlaces[0]?.name || '景點名稱')" />
      <p class="small-note">目前支援「加入／移除＋完整景點名稱」，多個操作請用逗號分隔。</p>
      <button class="secondary" :disabled="!refinement.trim()" @click="applyRefinement">套用文字微調</button>
      <p role="status" aria-live="polite">{{ refinementStatus }}</p>
    </section>
    <div class="panel">
      <div class="row">
        <span class="muted">{{ ids.length }} 個景點已選取</span>
        <NuxtLink :to="tripHref('/trip')">返回行程</NuxtLink>
      </div>
      <p v-if="!ids.length" class="small-note">圈選主要想逛的地方，不必畫得精準。也可以試試上方的快捷範圍。</p>
      <button class="primary" @click="openPreferences">下一步：生成行程與雨天備案 ↓</button>
    </div>
    <section v-if="draft.length" class="planner-results" aria-label="景點推薦">
      <div class="row"><div><span class="eyebrow">YOUR DAY, YOUR WAY</span><h2>這樣玩，你覺得呢？</h2></div><span class="planner-badge">{{ dirty ? '需求已變更' : '行程草案' }}</span></div>
      <p v-if="dirty" class="planner-error" role="status">圈選或需求已變更，請重新產生推薦後再儲存。</p>
      <div class="planner-legend"><span>● 藍色：已選取景點</span><span>● 灰色：尚未選取</span></div>
        <div class="panel" aria-live="polite"><b>你的需求與安排</b><p v-for="note in planNotes" :key="note" class="small-note">{{ note }}</p></div>
        <article v-for="s in draft" :key="s.id" class="planner-card" :class="{ outside: s.outside }">
          <time>{{ s.time }}</time>
          <span>
            <span class="planner-badge">{{ rangeIds.includes(s.id) ? '圈內景點' : '圈外已加入' }}</span><h3>{{ s.name }}</h3>
            <small>{{ s.stay }}</small>
            <p>{{ s.reason }}</p><div class="rain-plan"><b>☂ 雨天備案</b><p>{{ s.rainPlan }}</p></div><small v-if="s.travelMinutes">前一站交通約 {{ s.travelMinutes }} 分鐘 · 示範估算</small>
          </span>
          <img :src="asset(s.photo.src)" :alt="s.photo.alt" width="48" height="48" style="object-fit:cover;border-radius:8px">
        </article>
        <p class="small-note">這份草案保存在「{{ activeTrip.title }}」內，確認前不更動原有安排。</p>
        <button class="primary" :disabled="dirty || busy" @click="save">確認並儲存行程</button>
        <button class="secondary" @click="panel = 'preferences'">再微調一下</button>
        <button v-if="previous.length" class="secondary" @click="draft = previous; planNotes = previousNotes; previous = []; dirty = true; openPreferences()">復原上一版</button>
    </section>

    <AppSheet :model-value="!!panel" :title="panel === 'preferences' ? '這一天，想怎麼玩？' : panel === 'preview' ? '先看看你的安排' : '行程已儲存'" @update:model-value="panel = null">
      <template v-if="panel === 'preferences'">
        <p class="planner-area">已選景點：{{ places.filter(p => ids.includes(p.id)).map(p => p.name).join('、') }}</p>
        <div class="panel"><b>本次參考的偏好關鍵字</b><p class="small-note">{{ appliedTitles.length ? appliedTitles.join('、') : '未選用偏好，只依本次條件推薦' }}</p><small>本次明確排除的項目會優先處理；偏好可到上方吉祥物的「記憶偏好」管理。</small></div><p class="muted">再補充這次的額外條件（選填）</p>
        <textarea v-model="preferences" aria-label="旅行偏好" maxlength="300" placeholder="我有四小時，喜歡自然景點。預算 3000 日圓，已買周遊券。" />
        <div class="choice-row">
          <button v-for="hint in ['喜歡自然景點', '老街與甜點', '有四小時', '雨天室內']" :key="hint" @click="addPreference(hint)">{{ hint }}</button>
        </div>
        <div class="planner-fields">
        <label for="pace">旅行步調</label>
        <select id="pace" v-model.number="pace">
          <option :value="2">悠閒 · 最多 2 個景點</option>
          <option :value="3">剛好 · 最多 3 個景點</option>
          <option :value="4">充實 · 最多 4 個景點</option>
        </select>
        </div>
        <p v-if="error" class="planner-error" role="alert">{{ error }}</p>
        <p class="small-note">依關鍵字規則產生示範推薦，尚未串接 AI。交通為估算；預算與周遊券先記下需求，費用及適用路線待查核。</p>
        <button class="primary" :disabled="busy" @click="generate">{{ busy ? '正在安排…' : '生成行程與每站雨天備案 →' }}</button>
      </template>
      <template v-else>
        <ChictripMotion v-if="panel === 'saved'" motion="happy" :size="112"/>
        <p>下次回到「行程 → 已儲存」即可查看草案。</p>
        <NuxtLink class="primary" :to="tripHref('/trip')" @click="panel = null">回到我的行程</NuxtLink>
      </template>
    </AppSheet>
  </section>
</template>


<style scoped>
.selection-results{padding:16px}.selection-results h2{font-size:18px}.selection-results h3{font-size:15px;margin-top:24px}.selection-results .map-stops{margin:12px 0}.selection-results .map-stops button{background:#eef0f2;color:#646e77;border:1px solid #d8dde1}.selection-results .map-stops button[aria-pressed=true]{background:#edf8ff;color:#007eae;border-color:#009fe8}.selection-results textarea{width:100%;min-height:90px;margin-top:10px}.selection-results label{font-weight:600}.rain-plan{margin-top:12px;padding:12px;background:#eff7f8;border-radius:10px}.rain-plan b{font-size:12px;color:#356772}.rain-plan p{margin:6px 0 0;font-size:12px;line-height:1.7}

.planner-memory{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:6px 16px;align-items:center;background:#f0f7f6;border:1px solid #dce9e7;border-radius:14px;padding:14px 16px;margin:16px 0}.planner-memory strong{font-size:13px;color:#325e66}.planner-memory p{font-size:11px;color:#74898e;margin:5px 0 0;line-height:1.5}.planner-memory label{display:flex;align-items:center;gap:5px;font-size:12px;white-space:nowrap}.planner-memory input{accent-color:#397b87}.planner-memory a{grid-column:1/-1;justify-self:end;color:#397b87;font-size:12px;text-decoration:none;padding:4px 0}.planner-memory a:focus-visible{outline:2px solid #397b87;outline-offset:3px}
</style>

<script setup lang="ts">
import ChictripMotion from '~/components/ChictripMotion.vue';
import {tripItineraries,plannerStorageKey} from '~/data/trips';
import type { Stop } from '~/types/trip';
import type { Point } from '~/utils/map';
import { withinPlanningAreas, validPlanningBoundary } from '~/utils/planner-map';
import { travelPasses, filterTravelPasses, findTravelPass, passCountries, passKindLabels, travelPassRegions, type TravelPass, type TravelPassCountry } from '~/data/travel-passes';
import { benefitsForPass, benefitLocationFrame } from '~/data/pass-benefits';
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
const ids = ref<number[]>([]), drawing = ref(false), preferences = ref(''), pace = ref(3);
const selectionBoundary = ref<Point[]>([]);
const rangeIds = ref<number[]>([]), hasRange = ref(false), mapRevision = ref(0), refinement = ref(''), refinementStatus = ref('');
const selectedPassId = ref('');
const passCountry = ref<TravelPassCountry | ''>(''), passRegion = ref(''), passQuery = ref('');
const availablePasses = computed(() => filterTravelPasses({ country: passCountry.value, region: passRegion.value, query: passQuery.value }));
const availableRegions = computed(() => travelPassRegions(passCountry.value));
watch(passCountry, () => { passRegion.value = ''; });
const selectedPass = computed(() => findTravelPass(selectedPassId.value));
const selectedBenefits = computed(() => benefitsForPass(selectedPassId.value));
function planningAreas(pass: TravelPass) {
  return [...pass.areas, ...benefitsForPass(pass.id).filter(p => !withinPlanningAreas(p.at, pass.areas)).map(p => benefitLocationFrame(p.at))];
}
const selectionAreas = computed(() => selectedPass.value ? planningAreas(selectedPass.value) : []);
const extension = ref(0), planNotes = ref<string[]>([]);
const panel = ref<'passes' | 'preferences' | 'saved' | null>(null);
const dirty = ref(false), error = ref('');
const routeIds = computed(() => !dirty.value ? draft.value.map(s => s.id) : []);
const busy = ref(false), draft = ref<Recommendation[]>([]);
let generationTimer: ReturnType<typeof setTimeout> | undefined;
watch(activeId,()=>{clearTimeout(generationTimer);ids.value=[];rangeIds.value=[];selectionBoundary.value=[];selectedPassId.value='';hasRange.value=false;drawing.value=false;mapRevision.value++;refinement.value='';refinementStatus.value='';draft.value=[];preferences.value='';extension.value=0;dirty.value=false;error.value='';planNotes.value=[];panel.value=null;busy.value=false;});
watch([ids, preferences, pace, extension, selectedPassId, () => appliedKeywords.value.join(',')], () => {
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
      selectionBoundary.value = validPlanningBoundary(stored.boundary);
      selectedPassId.value = findTravelPass(stored.passId)?.id || '';
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
  selectedPassId.value = '';
  rangeIds.value = [...value]; ids.value = [...value]; hasRange.value = true;
  drawing.value = false; refinementStatus.value = ''; refinement.value = '';
  selectionBoundary.value = boundary;
}
function selectPass(pass: TravelPass) {
  if (!findTravelPass(pass.id)) return;
  const value = places.value.filter(p => withinPlanningAreas(p.at, planningAreas(pass))).map(p => p.id);
  selectRange(value);
  selectedPassId.value = pass.id; panel.value = null;
}
function beginDrawing() {
  if (drawing.value) { drawing.value = false; return; }
  drawing.value = true;
}
function applyRefinement() {
  const result = refineSelection(places.value, ids.value, refinement.value);
  ids.value = result.ids;
  refinementStatus.value = result.changes.length ? result.changes.join('、') + '。地圖已更新。' : '請使用完整景點名稱，例如「加入' + (places.value[0]?.name || '景點名稱') + '」。';
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
        localStorage.setItem(plannerStorageKey(activeId.value), JSON.stringify({ trip:activeId.value, ids: ids.value, rangeIds: rangeIds.value, boundary: selectionBoundary.value, passId: selectedPassId.value, extension: extension.value, pace: pace.value, saved: { stops: draft.value, preference: preferences.value, keywordIds: [...appliedKeywords.value], notes: planNotes.value } }));
    }
    catch {
        notify('瀏覽器無法儲存，請保留這份預覽。');
        return;
    }
    panel.value = 'saved';
    notify('草案已儲存到'+activeTrip.value?.title);
}
onBeforeUnmount(() => clearTimeout(generationTimer));
</script>
<template>
  <section v-if="activeTrip" class="screen active planner-screen">
    <div class="mascot-perch"><div class="page-heading">
      <span class="eyebrow">{{ activeTrip.english }} / DAY PLANNER</span>
      <h1>圈出今天想玩的地方。</h1>
      <p>自己畫範圍，或用手上的票券選區。放大地圖就能看景點。</p>
    </div><PageMascot /></div>
    <div class="range-choices" aria-label="選擇遊玩範圍的方式">
      <button :class="{ active: drawing }" :aria-pressed="drawing" @click="beginDrawing"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17 4c5 3 5 13-2 15C8 22 1 17 3 10c1-4 5-7 9-6M14 8l6-6 2 2-6 6-3 1 1-3Z"/></svg>{{ drawing ? '取消圈選' : hasRange ? '自己重畫範圍' : '自己圈選' }}</button>
      <button :class="{ active: selectedPass }" @click="panel = 'passes'"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18v5a2 2 0 0 0 0 4v3H3v-3a2 2 0 0 0 0-4V6Zm12 0v3m0 3v3m0 1v2"/></svg>{{ selectedPass ? '更換票券範圍' : '用票券範圍' }}</button>
    </div>
    <div v-if="selectedPass" class="selected-pass" aria-label="目前使用的票券範圍">
      <TravelPassArtwork :pass="selectedPass" />
      <span><b>{{ selectedPass.name }}</b><small>{{ selectedPass.region }} · {{ selectedPass.kind === 'stored-value' ? '服務區域示意・需儲值' : '規劃範圍示意' }}</small></span>
      <a :href="selectedPass.coverageUrl" target="_blank" rel="noopener">官方適用範圍 ↗</a>
    </div>
    <CircleMap :key="activeId || ''" :places="places" :selected="ids" :drawing="drawing" :has-range="hasRange" :range-ids="rangeIds" :boundary="selectionBoundary" :areas="selectionAreas" :benefits="selectedBenefits" :reset-key="mapRevision" :route="routeIds" @select="select" @range="selectRange" @cancel="drawing = false" />
    <p v-if="selectedPass" class="pass-range-note">{{ selectedPass.exclusions }} <template v-if="selectedBenefits.length">已標示 {{ selectedBenefits.length }} 個有確認座標的合作設施；黃框為位置示意，完整名單與方案限制見官網。</template></p>
    <div class="planning-next">
      <span>{{ hasRange ? ids.length + ' 個景點已加入' : '先選一個想逛的範圍' }}</span>
      <button class="primary" :disabled="!hasRange || !ids.length || drawing" @click="openPreferences">{{ draft.length ? '重新安排這一天' : '產生行程' }} <span aria-hidden="true">→</span></button>
    </div>
    <p v-if="hasRange && !ids.length" class="small-note empty-selection">{{ selectedPass && !rangeIds.length ? '這張票券未涵蓋目前「' + activeTrip.title + '」行程的景點。可切換到對應旅程，或自己重畫範圍。' : '這裡目前沒有選到景點。可以重畫範圍，或放大地圖點選想去的地方。' }}</p>
    <details v-if="hasRange" class="text-refinement">
      <summary>也可以用文字調整景點</summary>
      <form @submit.prevent="applyRefinement"><label for="refinement" class="sr-only">用文字調整景點</label><textarea id="refinement" v-model="refinement" maxlength="300" :placeholder="'例如：加入' + (places[0]?.name || '景點名稱') + '，移除另一個景點'" /><button class="secondary" :disabled="!refinement.trim()">套用</button></form>
      <p v-if="refinementStatus" role="status" aria-live="polite">{{ refinementStatus }}</p>
    </details>
    <section v-if="draft.length" class="planner-results" aria-label="行程草案">
      <div class="row"><h2>這樣玩，你覺得呢？</h2><span class="planner-badge">{{ dirty ? '需求已變更' : '行程草案' }}</span></div>
      <p v-if="dirty" class="planner-error" role="status">需求已變更，重新安排後就能儲存。</p>
      <details class="plan-notes"><summary>時間與安排</summary><p v-for="note in planNotes" :key="note" class="small-note">{{ note }}</p></details>
      <article v-for="s in draft" :key="s.id" class="planner-card">
        <time>{{ s.time }}</time><span><h3>{{ s.name }}</h3><small>{{ s.stay }}</small><p>{{ s.reason }}</p><details class="rain-plan"><summary>雨天備案</summary><p>{{ s.rainPlan }}</p></details><small v-if="s.travelMinutes">前一站交通約 {{ s.travelMinutes }} 分鐘 · 示範估算</small></span>
        <img :src="asset(s.photo.src)" :alt="s.photo.alt" width="48" height="48" style="object-fit:cover;border-radius:8px">
      </article>
      <button class="primary" :disabled="dirty || busy" @click="save">儲存這份行程</button>
    </section>
    <AppSheet :model-value="!!panel" :title="panel === 'passes' ? '用票券選一個遊玩範圍' : panel === 'preferences' ? '這一天，想怎麼玩？' : '行程已儲存'" @update:model-value="panel = null">
      <template v-if="panel === 'passes'">
        <p class="pass-intro">日本、韓國、台灣都能選，不受目前旅程限制。相同範圍的不同天數合併在同一張卡。</p>
        <div class="pass-filters">
          <label class="pass-search"><span class="sr-only">搜尋票券名稱或城市</span><input v-model="passQuery" type="search" placeholder="搜尋票券、城市，例如九州、釜山、日月潭" maxlength="100"></label>
          <label><span class="sr-only">票券國家</span><select v-model="passCountry"><option value="">全部國家</option><option v-for="country in passCountries" :key="country.id" :value="country.id">{{ country.name }}</option></select></label>
          <label><span class="sr-only">票券地區</span><select v-model="passRegion"><option value="">全部地區</option><option v-for="region in availableRegions" :key="region" :value="region">{{ region }}</option></select></label>
        </div>
        <p class="pass-count" role="status" aria-live="polite">{{ availablePasses.length }} / {{ travelPasses.length }} 張票券與旅遊卡</p>
        <article v-for="pass in availablePasses" :key="pass.id" class="pass-option">
          <button class="pass-choice" :aria-pressed="selectedPassId === pass.id" @click="selectPass(pass)"><TravelPassArtwork :pass="pass" /><span><em class="pass-kind" :class="{ prepaid: pass.kind === 'stored-value' }">{{ passKindLabels[pass.kind] }}{{ pass.kind === 'stored-value' ? '・需儲值' : '' }}</em><b>{{ pass.name }}</b><small>{{ pass.english }}</small><em>{{ pass.region }}</em><strong>{{ selectedPassId === pass.id ? '目前使用的範圍 ✓' : '套用範圍 →' }}</strong></span></button>
          <p class="pass-coverage">{{ pass.coverage }}</p>
          <details class="pass-conditions"><summary>使用限制與官方範圍</summary><p class="pass-exclusions">{{ pass.exclusions }}</p><a :href="pass.coverageUrl" target="_blank" rel="noopener">查看官方路線／合作景點 ↗</a><small class="pass-credit">圖片：{{ pass.credit }} · 資料查核 {{ pass.checkedAt }}</small></details>
        </article>
        <p v-if="!availablePasses.length" class="pass-empty">沒有符合的票券，試試其他名稱或地區。</p>
        <p class="small-note">地圖輪廓為規劃示意；實際優惠依票券方案、合作景點與指定路線。也可回到地圖自己重畫範圍。</p>
      </template>
      <template v-else-if="panel === 'preferences'">
        <label class="planner-input-label" for="day-preferences">還有什麼想法？（選填）</label>
        <textarea id="day-preferences" v-model="preferences" aria-label="旅行偏好" maxlength="300" placeholder="有四小時，想喝咖啡、逛老街，步調悠閒一點。" />
        <div class="planner-fields"><label for="pace">旅行步調</label><select id="pace" v-model.number="pace"><option :value="2">悠閒 · 最多 2 個景點</option><option :value="3">剛好 · 最多 3 個景點</option><option :value="4">充實 · 最多 4 個景點</option></select></div>
        <label class="memory-choice"><input v-model="useKeywords" type="checkbox">套用吉祥物記住的偏好</label><p v-if="useKeywords && appliedTitles.length" class="small-note">{{ appliedTitles.join('、') }}</p>
        <p v-if="error" class="planner-error" role="alert">{{ error }}</p>
        <p class="small-note">交通時間為估算，費用與票券優惠不會自動計入。</p>
        <button class="primary" :disabled="busy" @click="generate">{{ busy ? '正在安排…' : '安排這一天與雨天備案 →' }}</button>
      </template>
      <template v-else><ChictripMotion motion="happy" :size="112"/><p>已儲存到「{{ activeTrip.title }}」。</p><NuxtLink class="primary" :to="tripHref('/trip')" @click="panel = null">查看我的行程</NuxtLink></template>
    </AppSheet>
  </section>
</template>
<style scoped>
.planner-screen{max-width:1000px;margin:auto}.page-heading h1{font-size:clamp(24px,4vw,34px);line-height:1.4}.page-heading p{max-width:560px;line-height:1.7}.range-choices{display:flex;gap:10px;margin:18px 0 14px}.range-choices button{display:flex;align-items:center;justify-content:center;gap:9px;padding:13px 17px;border:1px solid #cfe4e9;border-radius:13px;background:#fff;color:#38768c;font-size:13px;cursor:pointer;flex:1;min-height:48px}.range-choices button.active{background:#eafaff;border-color:#009fc5;color:#0084a5}.range-choices svg{width:21px;height:21px;fill:none;stroke:currentColor;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round}.selected-pass{display:flex;align-items:center;gap:12px;background:#f3fbff;border:1px solid #d4edf3;border-radius:13px;margin-bottom:12px;padding:10px 12px}.selected-pass :deep(.pass-artwork){width:75px;flex:none}.selected-pass span b{font-size:13px;color:#21647b}.selected-pass small{display:block;font-size:10px;color:#7192a0;margin-top:4px}.selected-pass a{margin-left:auto;font-size:10px;color:#1382a1;text-decoration:none;text-align:right}.pass-range-note{font-size:10px;line-height:1.7;color:#8099a3;margin:9px 3px 0}.planning-next{display:flex;align-items:center;justify-content:space-between;gap:14px;margin:18px 0}.planning-next>span{font-size:12px;color:#708e9a}.planning-next .primary{width:auto;margin:0;min-width:152px;border-radius:13px;background:#009fc5;padding:13px 17px}.planning-next .primary:disabled{background:#edf3f5;color:#93a8b1;box-shadow:none;cursor:default}.empty-selection{margin:0 0 15px}.text-refinement,.plan-notes{font-size:12px;color:#688897;border-top:1px solid #e5edef;padding:13px 0;margin:0 0 12px}.text-refinement summary,.plan-notes summary,.rain-plan summary{cursor:pointer}.text-refinement form{display:flex;align-items:stretch;gap:8px;margin-top:12px}.text-refinement textarea{flex:1;min-height:80px;margin:0;resize:vertical}.text-refinement .secondary{width:auto;padding:10px 15px;margin:0}.text-refinement p{font-size:11px}.planner-results{margin-top:24px}.planner-results h2{font-size:21px}.planner-card h3{margin-top:3px}.rain-plan{margin:10px 0;padding:9px 11px;border-radius:9px;background:#f0f9fb;color:#45798b;font-size:11px}.rain-plan p{font-size:11px;line-height:1.7}.planner-input-label{font-size:13px;font-weight:600;display:block;margin:10px 0 12px}.memory-choice{display:flex;align-items:center;gap:6px;color:#668692;font-size:12px;margin:8px 0}.memory-choice input{accent-color:#009fc5}.pass-filters{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:15px 0 8px;position:sticky;top:0;background:#fff;padding:8px 0;z-index:1}.pass-search{grid-column:1/-1}.pass-filters input,.pass-filters select{width:100%;min-height:42px;border:1px solid #d4e9ed;border-radius:11px;background:#f8fcfd;color:#38768c;font-size:12px;padding:10px 12px;margin:0}.pass-filters input:focus,.pass-filters select:focus{outline:2px solid #009fc5;outline-offset:1px}.pass-count{font-size:11px;color:#7794a0;margin:8px 0}.pass-conditions{color:#74909c;font-size:11px;padding:5px 3px}.pass-conditions summary{cursor:pointer}.pass-conditions .pass-exclusions{margin-top:10px}.pass-choice .pass-kind{display:inline-block;padding:3px 7px;background:#e9f7fc;color:#0089ac;font-size:9px;border-radius:6px;margin-bottom:7px}.pass-choice .pass-kind.prepaid{color:#7a6500;background:#fff4c4}.pass-empty{font-size:13px;text-align:center;color:#73939f;padding:28px 12px}.pass-intro{font-size:13px;color:#638290;line-height:1.7}.pass-option{padding:16px 0;border-bottom:1px solid #e1ecef}.pass-choice{width:100%;display:grid;grid-template-columns:135px 1fr;align-items:center;gap:15px;padding:13px;text-align:left;border:1px solid #d4e9ed;border-radius:16px;background:#f8fdff;color:#276b83;cursor:pointer}.pass-choice[aria-pressed=true]{border-color:#009fc5;background:#effaff}.pass-choice span b{font-size:16px;display:block}.pass-choice small{font-size:10px;display:block;margin:4px 0 9px;color:#809ca7}.pass-choice em{font-size:11px;display:block;font-style:normal}.pass-choice strong{display:block;font-size:11px;color:#0092b5;margin-top:13px}.pass-option p{font-size:12px;line-height:1.8;color:#4d7383;margin:13px 3px 7px}.pass-option p.pass-exclusions{font-size:11px;color:#7b919b;margin-top:0}.pass-option a{font-size:11px;color:#0092b5;display:inline-block;padding:4px 3px;text-decoration:none}.pass-credit{display:block;margin:7px 3px;color:#94a5ad;font-size:9px;line-height:1.7}.range-choices button:focus-visible,.pass-choice:focus-visible{outline:3px solid #ffc500;outline-offset:3px}@media(max-width:600px){.planner-screen{padding-bottom:16px}.range-choices{gap:8px}.range-choices button{font-size:12px;padding:12px 8px}.pass-choice{grid-template-columns:105px 1fr;gap:11px}.selected-pass{gap:9px}.selected-pass a{font-size:9px}.planning-next .primary{min-width:145px;font-size:13px}.planning-next>span{font-size:11px}}
</style>

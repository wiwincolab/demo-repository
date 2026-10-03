<script setup lang="ts">
import {tripItineraries,plannerStorageKey} from '~/data/trips';
import type { Stop } from '~/types/trip';
const asset = useAsset();
const { notify } = useDemo();
const {activeId,activeTrip,tripHref}=useTripContext();
const places = computed<Stop[]>(()=>{
  if(!activeId.value)return [];
  const trip=tripItineraries[activeId.value];
  if(activeId.value==='tokyo')return [trip[0]!.stops[0]!,trip[0]!.stops[1]!,trip[0]!.stops[2]!,trip[4]!.stops[0]!,trip[4]!.stops[2]!];
  if(activeId.value==='kansai')return trip.flatMap(d=>d.stops).filter(s=>[1,2,7,8,9,10,11].includes(s.id));
  return trip.flatMap(d=>d.stops).filter((s,i,all)=>all.findIndex(p=>p.name===s.name)===i).slice(0,5);
});
const ids = ref<number[]>([]), drawing = ref(true), preferences = ref(''), pace = ref(3);
const panel = ref<'preferences' | 'preview' | 'saved' | null>(null);
const busy = ref(false), draft = ref<Stop[]>([]), previous = ref<Stop[]>([]);
const selected = computed(() => places.value.filter(p => ids.value.includes(p.id)));
const regions=computed(()=>activeId.value==='tokyo'?[{name:'淺草河岸範圍',ids:[0,1,2]},{name:'上野文化範圍',ids:[12,14]}]:activeId.value==='kansai'?[{name:'神戶範圍',ids:[1,2]},{name:'京都東山範圍',ids:[7,8]},{name:'奈良範圍',ids:[9]}]:[{name:'河口湖範圍',ids:places.value.map(p=>p.id)}]);
let generationTimer: ReturnType<typeof setTimeout> | undefined;
watch(activeId,()=>{clearTimeout(generationTimer);ids.value=[];draft.value=[];previous.value=[];preferences.value='';panel.value=null;busy.value=false;});
function select(value: number[]) { ids.value = value; if (!value.length)
    notify('這個範圍沒有示範景點，請圈選地圖上的編號或直接點選。'); }
function openPreferences() { if (!ids.value.length) {
    notify('先圈選想去的區域，或直接點選景點。');
    return;
} ; panel.value = 'preferences'; }
function generate() {
    if (!preferences.value.trim()) {
        notify('請說說想怎麼玩，或點選下方偏好。');
        return;
    }
    busy.value = true;
    generationTimer = setTimeout(() => {
        previous.value = draft.value;
        const rain = /下雨|室內/.test(preferences.value);
        const candidates = rain ? selected.value.filter(p => /博物館|美術館|咖啡|晴空塔|商場/.test(p.name)) : selected.value;
        draft.value = (candidates.length ? candidates : selected.value).slice(0, pace.value).map((s, i) => ({ ...s, time: ['10:30', '13:00', '15:30', '17:00'][i]! }));
        busy.value = false;
        panel.value = 'preview';
    }, 500);
}
function save() {
    if(!activeId.value)return;
    try {
        localStorage.setItem(plannerStorageKey(activeId.value), JSON.stringify({ trip:activeId.value,saved: { stops: draft.value, preference: preferences.value } }));
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
    <div class="page-heading">
      <span class="eyebrow">{{ activeTrip.english }} / DAY PLANNER</span>
      <h1>圈出想去的地方，<br>剩下的，聊聊就好。</h1>
      <p>先選範圍，再告訴 AI 想怎麼玩。</p>
    </div>
    <div class="view-bar">
      <h2>{{ activeTrip.location }}</h2>
      <div class="segmented">
        <button :aria-pressed="drawing" @click="drawing = true">圈選</button>
        <button :aria-pressed="!drawing" @click="drawing = false">點景點</button>
      </div>
    </div>
    <CircleMap :key="activeId || ''" :places="places" :selected="ids" :drawing="drawing" @select="select" />
    <div class="planner-controls">
      <button v-for="region in regions" :key="region.name" @click="ids = region.ids">{{ region.name }}</button>
      <button @click="ids = []">清除</button>
    </div>
    <div class="map-stops">
      <button v-for="(place, i) in places" :key="place.id" :aria-pressed="ids.includes(place.id)" @click="ids = ids.includes(place.id) ? ids.filter(n => n !== place.id) : [...ids, place.id]">
        <b>{{ i + 1 }} {{ place.name }}</b>
        <small>{{ place.stay }}</small>
      </button>
    </div>
    <div class="panel">
      <div class="row">
        <span class="muted">{{ ids.length }} 個景點已選取</span>
        <NuxtLink :to="tripHref('/trip')">返回行程</NuxtLink>
      </div>
      <button class="primary" @click="openPreferences">說說你的偏好 ↓</button>
    </div>
    <AppSheet :model-value="!!panel" :title="panel === 'preferences' ? '這一天，想怎麼玩？' : panel === 'preview' ? '先看看你的安排' : '行程已儲存'" @update:model-value="panel = null">
      <template v-if="panel === 'preferences'">
        <p class="muted">跟 AI 說說你的想法</p>
        <textarea v-model="preferences" aria-label="旅行偏好" maxlength="300" placeholder="我喜歡老街，不想早起，每天最多三個景點。" />
        <div class="choice-row">
          <button v-for="hint in ['老街與甜點', '慢慢逛', '下午再出門', '雨天室內']" :key="hint" @click="addPreference(hint)">{{ hint }}</button>
        </div>
        <label for="pace">旅行步調</label>
        <select id="pace" v-model.number="pace">
          <option :value="2">悠閒 · 最多 2 個景點</option>
          <option :value="3">剛好 · 最多 3 個景點</option>
          <option :value="4">充實 · 最多 4 個景點</option>
        </select>
        <p class="small-note">使用選取景點與預設規則模擬，尚未串接 AI。景點營業與交通需另行確認。</p>
        <button class="primary" :disabled="busy" @click="generate">{{ busy ? '正在安排…' : '依照偏好重新安排 →' }}</button>
      </template>
      <template v-else-if="panel === 'preview'">
        <article v-for="s in draft" :key="s.id" class="member-row">
          <time>{{ s.time }}</time>
          <span>
            <b>{{ s.name }}</b>
            <small>{{ s.stay }}</small>
          </span>
          <img :src="asset(s.photo.src)" :alt="s.photo.alt" width="48" height="48" style="object-fit:cover;border-radius:8px">
        </article>
        <p class="small-note">這份草案保存在「{{ activeTrip.title }}」內，確認前不更動原有安排。</p>
        <button class="primary" @click="save">確認並儲存行程</button>
        <button class="secondary" @click="panel = 'preferences'">再微調一下</button>
        <button v-if="previous.length" class="secondary" @click="draft = previous; previous = []">復原上一版</button>
      </template>
      <template v-else>
        <p>下次回到「行程 → 已儲存」即可查看草案。</p>
        <NuxtLink class="primary" :to="tripHref('/trip')" @click="panel = null">回到我的行程</NuxtLink>
      </template>
    </AppSheet>
  </section>
</template>


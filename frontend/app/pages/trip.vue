<script setup lang="ts">
import { kansaiReference } from '~/data/kansai';
import { dayColors } from '~/utils/map';
import type { Stop } from '~/types/trip';
import { tripItineraries, tripAlternatives, plannerStorageKey } from '~/data/trips';
const { days, members, group, adjusted, applyAdjustment, undoAdjustment, notify, saved: sharedTrip } = useDemo();
const { activeId,activeTrip,tripHref }=useTripContext();
const asset = useAsset();
const day = ref(0), view = ref<'list' | 'map'>('list'), selected = ref(0);
const groupOpen = ref(false), groupMode = ref<'invite' | 'deal'>('deal');
const sheet = ref<'info' | 'adjust' | 'compare' | 'done' | 'saved' | null>(null);
const stop = ref<Stop | null>(null);
const adjustText = ref(''), lockPlan = ref(true);
const shown = computed(() => day.value < 0 ? days.value.flatMap(d => d.stops) : days.value[day.value]?.stops || []);
const activeStop = computed(() => shown.value.find(s => s.id === selected.value) || shown.value[0]!);
const saved = ref<{
    time: string;
    name: string;
}[]>([]);
const title = computed(() => ({ info: activeTrip.value?.title || '旅程資訊', adjust: 'AI 局部微調', compare: '只換一站，其他照舊', done: '已套用局部替換', saved: '圈選排程 · 已儲存' }[sheet.value || 'info']));
const originalStop=computed(()=>activeId.value?tripItineraries[activeId.value][0]?.stops[1]:undefined);
const alternative=computed(()=>activeId.value?tripAlternatives[activeId.value]:undefined);
const keptStops=computed(()=>days.value[0]?.stops.filter(s=>s.id!==originalStop.value?.id).map(s=>s.name).join('與')||'其他景點');
function dayLabel(i:number){const date=new Date((activeTrip.value?.startDate||'2026-01-01')+'T12:00:00');date.setDate(date.getDate()+i);return `${date.getMonth()+1}/${date.getDate()}`;}
function chooseDay(n: number) { day.value = n; selected.value = days.value[Math.max(0,n)]?.stops[0]?.id||0; }
watch(activeId,()=>{chooseDay(0);sheet.value=null;stop.value=null;groupOpen.value=false;adjustText.value='';saved.value=[];});
function openGroup(mode: 'invite' | 'deal') { groupMode.value = mode; groupOpen.value = true; }
function preview() {
    if (!lockPlan.value)
        return notify('此示範請保留鎖定安排，再比較局部變更');
    if (!adjustText.value.trim())
        return notify('請先輸入改程需求');
    if (!/下雨|雨天|室內/.test(adjustText.value))
        return notify('這組示範支援雨天室內替換，請加入「下雨」或「室內」');
    sheet.value = 'compare';
}
function apply() { applyAdjustment(); chooseDay(0); selected.value = 1; sheet.value = 'done'; }
function savedPlan() {
    if(!activeId.value)return;
    try {
        const stored=localStorage.getItem(plannerStorageKey(activeId.value))||(activeId.value==='tokyo'?localStorage.getItem('chictrip-circle-planner-v1'):null);
        saved.value = JSON.parse(stored || 'null')?.saved?.stops || [];
    }
    catch {
        saved.value = [];
    }
    sheet.value = 'saved';
}
</script>
<template>
  <section v-if="activeTrip && days.length" class="screen active" aria-labelledby="trip-title">
    <div class="trip-cover">
      <img :src="asset(activeTrip.cover)" :alt="activeTrip.location+'・旅行封面'" :style="activeId==='fuji'?{objectPosition:'50% 10%'}:{}">
      <div class="cover-copy">
        <span>{{ activeTrip.statusLabel }} · {{ activeTrip.location }}</span>
        <h1 id="trip-title">{{ sharedTrip?.title || activeTrip.title }}</h1>
        <p>{{ sharedTrip ? '來自' + sharedTrip.from + '的分享 · 只放了朋友公開的景點' : activeTrip.english + ' ' + activeTrip.dayCount + ' Days' }}</p>
      </div>
      <button class="cover-button" aria-label="查看旅程資訊" @click="sheet = 'info'">•••</button>
    </div>
    <div class="trip-summary">
      <div>
        <strong>{{ activeTrip.dateLabel }}</strong>
        <p>{{ activeTrip.dayCount }} 天 {{ activeTrip.dayCount - 1 }} 夜 · {{ days.flatMap(d=>d.stops).length }} 個停留點</p>
      </div>
      <button class="invite-button" :aria-label="members.length + ' 人共編，邀請旅伴'" @click="openGroup('invite')">
        <span class="avatars">
          <span v-for="m in members.slice(0, 4)" :key="m.name" class="avatar">{{ m.name[0] }}</span>
        </span>
        <span>邀請旅伴 ＋</span>
      </button>
    </div>
    <button class="deal-banner" aria-haspopup="dialog" @click="openGroup('deal')">
      <span class="sim-mark" aria-hidden="true">e</span>
      <span>
        <strong>旅伴一起買，上網一起省</strong>
        <small>{{ group.count >= 4 ? '已解鎖旅伴價，每人現省 NT$20' : group.count + ' 人已購買 · 4 人成團，每人現省 NT$20' }}</small>
      </span>
      <span aria-hidden="true">›</span>
    </button>
    <div class="trip-tools">
      <NuxtLink class="ai-link" :to="tripHref('/planner')">✦ 圈選 AI 排程</NuxtLink>
      <button @click="sheet = 'adjust'">AI 微調</button>
      <button @click="savedPlan">已儲存</button>
    </div>
    <div class="day-bar" aria-label="選擇旅遊日期">
      <button :aria-pressed="day === -1" @click="chooseDay(-1)"><strong>全程</strong>{{ activeTrip.dayCount }} 天</button>
      <button v-for="(d, i) in days" :key="d.area" :style="{ '--day': dayColors[i] }" :aria-pressed="day === i" @click="chooseDay(i)"><strong>第 {{ i + 1 }} 天</strong><span class="day-dot" />{{ dayLabel(i) }}</button>
    </div>
    <div class="view-bar">
      <h2>{{ day < 0 ? activeTrip.location+'全程' : days[day]?.area }}</h2>
      <div class="segmented" aria-label="行程顯示方式">
        <button :aria-pressed="view === 'list'" @click="view = 'list'">清單</button>
        <button :aria-pressed="view === 'map'" @click="view = 'map'">地圖</button>
      </div>
    </div>
    <div v-if="day >= 0 && days[day]?.transport" class="day-context">
      <p>{{ days[day]?.transport }}</p>
      <span v-if="days[day]?.lodging">今晚住 {{ days[day]?.lodging }}</span>
    </div>
    <div v-if="view === 'list'" class="stop-list">
      <article v-for="(s, i) in shown" :key="s.id" class="stop-row" :style="{ '--day': dayColors[s.day] }">
        <div class="stop-track">
          <span class="stop-number">{{ i + 1 }}</span>
        </div>
        <button class="stop-card" @click="stop = s">
          <div>
            <time>第 {{ s.day + 1 }} 天 · {{ s.time }}</time>
            <h3>{{ s.name }}</h3>
            <p>{{ s.note }}</p>
            <small v-if="s.transit" class="stop-transit">{{ s.transit }}</small>
            <small>{{ s.stay }} · 看詳情 ›</small>
          </div>
          <img :src="asset(s.photo.src)" :alt="s.photo.alt" loading="lazy" :style="{ objectPosition: s.photo.objectPosition }">
        </button>
      </article>
    </div>
    <template v-else>
      <RouteMap :key="activeId || ''" :stops="shown" :selected="selected" :overview="day < 0" @select="selected = $event" @day="chooseDay" />
      <div class="map-stops">
        <button v-for="(s, i) in shown" :key="s.id" :aria-pressed="s.id === selected" @click="day < 0 ? chooseDay(s.day) : (selected = s.id)">
          <b>{{ i + 1 }} {{ s.name }}</b>
          <small>第 {{ s.day + 1 }} 天 · {{ s.time }}</small>
        </button>
      </div>
      <article v-if="day >= 0" class="spot-info">
        <StopDetails :stop="activeStop" />
      </article>
      <p v-else class="page-note">各色實線為單日行程，虛線為日間移動。選一天，看每站照片與流量。</p>
    </template>
    <p class="page-note">{{ activeId === 'kansai' ? '路線參考喜鴻五日行程；日期、時刻與車程為示範估算。' : '示範行程。' }} 流量依使用行為估算。</p>
    <GroupSheet v-model="groupOpen" :initial-mode="groupMode" />
    <AppSheet :model-value="!!stop" :title="stop?.name || ''" @update:model-value="stop = null">
      <StopDetails v-if="stop" :stop="stop" />
    </AppSheet>
    <AppSheet :model-value="!!sheet" :title="title" @update:model-value="sheet = null">
      <template v-if="sheet === 'info'">
        <p>{{ activeTrip.dateLabel }} · 示範旅行日期</p>
        <p>{{ days.map(d=>d.area).join(' → ') }}</p>
        <template v-if="activeId === 'kansai'"><p class="small-note">{{ kansaiReference.note }}</p><a :href="kansaiReference.url" target="_blank" rel="noopener">路線參考：{{ kansaiReference.name }} ↗</a></template>
        <p v-else class="small-note">景點資訊與停留時間是展示資料，出發前需另行確認。</p>
      </template>
      <template v-if="sheet === 'adjust'">
        <p>示範：把第 1 天的{{ originalStop?.name }}換成雨天也能去的安排。</p>
        <label><input v-model="lockPlan" type="checkbox"> 保留{{ keptStops }}，不動已確定的安排</label>
        <textarea v-model="adjustText" aria-label="改程需求" maxlength="200" :placeholder="'例如：下雨了，將'+originalStop?.name+'改成室內景點。'" />
        <p class="small-note">這裡示範一組預設替換；尚未串接即時 AI。</p>
        <button class="primary" @click="preview">看調整前後</button>
        <button v-if="adjusted" class="secondary" @click="undoAdjustment(); sheet = null">復原這次調整</button>
      </template>
      <template v-if="sheet === 'compare'">
        <div class="change-pair">
          <div>
            <small>原本</small>
            <strong>{{ originalStop?.time }} {{ originalStop?.name }}</strong>
          </div>
          <div>
            <small>替換草案</small>
            <strong>{{ alternative?.time }} {{ alternative?.name }}</strong>
          </div>
        </div>
        <p>保留{{ keptStops }}。實際交通與營業時間待確認。</p>
        <button class="primary" @click="apply">套用示範替換</button>
        <button class="secondary" @click="sheet = null">保留原行程</button>
      </template>
      <template v-if="sheet === 'done'">
        <p>只替換第 1 天的{{ originalStop?.name }}，其餘安排保留。</p>
        <button class="secondary" @click="undoAdjustment(); sheet = null">復原這次調整</button>
      </template>
      <template v-if="sheet === 'saved'">
        <p>{{ saved.length ? '來自你在圈選排程頁儲存的草案。' : '還沒有儲存圈選行程。先圈選想去的區域，輸入偏好後預覽並保存。' }}</p>
        <div v-for="s in saved" :key="s.name" class="member-row">
          <time>{{ s.time }}</time>
          <strong>{{ s.name }}</strong>
        </div>
        <NuxtLink class="primary" :to="tripHref('/planner')" @click="sheet = null">{{ saved.length ? '繼續編輯' : '開始圈選排程' }}</NuxtLink>
      </template>
    </AppSheet>
  </section>
</template>


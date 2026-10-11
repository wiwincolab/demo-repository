<script setup lang="ts">
import { pointsProducts } from '~/utils/points';
import { kansaiReference } from '~/data/kansai';
import { dayColors } from '~/utils/map';
import { directionsUrl } from '~/utils/directions';
import type { Stop } from '~/types/trip';
const { days, members, saved: sharedTrip } = useDemo();
const { activeId,activeTrip,tripHref }=useTripContext();
const asset = useAsset();
const route = useRoute();
const {wallet:pointsWallet}=usePointsWallet();
const tripPointOrders=computed(()=>pointsWallet.value.orders.filter(o=>o.tripId===activeId.value));
function requestedDay() { const value = Number(route.query.day); return Number.isInteger(value) && value >= 0 && value < days.value.length ? value : 0; }
const day = ref(requestedDay()), view = ref<'list' | 'map'>('list'), selected = ref(0);
const dayBar = ref<HTMLElement | null>(null);
const dayContent = ref<HTMLElement | null>(null);
const dayIndicator = ref({ transform: 'translateX(0px)', width: '0px' });
let dayResizeObserver: ResizeObserver | undefined;
let dayAnimation: Animation | undefined;
function positionDayIndicator() {
    const bar = dayBar.value;
    const button = bar?.querySelector<HTMLElement>('button[aria-pressed="true"]');
    if (!bar || !button) return;
    const transform = `translateX(${button.offsetLeft + 12}px)`;
    const width = `${Math.max(0, button.offsetWidth - 24)}px`;
    if (dayIndicator.value.transform !== transform || dayIndicator.value.width !== width)
        dayIndicator.value = { transform, width };
}
onMounted(() => {
    positionDayIndicator();
    dayResizeObserver = new ResizeObserver(positionDayIndicator);
    if (dayBar.value) dayResizeObserver.observe(dayBar.value);
});
onUpdated(positionDayIndicator);
onBeforeUnmount(() => { dayResizeObserver?.disconnect(); dayAnimation?.cancel(); });
watch(day, (next, previous) => {
    positionDayIndicator();
    dayAnimation?.cancel();
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const bar = dayBar.value;
    const button = bar?.querySelector<HTMLElement>('button[aria-pressed="true"]');
    if (bar && button) {
        const left = button.offsetLeft;
        if (left < bar.scrollLeft || left + button.offsetWidth > bar.scrollLeft + bar.clientWidth)
            bar.scrollTo({ left: Math.max(0, left - (bar.clientWidth - button.offsetWidth) / 2), behavior: reducedMotion ? 'instant' : 'smooth' });
    }
    if (!reducedMotion && dayContent.value) {
        dayAnimation = dayContent.value.animate([
            { opacity: 0, transform: `translateX(${next > previous ? 18 : -18}px)` },
            { opacity: 1, transform: 'translateX(0)' }
        ], { duration: 280, easing: 'cubic-bezier(.22,.75,.25,1)' });
    }
}, { flush: 'post' });
const groupOpen = ref(false);
const sheet = ref<'info' | null>(null);
const stop = ref<Stop | null>(null);
const shown = computed(() => day.value < 0 ? days.value.flatMap(d => d.stops) : days.value[day.value]?.stops || []);
const activeStop = computed(() => shown.value.find(s => s.id === selected.value) || shown.value[0]!);
const title = computed(() => activeTrip.value?.title || '旅程資訊');
function dayLabel(i:number){if(!activeTrip.value?.startDate)return '日期未定';const date=new Date((activeTrip.value?.startDate||'2026-01-01')+'T12:00:00');date.setDate(date.getDate()+i);return `${date.getMonth()+1}/${date.getDate()}`;}
function chooseDay(n: number) { day.value = n; selected.value = days.value[Math.max(0,n)]?.stops[0]?.id||0; }
watch(activeId,()=>{chooseDay(requestedDay());sheet.value=null;stop.value=null;groupOpen.value=false;});
watch(()=>route.query.day,()=>chooseDay(requestedDay()));
</script>
<template>
  <section v-if="activeTrip && days.length" class="screen active trip-motion-page" aria-labelledby="trip-title">
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
        <div class="trip-date-companion"><PageMascot :key="activeId || 'trip'" /><strong>{{ activeTrip.dateLabel }}</strong></div>
        <p>{{ activeTrip.dayCount }} 天 {{ activeTrip.dayCount - 1 }} 夜 · {{ days.flatMap(d=>d.stops).length }} 個停留點</p>
      </div>
      <button class="invite-button" :aria-label="members.length + ' 人共編，邀請旅伴'" @click="groupOpen = true">
        <span class="avatars">
          <span v-for="m in members.slice(0, 4)" :key="m.name" class="avatar">{{ m.name[0] }}</span>
        </span>
        <span>邀請旅伴 ＋</span>
      </button>
    </div>
    <div class="trip-tools"><NuxtLink class="ai-link" :to="tripHref('/planner',{day:Math.max(0,day)})">✦ AI 排行程 <span>規劃與微調 →</span></NuxtLink></div>
    <div ref="dayBar" class="day-bar" role="group" aria-label="選擇旅遊日期">
      <button :aria-pressed="day === -1" @click="chooseDay(-1)"><strong>全程</strong>{{ activeTrip.dayCount }} 天</button>
      <button v-for="(d, i) in days" :key="d.area" :style="{ '--day': dayColors[i] }" :aria-pressed="day === i" @click="chooseDay(i)"><strong>第 {{ i + 1 }} 天</strong><span class="day-dot" />{{ dayLabel(i) }}</button>
      <span class="day-sliding-indicator" :style="dayIndicator" aria-hidden="true" />
    </div>
    <div ref="dayContent" class="day-content">
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
    <Transition name="itinerary-view" mode="out-in">
    <div :key="view" class="itinerary-view">
    <div v-if="view === 'list'" :key="`${activeId}-${day}`" class="stop-list">
      <article v-for="(s, i) in shown" :key="s.id" class="stop-row" :style="{ '--day': dayColors[s.day], '--stop-delay': `${Math.min(i, 6) * 45}ms` }">
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
        <ServiceRecommendations :stop="s" :next="shown[i + 1]?.day===s.day ? shown[i + 1] : undefined" />
        <a v-if="shown[i + 1]" class="stop-route-link" :href="directionsUrl(s, shown[i + 1]!)" target="_blank" rel="noopener noreferrer">{{ s.day !== shown[i + 1]!.day ? '隔日移動' : '前往下一站' }} · {{ shown[i + 1]!.name }} <span>查看交通路線 ↗</span></a>
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
    </div>
    </Transition>
    </div>
    <p class="page-note">{{ activeId === 'kansai' ? '路線參考喜鴻五日行程；日期、時刻與車程為示範估算。' : '示範行程。' }} 流量依使用行為估算。</p>
    <section class="trip-service-store"><div><h3>和泰旅行商店</h3><p>交通、上網、體驗與出發準備，先兌換再讓 AI 安排。</p></div><NuxtLink :to="tripHref('/points')">逛商店 →</NuxtLink><details v-if="tripPointOrders.length"><summary>這趟旅行已兌換 {{tripPointOrders.length}} 項服務</summary><p v-for="o in tripPointOrders" :key="o.id">{{pointsProducts.find(p=>p.id===o.productId)?.name}} · 示範服務券</p></details></section>
    <GroupSheet v-model="groupOpen" />
    <AppSheet :model-value="!!stop" :title="stop?.name || ''" @update:model-value="stop = null">
      <StopDetails v-if="stop" :stop="stop" />
    </AppSheet>
    <AppSheet :model-value="!!sheet" :title="title" @update:model-value="sheet = null">
      <template v-if="sheet === 'info'">
        <p>{{ activeTrip.dateLabel }}<template v-if="activeTrip.startDate"> · 示範旅行日期</template></p><p v-if="activeTrip.coverSource" class="small-note">封面來源：<a :href="activeTrip.coverSource" target="_blank" rel="noopener noreferrer">{{ activeTrip.coverCredit }}行程頁 ↗</a></p>
        <p>{{ days.map(d=>d.area).join(' → ') }}</p>
        <template v-if="activeTrip.reference"><p class="small-note">{{ activeTrip.reference.note }}</p><a :href="activeTrip.reference.url" target="_blank" rel="noopener">路線參考：{{ activeTrip.reference.name }} ↗</a></template>
        <template v-if="activeId === 'kansai'"><p class="small-note">{{ kansaiReference.note }}</p><a :href="kansaiReference.url" target="_blank" rel="noopener">路線參考：{{ kansaiReference.name }} ↗</a></template>
        <p v-else class="small-note">景點資訊與停留時間是展示資料，出發前需另行確認。</p>
      </template>
    </AppSheet>
  </section>
</template>


<style scoped>
.trip-date-companion{display:flex;align-items:center;gap:8px}
.change-photo{display:block;width:100%;height:130px;object-fit:cover;border-radius:9px;margin:8px 0}
.change-photo-credit{font-size:9px;margin-top:7px;line-height:1.6}
.change-photo-credit a{color:inherit}
.day-bar button[aria-pressed=true]::after { display: none; }
.day-sliding-indicator { position: absolute; bottom: 0; left: 0; height: 3px; border-radius: 3px; background: var(--blue); pointer-events: none; }
/* Short, one-shot motion keeps the itinerary easy to scan. */
@keyframes trip-arrive {
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes trip-cover-reveal {
  from { transform: scale(1.045); }
  to { transform: scale(1); }
}
@media (prefers-reduced-motion: no-preference) {
  .trip-cover { overflow: hidden; }
  .trip-cover > img { animation: trip-cover-reveal 900ms cubic-bezier(.2,.7,.2,1) both; }
  .cover-copy > * { animation: trip-arrive 520ms ease-out both; }
  .cover-copy h1 { animation-delay: 70ms; }
  .cover-copy p { animation-delay: 140ms; }
  .trip-summary { animation: trip-arrive 480ms 100ms ease-out both; }
  .trip-tools { animation: trip-arrive 480ms 160ms ease-out both; }
  .day-sliding-indicator { transition: transform 280ms cubic-bezier(.22,.75,.25,1), width 280ms cubic-bezier(.22,.75,.25,1); }
  .stop-row { animation: trip-arrive 420ms var(--stop-delay, 0ms) cubic-bezier(.2,.7,.2,1) backwards; }
  .day-bar button, .segmented button { transition: background-color 200ms, color 200ms, box-shadow 200ms, transform 200ms; }
  .day-bar button:active, .segmented button:active { transform: scale(.96); }
  .stop-card { transition: transform 220ms, box-shadow 220ms; }
  .stop-card:active { transform: scale(.99); }
  .itinerary-view-enter-active, .itinerary-view-leave-active { transition: opacity 160ms ease, transform 160ms ease; }
  .itinerary-view-enter-from { opacity: 0; transform: translateY(8px); }
  .itinerary-view-leave-to { opacity: 0; transform: translateY(-4px); }
}
@media (hover: hover) and (prefers-reduced-motion: no-preference) {
  .stop-card:hover { transform: translateY(-2px); box-shadow: 0 8px 22px #183e4c12; }
}
</style>

<style scoped>
.stop-route-link { grid-column:2; display:flex; flex-wrap:wrap; gap:6px 12px; padding:10px 12px; margin:4px 0 8px; border-radius:9px; color:#286e80; background:#edf5f5; font-size:12px; line-height:1.6; }
.stop-route-link span { margin-left:auto; font-weight:600; }
</style>

<style scoped>
.trip-tools .ai-link{display:flex;align-items:center;justify-content:space-between;padding:16px;border-radius:14px;font-size:15px}.trip-tools .ai-link span{font-size:11px;font-weight:400}.trip-service-store{margin:20px 0;padding:18px;border-radius:16px;background:#eef8fb;display:flex;align-items:center;flex-wrap:wrap;gap:12px}.trip-service-store>div{flex:1;min-width:180px}.trip-service-store h3{margin:0;font-size:17px}.trip-service-store p{font-size:12px;color:#6a8998;line-height:1.7;margin:7px 0 0}.trip-service-store>a{min-height:44px;display:flex;align-items:center;text-decoration:none;color:#008bad;font-size:13px}.trip-service-store details{width:100%;font-size:12px}
</style>

<script setup lang="ts">
import { tripSummaries, type TripId } from '~/data/trips';
import '~/assets/css/trips.css';
const route = useRoute();
const { toast, reset } = useDemo();
const { activeId, activeTrip, ready, selectTrip, tripHref } = useTripContext();
const help = ref(false);
const switcher = ref(false);
const asset = useAsset();
const path = computed(() => route.path.replace(/\/$/, '') || '/');
const isScoped = computed(() => /^\/(trip|esim|planner|memory)(\/|$)/.test(path.value));
const isTripList = computed(() => path.value === '/trips');
const isAtlasPlaza = computed(() => path.value === '/atlas' && !['cities', 'journey'].includes(String(route.query.view)) && !route.query.journey && !route.query.scope);
const tabs = [{ to: '/trip', name: '行程', icon: 'trip' }, { to: '/esim', name: 'eSIM', icon: 'sim' }, { to: '/memory', name: 'AI 創作', icon: 'memory' }, { to: '/atlas', name: '回憶地圖', icon: 'atlas' }];
function tabLink(to: string) {
  if (to === '/atlas') return to;
  return activeId.value ? tripHref(to) : { path: '/trips', query: { next: to } };
}
async function changeTrip(id: TripId) {
  switcher.value = false;
  const destination = path.value.startsWith('/memory/usj') && id !== 'kansai' ? '/memory' : path.value;
  await navigateTo({ path: destination, query: { ...route.query, trip: id } });
  selectTrip(id);
}
</script>
<template>
  <div class="app-shell" :class="{ 'creation-shell': path === '/memory', 'journey-shell': path.startsWith('/memory/usj') || path.startsWith('/atlas'), 'trips-shell': isTripList, 'plaza-shell': isAtlasPlaza }">
    <header class="app-bar">
      <NuxtLink class="wordmark" to="/trips" aria-label="去趣，我的行程">去趣 <i>chicTrip</i><span aria-hidden="true" /></NuxtLink>
      <span class="prototype">競賽概念原型</span>
      <button class="icon-button" aria-label="查看原型說明" @click="help = true">?</button>
    </header>
    <div v-if="isScoped && ready && activeTrip" class="trip-context">
      <NuxtLink to="/trips" class="trip-context-back" aria-label="返回我的行程">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m14 6-6 6 6 6" /></svg>
      </NuxtLink>
      <div class="trip-context-name"><span>{{ activeTrip.dateLabel }}</span><strong>{{ activeTrip.title }}</strong></div>
      <button class="trip-context-change" @click="switcher = true">切換行程<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m5 8 5 5 5-5" /></svg></button>
    </div>
    <main id="main">
      <!-- NuxtPage must stay mounted so its completed navigation can update useRoute. -->
      <div v-show="!isScoped || (ready && activeTrip)" class="route-content"><slot /></div>
      <div v-if="isScoped && ready && !activeTrip" class="trip-selection-gate">
        <span class="trip-gate-symbol" aria-hidden="true"><svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5"><path d="m4 7 8-3 8 3 8-3v21l-8 3-8-3-8 3V7Z"/><path d="M12 4v21M20 7v21"/></svg></span>
        <h1>先選一趟旅行</h1>
        <p>照片、同行朋友與創作作品，<br>都會收在你選擇的行程裡。</p>
        <NuxtLink class="primary" :to="{ path: '/trips', query: { next: route.fullPath } }">選擇我的行程</NuxtLink>
      </div>
      <div v-else-if="isScoped && !ready" class="trip-context-loading" role="status">正在開啟行程…</div>
    </main>
    <nav v-if="!isTripList" class="bottom-nav" aria-label="主要功能">
      <NuxtLink v-for="tab in tabs" :key="tab.to" :to="tabLink(tab.to)" :aria-current="path === tab.to || (tab.to === '/memory' && path.startsWith('/memory/')) ? 'page' : undefined"><span class="nav-icon" :class="'icon-' + tab.icon" aria-hidden="true" />{{ tab.name }}</NuxtLink>
    </nav>
  </div>
  <AppSheet v-model="switcher" title="切換行程">
    <p class="trip-switch-hint">{{ path.startsWith('/memory') ? '查看另一趟旅行的照片與作品。' : '切換後，會開啟這趟旅行的內容。' }}</p>
    <div class="trip-switch-list">
      <button v-for="trip in tripSummaries" :key="trip.id" class="trip-switch-option" :class="{ selected: activeId === trip.id }" :aria-pressed="activeId === trip.id" @click="changeTrip(trip.id)">
        <img :src="asset(trip.cover)" alt="" />
        <span><strong>{{ trip.title }}</strong><small>{{ trip.dateLabel }} · {{ trip.dayCount }} 天</small></span>
        <svg v-if="activeId === trip.id" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m5 12 4 4L19 6" /></svg>
        <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m9 6 6 6-6 6" /></svg>
      </button>
    </div>
  </AppSheet>
  <AppSheet v-model="help" title="關於這個手機原型">
    <p>依去趣公開介面，參考藍白配色、照片卡片與行程操作製作的競賽概念原型。</p>
    <p>AI、組隊與回憶功能均為提案模擬；不會付款、邀請或發文。</p>
    <p><a :href="asset('assets/PHOTO-LICENSE.md')" target="_blank">景點照片來源與授權 ↗</a></p>
    <p><a :href="asset('assets/MAP-LICENSE.md')" target="_blank">地圖資料與授權 ↗</a></p>
    <button v-if="activeId" class="secondary" @click="reset(); help = false">重設這趟旅行的組隊模擬</button>
  </AppSheet>
  <div class="toast" :class="{ show: toast }" role="status" aria-live="polite">{{ toast }}</div>
</template>
<style>.app-shell.journey-shell{max-width:1160px}.journey-shell .app-bar{padding-inline:24px}@media(max-width:600px){.journey-shell .app-bar{padding-inline:18px}}</style>


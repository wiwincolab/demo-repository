<script setup lang="ts">
import { tripSummaries, type TripId } from '~/data/trips';
const route = useRoute();
const asset = useAsset();
const { activeId, ready, selectTrip } = useTripContext();
const nextPath = computed(() => typeof route.query.next === 'string' && /^\/(trip|esim|planner|memory|collection)(\/|\?|$)/.test(route.query.next) ? route.query.next : '/trip');
const actionName = computed(() => nextPath.value.startsWith('/collection') ? '翻開這趟收集冊' : nextPath.value.startsWith('/memory') ? '開啟這趟 AI 創作' : nextPath.value.startsWith('/esim') ? '查看這趟上網準備' : '開啟行程');
function openTrip(id: TripId) {
  selectTrip(id);
  const url = new URL(nextPath.value, 'https://chictrip.local');
  const destination = url.pathname.startsWith('/memory/usj') && id !== 'kansai' ? '/memory' : url.pathname;
  const query = Object.fromEntries(url.searchParams);
  navigateTo({ path: destination, query: { ...query, trip: id } });
}
useHead({ title: '我的行程 · 去趣 chicTrip' });
</script>
<template>
  <section class="trips-page">
    <div class="trips-heading"><div><p class="trips-eyebrow">MY JOURNEYS</p><h1>我的行程</h1><p>{{ route.query.next ? '選擇一趟旅行，繼續剛才的操作。' : '從出發前的安排，到回家後的收藏。' }}</p></div><NuxtLink to="/atlas" class="trips-atlas-link"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2V5Z"/><path d="M9 3v16M15 5v16"/></svg>回憶地圖<span aria-hidden="true">↗</span></NuxtLink></div>
    <div class="trips-list">
      <button v-for="trip in tripSummaries" :key="trip.id" class="trip-choice" :data-trip="trip.id" :disabled="!ready" :class="{ 'trip-choice-current': activeId === trip.id }" @click="openTrip(trip.id)">
        <div class="trip-choice-image"><img :src="asset(trip.cover)" :alt="trip.location" /><span class="trip-choice-status" :class="{ upcoming: trip.status === 'upcoming' }">{{ trip.statusLabel }}</span><span class="trip-choice-days">{{ trip.dayCount }} 天</span></div>
        <div class="trip-choice-body"><span class="trip-choice-date">{{ trip.dateLabel }}</span><h2>{{ trip.title }}</h2><p>{{ trip.summary }}</p><div class="trip-choice-company"><span class="trip-mini-avatars" aria-hidden="true"><i v-for="(friend, i) in trip.companions.slice(0, 3)" :key="friend" :style="{ '--avatar-order': i }">{{ friend.slice(0, 1) }}</i></span><span>{{ trip.companions.join('、') }}</span></div><div class="trip-choice-action"><span>{{ actionName }}</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6" /></svg></div></div>
      </button>
    </div>
    <p class="trips-footnote">先選行程，再查看這趟的照片、創作與同行朋友。回憶地圖則收藏所有旅程。</p>
  </section>
</template>

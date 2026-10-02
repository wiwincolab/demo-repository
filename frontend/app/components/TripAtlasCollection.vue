<script setup lang="ts">
import { tripSummaries, isTripId, type TripId } from '~/data/trips';
import { styleById, type CreationWork } from '~/data/creation';
import '~/assets/css/creation.css';
import '~/assets/css/trip-atlas.css';
const route = useRoute(), router = useRouter(), asset = useAsset();
const { allWorks } = useCreation();
const { state } = useJourneyCollection();
const { selectTrip } = useTripContext();
const selectedId = computed(() => isTripId(route.query.journey) ? route.query.journey : null);
const selectedTrip = computed(() => tripSummaries.find(trip => trip.id === selectedId.value));
const works = computed(() => allWorks.value.filter(work => work.tripId === selectedId.value));
const detail = ref<CreationWork | null>(null), detailOpen = ref(false), original = ref(false), newWorksOpen = ref(false);
const scope = computed(() => route.query.scope === 'period' ? 'period' : 'trip');
const period = computed(() => route.query.period === 'half' ? 'half' : 'year');
const periodTrips = computed(() => tripSummaries.filter(trip => trip.status === 'completed' && trip.startDate.startsWith('2026-') && (period.value === 'year' || Number(trip.startDate.slice(5, 7)) <= 6)).sort((a, b) => a.startDate.localeCompare(b.startDate)));
const recapOpen = ref(false), recapTripIds = ref<TripId[]>([]), recapTitle = ref('');
function setScope(value: 'trip' | 'period') {
  const { scope: previous, period: previousPeriod, ...query } = route.query;
  router.replace({ query: { ...query, ...(value === 'period' ? { scope: 'period', period: 'year' } : {}) } });
}
function setPeriod(value: 'year' | 'half') { router.replace({ query: { ...route.query, scope: 'period', period: value } }); }
function startRecap(id?: TripId) {
  recapTripIds.value = id ? [id] : periodTrips.value.map(trip => trip.id);
  recapTitle.value = id ? (tripSummaries.find(trip => trip.id === id)?.title || '旅行回顧') : period.value === 'half' ? '2026 上半年回顧' : '2026 旅行回顧';
  recapOpen.value = true;
}
function count(id: TripId) { return allWorks.value.filter(work => work.tripId === id).length + (id === 'kansai' ? 3 + Number(state.value.usjSaved) + Number(state.value.friendAccepted) : 0); }
function browse(id: TripId | null) {
  const { stop, journey, scope: previousScope, period: previousPeriod, ...query } = route.query;
  router.replace({ query: { ...query, ...(id ? { journey: id } : {}) } });
}
function open(work: CreationWork) { detail.value = work; original.value = false; detailOpen.value = true; }
function create(id: TripId) { selectTrip(id); navigateTo({ path: '/memory', query: { trip: id } }); }
watch(selectedId, () => { detailOpen.value = false; newWorksOpen.value = false; });
</script>
<template>
  <div class="trip-atlas" :class="{ 'is-period': scope === 'period' }">
    <header v-if="!selectedTrip || scope === 'period'" class="trip-atlas-heading"><span class="journey-eyebrow">MEMORY ATLAS</span><h1>旅行會結束，收藏會留下。</h1><p>重走一趟旅行，也把不同日子的回憶串起來。</p></header>
    <div class="trip-atlas-scope" role="group" aria-label="回顧範圍"><button :aria-pressed="scope === 'trip'" @click="setScope('trip')">依旅程</button><button :aria-pressed="scope === 'period'" @click="setScope('period')">依期間</button></div>
    <nav v-if="scope === 'trip'" class="trip-atlas-filters" aria-label="依旅程瀏覽收藏">
      <button :aria-pressed="!selectedId" @click="browse(null)">所有旅程</button>
      <button v-for="trip in tripSummaries" :key="trip.id" :aria-pressed="selectedId === trip.id" @click="browse(trip.id)">{{ trip.location }}<span>{{ trip.startDate.slice(0, 7).replace('-', '.') }}</span></button>
    </nav>
    <section v-if="scope === 'period'" class="trip-atlas-period">
      <div class="trip-atlas-period-options" role="group" aria-label="選擇回顧期間"><button :aria-pressed="period === 'year'" @click="setPeriod('year')">今年 <span>2026</span></button><button :aria-pressed="period === 'half'" @click="setPeriod('half')">上半年 <span>1 — 6 月</span></button></div>
      <article class="trip-atlas-recap-card">
        <div class="trip-atlas-recap-photos" aria-hidden="true"><div v-for="trip in periodTrips" :key="trip.id" :data-trip="trip.id"><img :src="asset(trip.cover)" alt=""/><span>{{ trip.location }}</span></div></div>
        <div class="trip-atlas-recap-copy"><span class="journey-eyebrow">{{ period === 'half' ? 'JANUARY — JUNE 2026' : 'YOUR 2026, SO FAR' }}</span><h2>{{ period === 'half' ? '這半年，去過的地方。' : '今年的旅行，接著看下去。' }}</h2><p>{{ periodTrips.length }} 趟旅行，和不同的朋友，留下不同的風景。<br>跟著路線移動，停下來看照片，也打開那時收藏的小物。</p><button class="creation-primary" :disabled="!periodTrips.length" @click="startRecap()"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="m8 5 11 7-11 7z"/></svg>開始回顧</button><small>只收錄已完成的旅程</small></div>
      </article>
      <div class="trip-atlas-period-trips"><span>這次回顧</span><button v-for="trip in periodTrips" :key="trip.id" @click="browse(trip.id)"><small>{{ trip.startDate.slice(5, 7) }} 月</small><b>{{ trip.location }}</b><span aria-hidden="true">↗</span></button></div>
    </section>
    <div v-else-if="!selectedTrip" class="trip-atlas-overview">
      <button v-for="trip in tripSummaries" :key="trip.id" class="trip-atlas-trip" :data-trip="trip.id" @click="browse(trip.id)">
        <div class="trip-atlas-trip-cover"><img :src="asset(trip.cover)" :alt="trip.location" /><span>{{ trip.statusLabel }}</span></div>
        <div class="trip-atlas-trip-copy"><small>{{ trip.dateLabel }}</small><h2>{{ trip.title }}</h2><p>{{ count(trip.id) ? count(trip.id) + ' 件收藏' : '還沒有收藏' }}<span>{{ trip.companions.join('、') }}</span></p><b>{{ count(trip.id) ? '打開這趟回憶' : '看看這趟旅行' }}<span aria-hidden="true">↗</span></b></div>
      </button>
    </div>
    <template v-else-if="selectedId === 'kansai'">
      <div v-if="works.length" class="trip-atlas-added"><button @click="newWorksOpen = true"><span class="trip-atlas-added-stack" aria-hidden="true"><img v-for="work in works.slice(0, 3)" :key="work.id" :src="asset('assets/memory/' + work.image)" alt="" /></span><span>這趟新增的作品 <b>{{ works.length }}</b></span><span aria-hidden="true">↗</span></button></div>
      <JourneyAtlas @recap="startRecap('kansai')" />
    </template>
    <section v-else-if="selectedTrip" class="trip-atlas-collection">
      <header class="trip-atlas-collection-heading"><div><span class="journey-eyebrow">{{ selectedTrip.english }} / {{ selectedTrip.startDate.slice(0, 4) }}</span><h1>{{ selectedTrip.title }}</h1><p>{{ selectedTrip.dateLabel }} <span>·</span> {{ works.length }} 件收藏</p></div><div class="trip-atlas-heading-actions"><button v-if="selectedTrip.status === 'completed'" class="creation-primary" @click="startRecap(selectedTrip.id)">開始回顧<span aria-hidden="true">▷</span></button><button class="creation-secondary" @click="create(selectedTrip.id)">{{ selectedTrip.status === 'upcoming' ? '查看行程照片' : '繼續創作' }}<span aria-hidden="true">↗</span></button></div></header>
      <div v-if="works.length" class="trip-atlas-works">
        <button v-for="work in works" :key="work.id" class="trip-atlas-work" @click="open(work)"><div><img :src="asset('assets/memory/' + work.image)" :alt="work.title" /></div><span>{{ styleById(work.styleId).name }}</span><h2>{{ work.location }}</h2><p>{{ work.receivedFrom ? '與朋友交換的收藏' : work.creator + ' 的作品' }}<span aria-hidden="true">↗</span></p></button>
      </div>
      <div v-else class="trip-atlas-empty"><svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="9" y="8" width="30" height="32" rx="5"/><path d="m10 31 9-10 7 8 5-5 8 10"/><circle cx="31" cy="17" r="3"/></svg><h2>{{ selectedTrip.status === 'upcoming' ? '這趟旅行，等出發後慢慢收藏。' : '還沒有收藏，先從一張照片開始。' }}</h2><p>在這趟旅行的 AI 創作中保存作品，就會出現在這裡。</p><button class="creation-primary" @click="create(selectedTrip.id)">打開這趟 AI 創作</button></div>
    </section>
    <CreationDialog v-model="newWorksOpen" title="關西旅行 · 新增收藏" wide>
      <div class="trip-atlas-works">
        <button v-for="work in works" :key="work.id" class="trip-atlas-work" @click="open(work)"><div><img :src="asset('assets/memory/' + work.image)" :alt="work.title" /></div><span>{{ styleById(work.styleId).name }}</span><h2>{{ work.location }}</h2><p>{{ work.receivedFrom ? '與朋友交換的收藏' : work.creator + ' 的作品' }}<span aria-hidden="true">↗</span></p></button>
      </div>
    </CreationDialog>
    <CreationDialog v-model="detailOpen" :title="detail?.title || '旅行收藏'" wide>
      <div v-if="detail" class="trip-atlas-detail">
        <div v-if="detail.source" class="journey-detail-tabs"><button :aria-pressed="!original" @click="original = false">{{ styleById(detail.styleId).name }}</button><button :aria-pressed="original" @click="original = true">原照片</button></div>
        <div class="trip-atlas-detail-image" :class="{ 'source-crop': original && detail.sourceCrop }"><img :src="asset('assets/memory/' + (original && detail.source ? detail.source : detail.image))" :alt="detail.location + (original ? '原照片' : detail.title)" /></div>
        <div class="trip-atlas-detail-caption"><span>{{ selectedTrip?.title }}</span><h3>{{ detail.location }}</h3><p>{{ detail.creator }} · {{ styleById(detail.styleId).name }}</p><p v-if="detail.receivedFrom">與朋友交換後，收藏在這趟旅行中；保留作品的原始照片。</p></div>
      </div>
    </CreationDialog>
    <MemoryRecap v-model="recapOpen" :trip-ids="recapTripIds" :title="recapTitle" />
  </div>
</template>

<script setup lang="ts">
import trip from '~/data/atlas.json';
import scenes from '~/data/scenes.json';
import '~/assets/css/journey-atlas.css';
const route = useRoute();
const atlasMode = computed(() => route.query.view === 'cities' ? 'cities' : route.query.view === 'journey' || route.query.journey || route.query.scope ? 'journey' : 'plaza');
useHead(() => ({ title: atlasMode.value === 'plaza' ? '回憶廣場 · Memory Atlas · 去趣' : 'Memory Atlas · 去趣' }));
const asset = useAsset();
const city = ref('all'), selected = ref(-1), three = ref(true), paused = ref(false), autoplay = ref(false), arrived = ref(false);
const seen = ref<number[]>([]), sceneOpen = ref(false), sceneStyle = ref<'photo' | 'art'>('photo');
const stops = computed(() => trip.stops.filter(s => city.value === 'all' || s.city === city.value));
const active = computed(() => trip.stops[selected.value]);
const scene = computed(() => scenes.find(s => s.id === selected.value));
const collectibles = computed(() => trip.stickers.filter(s => city.value === 'all' || trip.stops[s.stop]?.city === city.value));
let timer: ReturnType<typeof setTimeout> | undefined;
function chooseMode(mode: 'cities' | 'journey') { clearTimeout(timer); autoplay.value = false; paused.value = true; navigateTo({ path: '/atlas', query: { view: mode } }); }
watch(atlasMode, () => { clearTimeout(timer); autoplay.value = false; paused.value = true; sceneOpen.value = false; });
function visit(id: number) { clearTimeout(timer); paused.value = false; selected.value = id; arrived.value = false; sceneOpen.value = false; }
function chooseCity(value: string) { clearTimeout(timer); autoplay.value = false; city.value = value; selected.value = -1; arrived.value = false; }
function arrival(id: number) {
    arrived.value = true;
    if (!seen.value.includes(id))
        seen.value.push(id);
    if (autoplay.value)
        timer = setTimeout(next, 2600);
}
function next() {
    const index = stops.value.findIndex(s => s.id === selected.value);
    const target = stops.value[index + 1];
    if (!target) {
        autoplay.value = false;
        paused.value = false;
        return;
    }
    visit(target.id);
}
function play() {
    if (autoplay.value && !paused.value) {
        paused.value = true;
        clearTimeout(timer);
        return;
    }
    autoplay.value = true;
    paused.value = false;
    if (selected.value < 0 || arrived.value)
        next();
}
function sprite(id: number) {
    const sheet = id < 9 ? 'travel-stickers.png' : 'interest-stickers.png';
    const index = id < 9 ? id : id - 9;
    return { backgroundImage: 'url(' + asset('atlas-assets/' + sheet) + ')', backgroundPosition: (index % 3) * 50 + '% ' + Math.floor(index / 3) * 50 + '%' };
}
onBeforeUnmount(() => clearTimeout(timer));
</script>
<template>
  <AtlasPlaza v-if="atlasMode === 'plaza'" />
  <div v-else class="atlas-return">
    <NuxtLink to="/atlas"><MemoryMotionIcon name="back"/>回憶樂園</NuxtLink>
    <div class="atlas-mode-tabs" role="group" aria-label="回憶地圖模式">
    <button :aria-pressed="atlasMode === 'journey'" @click="chooseMode('journey')">旅程收藏</button>
    <button :aria-pressed="atlasMode === 'cities'" @click="chooseMode('cities')">城市漫遊</button>
    </div>
  </div>
  <TripAtlasCollection v-if="atlasMode === 'journey'" />
  <section v-else-if="atlasMode === 'cities'" class="screen active atlas-page">
    <div class="page-heading">
      <span class="eyebrow">MEMORY ATLAS</span>
      <h1>走過的地方，<br>都有一點光。</h1>
      <p>台灣出發 · 大阪、首爾、香港，收藏不同的你。</p>
    </div>
    <div class="atlas-cities">
      <button :aria-pressed="city === 'all'" @click="chooseCity('all')">總回憶</button>
      <button v-for="c in trip.cities" :key="c.id" :aria-pressed="city === c.id" @click="chooseCity(c.id)">{{ c.name }}</button>
      <button :aria-pressed="three" @click="three = !three">{{ three ? '立體城市 ✓' : '平面地圖' }}</button>
    </div>
    <ClientOnly>
      <AtlasMap :selected="selected" :city="city" :three="three" :paused="paused" @select="visit" @arrive="arrival" />
      <template #fallback>
        <div class="atlas-map">
          <div class="atlas-overlay">正在打開你的旅行地圖…</div>
        </div>
      </template>
    </ClientOnly>
    <div class="play-bar">
      <span role="status">{{ selected < 0 ? '台灣出發' : (selected + 1) + ' / 12 段回憶' }}</span>
      <button @click="play">{{ autoplay && !paused ? '暫停回憶' : '繼續回憶' }}</button>
      <button @click="autoplay = false; next()">下一站 →</button>
    </div>
    <div class="map-stops">
      <button v-for="s in stops" :key="s.id" :aria-pressed="selected === s.id" @click="autoplay = false; visit(s.id)">
        <b>{{ s.short }}</b>
        <small>{{ s.date }} · {{ s.mode }}</small>
      </button>
    </div>
    <article v-if="active" class="panel">
      <div class="row">
        <span class="eyebrow">{{ active.city.toUpperCase() }} / {{ active.date }}</span>
        <span class="mock">{{ active.with }}</span>
      </div>
      <div class="atlas-sprite" :style="sprite(active.art)" aria-hidden="true" />
      <h2>{{ active.name }}</h2>
      <p>{{ active.story }}</p>
      <p class="muted">{{ active.mode }} · {{ active.time }}</p>
      <button class="primary" @click="sceneStyle = 'photo'; sceneOpen = true">回到這一刻 ↗</button>
    </article>
    <div class="panel">
      <div class="row">
        <h2>旅途的小收藏</h2>
        <span class="mock">已回顧 {{ seen.length }} / 12 站</span>
      </div>
      <p class="muted">地標之外，也收藏你的喜歡。</p>
      <div class="atlas-collectibles">
        <button v-for="item in collectibles" :key="item.id" :aria-pressed="selected === item.stop" @click="autoplay = false; visit(item.stop)">
          <div class="atlas-sprite" :style="sprite(item.id)" style="width:74px;height:74px" />
          <b>{{ item.name }}</b>
          <small class="reward-note">{{ item.tag }}</small>
        </button>
      </div>
    </div>
    <p class="page-note">交通路線為旅程示意，非導航或即時航跡。底圖由 OpenFreeMap 提供，需網路連線。</p>
    <AppSheet v-model="sceneOpen" :title="active?.name || '旅行回憶'">
      <template v-if="scene">
        <div class="atlas-scene">
          <Transition name="memory-crossfade" mode="out-in">
            <img v-if="sceneStyle === 'photo'" key="photo" :src="asset(scene.src.replace('assets/', 'atlas-assets/'))" :alt="active?.name + '實景'">
            <div v-else key="art" class="atlas-sprite" :style="sprite(active!.art)" style="width:260px;height:260px" />
          </Transition>
        </div>
        <p>{{ scene.caption }}</p>
        <p class="muted">{{ scene.note }}</p>
        <div class="choice-row">
          <button :aria-pressed="sceneStyle === 'photo'" @click="sceneStyle = 'photo'">當時的風景</button>
          <button :aria-pressed="sceneStyle === 'art'" @click="sceneStyle = 'art'">收藏貼紙</button>
        </div>
        <a class="photo-credit" :href="scene.url" target="_blank" rel="noopener">{{ scene.artist }} · {{ scene.license }} ↗</a>
      </template>
    </AppSheet>
  </section>
</template>

<script setup lang="ts">
import '~/assets/css/creation.css';
import '~/assets/css/journey-atlas.css';
const { stops, state } = useJourneyCollection();
const { allWorks } = useCreation();
const emit = defineEmits<{ recap: [] }>();
const route = useRoute(), router = useRouter(), asset = useAsset();
const selected = ref(stops.some(s => s.id === route.query.stop) ? String(route.query.stop) : 'usj');
const active = computed(() => stops.find(s => s.id === selected.value) || stops[0]!);
const detailOpen = ref(false), showOriginal = ref(false);
const savedCount = computed(() => stops.length - 1 + Number(state.value.usjSaved) + Number(state.value.friendAccepted) + allWorks.value.filter(work => work.tripId === 'kansai').length);
function isSaved(id: string) { return id !== 'usj' || state.value.usjSaved; }
function preview(stop: typeof stops[number]) { return asset(isSaved(stop.id) ? stop.image : stop.source); }
function choose(id: string, updateRoute = true) {
  selected.value = id;
  showOriginal.value = false;
  if (updateRoute) router.replace({ query: { ...route.query, journey: 'kansai', stop: id } });
}
function openDetail() { showOriginal.value = false; detailOpen.value = true; }
watch(() => route.query.stop, value => { if (stops.some(s => s.id === value)) choose(String(value), false); });
</script>
<template>
  <div class="journey-atlas">
    <header class="journey-header">
      <div><span class="journey-eyebrow">MEMORY ATLAS / 2026</span><h1>關西旅行<span>日本</span></h1><p>2026.04.03 — 04.07 <i /> 四個地方，四種留下回憶的方式。</p></div>
      <button class="journey-recap-button" @click="emit('recap')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="3" y="5" width="18" height="15" rx="3"/><path d="M7 3v4m10-4v4M3 10h18m-12 3 5 2.5-5 2.5z"/></svg><span>重走這一趟<small>關西 · 5 天</small></span><span aria-hidden="true">↗</span></button>
    </header>
    <div class="journey-context"><span class="journey-travelers"><i>S</i><i>J</i><i>B</i></span><span>與 James、Betty 同行</span><span class="journey-context-count"><b>{{ savedCount }}</b> 件創作 <span>·</span> {{ stops.length }} 個地點</span></div>
    <div class="journey-workspace">
      <div class="journey-map-column">
        <ClientOnly><JourneyCollectionMap :selected="selected" @select="choose"/><template #fallback><div class="journey-map journey-map-wait">正在打開旅行地圖…</div></template></ClientOnly>
        <nav class="journey-timeline" aria-label="選擇旅行地點">
          <button v-for="(stop, index) in stops" :key="stop.id" :aria-current="selected === stop.id ? 'location' : undefined" @click="choose(stop.id)"><span class="journey-stop-dot">{{ String(index + 1).padStart(2, '0') }}</span><b>{{ stop.short }}</b><small>{{ isSaved(stop.id) ? stop.formatLabel : '原照片' }}</small></button>
        </nav>
      </div>
      <Transition name="journey-stop" mode="out-in">
        <article :key="active.id + String(state.usjSaved)" class="journey-active-card">
          <div class="journey-active-meta"><span>{{ active.date }}</span><span>{{ isSaved(active.id) ? active.formatLabel : '等待創作的照片' }}</span></div>
          <button class="journey-active-image" :class="['journey-format-' + active.format, { 'is-source': !isSaved(active.id) }]" :aria-label="'打開' + active.name + '回憶'" @click="isSaved(active.id) ? openDetail() : navigateTo('/memory/usj')"><img :src="preview(active)" :alt="active.name + (isSaved(active.id) ? '・' + active.formatLabel : '原照片')"><span class="journey-image-open" aria-hidden="true">↗</span></button>
          <div class="journey-active-copy"><span class="journey-eyebrow">{{ active.location }}</span><h2>{{ active.name }}</h2><p>{{ active.caption }}</p>
            <div v-if="active.id === 'usj' && state.friendAccepted" class="journey-friend-tag"><i>J</i><span>{{ state.friendPlaced ? 'James 的旅伴已加入場景' : 'James 的旅伴已收藏' }}<small>同行交換 · 保留對方的照片與留言</small></span></div>
            <button v-if="isSaved(active.id)" class="creation-primary journey-open" @click="openDetail">{{ active.id === 'usj' ? '走進這個場景' : '打開這段回憶' }}<span aria-hidden="true">↗</span></button>
            <NuxtLink v-else class="creation-primary journey-open" to="/memory/usj">把這張照片變成場景<span aria-hidden="true">↗</span></NuxtLink>
          </div>
        </article>
      </Transition>
    </div>
    <div class="journey-footer-note"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M5 4h14v16l-7-4-7 4z"/></svg><span>不同照片，各自留下喜歡的樣子。收藏都能回到原本的旅程。</span></div>

    <CreationDialog v-model="detailOpen" :title="active.name" wide>
      <UsjMemoryDetail v-if="detailOpen && active.id === 'usj'" embedded />
      <div v-else-if="detailOpen" class="journey-memory-detail">
        <div v-if="active.image !== active.source" class="journey-detail-tabs"><button :aria-pressed="!showOriginal" @click="showOriginal = false">{{ active.formatLabel }}</button><button :aria-pressed="showOriginal" @click="showOriginal = true">{{ active.id === 'nara' ? '示範照片' : '原照片' }}</button></div>
        <div class="journey-detail-art" :class="['journey-format-' + active.format, { 'is-source': showOriginal }]"><Transition name="journey-stop" mode="out-in"><img :key="String(showOriginal)" :src="asset(showOriginal ? active.source : active.image)" :alt="active.name + (showOriginal ? (active.id === 'nara' ? '示範照片' : '原照片') : active.formatLabel)"></Transition></div>
        <div class="journey-detail-caption"><span class="journey-eyebrow">{{ active.date }} · {{ active.location }}</span><h3>{{ active.name }}</h3><p>{{ active.caption }}</p></div>
        <p v-if="active.id === 'dotonbori'" class="creation-muted">示範旅程攝影 · <a href="https://commons.wikimedia.org/wiki/File:Osaka_Dotonbori_Ebisu_Bridge.jpg" target="_blank" rel="noopener noreferrer">Type specimen · CC BY-SA 3.0</a></p>
        <div class="journey-provenance"><span class="journey-owner-avatar">S</span><div><b>Scott 的旅行收藏</b><small>關西旅行 · {{ active.short }} · {{ active.formatLabel }}<br>{{ active.id === 'nara' ? '奈良照片與貼紙為 AI 示意素材，用於展示不同形式的收藏。' : '這件作品與原照片保存在同一站。' }}</small></div></div>
      </div>
    </CreationDialog>

  </div>
</template>

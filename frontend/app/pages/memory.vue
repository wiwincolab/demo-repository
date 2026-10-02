<script setup lang="ts">
import { creationStyles, photosForTrip, photoById, styleForPhoto, workForPhoto, type CreationWork, type CreationId, type CreationPhoto } from '~/data/creation';
import { tripSummaries } from '~/data/trips';
import '~/assets/css/creation.css';
import '~/assets/css/photo-exploration.css';
import '~/assets/css/trip-studio.css';
const asset = useAsset();
const route = useRoute();
const { notify } = useDemo();
const { activeId, activeTrip, tripHref } = useTripContext();
const { works, exchanges, pending, save, friends } = useCreation();
const { collectionCount: journeyCount } = useJourneyCollection();
const photos = computed(() => activeId.value ? photosForTrip(activeId.value) : []);
const selectedPhoto = ref<CreationPhoto | null>(null);
const selected = ref<CreationId>('sticker');
const activeWork = ref<CreationWork | null>(null);
const styles = computed(() => selectedPhoto.value?.styles.map(id => styleForPhoto(selectedPhoto.value!, id)!).filter(Boolean) || []);
const style = computed(() => selectedPhoto.value ? styleForPhoto(selectedPhoto.value, selected.value) : undefined);
const work = computed(() => activeWork.value || (selectedPhoto.value && style.value ? workForPhoto(selectedPhoto.value, selected.value) : null));
const image = computed(() => work.value ? asset('assets/memory/' + work.value.image) : '');
const sourceImage = computed(() => selectedPhoto.value ? asset('assets/memory/' + selectedPhoto.value.source) : '');
const photoUrl = ref(''), photoName = ref('');
const uploading = ref(false), exchanging = ref(false), library = ref(false), sharing = ref(false), details = ref(false), zoom = ref(false), playing = ref(false), formats = ref(false);
const libraryTab = ref<'collection' | 'history'>('collection');
const generating = ref(false), complete = ref(false), original = ref(false), exploring = ref(false);
let timer: ReturnType<typeof setTimeout> | undefined;
const saved = computed(() => !!work.value && works.value.some(item => item.id === work.value!.id));
const hasResult = computed(() => saved.value || complete.value);
const originExchange = computed(() => exchanges.value.find(e => e.id === work.value?.exchangeId));
const giver = computed(() => friends.value.find(f => f.id === work.value?.receivedFrom));
const received = computed(() => !!activeWork.value?.receivedFrom);
const sourceTrip = computed(() => tripSummaries.find(trip => trip.id === (activeWork.value?.sourceTripId || selectedPhoto.value?.tripId)));
const count = computed(() => works.value.length + (activeId.value === 'kansai' ? journeyCount.value : 0));
const canPlay = computed(() => !!style.value?.interactive && selectedPhoto.value?.id !== 'nara-deer');
const aliases: Record<string, CreationId> = { editorial: 'photo', enamel: 'pin', postcard: 'photo', diorama: 'scene' };
function reset() {
  if (timer) clearTimeout(timer);
  generating.value = false; selectedPhoto.value = null; activeWork.value = null; complete.value = false; original.value = false;
  exchanging.value = sharing.value = details.value = zoom.value = playing.value = exploring.value = false;
  if (photoUrl.value) URL.revokeObjectURL(photoUrl.value);
  photoUrl.value = ''; photoName.value = '';
}
function choosePhoto(photo: CreationPhoto, requested?: CreationId) {
  if (photo.tripId !== activeId.value) return;
  reset();
  if (photo.featured === 'usj') { navigateTo(tripHref('/memory/usj')); return; }
  selectedPhoto.value = photo;
  selected.value = requested && photo.styles.includes(requested) ? requested : photo.styles[0]!;
}
function fromRoute() {
  reset();
  const photo = photoById(String(route.query.photo || ''));
  const requested = String(route.query.style || '');
  const styleId = (creationStyles.some(s => s.id === requested) ? requested : aliases[requested]) as CreationId | undefined;
  if (photo?.tripId === activeId.value) choosePhoto(photo, styleId);
  else if (styleId) { const compatible = photos.value.find(p => p.styles.includes(styleId)); if (compatible) choosePhoto(compatible, styleId); }
}
watch(() => [activeId.value, route.query.photo, route.query.style], fromRoute, { immediate: true });
function pick(id: CreationId) { if (!selectedPhoto.value?.styles.includes(id)) return; selected.value = id; activeWork.value = null; complete.value = false; original.value = false; }
function selectWork(item: CreationWork) {
  const photo = photoById(item.photoId || '');
  if (!photo || item.tripId !== activeId.value) return;
  reset();
  if (photo.featured === 'usj') { navigateTo(tripHref('/atlas', { journey: 'kansai', stop: 'usj' })); return; }
  selectedPhoto.value = photo; selected.value = item.styleId; activeWork.value = item; complete.value = true;
}
function openLibrary(tab: 'collection' | 'history') { libraryTab.value = tab; library.value = true; }
function upload(url: string, name: string) { reset(); photoUrl.value = url; photoName.value = name; }
function example(id: string) { const photo = photoById(id); if (photo) choosePhoto(photo); }
function generate() {
  if (generating.value || !selectedPhoto.value || !style.value) return;
  generating.value = true; complete.value = false; original.value = false;
  const photo = selectedPhoto.value, id = selected.value;
  timer = setTimeout(() => {
    const generated = workForPhoto(photo, id, '你', '-' + Date.now());
    generated.createdAt = new Date().toISOString();
    activeWork.value = generated; save(generated); generating.value = false; complete.value = true;
    notify('已加入這趟旅行的作品');
  }, 900);
}
useHead({ title: 'AI Image Creation · 去趣 chicTrip' });
onBeforeUnmount(() => { if (timer) clearTimeout(timer); if (photoUrl.value) URL.revokeObjectURL(photoUrl.value); });
</script>
<template>
  <section v-if="activeTrip" class="creation-page trip-studio" aria-labelledby="creation-title">
    <header class="creation-heading">
      <div><span class="creation-eyebrow">這趟旅行，值得留下的片刻</span><h1 id="creation-title">AI Image Creation<span>{{ activeTrip?.title }} · 回憶創作</span></h1></div>
      <div class="creation-top-actions"><button @click="openLibrary('collection')">本次作品 <span>{{ count }}</span></button><button aria-label="開啟這趟旅行的交換紀錄" @click="openLibrary('history')">⇄ <span v-if="pending" class="creation-unread">{{ pending }}</span></button></div>
    </header>
    <template v-if="!selectedPhoto && !photoUrl">
      <div class="studio-gallery-heading"><div><h2>從這趟旅行，選一張照片</h2><p>每個地方，留成不同的收藏。</p></div><button class="creation-secondary" @click="uploading = true"><span aria-hidden="true">＋</span> 加入照片</button></div>
      <div v-if="photos.length" class="studio-photo-grid">
        <button v-for="photo in photos" :key="photo.id" class="studio-photo-card" @click="choosePhoto(photo)">
          <span class="studio-photo-frame" :class="{ 'creation-cropped-source': photo.sourceCrop }"><img :src="asset('assets/memory/' + photo.source)" :alt="photo.title" /><span v-if="photo.featured === 'usj'" class="studio-photo-badge">可走進的 3D 場景</span></span>
          <span class="studio-photo-info"><b>{{ photo.title }}</b><small>{{ photo.location }}<template v-if="photo.note"> · {{ photo.note }}</template></small><span>{{ photo.styles.map(id => creationStyles.find(s => s.id === id)?.name).join(' · ') }}</span></span><span class="studio-photo-arrow" aria-hidden="true">↗</span>
        </button>
      </div>
      <div v-else class="studio-empty"><span class="studio-empty-frames" aria-hidden="true"><i></i><i></i></span><h3>把這趟旅行的照片放進來</h3><p>出發前也能先準備，旅行中的照片會從這裡開始收藏。</p><button class="creation-primary" @click="uploading = true">選擇照片</button></div>
      <footer class="studio-gallery-footer"><button @click="formats = true">認識六種收藏方式 <span aria-hidden="true">↗</span></button><NuxtLink :to="tripHref('/atlas', { journey: activeId || undefined })">在回憶地圖看這趟旅行 ↗</NuxtLink></footer>
    </template>
    <template v-else-if="photoUrl">
      <button class="studio-back" @click="reset"><MemoryMotionIcon name="back" /> 這趟旅行的照片</button>
      <div class="studio-upload-preview"><img :src="photoUrl" :alt="photoName" /><div><span class="creation-eyebrow">{{ activeTrip?.title }}</span><h2>{{ photoName }}</h2><p>照片已選好。這個版本可先預覽你的照片，正式 AI 創作尚未開放。</p><button class="creation-primary" @click="uploading = true">換一張照片</button><button class="creation-text-button" @click="reset">用這趟旅行的範例體驗</button><small>僅本機預覽，不會上傳或替換成其他景點。</small></div></div>
    </template>
    <template v-else-if="selectedPhoto && style && work">
      <div class="studio-workspace-nav"><button class="studio-back" :disabled="generating" @click="reset"><MemoryMotionIcon name="back" /> 這趟旅行的照片</button><span>{{ selectedPhoto.location }}</span></div>
      <div class="creation-workspace">
        <div class="creation-canvas-column">
          <div class="creation-stage" :class="['creation-stage-' + selected, { 'is-generating': generating }]" :aria-busy="generating">
            <div class="creation-stage-tags"><span>{{ original ? '原照片' : giver ? '朋友的收藏' : hasResult ? '這趟旅行的作品' : '作品預覽' }}</span><button class="studio-original-toggle" :aria-pressed="original" :disabled="generating" @click="original = !original">{{ original ? '看作品' : '對照原照' }}</button></div>
            <div v-if="original" class="studio-original-art" :class="{ 'creation-cropped-source': selectedPhoto.sourceCrop }"><img :src="sourceImage" :alt="selectedPhoto.title + '原照片'" /></div>
            <button v-else class="creation-art-button" aria-label="放大作品" :disabled="generating" @click="zoom = true"><img :key="work.image" :src="image" :alt="work.location + '・' + style.name" :class="{ 'creation-photo-finish': selected === 'photo' }" /></button>
            <div v-if="generating" class="creation-generating" role="status"><span class="creation-spinner" /><b>正在製作你的{{ style.name }}…</b><small>預製作品生成體驗</small></div>
            <button v-if="canPlay && !generating && !original" class="creation-play" @click="playing = true">{{ style.interactive }} <span>↗</span></button>
          </div>
          <div class="creation-caption"><div><small>{{ style.english }}</small><h2>{{ style.name }}<span v-if="selected === 'scene'">3D</span></h2></div><span v-if="saved" class="studio-saved">✓ 已收藏</span></div>
          <div v-if="giver" class="creation-received"><span>⇄</span><p>來自 <b>{{ giver.name }}</b><small>{{ giver.companion ? '這趟一起旅行的紀念' : '交換來的旅行收藏' }}</small></p><button aria-label="查看交換來源" @click="details = true">查看來源 ›</button></div>
          <p v-else class="creation-description">{{ style.caption }}</p>
          <button v-if="selectedPhoto.id === 'fuji-blue' && selected === 'sticker'" class="creation-explore-entry" @click="exploring = true"><span>✧</span><span><b>走進照片，拾起回憶</b><small>從富士山的風景裡，找回那天的小細節。</small></span><span>↗</span></button>
        </div>
        <aside class="creation-controls" aria-label="這張照片的創作選項">
          <template v-if="!received">
            <div class="creation-section-label"><h2>想怎麼留下這張照片？</h2><button class="studio-format-help" aria-label="認識六種收藏方式" @click="formats = true">?</button></div>
            <div class="creation-style-picker studio-compatible-styles" :class="{ 'studio-single-style': styles.length === 1 }" role="group" aria-label="這張照片可體驗的風格"><button v-for="item in styles" :key="item.id" :aria-pressed="selected === item.id" :disabled="generating" @click="pick(item.id)"><span class="creation-style-image"><img :src="asset('assets/memory/' + item.image)" alt="" /><i v-if="selected === item.id">✓</i></span><b>{{ item.name }}</b><small>{{ item.interactive && selectedPhoto.id !== 'nara-deer' ? '互動收藏' : '影像收藏' }}</small></button></div>
            <p class="studio-format-context">{{ styles.length === 1 ? '這張照片先體驗' + style.name + '。' : '切換收藏方式，照片仍是同一張。' }}本次提供這些對應照片的預覽。</p>
            <button class="creation-primary creation-generate" :disabled="generating" @click="generate">{{ generating ? '正在製作…' : hasResult ? '再創作一件' : '製作並加入本次作品' }}<span v-if="!generating">✦</span></button>
            <p class="creation-generation-note">{{ activeTrip?.title }} · 使用這張照片的預製範例</p>
          </template>
          <div v-else class="studio-exchanged-info"><span class="creation-eyebrow">交換來的旅行收藏</span><h2>{{ work.title }}</h2><p>{{ work.creator }} 的作品，來自「{{ sourceTrip?.title }}」。</p><button class="creation-text-button" @click="details = true">查看交換與原作紀錄 ›</button></div>
          <template v-if="hasResult"><div class="creation-divider" /><div class="creation-quick-actions"><button @click="exchanging = true"><span>⇄</span><b>與朋友交換</b><small>留句話，交換風景</small></button><button @click="sharing = true"><span>＠</span><b>分享到 Threads</b><small>把作品變成話題</small></button></div><div class="creation-bottom-links"><button @click="details = true">作品資訊</button><a :href="image" :download="work.image.split('/').pop()">下載圖片 ↓</a><NuxtLink :to="tripHref('/atlas', { journey: activeId || undefined })">回憶地圖 ↗</NuxtLink></div></template>
        </aside>
      </div>
    </template>
    <CreationUpload v-model="uploading" @upload="upload" @example="example" />
    <CreationLibrary v-model="library" :start-tab="libraryTab" @select="selectWork" />
    <CreationPhotoExplore v-if="exploring" @close="exploring = false" @notebook="exploring = false; playing = true" />
    <template v-if="work && style">
      <CreationExchange v-model="exchanging" :work="work" />
      <ThreadsComposer v-model="sharing" :image="image" :location="work.location" :style-id="selected" :photo-id="work.photoId" />
      <CreationDialog v-model="details" title="作品的旅行紀錄">
        <div class="creation-detail-art"><img :src="image" :alt="work.title" /><div><h3>{{ work.title }}</h3><p>{{ work.location }}</p><small>原作旅程 · {{ sourceTrip?.title }}<br />原創作者 · {{ work.creator }}</small></div></div>
        <div v-if="giver?.companion" class="creation-companion"><span>↔</span><div><b>同行限定收藏</b><small>{{ giver.trip }} · 與 {{ giver.name }} 一起</small></div></div>
        <ol class="creation-provenance"><li><b>{{ work.creator }} 創作了這件作品</b><small>{{ new Date(work.createdAt).toLocaleDateString('zh-TW', { timeZone: 'Asia/Taipei' }) }} · {{ work.location }}</small></li><li v-if="giver"><b>{{ giver.name }} 交換給你</b><small>{{ originExchange?.resolvedAt ? new Date(originExchange.resolvedAt).toLocaleDateString('zh-TW', { timeZone: 'Asia/Taipei' }) : '已完成交換' }} · 保留原作者資訊</small></li><li><b>{{ saved ? '已存入這趟旅行的作品' : '作品預覽' }}</b><small>六種形式皆可交換收藏副本</small></li></ol>
        <blockquote v-if="originExchange?.note" class="creation-message">「{{ originExchange.note }}」<small>{{ originExchange.direction === 'received' ? giver?.name : '你' }} 的留言</small></blockquote>
        <blockquote v-if="originExchange?.reply" class="creation-message">「{{ originExchange.reply }}」<small>{{ originExchange.direction === 'received' ? '你' : giver?.name }} 的回覆</small></blockquote>
        <p class="creation-muted">預製作品與本機交換紀錄。</p>
        <template #footer><a class="creation-secondary" :href="image" :download="work.image.split('/').pop()">下載圖片 ↓</a><NuxtLink class="creation-primary" :to="tripHref('/atlas', { journey: activeId || undefined })" @click="details = false">在地圖上回顧 ↗</NuxtLink></template>
      </CreationDialog>
      <CreationDialog v-model="zoom" title="欣賞作品" wide><img class="creation-full-art" :src="image" :alt="work.title" /></CreationDialog>
      <CreationDialog v-model="playing" :title="style.name + ' · 互動收藏'" wide><CreationPlayground v-if="playing && canPlay" :work="work" :image="image" :giver="giver?.name" /></CreationDialog>
    </template>
    <CreationDialog v-model="formats" title="六種方式，收藏一趟旅行" wide><p class="creation-lead">不同照片，可以留下不同的作品。不需要把每一張照片都做成六種。</p><div class="studio-format-list"><article v-for="item in creationStyles" :key="item.id"><img :src="asset('assets/memory/' + item.image)" :alt="item.name + '風格示意'" /><div><h3>{{ item.name }}</h3><p>{{ item.caption }}</p></div></article></div><p class="creation-muted">目前依每張照片提供對應的示範風格，選照片後查看可體驗項目。</p></CreationDialog>
  </section>
</template>

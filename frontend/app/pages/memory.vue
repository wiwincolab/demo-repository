<script setup lang="ts">
import { creationStyles, styleForPhoto, workForPhoto, makeExample, type CreationWork, type CreationId, type CreationPhoto } from '~/data/creation';
import { renderDemoArtwork } from '~/utils/creation-artwork';
import { tripSummaries } from '~/data/trips';
import '~/assets/css/creation.css';
import '~/assets/css/photo-exploration.css';
import '~/assets/css/trip-studio.css';
const asset = useCreationAsset();
const route = useRoute();
const { notify } = useDemo();
const { activeId, activeTrip, tripHref } = useTripContext();
const { works, exchanges, pending, save, friends, photos, findPhoto, addPhoto, generateOnServer } = useCreation();
const selectedPhoto = ref<CreationPhoto | null>(null);
const selected = ref<CreationId>('sticker');
const activeWork = ref<CreationWork | null>(null);
const exchangeTarget = ref<CreationWork | null>(null);
const styles = computed(() => selectedPhoto.value ? creationStyles.map(item => styleForPhoto(selectedPhoto.value!, item.id)) : []);
const style = computed(() => selectedPhoto.value ? styleForPhoto(selectedPhoto.value, selected.value) : undefined);
const work = computed(() => activeWork.value || (selectedPhoto.value && style.value ? workForPhoto(selectedPhoto.value, selected.value) : null));
const image = computed(() => work.value ? work.value.renderedImage || asset('assets/memory/' + work.value.image) : '');
const sourceImage = computed(() => selectedPhoto.value ? asset('assets/memory/' + selectedPhoto.value.source) : '');
const downloadName = computed(() => `chictrip-${work.value?.styleId || 'memory'}.png`);
const uploading = ref(false), exchanging = ref(false), library = ref(false), sharing = ref(false), details = ref(false), zoom = ref(false), sourceZoom = ref(false), playing = ref(false), formats = ref(false);
const guideSelected = ref<CreationId>('sticker');
const libraryTab = ref<'collection' | 'history'>('collection');
const generating = ref(false), complete = ref(false), original = ref(false), exploring = ref(false);
// progress：排隊與製作進度（有後端時）；run：每次開始或離開都換號，舊的輪詢看到號碼變了就停
const progress = ref('');
let run = 0;
const saved = computed(() => !!work.value && works.value.some(item => item.id === work.value!.id));
const hasResult = computed(() => saved.value || complete.value);
// Style previews use our existing examples; only finished works use the chosen photo.
const previewStyle = computed(() => creationStyles.find(item => item.id === selected.value)!);
const previewWork = computed(() => makeExample(previewStyle.value, 'AI 示範'));
const displayWork = computed(() => hasResult.value ? work.value! : previewWork.value);
const displaySource = computed(() => asset('assets/memory/' + displayWork.value.source));
const originExchange = computed(() => exchanges.value.find(e => e.id === work.value?.exchangeId));
const giver = computed(() => friends.value.find(f => f.id === work.value?.receivedFrom));
const received = computed(() => !!activeWork.value?.receivedFrom);
const sourceTrip = computed(() => tripSummaries.find(trip => trip.id === (activeWork.value?.sourceTripId || selectedPhoto.value?.tripId)));
const count = computed(() => works.value.length + photos.value.reduce((total, photo) => total + photo.styles.filter(id => !works.value.some(work => work.photoId === photo.id && work.styleId === id)).length, 0));
const canPlay = computed(() => !!style.value?.interactive);
const photoWorks = computed(() => {
  if (!selectedPhoto.value) return [];
  const savedForPhoto = works.value.filter(item => item.photoId === selectedPhoto.value!.id);
  const presets = selectedPhoto.value.styles
    .filter(id => !savedForPhoto.some(item => item.styleId === id))
    .map(id => workForPhoto(selectedPhoto.value!, id, 'AI 示範'));
  return [...savedForPhoto, ...presets];
});
const guideStyle = computed(() => creationStyles.find(item => item.id === guideSelected.value) || creationStyles[0]!);
const guideWork = computed(() => makeExample(guideStyle.value, 'AI 示範'));
const aliases: Record<string, CreationId> = { editorial: 'photo', enamel: 'pin', postcard: 'photo', diorama: 'scene' };
function reset() {
  run++; progress.value = '';
  generating.value = false; selectedPhoto.value = null; activeWork.value = null; complete.value = false; original.value = false;
  exchanging.value = sharing.value = details.value = zoom.value = sourceZoom.value = playing.value = exploring.value = false;
}
function choosePhoto(photo: CreationPhoto, requested?: CreationId) {
  if (photo.tripId !== activeId.value) return;
  reset();
  selectedPhoto.value = photo;
  selected.value = requested || photo.styles[0] || 'sticker';
}
function fromRoute() {
  reset();
  const photo = findPhoto(String(route.query.photo || ''));
  const requested = String(route.query.style || '');
  const styleId = (creationStyles.some(s => s.id === requested) ? requested : aliases[requested]) as CreationId | undefined;
  if (photo?.tripId === activeId.value) choosePhoto(photo, styleId);
  else if (styleId && photos.value[0]) choosePhoto(photos.value[0], styleId);
}
watch(() => [activeId.value, route.query.photo, route.query.style], fromRoute, { immediate: true });
function pick(id: CreationId) { if (!selectedPhoto.value) return; selected.value = id; activeWork.value = null; complete.value = false; original.value = false; }
function selectPhotoWork(item: CreationWork) { if (generating.value) return; selected.value = item.styleId; activeWork.value = item; complete.value = true; original.value = false; }
function openFormats(id: CreationId = selected.value) { guideSelected.value = id; formats.value = true; }
function selectWork(item: CreationWork) {
  const photo = findPhoto(item.photoId);
  if (!photo || item.tripId !== activeId.value) return;
  reset();
  selectedPhoto.value = photo; selected.value = item.styleId; activeWork.value = item; complete.value = true;
}
function openLibrary(tab: 'collection' | 'history') { libraryTab.value = tab; library.value = true; }
function generateFromLibrary(photoId: string) { const photo = findPhoto(photoId); if (photo) choosePhoto(photo); }
function startExchange(item?: CreationWork | null) {
  const fallbackPhoto = photos.value[0];
  const candidate = item || (hasResult.value ? work.value : null) || works.value[0] || (fallbackPhoto?.styles[0] ? workForPhoto(fallbackPhoto, fallbackPhoto.styles[0]) : null);
  if (!candidate) { openLibrary('collection'); notify('先選一張照片製作作品，再開始交換'); return; }
  exchangeTarget.value = candidate;
  exchanging.value = true;
}
async function upload(url: string, name: string, demoPhotoId?: string, file?: File) { const photo = await addPhoto(url, name, demoPhotoId, file); if (photo) { choosePhoto(photo); notify('照片已加入，選一種風格開始創作'); } }
async function generate() {
  if (generating.value || !selectedPhoto.value || !style.value) return;
  generating.value = true; complete.value = false; original.value = false; progress.value = '';
  const token = ++run, photo = selectedPhoto.value, id = selected.value;
  const stale = () => token !== run || selectedPhoto.value?.id !== photo.id || selected.value !== id || !generating.value;
  const generated = workForPhoto(photo, id, '你', '-' + Date.now());
  generated.createdAt = new Date().toISOString();
  // 有後端時四種平面風格真的交給 Gemini；沒有後端、場景積木與旅伴照舊用預製圖或本機合成
  const server = await generateOnServer(photo, id, text => { if (!stale()) progress.value = text; }, stale);
  if (server) {
    generated.serverId = server.serverId;
    if (server.imageUrl) { generated.renderedImage = server.imageUrl; generated.preset = false; }
    else generated.fallback = true;
    if (server.message) notify(server.message);
  } else await new Promise(resolve => setTimeout(resolve, 900));
  if (stale()) return;
  if (!generated.preset && !generated.renderedImage) {
    try { generated.renderedImage = await renderDemoArtwork(generated, asset('assets/memory/' + photo.source)); }
    catch { generating.value = false; notify('圖片暫時無法處理，請換一張照片再試'); return; }
  }
  if (stale()) return;
  activeWork.value = generated; save(generated); generating.value = false; complete.value = true; progress.value = '';
  notify(generated.fallback ? 'AI 這次沒做成，先放上示範圖' : '已加入這趟旅行的作品');
}
useHead({ title: '回憶製造所 · 去趣 chicTrip' });
function play() {
  if (!hasResult.value) { openFormats(); return; }
  if ((selectedPhoto.value?.id === 'usj-scene' || selectedPhoto.value?.demoPhotoId === 'usj-scene') && selected.value === 'scene') navigateTo(tripHref('/memory/usj'));
  else playing.value = true;
}
onBeforeUnmount(() => { run++; generating.value = false; });
</script>
<template>
  <section v-if="activeTrip" class="creation-page trip-studio" aria-labelledby="creation-title">
    <header class="creation-heading">
      <div><span class="creation-eyebrow">把喜歡的那一天，留成收藏</span><h1 id="creation-title">回憶製造所<span>{{ activeTrip?.title }} · 回憶創作</span></h1></div>
      <div class="creation-top-actions"><button @click="openLibrary('collection')">本次作品 <span>{{ count }}</span></button><button class="creation-exchange-action" aria-label="交換 AI 作品" @click="startExchange()"><img class="creation-exchange-illustration" :src="asset('assets/memory/exchange-collectibles.png')" alt="" /><span class="creation-exchange-copy"><b>交換作品</b><small>用收藏，換個風景</small></span><i v-if="pending" class="creation-unread">{{ pending }}</i></button></div>
    </header>
    <template v-if="!selectedPhoto">
      <div class="studio-gallery-heading"><div><h2>從這趟旅行，選一張照片</h2><p>每個地方，留成不同的收藏。</p></div><button class="creation-secondary" @click="uploading = true"><span aria-hidden="true">＋</span> 加入照片</button></div>
      <div v-if="photos.length" class="studio-photo-grid">
        <button v-for="photo in photos" :key="photo.id" class="studio-photo-card" @click="choosePhoto(photo)">
          <span class="studio-photo-frame" :class="{ 'creation-cropped-source': photo.sourceCrop }"><img :src="asset('assets/memory/' + photo.source)" :alt="photo.title" /><span v-if="photo.featured === 'usj'" class="studio-photo-badge">可走進的 3D 場景</span></span>
          <span class="studio-photo-info"><b>{{ photo.title }}</b><small>{{ photo.location }}<template v-if="photo.note"> · {{ photo.note }}</template></small><span>六種 AI 風格皆可製作</span></span><span class="studio-photo-arrow" aria-hidden="true">↗</span>
        </button>
      </div>
      <div v-else class="studio-empty"><span class="studio-empty-frames" aria-hidden="true"><i></i><i></i></span><h3>把這趟旅行的照片放進來</h3><p>出發前也能先準備，旅行中的照片會從這裡開始收藏。</p><button class="creation-primary" @click="uploading = true">選擇照片</button></div>
      <footer class="studio-gallery-footer"><button @click="openFormats('sticker')">認識六種收藏方式 <span aria-hidden="true">↗</span></button><NuxtLink :to="tripHref('/collection')">打開旅行收集冊 ↗</NuxtLink></footer>
    </template>
    <template v-else-if="selectedPhoto && style && work">
      <div class="studio-workspace-nav"><button class="studio-back" :disabled="generating" @click="reset"><MemoryMotionIcon name="back" /> 這趟旅行的照片</button><span>{{ selectedPhoto.location }}</span></div>
      <div class="creation-workspace">
        <div class="creation-canvas-column">
          <div class="creation-stage" :class="['creation-stage-' + selected, { 'is-generating': generating }]" :aria-busy="generating">
            <div class="creation-stage-tags"><span>{{ original ? (hasResult ? '作品原照' : '範例原照') : giver ? '朋友的收藏' : hasResult ? (work.fallback ? '示範圖 · AI 這次沒做成' : '這趟旅行的作品') : '風格範例' }}</span><button class="studio-original-toggle" :aria-pressed="original" :disabled="generating" @click="original = !original">{{ original ? (hasResult ? '看作品' : '看範例成品') : hasResult ? '對照原照' : '看範例原照' }}</button></div>
            <div v-if="original" class="studio-original-art" :class="{ 'creation-cropped-source': displayWork.sourceCrop }"><img :src="displaySource" :alt="displayWork.location + '原照'" /></div>
            <button v-else class="creation-art-button" :aria-label="hasResult ? '放大作品' : '放大風格範例'" :disabled="generating" @click="zoom = true"><CreationArtwork :key="displayWork.id" :work="displayWork" :alt="displayWork.location + '・' + style.name + (hasResult ? '' : '範例')" /></button>
            <div v-if="generating" class="creation-generating" role="status"><span class="creation-spinner" /><b>正在製作你的{{ style.name }}…</b><small>{{ progress || '把這張照片，變成一件旅行收藏。' }}</small></div>
            <button v-if="canPlay && !generating && !original" class="creation-play" @click="play">{{ hasResult ? style.interactive : '看看原照與成品範例' }} <span>↗</span></button>
          </div>
          <div class="creation-caption"><div><small>{{ style.english }}</small><h2>{{ style.name }}<span v-if="selected === 'scene'">3D</span></h2></div><span v-if="saved" class="studio-saved">✓ 已收藏</span></div>
          <div v-if="giver" class="creation-received"><span>⇄</span><p>來自 <b>{{ giver.name }}</b><small>{{ giver.companion ? '這趟一起旅行的紀念' : '交換來的旅行收藏' }}</small></p><button aria-label="查看交換來源" @click="details = true">查看來源 ›</button></div>
          <p v-else class="creation-description">{{ style.caption }}</p>
          <button v-if="selectedPhoto.id === 'fuji-blue' && selected === 'sticker'" class="creation-explore-entry" @click="exploring = true"><span>✧</span><span><b>走進照片，拾起回憶</b><small>從富士山的風景裡，找回那天的小細節。</small></span><span>↗</span></button>
        </div>
        <aside class="creation-controls" aria-label="這張照片的創作選項">
          <template v-if="!received">
            <button class="studio-source-card" @click="sourceZoom = true"><span :class="{ 'creation-cropped-source': selectedPhoto.sourceCrop }"><img :src="sourceImage" :alt="selectedPhoto.title" /></span><span><small>這次使用的原照片</small><b>{{ selectedPhoto.title }}</b></span><em>查看原圖 ›</em></button>
            <div class="creation-section-label"><h2>想怎麼留下這張照片？</h2><button class="studio-format-help" aria-label="查看六種風格原圖與成品範例" @click="openFormats(selected)"><span>看風格範例</span><b>?</b></button></div>
            <div class="creation-style-picker studio-compatible-styles" role="group" aria-label="六種 AI 生成風格"><button v-for="item in styles" :key="item.id" :aria-pressed="selected === item.id" :disabled="generating" @click="pick(item.id)"><span class="creation-style-image"><img :src="asset('assets/memory/' + (creationStyles.find(example => example.id === item.id)?.image || item.image))" alt="" /><i v-if="selected === item.id">✓</i></span><b>{{ item.name }}</b><small>看風格範例</small></button></div>
            <p class="studio-format-context">{{ hasResult ? '這張照片的收藏，可以交換，也可以分享給朋友。' : '上方是已有的成品範例。挑一種喜歡的風格，用你的原照開始製作。' }}</p>
            <button class="creation-primary creation-generate" :disabled="generating" @click="generate">{{ generating ? '正在製作…' : hasResult ? '再創作一件' : '製作並加入本次作品' }}<span v-if="!generating">✦</span></button>
            <p class="creation-generation-note">完成後，作品會收進這趟旅行的收藏。</p>

            <section class="studio-photo-library" aria-labelledby="photo-library-title">
              <div><span><small>FROM THIS PHOTO</small><h3 id="photo-library-title">這張照片的作品</h3></span><button @click="openLibrary('collection')">查看本次全部 {{ count }} 件 ›</button></div>
              <div v-if="photoWorks.length" class="studio-photo-library-track">
                <button v-for="item in photoWorks" :key="item.id" :aria-pressed="activeWork?.id === item.id" @click="selectPhotoWork(item)"><CreationArtwork :work="item" :alt="item.title" compact /><span><b>{{ item.title }}</b><small>{{ item.creator === 'AI 示範' ? '範例收藏' : item.fallback ? '示範圖' : '已加入作品庫' }}</small></span></button>
              </div>
              <p v-else>還沒有作品。選一種風格，做出這張照片的第一件收藏。</p>
            </section>
          </template>
          <div v-else class="studio-exchanged-info"><span class="creation-eyebrow">交換來的旅行收藏</span><h2>{{ work.title }}</h2><p>{{ work.creator }} 的作品，來自「{{ sourceTrip?.title }}」。</p><button class="creation-text-button" @click="details = true">查看交換與原作紀錄 ›</button></div>
          <template v-if="hasResult"><div class="creation-divider" /><div class="creation-quick-actions"><button class="creation-exchange-result" @click="startExchange(work)"><img class="creation-exchange-illustration" :src="asset('assets/memory/exchange-collectibles.png')" alt="" /><b>與朋友交換</b><small>留句話，交換風景</small></button><button @click="sharing = true"><span>＠</span><b>分享到 Threads</b><small>把作品變成話題</small></button></div><div class="creation-bottom-links"><button @click="details = true">作品資訊</button><a :href="image" :download="downloadName">下載圖片 ↓</a><NuxtLink :to="tripHref('/atlas', { journey: activeId || undefined })">回憶地圖 ↗</NuxtLink></div></template>
        </aside>
      </div>
    </template>
    <CreationUpload v-model="uploading" @upload="upload" />
    <CreationLibrary v-model="library" :start-tab="libraryTab" @select="selectWork" @exchange="startExchange" @generate="generateFromLibrary" @browse="reset" />
    <CreationPhotoExplore v-if="exploring" @close="exploring = false" @notebook="exploring = false; playing = true" />
    <template v-if="work && style">
      <ThreadsComposer v-model="sharing" :image="image" :location="work.location" :style-id="selected" :photo-id="work.photoId" />
      <CreationDialog v-model="details" title="作品的旅行紀錄">
        <div class="creation-detail-art"><img :src="image" :alt="work.title" /><div><h3>{{ work.title }}</h3><p>{{ work.location }}</p><small>原作旅程 · {{ sourceTrip?.title }}<br />原創作者 · {{ work.creator }}</small></div></div>
        <div v-if="giver?.companion" class="creation-companion"><span>↔</span><div><b>同行限定收藏</b><small>{{ giver.trip }} · 與 {{ giver.name }} 一起</small></div></div>
        <ol class="creation-provenance"><li><b>{{ work.creator }} 創作了這件作品</b><small>{{ new Date(work.createdAt).toLocaleDateString('zh-TW', { timeZone: 'Asia/Taipei' }) }} · {{ work.location }}</small></li><li v-if="giver"><b>{{ giver.name }} 交換給你</b><small>{{ originExchange?.resolvedAt ? new Date(originExchange.resolvedAt).toLocaleDateString('zh-TW', { timeZone: 'Asia/Taipei' }) : '已完成交換' }} · 保留原作者資訊</small></li><li><b>{{ saved ? '已存入這趟旅行的作品' : '作品預覽' }}</b><small>六種形式皆可交換收藏副本</small></li></ol>
        <blockquote v-if="originExchange?.note" class="creation-message">「{{ originExchange.note }}」<small>{{ originExchange.direction === 'received' ? giver?.name : '你' }} 的留言</small></blockquote>
        <blockquote v-if="originExchange?.reply" class="creation-message">「{{ originExchange.reply }}」<small>{{ originExchange.direction === 'received' ? '你' : giver?.name }} 的回覆</small></blockquote>
        <template #footer><a class="creation-secondary" :href="image" :download="downloadName">下載圖片 ↓</a><NuxtLink class="creation-primary" :to="tripHref('/atlas', { journey: activeId || undefined })" @click="details = false">在地圖上回顧 ↗</NuxtLink></template>
      </CreationDialog>
      <CreationDialog v-model="zoom" :title="hasResult ? '欣賞作品' : '欣賞風格範例'" wide><CreationArtwork class="creation-full-art" :work="displayWork" :alt="displayWork.title" /></CreationDialog>
      <CreationDialog v-model="sourceZoom" title="這次使用的原照片" wide><div class="studio-source-preview" :class="{ 'creation-cropped-source': selectedPhoto?.sourceCrop }"><img :src="sourceImage" :alt="selectedPhoto?.title" /></div><p class="creation-muted">{{ selectedPhoto?.title }} · {{ selectedPhoto?.location }}</p></CreationDialog>
      <CreationDialog v-model="playing" :title="style.name + ' · 互動收藏'" wide><CreationPlayground v-if="playing && canPlay" :work="work" :image="image" :giver="giver?.name" /></CreationDialog>
    </template>
    <CreationExchange v-if="exchangeTarget" v-model="exchanging" :work="exchangeTarget" />
    <CreationDialog v-model="formats" title="六種風格，會把照片變成什麼？" wide>
      <p class="creation-lead">看看各種風格的原照與成品範例，挑一種喜歡的收藏方式。</p>
      <div class="studio-guide-tabs" role="tablist" aria-label="六種 AI 生成風格"><button v-for="item in creationStyles" :key="item.id" role="tab" :aria-selected="guideSelected === item.id" @click="guideSelected = item.id">{{ item.name }}</button></div>
      <div class="studio-guide-comparison">
        <figure><span>原圖</span><img :src="asset('assets/memory/' + guideStyle.source)" :alt="guideStyle.location + '原圖'" :class="{ 'creation-guide-crop': guideStyle.sourceCrop }" /><figcaption>{{ guideStyle.location }}</figcaption></figure>
        <i aria-hidden="true">→</i>
        <figure><span>生成後</span><CreationArtwork :work="guideWork" :alt="guideStyle.name + '生成範例'" /><figcaption>{{ guideStyle.name }}</figcaption></figure>
      </div>
      <div class="studio-guide-copy"><small>{{ guideStyle.english }}</small><h3>{{ guideStyle.name }}</h3><p>{{ guideStyle.caption }}</p><span v-if="guideStyle.interactive">可互動 · {{ guideStyle.interactive }}</span></div>
    </CreationDialog>
  </section>
</template>

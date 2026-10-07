<script setup lang="ts">
import { creationPhotos, photosForTrip, type CreationPhoto } from '~/data/creation';
import { stopForPhoto, stopsForTrip } from '~/data/recap';
const open = defineModel<boolean>({ default: false });
// file：從裝置選的原檔，有後端時縮圖後上傳（useCreation 的 addPhoto）；範例照片沒有原檔
// stopId：這張照片在哪一站，作品才會出現在立體重遊的那一站
const emit = defineEmits<{ upload: [url: string, name: string, demoPhotoId?: string, file?: File, stopId?: string] }>();
const { activeId, activeTrip } = useTripContext();
const photos = computed(()=>{ const tripPhotos = photosForTrip(activeId.value); return tripPhotos.length ? tripPhotos : creationPhotos.filter(photo=>!photo.referenceOnly).slice(0,3); });
const stops = computed(() => stopsForTrip(activeId.value));
const stopId = ref('');
const asset = useAsset();
const url = ref(''), name = ref(''), error = ref(''), dragging = ref(false), reading = ref(false);
const sample = ref<CreationPhoto | null>(null);
const input = ref<HTMLInputElement>();
let version = 0, file: File | undefined;
function clear() { version++; if (url.value.startsWith('blob:')) URL.revokeObjectURL(url.value); url.value = ''; name.value = ''; sample.value = null; reading.value = false; file = undefined; }
function chooseSample(photo: CreationPhoto) { clear(); error.value = ''; sample.value = photo; url.value = asset('assets/memory/' + photo.source); name.value = photo.title + '.jpg'; stopId.value = stopForPhoto(photo.id) || ''; }
function read(picked?: File) {
  if (!picked) return;
  error.value = '';
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(picked.type) || picked.size > 20 * 1024 * 1024) { error.value = '請選擇 20 MB 以內的 JPG、PNG 或 WebP 圖片。'; return; }
  clear(); const token = version; const candidate = URL.createObjectURL(picked); const probe = new Image(); reading.value = true;
  probe.onload = () => { if (version !== token) { URL.revokeObjectURL(candidate); return; } url.value = candidate; name.value = picked.name; file = picked; reading.value = false; };
  probe.onerror = () => { URL.revokeObjectURL(candidate); if (version === token) { error.value = '圖片無法讀取，請換一張試試。'; reading.value = false; } };
  probe.src = candidate;
}
function choose(event: Event) { const target = event.target as HTMLInputElement; read(target.files?.[0]); target.value = ''; }
function drop(event: DragEvent) { dragging.value = false; read(event.dataTransfer?.files?.[0]); }
function confirm() { if (!url.value) return; emit('upload', sample.value?.source || url.value, name.value, sample.value?.id, sample.value ? undefined : file, stopId.value || undefined); url.value = ''; open.value = false; }
watch(open, value => { if (!value) { clear(); stopId.value = ''; } else error.value = ''; });
onBeforeUnmount(clear);
</script>
<template>
  <CreationDialog v-model="open" title="選一張旅行照片">
    <p class="creation-lead">{{ activeTrip?.title }} · 從相簿選一張這趟旅行的照片。</p>
    <div class="creation-upload-zone" :class="{ 'is-dragging': dragging }" @dragover.prevent="dragging = true" @dragleave.prevent="dragging = false" @drop.prevent="drop">
      <img v-if="url" :src="url" alt="選取照片預覽"><template v-else><span class="creation-upload-symbol">＋</span><b>{{ reading ? '正在讀取照片…' : '拖曳照片到這裡' }}</b><small>JPG、PNG、WebP · 最大 20 MB</small></template>
      <button class="creation-secondary" @click="input?.click()">{{ url ? '換一張照片' : '從裝置選擇' }}</button>
      <input ref="input" type="file" accept="image/jpeg,image/png,image/webp" class="sr-only" aria-label="上傳旅行照片" @change="choose">
    </div>
    <p v-if="name" class="creation-file-name">{{ name }}</p><p v-if="error" class="creation-error" role="alert">{{ error }}</p>
    <template v-if="stops.length">
      <label class="creation-label">這張照片在哪一站？ <span>選了之後，作品會出現在 3D 重遊的這一站</span></label>
      <div class="creation-stop-options" role="group" aria-label="照片拍攝的站點"><button v-for="stop in stops" :key="stop.id" :aria-pressed="stopId === stop.id" @click="stopId = stopId === stop.id ? '' : stop.id">{{ stop.name }}</button></div>
    </template>
    <label class="creation-label">也可以先試試這些照片 <span>選一張，看看能做出什麼收藏</span></label>
    <div class="creation-example-grid"><button v-for="photo in photos" :key="photo.id" :aria-pressed="sample?.id === photo.id" @click="chooseSample(photo)"><div :class="{ 'creation-cropped-source': photo.sourceCrop }"><img :src="asset('assets/memory/' + photo.source)" :alt="photo.location"></div><span>{{ photo.title }}</span></button></div>
    <template #footer><button class="creation-primary" :disabled="!url || reading" @click="confirm">使用這張照片</button></template>
  </CreationDialog>
</template>

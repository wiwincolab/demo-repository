<script setup lang="ts">
import { photosForTrip } from '~/data/creation';
const open = defineModel<boolean>({ default: false });
const emit = defineEmits<{ upload: [url: string, name: string]; example: [id: string] }>();
const { activeId, activeTrip } = useTripContext();
const photos = computed(()=>photosForTrip(activeId.value));
const asset = useAsset();
const url = ref(''), name = ref(''), error = ref(''), dragging = ref(false), reading = ref(false);
const input = ref<HTMLInputElement>();
let version = 0;
function clear() { version++; if (url.value) URL.revokeObjectURL(url.value); url.value = ''; name.value = ''; reading.value = false; }
function read(file?: File) {
  if (!file) return;
  error.value = '';
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 20 * 1024 * 1024) { error.value = '請選擇 20 MB 以內的 JPG、PNG 或 WebP 圖片。'; return; }
  clear(); const token = version; const candidate = URL.createObjectURL(file); const probe = new Image(); reading.value = true;
  probe.onload = () => { if (version !== token) { URL.revokeObjectURL(candidate); return; } url.value = candidate; name.value = file.name; reading.value = false; };
  probe.onerror = () => { URL.revokeObjectURL(candidate); if (version === token) { error.value = '圖片無法讀取，請換一張試試。'; reading.value = false; } };
  probe.src = candidate;
}
function choose(event: Event) { const target = event.target as HTMLInputElement; read(target.files?.[0]); target.value = ''; }
function drop(event: DragEvent) { dragging.value = false; read(event.dataTransfer?.files?.[0]); }
function confirm() { if (!url.value) return; emit('upload', url.value, name.value); url.value = ''; open.value = false; }
watch(open, value => { if (!value) clear(); else error.value = ''; });
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
    <p class="creation-muted">照片只在你的裝置預覽。這個版本不會上傳照片；生成流程使用預製風格範例。</p>
    <label v-if="photos.length" class="creation-label">這趟旅行的照片</label>
    <div v-if="photos.length" class="creation-example-grid"><button v-for="photo in photos" :key="photo.id" @click="emit('example', photo.id); open = false"><div :class="{ 'creation-cropped-source': photo.sourceCrop }"><img :src="asset('assets/memory/' + photo.source)" :alt="photo.location"></div><span>{{ photo.title }}</span></button></div>
    <template #footer><button class="creation-primary" :disabled="!url || reading" @click="confirm">使用這張照片</button></template>
  </CreationDialog>
</template>

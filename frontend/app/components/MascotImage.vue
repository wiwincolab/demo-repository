<script setup lang="ts">
const props = withDefaults(defineProps<{ src: string; alt: string; loading?: 'eager' | 'lazy' }>(), { loading: 'eager' });
const image = ref<HTMLImageElement>();
const state = ref<'loading' | 'ready' | 'error'>('loading');
let request = 0;
watch(() => props.src, () => { request++; state.value = 'loading'; });
async function loaded() {
  const current = ++request;
  const element = image.value;
  if (!element) return;
  try { await element.decode(); } catch { /* Some browsers cannot decode an already loaded image. */ }
  if (current === request) state.value = element.naturalWidth ? 'ready' : 'error';
}
function failed() { request++; state.value = 'error'; }
onMounted(() => { if (image.value?.complete) { if (image.value.naturalWidth) void loaded(); else failed(); } });
</script>

<template>
  <span class="mascot-image" :class="`is-${state}`" :aria-busy="state === 'loading'">
    <span v-if="state === 'loading'" class="mascot-image-placeholder" role="status" aria-label="吉祥物圖片載入中"><span class="mascot-image-spinner" aria-hidden="true" /></span>
    <img ref="image" :src="src" :alt="alt" :loading="loading" decoding="async" @load="loaded" @error="failed" />
    <span v-if="state === 'error'" class="mascot-image-error" role="status">圖片暫時無法載入</span>
  </span>
</template>

<style scoped>
.mascot-image{display:block;position:relative;width:100%;height:100%;overflow:hidden;background:#edf3f4}
.mascot-image img{display:block;width:100%;height:100%;object-fit:var(--mascot-object-fit,cover);object-position:var(--mascot-object-position,50% 50%);opacity:0;transition:opacity .25s}
.mascot-image.is-ready img{opacity:1}
.mascot-image-placeholder,.mascot-image-error{position:absolute;inset:0;display:grid;place-items:center}
.mascot-image-placeholder{background:linear-gradient(110deg,#edf3f4 25%,#fff 45%,#edf3f4 65%);background-size:240% 100%;animation:mascot-shimmer 1.6s ease-in-out infinite}
.mascot-image-spinner{width:24px;height:24px;border:3px solid #cce3e8;border-top-color:#009fcc;border-radius:50%;animation:mascot-spin .9s linear infinite}
.mascot-image-error{padding:8px;color:#617c86;font-size:11px;text-align:center}
@keyframes mascot-shimmer{to{background-position:-170% 0}}
@keyframes mascot-spin{to{transform:rotate(360deg)}}
@media(prefers-reduced-motion:reduce){.mascot-image-placeholder,.mascot-image-spinner{animation:none}.mascot-image img{transition:none}}
</style>

<script setup lang="ts">
const asset = useAsset();
const host = ref<HTMLElement>();
const blinkImage = ref<HTMLImageElement>();
const delighted = ref(false);
const visible = ref(false);
const pageActive = ref(true);
const blinkReady = ref(false);
let observer: IntersectionObserver | undefined;
let timer: ReturnType<typeof setTimeout> | undefined;
function syncPageVisibility() { pageActive.value = !document.hidden; }
function greet() {
  if (delighted.value) return;
  delighted.value = true;
  timer = setTimeout(() => { delighted.value = false; }, 1400);
}
onMounted(() => {
  // SSR/cached images can finish loading before Vue attaches the load listener.
  blinkReady.value = !!blinkImage.value?.complete && blinkImage.value.naturalWidth > 0;
  syncPageVisibility();
  document.addEventListener('visibilitychange', syncPageVisibility);
  observer = new IntersectionObserver(entries => { visible.value = entries.some(entry => entry.isIntersecting); });
  if (host.value) observer.observe(host.value);
});
onBeforeUnmount(() => {
  observer?.disconnect();
  clearTimeout(timer);
  document.removeEventListener('visibilitychange', syncPageVisibility);
});
</script>

<template>
  <span ref="host" class="page-mascot" :class="{ 'is-delighted': delighted, 'is-paused': !visible || !pageActive }">
    <button type="button" aria-label="摸摸吉祥物" @click="greet" @pointerenter="greet">
      <span class="mascot-pose">
        <img :src="asset('assets/memory/motion/mascot-seated.png')" alt="" width="128" height="128" decoding="async" />
        <img ref="blinkImage" class="mascot-blink" :class="{ 'is-ready': blinkReady }" :src="asset('assets/memory/motion/mascot-seated-blink.png')" alt="" width="128" height="128" decoding="async" @load="blinkReady = true" @error="blinkReady = false" />
      </span>
    </button>
    <span class="mascot-seat" aria-hidden="true" />
  </span>
</template>

<style scoped>
.page-mascot{display:inline-flex;position:relative;align-items:flex-end;justify-content:center;flex-shrink:0;width:88px;height:91px;vertical-align:bottom;isolation:isolate}
.page-mascot button{display:block;position:relative;z-index:1;width:88px;height:88px;padding:0 0 1px;margin:0;border:0;background:none;cursor:pointer;touch-action:manipulation;transform-origin:50% 94%;animation:seated-idle 12s ease-in-out infinite}
.mascot-pose{display:block;position:relative;width:100%;height:100%;transform-origin:50% 94%;animation:seated-breathe 4.6s ease-in-out infinite}
.page-mascot img{display:block;width:100%;height:100%;object-fit:contain;pointer-events:none}
/* Overlay only the eyes so the original felt body stays perfectly still during a blink. */
.page-mascot .mascot-blink{position:absolute;inset:0;opacity:0;mask-image:radial-gradient(ellipse 10% 11% at 37% 37%,#000 90%,transparent 100%),radial-gradient(ellipse 10% 11% at 55.5% 39.3%,#000 90%,transparent 100%)}
.mascot-blink.is-ready{animation:seated-blink 8s steps(1,end) infinite}
.mascot-seat{position:absolute;bottom:0;width:94%;height:8px;border-radius:50%;background:#c4d9d4;box-shadow:0 3px 0 #e7eeea;z-index:0}
.page-mascot button:focus-visible{outline:3px solid #d9ae48;outline-offset:3px;border-radius:18px}
.is-delighted button{animation:seated-wiggle .7s ease-in-out 2}
.is-paused button,.is-paused .mascot-pose,.is-paused .mascot-blink{animation-play-state:paused}
@keyframes seated-breathe{0%,100%{transform:scale(1)}50%{transform:scale(1.015,.985)}}
@keyframes seated-idle{0%,17%,34%,72%,100%{transform:rotate(0)}22%{transform:rotate(-2.8deg)}28%{transform:rotate(2deg)}79%{transform:rotate(1.8deg)}84%{transform:rotate(-2deg)}89%{transform:rotate(0)}}
/* A single blink, then an occasional double blink, with unequal pauses between them. */
@keyframes seated-blink{0%,20%,22%,72%,74%,77%,79%,100%{opacity:0}20.1%,21.9%,72.1%,73.9%,77.1%,78.9%{opacity:1}}
@keyframes seated-wiggle{0%,100%{transform:rotate(0)}25%{transform:rotate(-5deg)}75%{transform:rotate(5deg)}}
@media(max-width:600px){.page-mascot{width:70px;height:73px}.page-mascot button{width:70px;height:70px}}
@media(prefers-reduced-motion:reduce){.page-mascot button,.page-mascot .mascot-pose,.page-mascot .mascot-blink{animation:none}.page-mascot .mascot-blink{opacity:0}}
</style>

<style>
/* Each perch belongs to its page's document flow and scrolls with that content. */
.mascot-perch{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:14px;align-items:end;margin-bottom:20px}
.mascot-perch>header,.mascot-perch>.page-heading,.mascot-perch>.wardrobe-heading{margin-bottom:0}
.mascot-perch>.page-mascot{margin-bottom:4px}
@media(max-width:600px){.mascot-perch{gap:8px}.mascot-perch>header{min-width:0}}
</style>

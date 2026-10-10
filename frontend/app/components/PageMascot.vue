<script setup lang="ts">
const asset = useAsset();
const host = ref<HTMLElement>();
const delighted = ref(false);
const visible = ref(false);
let observer: IntersectionObserver | undefined;
let timer: ReturnType<typeof setTimeout> | undefined;
function greet() {
  if (delighted.value) return;
  delighted.value = true;
  timer = setTimeout(() => { delighted.value = false; }, 1400);
}
onMounted(() => {
  observer = new IntersectionObserver(entries => { visible.value = entries.some(entry => entry.isIntersecting); });
  if (host.value) observer.observe(host.value);
});
onBeforeUnmount(() => { observer?.disconnect(); clearTimeout(timer); });
</script>

<template>
  <span ref="host" class="page-mascot" :class="{ 'is-delighted': delighted, 'is-paused': !visible }">
    <button type="button" aria-label="摸摸吉祥物" @click="greet" @pointerenter="greet">
      <img :src="asset('assets/memory/motion/mascot-seated.png')" alt="" width="128" height="128" decoding="async" />
    </button>
    <span class="mascot-seat" aria-hidden="true" />
  </span>
</template>

<style scoped>
.page-mascot{display:inline-flex;position:relative;align-items:flex-end;justify-content:center;flex-shrink:0;width:88px;height:91px;vertical-align:bottom;isolation:isolate}
.page-mascot button{display:block;position:relative;z-index:1;width:88px;height:88px;padding:0 0 1px;margin:0;border:0;background:none;cursor:pointer;touch-action:manipulation;transform-origin:50% 94%;animation:seated-breathe 5s ease-in-out infinite}
.page-mascot img{display:block;width:100%;height:100%;object-fit:contain;pointer-events:none}
.mascot-seat{position:absolute;bottom:0;width:94%;height:8px;border-radius:50%;background:#c4d9d4;box-shadow:0 3px 0 #e7eeea;z-index:0}
.page-mascot button:focus-visible{outline:3px solid #d9ae48;outline-offset:3px;border-radius:18px}
.is-delighted button{animation:seated-wiggle .7s ease-in-out 2}
.is-paused button{animation-play-state:paused}
@keyframes seated-breathe{0%,100%{transform:scale(1)}50%{transform:scale(1.015,.985)}}
@keyframes seated-wiggle{0%,100%{transform:rotate(0)}25%{transform:rotate(-5deg)}75%{transform:rotate(5deg)}}
@media(max-width:600px){.page-mascot{width:70px;height:73px}.page-mascot button{width:70px;height:70px}}
@media(prefers-reduced-motion:reduce){.page-mascot button{animation:none}}
</style>

<style>
/* Each perch belongs to its page's document flow and scrolls with that content. */
.mascot-perch{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:14px;align-items:end;margin-bottom:20px}
.mascot-perch>header,.mascot-perch>.page-heading,.mascot-perch>.wardrobe-heading{margin-bottom:0}
.mascot-perch>.page-mascot{margin-bottom:4px}
@media(max-width:600px){.mascot-perch{gap:8px}.mascot-perch>header{min-width:0}}
</style>

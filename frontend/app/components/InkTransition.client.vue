<script setup lang="ts">
import { createInkController, type InkSurface } from '~/utils/ink/controller';
import { inkColors, pickEffect } from '~/utils/ink/effects';
import { createInkRenderer } from '~/utils/ink/renderer';

const canvas = ref<HTMLCanvasElement>();
const router = useRouter();
const nuxt = useNuxtApp();
let cleanup = () => {};

onMounted(() => {
  const element = canvas.value;
  if (!element) return;
  const renderer = createInkRenderer(element);
  if (!renderer) return;
  const ink = createInkController({
    now: () => performance.now(),
    raf: callback => { requestAnimationFrame(callback); },
    canAnimate: () => !document.hidden && !matchMedia('(prefers-reduced-motion: reduce)').matches,
    random: Math.random,
    setTimer: (fn, ms) => {
      const id = window.setTimeout(fn, ms);
      return () => clearTimeout(id);
    },
  });
  const pointer = { x: 0, y: 0, at: -Infinity };
  const onPointer = (event: PointerEvent) => {
    Object.assign(pointer, { x: event.clientX, y: event.clientY, at: performance.now() });
  };
  window.addEventListener('pointerdown', onPointer, true);
  const surface: InkSurface = {
    begin(effect) {
      if (!renderer.canDraw(effect)) return null;
      const rect = renderer.resize();
      if (!rect.width || !rect.height) return null;
      element.style.visibility = 'visible';
      const fresh = performance.now() - pointer.at < 1200;
      return { origin: [
        fresh ? Math.max(0, Math.min(rect.width, pointer.x - rect.left)) : rect.width / 2,
        fresh ? Math.max(0, Math.min(rect.height, pointer.y - rect.top)) : rect.height * .42,
      ] };
    },
    draw: renderer.draw,
    clear() { renderer.clear(); element.style.visibility = 'hidden'; },
    degrade: renderer.degrade,
  };
  ink.attach(surface);
  let painted: (() => void) | undefined;
  const release = () => { painted?.(); painted = undefined; };
  const unhook = nuxt.hook('page:finish', release);
  // Resolve lazy route components first; keep the old page until ink covers it.
  const removeGuard = router.beforeResolve((to, from) => {
    const effect = from.matched.length ? pickEffect(from.path, to.path) : null;
    if (!effect || !ink.ready()) return;
    return new Promise<void>(resolve => {
      ink.play({ effect, colors: inkColors('light'), atSwap: () => {
        const ready = new Promise<void>(done => { painted = done; });
        resolve();
        return ready;
      } });
    });
  });
  const removeAfter = router.afterEach((_to, _from, failure) => { if (failure) release(); });
  const removeError = router.onError(release);
  // A background tab or lost GPU context must never leave an invisible click blocker.
  const stop = () => { ink.attach(null); release(); };
  const resume = () => { ink.attach(surface); };
  const visibility = () => { if (document.hidden) stop(); else resume(); };
  document.addEventListener('visibilitychange', visibility);
  element.addEventListener('webglcontextlost', stop);
  element.addEventListener('webglcontextrestored', resume);
  const warm = window.setTimeout(renderer.warm, 800);
  cleanup = () => {
    removeGuard(); removeAfter(); removeError(); unhook();
    stop(); clearTimeout(warm);
    window.removeEventListener('pointerdown', onPointer, true);
    document.removeEventListener('visibilitychange', visibility);
    element.removeEventListener('webglcontextlost', stop);
    element.removeEventListener('webglcontextrestored', resume);
    renderer.dispose();
  };
});
onBeforeUnmount(() => cleanup());
</script>

<template>
  <Teleport to="body">
    <canvas ref="canvas" class="ink-transition" aria-hidden="true" />
  </Teleport>
</template>

<style scoped>
.ink-transition { position: fixed; inset: 0; width: 100%; height: 100%; z-index: 10000; visibility: hidden; touch-action: none; }
</style>

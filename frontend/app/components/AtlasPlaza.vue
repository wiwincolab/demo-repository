<script setup lang="ts">
import { gsap } from 'gsap';
import { atlasParkZones, type AtlasParkZone } from '~/data/atlas-plaza';
import '~/assets/css/atlas-plaza.css';
import '~/assets/css/atlas-painted-park.css';

const asset = useAsset();
const root = ref<HTMLElement>(), dialog = ref<HTMLDialogElement>();
const selected = ref<AtlasParkZone | null>(null);
const paused = ref(false), reduced = ref(false);
const closeView = ref(false);
const failedImages = ref<string[]>([]);
const highlighted = ref<string>();
const activeZone = computed(() => selected.value?.id || highlighted.value);
const walking = ref(false);
const world = ref<HTMLElement>();
const viewport = ref<HTMLElement>();
const pan = ref(0), dragging = ref(false), canPan = ref(false);
let resizeObserver: ResizeObserver | undefined;
let dragStart = 0, dragScroll = 0, dragMoved = false, dragPointer: number | null = null;
let returnScroll = 0;
function updatePan() {
  const el = viewport.value;
  if (el) pan.value = el.scrollLeft / Math.max(1, el.scrollWidth - el.clientWidth);
}
function panTo(position: number) {
  const el = viewport.value;
  if (!el || walking.value) return;
  context?.add(() => gsap.to(el, {scrollLeft:position * (el.scrollWidth-el.clientWidth),duration:reduced.value?0:.42,ease:'power2.out',overwrite:true}));
}
function beginPan(event: PointerEvent) {
  dragMoved = false;
  if (walking.value) return;
  gsap.killTweensOf(viewport.value!);
  if (event.pointerType !== 'mouse' || event.button !== 0) return;
  dragPointer = event.pointerId; dragStart = event.clientX; dragScroll = viewport.value!.scrollLeft;
}
function movePan(event: PointerEvent) {
  if (dragPointer !== event.pointerId) return;
  const distance = event.clientX - dragStart;
  if (!dragMoved && Math.abs(distance) < 6) return;
  dragMoved = true; dragging.value = true;
  viewport.value!.setPointerCapture(event.pointerId);
  viewport.value!.scrollLeft = dragScroll - distance;
}
function endPan(event: PointerEvent) {
  if (dragPointer !== event.pointerId) return;
  if (viewport.value?.hasPointerCapture(event.pointerId)) viewport.value.releasePointerCapture(event.pointerId);
  dragPointer = null; dragging.value = false;
}
function preventDragClick(event: MouseEvent) {
  if (dragMoved && event.detail) { event.preventDefault(); event.stopPropagation(); }
}
// Coordinates are anchored to the approved illustration, not the browser viewport.
const positions: Record<string, {x:number;y:number}> = { cities:{x:23,y:33}, town:{x:77,y:36}, collection:{x:23,y:72}, wardrobe:{x:77,y:77} };
// Trace the visible landmark silhouettes in the 1086 × 1448 painted background.
// These are separate from the small, alpha-masked artwork in each nameplate.
const landmarkContours: Record<string, string> = {
  cities: 'M2 278 L24 260 L55 269 L135 216 L185 251 L211 237 L257 252 L277 232 L319 246 L319 215 L312 202 L333 197 L334 179 L351 172 L357 194 L380 197 L374 215 L374 297 L409 309 L411 334 L430 342 L432 393 L418 416 L411 451 L363 470 L319 486 L278 480 L225 495 L174 489 L140 494 L98 477 L63 470 L63 441 L33 432 L34 402 L5 382 Z',
  town: 'M711 322 L739 309 L740 289 L723 286 L773 270 L793 279 L800 261 L792 249 L830 208 L845 207 L842 183 Q840 163 860 168 L881 183 L877 203 L899 209 L929 245 L921 305 L939 308 L943 271 L930 263 L967 245 L990 220 L1003 240 L1048 266 L1032 276 L1037 322 L1058 333 L1055 361 L1019 382 L1068 401 L1067 419 L1055 421 L1055 480 L1078 490 L1077 531 L1044 548 L1005 537 L965 549 L923 526 L879 519 L852 491 L811 484 L800 454 L812 420 L825 389 L790 378 L754 369 L716 350 Z',
  collection: 'M12 741 L48 720 L54 704 Q71 676 108 690 L155 705 Q172 713 181 725 Q195 707 223 716 L319 739 L307 801 L318 834 L359 849 L346 862 L345 930 L366 941 L371 993 L345 1006 L302 1005 L284 1020 L263 1015 L231 1041 L177 1031 L162 1018 L126 1037 L98 1029 L68 1040 L54 1019 L36 1014 L34 965 L18 948 L20 890 L7 854 L26 838 L32 782 L12 778 Z',
  wardrobe: 'M747 831 L800 788 L849 771 L871 748 L1003 701 L1028 710 L1063 728 L1062 749 L1036 762 L1037 805 L1050 805 L1081 848 L1068 855 L1071 927 L1053 946 L1078 964 L1084 1013 L1071 1045 L1028 1059 L984 1051 L953 1037 L909 1044 L854 1037 L816 1041 L780 1026 L741 1020 L721 1001 L728 973 L738 953 L735 885 L736 863 L757 848 Z',
};
let opener: HTMLElement | null = null, closing = false;
let context: gsap.Context | undefined, media: gsap.MatchMedia | undefined;
let ambient: gsap.core.Timeline | undefined;
const moving = computed(() => !paused.value && !reduced.value);
const artwork = (zone: AtlasParkZone) => asset('assets/atlas-plaza/v3/' + zone.image);
function hover(event: PointerEvent, enter: boolean) {
  if (event.pointerType !== 'mouse') return;
  highlighted.value = enter ? (event.currentTarget as HTMLElement).dataset.zone : undefined;
  if (!moving.value) return;
  const button = event.currentTarget as HTMLElement;
  const image = button.querySelector('.park-art-silhouette');
  context?.add(() => gsap.to(image, { y: enter ? -4 : 0, duration: .3, ease: 'power2.out', overwrite: true }));
}
watch([moving, selected], ([value, zone]) => ambient?.paused(!value || !!zone));
async function openZone(zone: AtlasParkZone, event: MouseEvent) {
  if (walking.value || closing || dialog.value?.open) return;
  opener = root.value?.querySelector<HTMLElement>(`button[data-zone="${zone.id}"]`) ?? null;
  returnScroll = viewport.value!.scrollLeft;
  selected.value = zone;
  walking.value = true;
  await nextTick();
  context?.add(() => {
    const duration = reduced.value ? 0 : .55;
    gsap.timeline({onComplete:()=>{
      walking.value = false;
      dialog.value?.showModal();
      context?.add(()=>gsap.fromTo(dialog.value!, { y: reduced.value ? 0 : 16, opacity: 0 }, { y: 0, opacity: 1, duration: reduced.value ? 0 : .25, ease: 'power3.out' }));
    }})
      .to(viewport.value!, {scrollLeft:Math.max(0,Math.min(positions[zone.id]!.x/100*world.value!.offsetWidth-viewport.value!.clientWidth/2,viewport.value!.scrollWidth-viewport.value!.clientWidth)),duration,ease:'power2.inOut',overwrite:true},0);
  });
}
function afterClose() {
  selected.value = null; closing = false; opener?.focus({ preventScroll: true });
  context?.add(()=>{
    gsap.to(viewport.value!,{scrollLeft:returnScroll,duration:reduced.value?0:.4,ease:'power2.out',overwrite:true});
  });
}
function closeZone() {
  if (closing) return;
  closing = true;
  context?.add(() => gsap.to(dialog.value!, { y: reduced.value ? 0 : 8, opacity: 0, duration: reduced.value ? 0 : .16, onComplete: () => dialog.value?.close() }));
}
function backdrop(event: MouseEvent) { if (event.target === dialog.value) closeZone(); }
onMounted(() => {
  context = gsap.context(() => {}, root.value);
  const positionViewport = () => {
    const el = viewport.value;
    if (el) {
      canPan.value = el.scrollWidth > el.clientWidth + 2;
      el.scrollLeft = pan.value * Math.max(0, el.scrollWidth-el.clientWidth);
    }
  };
  positionViewport();
  resizeObserver = new ResizeObserver(positionViewport);
  resizeObserver.observe(viewport.value!);
  resizeObserver.observe(world.value!);
  media = gsap.matchMedia(root.value);
  media.add({ reduce: '(prefers-reduced-motion: reduce)', normal: '(prefers-reduced-motion: no-preference)' }, ctx => {
    reduced.value = !!ctx.conditions?.reduce;
    if (reduced.value) return;
    const intro = gsap.timeline({ defaults: { ease: 'power3.out' } })
      .from('.painted-park-image', { opacity: 0, duration: .65 })
      .from('.park-zone-label', { y: 9, opacity: 0, duration: .4, stagger: .1 }, .25)
      .from('.park-beacon', { y: -9, scale: .8, opacity: 0, duration: .35, stagger: .1, clearProps: 'transform,opacity' }, .8);
    // Guide attention from pin to glass glint, with one destination active at a time.
    ambient = gsap.timeline({ delay: 2, repeat: -1, repeatDelay: 5, defaults: { ease: 'sine.inOut' } });
    for (const [index, zone] of atlasParkZones.entries()) {
      const target = `[data-zone="${zone.id}"]`;
      const start = index * 4;
      ambient.to(`${target} .park-beacon>svg`, { y: -3, duration: .5 }, start)
        .to(`${target} .park-beacon>svg`, { y: 0, duration: .65 }, start + .5)
        .fromTo(`${target} .park-beacon-ring`, { scale: .7, opacity: .65 }, { scale: 1.4, opacity: 0, duration: 1.5, ease: 'sine.out' }, start + .3)
        .fromTo(`${target} .park-glass-sheen`, { xPercent: -160, opacity: 0 }, { xPercent: 160, opacity: .65, duration: 1.3 }, start + .5)
        .to(`${target} .park-glass-sheen`, { opacity: 0, duration: .3 }, start + 1.8);
    }
    ambient.paused(paused.value);
    if (paused.value) intro.progress(1);
    return () => { ambient = undefined; };
  });
});
onBeforeUnmount(() => { resizeObserver?.disconnect(); context?.revert(); media?.revert(); dialog.value?.close(); });
</script>

<template>
  <section ref="root" class="atlas-plaza painted-plaza" :class="{'motion-paused': !moving, 'is-close-view': closeView}" aria-labelledby="plaza-title">
    <header class="park-heading">
      <div><span class="park-eyebrow">MEMORY ATLAS</span><h1 id="plaza-title">回憶廣場<span class="park-title-dot" aria-hidden="true" /></h1><p>{{ canPan ? '左右滑動探索園區 · 點選入口開始' : '歡迎回來，今天想去哪裡？' }}</p></div>
      <div class="park-heading-actions"><button class="park-view-toggle" :aria-pressed="closeView" @click="closeView = !closeView; pan = 0"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10" cy="10" r="6"/><path d="m15 15 6 6M7 10h6"/><path v-if="!closeView" d="M10 7v6"/></svg>{{ closeView ? '全園總覽' : '近看園區' }}</button><button class="park-motion" :aria-pressed="paused || reduced" :disabled="reduced" :aria-label="reduced ? '已依系統設定減少動態' : paused ? '開啟環境動態' : '暫停環境動態'" @click="paused = !paused"><span aria-hidden="true">{{ moving ? 'Ⅱ' : '▷' }}</span></button></div>
    </header>

    <div ref="viewport" class="lobby-viewport" :class="{'is-dragging':dragging}" tabindex="0" role="region" aria-label="可左右滑動的回憶廣場" @scroll.passive="updatePan" @pointerdown="beginPan" @pointermove="movePan" @pointerup="endPan" @pointercancel="endPan" @lostpointercapture="endPan" @click.capture="preventDragClick" @keydown.left.prevent="panTo(Math.max(0,pan-.35))" @keydown.right.prevent="panTo(Math.min(1,pan+.35))">
    <div ref="world" class="park-stage">
      <img class="painted-park-image" :src="asset('assets/atlas-plaza/painted-v1/park.png')" alt="湖畔回憶園區，四個主題區由石階、橋梁與步道相連" draggable="false" />
      <svg class="park-landmark-highlights" viewBox="0 0 1086 1448" preserveAspectRatio="none" aria-hidden="true">
        <g v-for="(zone, index) in atlasParkZones" :key="zone.id" :class="{'is-highlighted':activeZone===zone.id}" :style="{'--contour-delay':(-index * 2)+'s'}" @pointerenter="highlighted = zone.id" @pointerleave="highlighted = undefined" @click="openZone(zone, $event)">
          <path class="park-landmark-hit" :d="landmarkContours[zone.id]"/>
          <path class="park-landmark-outline" :d="landmarkContours[zone.id]"/>
          <path class="park-landmark-runner" :d="landmarkContours[zone.id]" pathLength="100"/>
        </g>
      </svg>
      <div class="park-water-light" aria-hidden="true"><i/><i/><i/></div>
      <nav class="park-destinations" aria-label="選擇回憶樂園區域">
        <button v-for="zone in atlasParkZones" :key="zone.id" class="park-zone" :class="{'is-selected':selected?.id===zone.id, 'is-highlighted':activeZone===zone.id}" :data-zone="zone.id" :style="{ '--zone-x': positions[zone.id]!.x + '%', '--zone-y': positions[zone.id]!.y + '%' }" :aria-label="zone.name" :aria-disabled="walking" aria-haspopup="dialog" @click="openZone(zone, $event)" @focus="highlighted = zone.id" @blur="highlighted = undefined" @pointerenter="hover($event, true)" @pointerleave="hover($event, false)">
          <span class="park-place-aura" aria-hidden="true" />
          <span class="park-beacon" aria-hidden="true"><span class="park-beacon-ring"/><svg viewBox="0 0 24 24"><path d="M12 3a7 7 0 0 0-7 7c0 5 7 11 7 11s7-6 7-11a7 7 0 0 0-7-7Z"/><circle cx="12" cy="10" r="2.4"/></svg></span>
          <span class="park-zone-label">
            <span class="park-glass-surface" aria-hidden="true"><span class="park-glass-sheen"/></span>
            <span class="park-art-medallion"><span v-if="!failedImages.includes(zone.id)" class="park-art-silhouette">
              <img class="park-zone-art" :src="artwork(zone)" alt="" draggable="false" @error="failedImages.push(zone.id)"/>
            </span><span v-else>{{ zone.number }}</span></span>
            <span class="park-label-copy"><span class="park-zone-caption"><span class="park-zone-index">{{ zone.number }}</span> {{ zone.short }}</span><strong>{{ zone.name }}</strong></span>
            <span class="park-zone-arrow" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m9 5 7 7-7 7"/></svg></span>
          </span>
        </button>
      </nav>
    </div>
    </div>
    <div v-show="canPan" class="lobby-pan-controls" aria-label="廣場視野">
      <button aria-label="向左逛廣場" :disabled="pan<.01 || walking" @click="panTo(Math.max(0,pan-.5))">←</button>
      <div class="lobby-pan-guide"><span>{{ pan<.3?'出發站 · 收藏館':pan>.7?'積木世界 · 換裝屋':'左右滑動，逛逛廣場' }}</span><div class="lobby-pan-track"><span :style="{left:(pan*76)+'%'}"/></div></div>
      <button aria-label="向右逛廣場" :disabled="pan>.99 || walking" @click="panTo(Math.min(1,pan+.5))">→</button>
    </div>
    <p class="park-footnote" role="status"><span class="lobby-status-dot"/><span>{{ walking && selected ? '正在前往'+selected.short+'…' : '點選圖示或名稱牌，探索四個回憶空間。' }}</span></p>

    <dialog ref="dialog" class="park-dialog" aria-labelledby="park-zone-title" @cancel.prevent="closeZone" @close="afterClose" @click="backdrop">
      <template v-if="selected">
        <div class="park-dialog-art"><img class="park-dialog-illustration" :src="artwork(selected)" alt="" /></div>
        <button class="park-dialog-close" aria-label="返回廣場" @click="closeZone"><MemoryMotionIcon name="close" /></button>
        <div class="park-dialog-copy"><span class="park-dialog-eyebrow">{{ selected.short }}</span><h2 id="park-zone-title">{{ selected.name }}</h2><h3>{{ selected.title }}</h3><p>{{ selected.description }}</p><div class="park-zone-tags"><span v-for="tag in selected.tags" :key="tag">{{ tag }}</span></div>
          <NuxtLink v-if="selected.destination" :to="selected.destination" class="park-enter">{{ selected.action }}<MemoryMotionIcon name="arrow" /></NuxtLink>
          <div v-else class="park-coming"><span>即將開放</span><p>旅伴的新衣櫥，正在準備中。</p><button @click="closeZone">繼續逛廣場 <span aria-hidden="true">↗</span></button></div>
        </div>
      </template>
    </dialog>
  </section>
</template>

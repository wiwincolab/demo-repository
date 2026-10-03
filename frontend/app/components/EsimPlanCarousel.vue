<script setup lang="ts">
import type { Usage } from '~/types/trip';
import { esimPlan } from '~/utils/esim';
import { esimPriceSource } from '~/data/esim-catalog';
const props = defineProps<{ modelValue: Usage; days: number; cover: string; location: string; purchased: boolean; advised: boolean }>();
const emit = defineEmits<{ 'update:modelValue': [usage: Usage]; compare: [] }>();
const asset = useAsset();
const modes: Usage[] = ['light','normal','heavy'];
const offers = computed(() => modes.map(mode => ({mode,...esimPlan(mode,props.days)})));
const index = computed(() => modes.indexOf(props.modelValue));
const viewport = ref<HTMLElement>();
const offset = ref(0), dragging = ref(false);
let startX = 0, startY = 0, pointer: number | null = null;
function select(i: number) { if(!props.purchased && i>=0 && i<modes.length) emit('update:modelValue',modes[i]!); }
function begin(e: PointerEvent) {
  if(props.purchased || (e.pointerType==='mouse' && e.button!==0) || (e.target as HTMLElement).closest('a,button')) return;
  startX=e.clientX; startY=e.clientY; pointer=e.pointerId;
  viewport.value?.setPointerCapture(e.pointerId);
}
function move(e: PointerEvent) {
  if(pointer!==e.pointerId) return;
  const dx=e.clientX-startX, dy=e.clientY-startY;
  if(!dragging.value && Math.abs(dy)>Math.abs(dx) && Math.abs(dy)>10) { end(); return; }
  if(Math.abs(dx)>10) dragging.value=true;
  offset.value = (index.value===0 && dx>0 || index.value===2 && dx<0) ? dx*.2 : dx;
}
function end(e?: PointerEvent) {
  if(e && pointer!==e.pointerId) return;
  if(e?.type==='pointerup' && dragging.value && Math.abs(offset.value)>45) select(index.value+(offset.value<0?1:-1));
  pointer=null; dragging.value=false; offset.value=0;
}
watch(()=>props.modelValue,()=>{offset.value=0;});
</script>

<template>
  <section class="esim-carousel" aria-label="選擇上網方案" aria-roledescription="輪播">
    <div class="esim-levels" aria-label="流量使用程度" @keydown.right.prevent="select(index+1)" @keydown.left.prevent="select(index-1)">
      <button v-for="(offer,i) in offers" :key="offer.mode" :aria-pressed="modelValue===offer.mode" :disabled="purchased" @click="select(i)"><span class="esim-level-bars" aria-hidden="true"><i v-for="n in 3" :key="n" :class="{on:n<=i+1}"/></span>{{ offer.label }}<small>{{ ['日常聯絡','照片社群','影音熱點'][i] }}</small></button>
    </div>
    <div ref="viewport" class="esim-carousel-window" :class="{'is-dragging':dragging,'is-locked':purchased}" @pointerdown="begin" @pointermove="move" @pointerup="end" @pointercancel="end()" @lostpointercapture="end()">
      <div class="esim-carousel-strip" :style="{transform:`translateX(calc(${-index*100}% + ${offset}px))`}">
        <article v-for="(offer,i) in offers" :key="offer.mode" class="esim-plan-card" :inert="i!==index" :aria-hidden="i!==index" :aria-label="`${offer.label}方案 ${i+1} / 3`">
          <div class="esim-destination"><img :src="asset(cover)" :alt="location+'旅行風景'" draggable="false"/><div><span class="esim-destination-code">JPN</span><strong>{{ location }}<small>{{ days }} 天的旅行</small></strong><span class="esim-destination-label">{{ purchased?'我的 eSIM':advised?'依需求選擇':'日本旅行上網' }}</span></div></div>
          <div class="esim-plan-body">
            <div class="esim-carrier"><span><EsimIcon name="signal" :size="14"/> Docomo (IIJ) <b>4G</b></span><span>{{ offer.days }} 天方案</span></div>
            <div class="esim-plan-title"><h2>{{ offer.name }}</h2><button v-if="!purchased" @click="emit('compare')">方案詳情<EsimIcon name="arrow" :size="13"/></button><span v-else class="esim-paid-tag">已購買</span></div>
            <p class="esim-plan-description">{{ offer.reason }}</p>
            <p class="esim-plan-rule">{{ offer.unlimited?'每日 10GB 高速，超額降至 256kbps':'每日額度重置，不跨日累積' }}</p>
            <p v-if="offer.days!==days" class="esim-duration-note">{{ days }} 天行程，搭配 {{ offer.days }} 天方案。</p>
            <div class="esim-plan-price"><div><small>去趣官網參考價</small><strong><small>NT$</small>{{ offer.price }}<del>{{ offer.originalPrice }}</del></strong></div><a :href="offer.source" target="_blank" rel="noopener noreferrer" @pointerdown.stop>官網價格 ↗</a></div>
            <p class="esim-price-date">{{ esimPriceSource.checkedAt }} 查核 · 售價以官網為準</p>
          </div>
        </article>
      </div>
    </div>
    <div v-if="!purchased" class="esim-carousel-nav"><button aria-label="上一個方案" :disabled="index===0" @click="select(index-1)"><EsimIcon name="arrow" :size="16"/></button><span><i v-for="n in 3" :key="n" :class="{active:index===n-1}"/><small>左右滑動選方案</small></span><button aria-label="下一個方案" :disabled="index===2" @click="select(index+1)"><EsimIcon name="arrow" :size="16"/></button></div>
    <span class="esim-sr-only" aria-live="polite">{{ offers[index]?.label }}，{{ offers[index]?.name }}，NT${{ offers[index]?.price }}</span>
  </section>
</template>

<script setup lang="ts">
defineProps<{ image:string }>();
const root=ref<HTMLElement>(), original=ref(false), balance=ref(50);
const {gsap,animate,reduced}=useCreationMotion(root);
function move(e:PointerEvent) {
  if(reduced.value) return;
  const r=(e.currentTarget as HTMLElement).getBoundingClientRect();
  animate(d=>gsap.to('.photo-print',{rotationY:((e.clientX-r.left)/r.width-.5)*6,rotationX:-((e.clientY-r.top)/r.height-.5)*5,duration:d(.35),overwrite:true}));
}
function leave(){original.value=false;animate(d=>gsap.to('.photo-print',{rotationX:0,rotationY:0,duration:d(.45),overwrite:true}));}
</script>
<template><div ref="root" class="motion-experience">
  <div class="motion-intro"><span>LIGHT · COLOR · REMEMBER</span><h3>同一個瞬間，重新看見光。</h3></div>
  <div class="photo-desk" @pointermove="move" @pointerleave="leave"><div class="photo-print"><div class="photo-compare"><img :src="image" alt="超級任天堂世界原照"><div class="photo-grade" :style="{clipPath:original?'inset(0 100% 0 0)':`inset(0 ${100-balance}% 0 0)`}"><img :src="image" alt="暖調攝影風格預覽"></div><div v-if="!original" class="photo-compare-line" :style="{left:balance+'%'}"><span>↔</span></div><span class="photo-tag">{{ original?'原始照片':'風格預覽 / 原照' }}</span></div><div class="photo-print-caption"><b>OSAKA, IN FULL COLOR.</b><span>把這天的快樂，好好留下。</span></div></div></div>
  <label class="motion-range">拖曳比較光影<input v-model.number="balance" aria-label="原照與攝影風格比較" type="range" min="0" max="100"></label>
  <div class="motion-toolbar"><span>移動指尖，輕輕傾看相紙</span><button :aria-pressed="original" @pointerdown="original=true" @pointerup="original=false" @pointercancel="original=false" @pointerleave="original=false" @keydown.space.prevent="original=true" @keyup.space.prevent="original=false" @keydown.enter.prevent="original=!original" @blur="original=false">按住看原照</button></div>
  <p class="motion-status">這版先示範光影調色與相紙手感，保留原照內容。</p>
</div></template>

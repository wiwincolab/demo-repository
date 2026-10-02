<script setup lang="ts">
defineProps<{ creator:string; giver?:string }>();
const root=ref<HTMLElement>(), back=ref(false), pinned=ref(false);
const asset=useAsset(); const {gsap,animate,reduced}=useCreationMotion(root);
let dragging=false,startX=0;
function down(e:PointerEvent){dragging=true;startX=e.clientX;}
function up(){dragging=false;}
function move(e:PointerEvent){if(pinned.value||reduced.value)return;const r=(e.currentTarget as HTMLElement).getBoundingClientRect();animate(d=>{
 gsap.to('.pin-tilt',{rotationY:((e.clientX-r.left)/r.width-.5)*28,rotationX:-((e.clientY-r.top)/r.height-.5)*22,duration:d(.2),overwrite:true});
 gsap.to('.pin-glint',{xPercent:((e.clientX-r.left)/r.width-.5)*150,duration:d(.22),overwrite:true});
});if(dragging&&Math.abs(e.clientX-startX)>65){dragging=false;flip();}}
function neutral(){dragging=false;animate(d=>gsap.to('.pin-tilt',{rotationX:0,rotationY:0,duration:d(.45),ease:'power3.out',overwrite:true}));}
function flip(){back.value=!back.value;animate(d=>gsap.to('.pin-flip',{rotationY:back.value?180:0,duration:d(.6),ease:'power3.inOut',overwrite:true}));}
function pin(){pinned.value=!pinned.value;back.value=false;animate(d=>{gsap.to('.pin-flip',{rotationY:0,duration:d(.35),overwrite:true});gsap.to('.pin-tilt',{rotationY:0,rotationX:0,duration:d(.3),overwrite:true});gsap.to('.pin-object',{scale:pinned.value?.74:1,y:pinned.value?18:0,rotation:pinned.value?-7:0,duration:d(.55),ease:'back.out(1.8)',overwrite:true});});}
</script>
<template><div ref="root" class="motion-experience">
  <div class="motion-intro"><span>A SMALL PLACE, CLOSE TO YOU</span><h3>指尖的光，是金屬的溫度。</h3></div>
  <div class="pin-board" :class="{'is-pinned':pinned}" @pointermove="move" @pointerleave="neutral" @pointerdown="down" @pointerup="up" @pointercancel="neutral"><span class="pin-board-label">MY TRAVEL COLLECTION / KYOTO</span><div class="pin-object"><div class="pin-tilt"><div class="pin-flip"><div class="pin-face"><img :src="asset('assets/memory/motion/pin.png')" alt="野宮神社金屬琺瑯徽章"><div class="pin-glint" :style="{maskImage:`url(${asset('assets/memory/motion/pin.png')})`}" /></div><div class="pin-face pin-reverse" :style="{maskImage:`url(${asset('assets/memory/motion/pin.png')})`,maskSize:'contain',maskRepeat:'no-repeat',maskPosition:'center',inset:0,border:0,borderRadius:0}"><div class="pin-clasp" /><small>CHICTRIP · KYOTO</small><h4>野宮神社</h4><p>{{ creator }} 的旅行收藏</p><span>{{ giver?'與 '+giver+' 交換的回憶':'綠蔭裡，記住一個午後。' }}</span><b>✦</b></div></div></div></div><span v-if="pinned" class="pin-mounted-label">已別上收藏板</span></div>
  <div class="motion-toolbar"><button @click="flip">{{ back?'看正面':'翻看背面' }}</button><button class="is-primary" @click="pin">{{ pinned?'拿起徽章':'別上收藏板' }}</button></div>
  <p class="motion-status">{{ pinned?'徽章已定位；拿起來可以繼續欣賞。':'移動指尖看金屬反光，左右滑動可翻面。' }}</p>
</div></template>

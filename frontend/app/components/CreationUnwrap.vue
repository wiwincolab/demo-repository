<script setup lang="ts">
import '~/assets/css/creation-motion.css';
defineProps<{image:string;friend:string;companion:boolean;message?:string}>();
const root=ref<HTMLElement>(),opened=ref(false);const {gsap,animate}=useCreationMotion(root);
function reveal(){if(opened.value)return;opened.value=true;animate(d=>gsap.timeline().to('.unwrap-flap',{rotationX:180,duration:d(.4),ease:'power2.inOut'}).to('.unwrap-art',{y:-85,rotation:-4,scale:1.04,duration:d(.55),ease:'power3.out'},d(.25)).to('.unwrap-pocket',{y:55,duration:d(.5)},'<').fromTo('.unwrap-note',{y:12,opacity:0},{y:0,opacity:1,duration:d(.3)},'>-.1'));}
</script>
<template><div ref="root" class="motion-unwrap"><button class="unwrap-envelope" :aria-label="opened?'已打開 '+friend+' 的收藏':'打開 '+friend+' 的收藏'" :aria-expanded="opened" @click="reveal"><div class="unwrap-art"><img :src="image" :alt="friend+' 交換給你的作品'"><span>{{ companion?'一起旅行的紀念':'另一段旅程的風景' }}</span></div><div class="unwrap-pocket"><small>FROM {{ friend }}</small><b>{{ opened?'這段風景，也屬於你了。':'有一件收藏，想送到你手裡。' }}</b></div><div class="unwrap-flap"><span>✦</span></div></button><p v-if="!opened" class="motion-status">點開朋友的收藏封套</p><div class="unwrap-note" :aria-hidden="!opened"><b>{{ companion?'↔ 同行朋友 · ':'來自 ' }}{{ friend }}</b><p>「{{ message || '把這一站的風景，分一份給你。' }}」</p><small>作品與交換來源已一起收進收藏</small></div></div></template>

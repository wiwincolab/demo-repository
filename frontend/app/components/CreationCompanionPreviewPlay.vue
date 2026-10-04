<script setup lang="ts">
import type { CreationWork } from '~/data/creation';
const props=defineProps<{work:CreationWork}>();
const root=ref<HTMLElement>(),busy=ref(false),waved=ref(false),stamped=ref(false);
const asset=useAsset(),{gsap,animate}=useCreationMotion(root);
const portrait=computed(()=>props.work.photoId==='fuji-blue'?'assets/mascots/fuji.png':props.work.photoId==='nara-deer'?'assets/mascots/nara.png':props.work.photoId?.startsWith('usj')?'assets/memory/usj-companion-test.png':'assets/memory/references/chictrip-mascot.png');
function greet(){if(busy.value)return;busy.value=true;waved.value=true;animate(d=>gsap.timeline({onComplete:()=>{busy.value=false;}}).to('.buddy-preview-portrait',{rotation:-5,y:-8,duration:d(.17)}).to('.buddy-preview-portrait',{rotation:4,y:0,duration:d(.2)}).to('.buddy-preview-portrait',{rotation:0,duration:d(.25),ease:'power3.out'}));}
function stamp(){stamped.value=true;animate(d=>gsap.fromTo('.buddy-pass-stamp',{scale:1.6,opacity:0,rotation:-22},{scale:1,opacity:1,rotation:-12,duration:d(.35),ease:'back.out(1.4)',overwrite:true}));}
</script>
<template><div ref="root" class="motion-experience"><div class="motion-intro"><span>YOUR TRAVEL BUDDY</span><h3>這一站，有旅伴陪你。</h3></div><div class="buddy-preview-desk"><button class="buddy-preview-portrait" aria-label="與這一站的旅伴打招呼" :disabled="busy" @click="greet"><img :src="asset(portrait)" :alt="work.location+'景點穿搭旅伴'" /></button><div class="buddy-preview-pass"><small>CHICTRIP · TRAVEL PASS</small><h4>{{ work.location }}</h4><p role="status">{{ waved?'準備好了，一起出發！':'點一下，跟旅伴打聲招呼。' }}</p><span v-if="stamped" class="buddy-pass-stamp">一起到過<br>這個地方</span></div></div><div class="motion-toolbar"><button :disabled="busy" @click="greet">打聲招呼</button><button class="is-primary" @click="stamp">{{ stamped?'再蓋一次同行章':'蓋上同行章' }}</button></div><p class="motion-status">點按旅伴打招呼，也可以在這一站留下同行章。</p></div></template>

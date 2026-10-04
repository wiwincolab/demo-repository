<script setup lang="ts">
withDefaults(defineProps<{ image:string; creator:string; location?:string; date?:string; caption?:string; sourceCrop?:boolean }>(),{location:'富士山 · 藍調時刻',date:'2026.02.14',caption:'看山、喝咖啡，把天色變藍的那刻留下來。',sourceCrop:false});
const root=ref<HTMLElement>(), extracted=ref(false), back=ref(false), stamped=ref(false), stamping=ref(false);
const {gsap,animate,reduced}=useCreationMotion(root);
let startY=0, travel=0, holding=false;
function extract(value=true){extracted.value=value;animate(d=>{gsap.to('.ticket-pull',{y:value?-105:0,duration:d(.48),ease:'power3.out',overwrite:true});gsap.to(['.ticket-pocket-front','.ticket-pocket-back'],{y:value?100:0,duration:d(.48),ease:'power3.out',overwrite:true});});}
function down(e:PointerEvent){if(e.button!==0)return;holding=true;startY=e.clientY;travel=extracted.value?-105:0;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);}
function move(e:PointerEvent){if(holding)gsap.set(root.value!.querySelector('.ticket-pull'),{y:Math.min(0,Math.max(-115,travel+e.clientY-startY))});}
function up(e:PointerEvent,cancel=false){if(!holding)return;holding=false;extract(cancel?extracted.value:travel+e.clientY-startY < -40);}
function flip(){back.value=!back.value;animate(d=>gsap.to('.ticket-flip',{rotationY:back.value?180:0,duration:d(.55),ease:'power2.inOut',overwrite:true}));}
function stamp(){if(stamping.value)return;stamping.value=true;extract();back.value=true;
  // A zero-duration timeline can apply its initial hidden state last.
  // Reduced motion keeps the completed interaction visible without a timeline.
  if(reduced.value){stamped.value=true;stamping.value=false;animate(()=>{gsap.set('.ticket-flip',{rotationY:180});gsap.set('.ticket-stamp',{opacity:1,scale:1,rotation:-12});gsap.set('.stamp-tool',{opacity:0});});return;}
  animate(d=>{
  gsap.to('.ticket-flip',{rotationY:180,duration:d(.4),overwrite:true});
  gsap.timeline({onComplete:()=>{stamping.value=false;}}).set('.ticket-stamp',{opacity:0,scale:1.55,rotation:-20}).to('.stamp-tool',{y:20,opacity:1,duration:d(.18)},d(.32)).call(()=>{stamped.value=true;}).to('.ticket-stamp',{opacity:1,scale:1,rotation:-12,duration:d(.18),ease:'back.out(1.3)'},'>').to('.stamp-tool',{y:-25,opacity:0,duration:d(.22)},'<').fromTo('.ticket-pull',{scale:.985},{scale:1,duration:d(.25)},'<');
});}
</script>
<template><div ref="root" class="motion-experience">
  <div class="motion-intro"><span>A LITTLE PROOF OF BEING THERE</span><h3>抽出那一天，蓋一枚回憶章。</h3></div>
  <div class="ticket-desk"><div class="ticket-pocket-back" />
    <div class="ticket-pull" @pointerdown="down" @pointermove="move" @pointerup="up($event)" @pointercancel="up($event,true)"><div class="ticket-flip"><div class="ticket-face ticket-front"><img :src="image" :alt="location + '旅行票根'" :class="{'source-crop':sourceCrop}"><span>{{ date }}</span></div><div class="ticket-face ticket-back"><small>CHICTRIP / TRAVEL ARCHIVE</small><h4>{{ location }}</h4><p>{{ caption }}</p><dl><dt>收藏人</dt><dd>{{ creator }}</dd><dt>地點</dt><dd>{{ location }}</dd><dt>旅行日期</dt><dd>{{ date }}</dd></dl><div class="ticket-stamp" :class="{'is-stamped':stamped}"><b>記得這天</b><span>{{ date }}</span><small>MEMORY COLLECTED</small></div><div class="ticket-barcode" /></div></div></div>
    <div class="ticket-pocket-front"><span>✦</span><b>ONE DAY,<br>WORTH KEEPING.</b><small>向上抽出你的旅行票根 ↑</small></div><div class="stamp-tool" aria-hidden="true">✦</div>
  </div>
  <div class="motion-toolbar"><button @click="extract(!extracted)">{{ extracted?'收回票套':'抽出票根' }}</button><button @click="flip">{{ back?'看正面':'翻到背面' }}</button><button class="is-primary" @click="stamp">{{ stamped?'再蓋一次':'蓋上紀念章' }}</button></div>
  <p class="motion-status" role="status">{{ stamped?'這張票根，留下了你的到訪印記。':'拖曳票根或點按抽出，再翻面留下印記。' }}</p>
</div></template>

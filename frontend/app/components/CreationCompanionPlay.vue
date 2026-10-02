<script setup lang="ts">
const root=ref<HTMLElement>(), playing=ref(false), count=ref(0), message=ref('那個方塊，好像藏著什麼？');
const asset=useAsset(); const {gsap,animate}=useCreationMotion(root);
function adventure(){if(playing.value)return;playing.value=true;message.value='走，一起看看！';animate(d=>{
 const actor=root.value!.querySelector('.companion-actor')!.getBoundingClientRect(), block=root.value!.querySelector('.adventure-block')!.getBoundingClientRect();
 const distance=block.left+block.width/2-actor.left-actor.width/2;
 const tl=gsap.timeline({onComplete:()=>{playing.value=false;count.value++;message.value='找到一顆旅行星星，收進口袋！';}});
 tl.to('.companion-actor',{x:distance,rotation:4,duration:d(.35),ease:'power2.inOut'})
 .to('.companion-actor',{scaleY:.91,scaleX:1.05,duration:d(.12)})
 .to('.companion-actor',{y:-65,scaleY:1.05,scaleX:.98,rotation:-5,duration:d(.28),ease:'power2.out'})
 .to('.adventure-block',{y:-12,rotation:5,duration:d(.12)},`<${d(.2)}`)
 .to('.adventure-block',{y:0,rotation:0,duration:d(.25),ease:'back.out(2)'})
 .fromTo('.adventure-star',{opacity:0,y:0,scale:.2,rotation:-35},{opacity:1,y:-55,scale:1,rotation:20,duration:d(.3)},'<')
 .to('.companion-actor',{y:0,rotation:0,scaleX:1,scaleY:1,duration:d(.32),ease:'bounce.out'},'<')
 .to('.adventure-star',{y:120,x:-65,scale:.25,opacity:0,rotation:170,duration:d(.48),ease:'power2.in'},`>${d(.1)}`)
 .to('.companion-actor',{x:0,duration:d(.38),ease:'power2.inOut'});
});}
function greet(){if(playing.value)return;message.value='帽子戴好了，今天一起闖關！';animate(d=>gsap.timeline().to('.companion-actor',{rotation:-9,scaleY:.95,duration:d(.18)}).to('.companion-actor',{rotation:7,scaleY:1.02,duration:d(.22)}).to('.companion-actor',{rotation:0,scaleY:1,duration:d(.3),ease:'back.out(2)'}));}
</script>
<template><div ref="root" class="motion-experience">
  <div class="motion-intro"><span>YOUR LITTLE ADVENTURE BUDDY</span><h3>換上這一站的裝扮，一起闖關。</h3></div>
  <div class="companion-world"><div class="companion-landscape" :style="{backgroundImage:`url(${asset('assets/memory/references/usj-nintendo-source.png')})`}" /><div class="companion-platform"/><div class="companion-speech" role="status">{{ message }}</div><span class="adventure-star" aria-hidden="true">★</span><button class="adventure-block" aria-label="敲擊驚喜方塊" :disabled="playing" @click="adventure">?</button><button class="companion-actor" aria-label="跟景點旅伴打招呼" :disabled="playing" @click="greet"><img :src="asset('assets/memory/motion/companion.png')" alt="戴紅帽、穿牛仔吊帶褲的去趣旅伴"></button><span class="companion-pocket">★ {{ count }} 顆旅行星星</span></div>
  <div class="motion-toolbar"><button :disabled="playing" @click="greet">跟旅伴打招呼</button><button class="is-primary" :disabled="playing" @click="adventure">{{ playing?'一起冒險中…':'發現方塊裡的驚喜' }}</button></div>
  <p class="motion-status">點方塊，旅伴會走近、跳起，收下這一站的星星。</p>
</div></template>

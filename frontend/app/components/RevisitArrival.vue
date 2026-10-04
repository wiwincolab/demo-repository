<script setup lang="ts">
import type { RevisitStop } from '~/data/revisit';
const props=defineProps<{stop:RevisitStop;stage:'survey'|'descending'|'framing';progress:number}>();
const root=ref<HTMLElement>();
const {gsap,animate}=useCreationMotion(root);
onMounted(()=>animate(duration=>{
  const timeline=gsap.timeline({defaults:{ease:'power2.out'}});
  timeline.fromTo('.revisit-descent-caption',{y:15,opacity:0},{y:0,opacity:1,duration:duration(.45)},0)
    .fromTo('.revisit-descent-cloud.one',{xPercent:0,opacity:0},{xPercent:40,opacity:.4,duration:duration(.6)},0)
    .to('.revisit-descent-cloud.one',{xPercent:110,opacity:0,duration:duration(1.1),ease:'sine.inOut'},.6)
    .fromTo('.revisit-descent-cloud.two',{xPercent:0,opacity:0},{xPercent:-90,opacity:.3,duration:duration(1.3),ease:'sine.inOut'},.2)
    .to('.revisit-descent-cloud.two',{opacity:0,duration:duration(.5)},1.4);
}));
watch(()=>props.stage,()=>animate(duration=>{
  gsap.fromTo('.revisit-descent-label',{y:5,opacity:.6},{y:0,opacity:1,duration:duration(.25),overwrite:true});
}));
</script>
<template>
  <div ref="root" class="revisit-descent" :data-stage="stage" :style="{'--descent-progress':progress}" aria-hidden="true">
    <div class="revisit-descent-cloud one"/><div class="revisit-descent-cloud two"/>
    <div class="revisit-descent-caption"><span>{{ stop.date.replaceAll('-','.') }} · {{ stop.english || 'TRAVEL MEMORY' }}</span><h2>{{ stop.title }}</h2><p>{{ stop.location }}</p><div class="revisit-descent-track"><span>俯瞰</span><i/><span class="revisit-descent-label">{{ stage==='survey'?'看見目的地':stage==='descending'?'慢慢靠近':'回到這個地方' }}</span><i/><span>抵達</span></div></div>
  </div>
</template>

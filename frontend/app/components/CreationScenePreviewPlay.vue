<script setup lang="ts">
import type { CreationWork } from '~/data/creation';
defineProps<{work:CreationWork}>();
const root=ref<HTMLElement>(),rotation=ref(-18),night=ref(false),expanded=ref(false);
const {gsap,animate}=useCreationMotion(root);
let dragging=false,startX=0,startAngle=0;
function turn(value:number){rotation.value=Math.max(-55,Math.min(55,value));animate(d=>gsap.to('.scene-preview-model',{rotationY:rotation.value,duration:d(.25),overwrite:true}));}
function down(event:PointerEvent){if(event.button!==0)return;dragging=true;startX=event.clientX;startAngle=rotation.value;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);}
function move(event:PointerEvent){if(dragging)turn(startAngle+(event.clientX-startX)*.3);}
function separate(){expanded.value=!expanded.value;animate(d=>gsap.to('.scene-preview-model',{y:expanded.value?-35:0,rotationX:expanded.value?7:0,duration:d(.45),ease:'power3.out',overwrite:true}));}
</script>
<template><div ref="root" class="motion-experience">
  <div class="motion-intro"><span>TURN · LIGHT · LOOK CLOSER</span><h3>從另一個角度，看看這片風景。</h3></div>
  <div class="scene-preview-desk" :class="{'is-night':night,'is-separated':expanded}" @pointerdown="down" @pointermove="move" @pointerup="dragging=false" @pointercancel="dragging=false"><div class="scene-preview-ground"/><div class="scene-preview-model" style="transform:rotateY(-18deg)"><CreationArtwork :work="work" :alt="work.location+'場景預覽'" /></div><span>{{ work.location }}</span><small>2.5D 場景預覽</small></div>
  <div class="motion-toolbar"><button aria-label="向左轉動場景" @click="turn(rotation-15)">↶</button><button @click="separate">{{ expanded?'放回底座':'抬起場景' }}</button><button class="is-primary" :aria-pressed="night" @click="night=!night">{{ night?'回到日光':'切換晚間光線' }}</button><button aria-label="向右轉動場景" @click="turn(rotation+15)">↷</button></div>
  <p class="motion-status">左右拖動或點箭頭轉動，抬起來看看底座。</p>
</div></template>

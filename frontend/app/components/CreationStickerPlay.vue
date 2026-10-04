<script setup lang="ts">
import type { CreationWork } from '~/data/creation';
import { stickerKit, type StickerKit } from '~/data/creation-motifs';
const props=defineProps<{work?:CreationWork; kit?:StickerKit}>();
const kit=computed(()=>props.kit || stickerKit(props.work));
const names=computed(()=>kit.value.motifs.map(item=>item.name));
const root = ref<HTMLElement>();
const board = ref<HTMLElement>();
const { gsap, animate } = useCreationMotion(root);
const placed = ref<number[]>([]), selected = ref(0), dragging = ref(-1);
const positions = ref<Record<number, {x:number;y:number}>>({});
let start = { x:0,y:0 }, delta = {x:0,y:0}, target: HTMLElement | undefined;
const status = ref('把喜歡的小風景，貼進這一頁。');
function down(e: PointerEvent, index: number) {
  if (e.button !== 0) return;
  selected.value = index; dragging.value = index;
  target = e.currentTarget as HTMLElement; target.setPointerCapture(e.pointerId);
  start = {x:e.clientX,y:e.clientY}; delta = {x:0,y:0};
  animate(d => gsap.to(target!, {scale:1.12,rotation:-7,rotationX:18,duration:d(.18),overwrite:true}));
}
function move(e: PointerEvent) {
  if (dragging.value < 0 || !target) return;
  delta = {x:e.clientX-start.x,y:e.clientY-start.y};
  gsap.set(target,{x:delta.x,y:delta.y});
}
function place(index: number, x?:number,y?:number) {
  positions.value[index] = {x:x ?? 22 + (index%3)*28, y:y ?? 35+Math.floor(index/3)*35};
  if (!placed.value.includes(index)) placed.value.push(index);
  status.value = `已貼上${names.value[index]}，還可以拖動換位置。`;
  nextTick(()=>animate(d=>gsap.fromTo(root.value!.querySelector(`[data-placed="${index}"]`),{scale:1.18,rotation:-9},{scale:1,rotation:index%2?5:-4,duration:d(.45),ease:'back.out(1.7)',overwrite:true})));
}
function up(e: PointerEvent, cancelled=false) {
  if (dragging.value < 0 || !target) return;
  const index = dragging.value, el = target, rect = board.value!.getBoundingClientRect();
  const inside = e.clientX>=rect.left && e.clientX<=rect.right && e.clientY>=rect.top && e.clientY<=rect.bottom;
  if (!cancelled && inside) {
    if(el.dataset.placed) gsap.set(el,{x:0,y:0});
    place(index,Math.max(14,Math.min(86,(e.clientX-rect.left)/rect.width*100)),Math.max(22,Math.min(84,(e.clientY-rect.top)/rect.height*100)));
  }
  else if (!cancelled && Math.hypot(delta.x,delta.y)<6) selected.value=index;
  animate(d=>gsap.to(el,{x:0,y:0,rotation:0,rotationX:0,scale:1,duration:d(.3),ease:'back.out(1.5)',overwrite:true}));
  if(el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
  dragging.value=-1; target=undefined;
}
function reset() { placed.value=[]; positions.value={}; status.value='重新挑一枚，留下你的排列。'; }
function returnSticker(){placed.value=placed.value.filter(i=>i!==selected.value);delete positions.value[selected.value];status.value=`已把${names.value[selected.value]}放回貼紙紙。`;}
function nudge(event:KeyboardEvent,index:number){
  const shifts:Record<string,[number,number]>={ArrowLeft:[-3,0],ArrowRight:[3,0],ArrowUp:[0,-3],ArrowDown:[0,3]};
  const shift=shifts[event.key], position=positions.value[index];if(!shift||!position)return;
  event.preventDefault();selected.value=index;position.x=Math.max(14,Math.min(86,position.x+shift[0]));position.y=Math.max(22,Math.min(84,position.y+shift[1]));
}
</script>
<template>
  <div ref="root" class="motion-experience">
    <div class="motion-intro"><span>PEEL · PLACE · KEEP</span><h3>把那一天，貼成自己的樣子。</h3></div>
    <div ref="board" class="sticker-notebook" :class="{'is-receiving':dragging>=0}" aria-label="貼紙收藏頁">
      <div class="notebook-heading"><b>{{ kit.title }}</b><span>我的旅行手帖</span></div>
      <p v-if="!placed.length" class="notebook-empty">這一頁，留給你的風景。<span>拖一枚貼紙到這裡</span></p>
      <button v-for="i in placed" :key="i" :data-placed="i" class="placed-sticker" :aria-label="'移動'+names[i]" :style="{left:positions[i]!.x+'%',top:positions[i]!.y+'%'}" @pointerdown="down($event,i)" @pointermove="move" @pointerup="up($event)" @pointercancel="up($event,true)" @click="selected=i" @keydown="nudge($event,i)"><CreationStickerSprite :index="i" :kit="kit" /></button>
      <span class="notebook-count">{{ placed.length }} / {{ names.length }} 個旅行細節</span>
    </div>
    <div class="sticker-tray" :aria-label="'可揭起的'+names.length+'枚貼紙'">
      <button v-for="(name,i) in names" :key="name" :aria-label="'選取'+name+'貼紙'" :aria-pressed="selected===i" :class="{'is-peeled':placed.includes(i),'is-lifted':dragging===i}" @pointerdown="down($event,i)" @pointermove="move" @pointerup="up($event)" @pointercancel="up($event,true)" @click="selected=i"><CreationStickerSprite :index="i" :kit="kit" /><small>{{ name }}</small><i class="peel-corner" /></button>
    </div>
    <div class="motion-toolbar"><button @click="reset">重新排列</button><button v-if="placed.includes(selected)" @click="returnSticker">放回貼紙紙</button><button class="is-primary" @click="place(selected)">貼上{{ names[selected] }} ↗</button></div>
    <p class="motion-status" role="status">{{ status }}</p>
  </div>
</template>

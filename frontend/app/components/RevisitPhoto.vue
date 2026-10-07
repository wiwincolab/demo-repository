<script setup lang="ts">
import type { RevisitStop, RevisitSouvenir } from '~/data/revisit';
import type { CreationWork } from '~/data/creation';
// These players are also mounted directly from Atlas, without CreationPlayground.
import '~/assets/css/creation-motion.css';
const props = defineProps<{ stop: RevisitStop; remaining: number; running: boolean; last: boolean }>();
const emit = defineEmits<{ loaded: []; discover: [id:string]; hold: [value:boolean]; pause: []; resume: []; next: []; close: [] }>();
const asset = useCreationAsset(), root = ref<HTMLElement>();
const { gsap, animate } = useCreationMotion(root);
const active = ref<RevisitSouvenir | null>(null);
const savedWork=computed(()=>props.stop.works.find(work=>work.id===active.value?.id));
const playWork=computed<CreationWork | null>(()=>active.value && props.stop.tripId !== 'last-year' ? savedWork.value || {
  id:active.value.id,styleId:active.value.kind,title:active.value.title,image:active.value.image.replace('assets/memory/',''),
  location:props.stop.location,creator:'你',createdAt:props.stop.date,tripId:props.stop.tripId,
  photoId:props.stop.id==='nara'?'nara-deer':props.stop.id,source:props.stop.source.replace('assets/memory/',''),preset:true,
} : null);
// 示範收藏只給人看樣子；真的想要，用這一站的照片自己做一件，做好就換成你的
const kinds = {sticker:'貼紙',pin:'徽章',ticket:'票根'} as const;
const amounts = {sticker:'一組',pin:'一枚',ticket:'一張'} as const;
const makeLink = computed(() => active.value?.demo && props.stop.photoId && props.stop.tripId !== 'last-year'
  ? { path:'/memory', query:{ trip:props.stop.tripId, photo:props.stop.photoId, style:active.value.kind, stop:props.stop.id } } : null);
const ratio = ref(1.5), failed = ref(false), ready = ref(false);
const friendOpen = ref(false);
watch([active, friendOpen], () => emit('hold', !!active.value || friendOpen.value));
let trigger: HTMLElement | null = null;
function loaded(event: Event) {
  const image = event.target as HTMLImageElement;
  ratio.value = image.naturalWidth / image.naturalHeight * (props.stop.sourceCrop ? 2 : 1);
  ready.value = true; emit('loaded');
}
async function discover(item: RevisitSouvenir) {
  emit('discover',item.id);
  emit('hold',true); trigger = document.activeElement as HTMLElement;
  active.value = item;
  await nextTick();
  const board=root.value?.querySelector<HTMLElement>('.revisit-photo-board');
  if(board)board.scrollTop=0;
  root.value?.querySelector<HTMLButtonElement>('.revisit-souvenir-close')?.focus({preventScroll:true});
  animate(duration => {
    const object = root.value?.querySelector('.revisit-collection-play');
    if (object) gsap.fromTo(object,{opacity:0,y:34,rotation:-5,rotateX:-12},{opacity:1,y:0,rotation:0,rotateX:0,duration:duration(.6),ease:'power3.out',clearProps:'transform,opacity'});
  });
}
function closeArtifact() { active.value=null; nextTick(()=>{const board=root.value?.querySelector<HTMLElement>('.revisit-photo-board');if(board)board.scrollTop=0;if(trigger?.isConnected)trigger.focus({preventScroll:true});}); }
function escape(event:KeyboardEvent) { if(active.value && event.key==='Escape'){event.preventDefault();event.stopPropagation();closeArtifact();} }
onBeforeUnmount(()=>emit('hold',false));
</script>
<template>
  <div ref="root" class="revisit-photo-room" @keydown="escape">
    <header class="revisit-photo-room-header"><div><span class="revisit-eyebrow">{{ stop.date.replaceAll('-','.') }} · {{ stop.location }}</span><h2>{{ stop.title }}</h2></div><button aria-label="關閉照片，留在地圖" @click="emit('close')">×</button></header>
    <div class="revisit-photo-board">
      <figure class="revisit-hotspot-photo" :inert="!!active" :style="{'--photo-ratio':ratio}">
        <img :src="asset(stop.source)" :alt="stop.title+'的旅行照片'" :class="{'is-source-crop':stop.sourceCrop}" @load="loaded" @error="failed=true;emit('pause')"/>
        <template v-if="ready"><button v-for="item in stop.souvenirs" :key="item.id" class="revisit-photo-hotspot" :class="{'is-own':!item.demo}" :style="{left:item.x+'%',top:item.y+'%'}" :aria-label="'打開'+(item.demo?'':'我的')+item.title+'的'+kinds[item.kind]" @click="discover(item)"><i/><span>{{ item.demo ? {sticker:'揭貼紙',pin:'翻徽章',ticket:'抽票根'}[item.kind] : '我的'+kinds[item.kind] }}</span></button></template>
      </figure>
      <p v-if="failed" class="revisit-photo-error" role="status">照片暫時載入失敗，倒數已暫停。<button @click="emit('next')">先看下一站 →</button></p>
      <div v-if="active" class="revisit-souvenir-stage">
        <button class="revisit-souvenir-close" @click="closeArtifact">← 回到照片</button>
        <div class="revisit-collection-play" :key="active.id">
          <CreationStickerPlay v-if="active.kind==='sticker'" :work="playWork || undefined" :kit="active.kit" />
          <CreationPinPlay v-else-if="active.kind==='pin'" creator="你" :image="asset(active.image)" :location="stop.location" :date="stop.date.replaceAll('-','.')" :work="savedWork" />
          <CreationTicketPlay v-else :image="asset(active.image)" creator="你" :location="stop.location" :date="stop.date.replaceAll('-','.')" :caption="stop.caption" />
        </div>
        <div class="revisit-souvenir-description"><template v-if="makeLink"><p>這是{{ kinds[active.kind] }}的示範樣式，還不是你的收藏。</p><NuxtLink class="revisit-primary revisit-make-own" :to="makeLink">用這張照片做{{ amounts[active.kind] }}{{ kinds[active.kind] }} <span aria-hidden="true">✦</span></NuxtLink></template><small v-else-if="active.demo">旅程示範收藏 · 不會寫入你的個人收藏</small><small v-else>你的收藏 · 跟著這一站保存</small></div>
      </div>
    </div>
    <footer class="revisit-photo-room-footer">
      <div v-show="!active" class="revisit-photo-story"><p>{{ stop.caption }}</p><small>{{ stop.sourceNote || '旅行示範紀錄' }}<span v-if="stop.souvenirs.length"> · 點照片裡的光點，看看那天的收藏</span></small><details v-if="stop.friend" @toggle="friendOpen=($event.target as HTMLDetailsElement).open"><summary>{{ stop.friend.name }} 留下的話</summary><p>{{ stop.friend.note }}</p></details></div>
      <div class="revisit-countdown-controls"><button class="revisit-countdown-toggle" :aria-label="active?'互動中，返回照片後繼續':!ready?'照片載入中':running?'暫停自動重遊':'繼續自動重遊'" :disabled="!!active || !ready" @click="running?emit('pause'):emit('resume')"><svg viewBox="0 0 44 44" aria-hidden="true"><circle cx="22" cy="22" r="19" fill="none" stroke="#dbe5df" stroke-width="2"/><circle cx="22" cy="22" r="19" fill="none" stroke="#b19954" stroke-width="2.5" stroke-dasharray="119.4" :stroke-dashoffset="119.4*(1-remaining/10)" transform="rotate(-90 22 22)"/></svg><b>{{ Math.ceil(remaining) }}</b><span>{{ active?'互動中':!ready?(failed?'載入失敗':'載入中'):running?'暫停':'已暫停' }}</span></button><button class="revisit-primary" @click="emit('next')">{{ last?'完成這趟重遊':'下一站' }} →</button></div>
    </footer>
  </div>
</template>

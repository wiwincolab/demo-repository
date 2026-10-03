<script setup lang="ts">
import { gsap } from 'gsap';
import type { TripId } from '~/data/trips';
import { tripSummaries } from '~/data/trips';
import { buildRecapStops } from '~/data/recap';
import { styleById, type CreationWork } from '~/data/creation';
import '~/assets/css/memory-recap.css';
const open = defineModel<boolean>({ default: false });
const props = defineProps<{ tripIds: TripId[]; title: string }>();
const { allWorks } = useCreation();
const { state } = useJourneyCollection();
const asset = useAsset();
const dialog = ref<HTMLDialogElement>(), root = ref<HTMLElement>();
const { animate, reduced } = useCreationMotion(root);
const stops = computed(() => buildRecapStops(props.tripIds, allWorks.value, state.value));
const index = ref(0), progress = ref(0), playing = ref(false), finished = ref(false);
const artifact = ref(false), friendOpen = ref(false), eventReady = ref(false), detailOpen = ref(false);
const selectedWork = ref<CreationWork | null>(null);
const current = computed(() => stops.value[index.value]);
const displayWork = computed(() => selectedWork.value || current.value?.works.find(work => 'assets/memory/'+work.image === current.value?.image) || (current.value?.interaction === 'photo' ? current.value.works[0] : undefined));
const displayImage = computed(() => displayWork.value ? 'assets/memory/'+displayWork.value.image : current.value?.image || '');
const displayFormat = computed(() => displayWork.value ? styleById(displayWork.value.styleId).name : current.value?.format || '旅行收藏');
const displayKind = computed(() => displayWork.value?.styleId || current.value?.interaction || 'photo');
const photoCaption = computed(() => ({'fuji-blue':'天色開始變藍，店裡的燈還亮著。',usj:'照片裡的餐廳和城堡，現在還認得出來。',nara:'在奈良留下的那一張。',kyoto:'從清水舞台望出去，是京都的屋頂和山。',dotonbori:'走到橋上，回頭拍下這片街景。'}[current.value?.id || ''] || current.value?.caption));
const currentTrip = computed(() => tripSummaries.find(t => t.id === current.value?.tripId));
const eventLabel = computed(() => ({sticker:'拾起這張貼紙',pin:'看看這枚徽章',scene:'走進這座小場景',companion:'和旅伴打個招呼',photo:'看看這一站的收藏'})[current.value?.interaction || 'photo']);
const canDiscover = computed(() => current.value && (current.value.interaction !== 'photo' || current.value.works.length > 0));
let ticker: gsap.core.Tween | undefined, camera: gsap.core.Tween | undefined, cue: ReturnType<typeof setTimeout> | undefined;
let opener: HTMLElement | null = null;
function stopMotion() { ticker?.kill(); camera?.kill(); clearTimeout(cue); }
function pause() { playing.value = false; ticker?.pause(); camera?.pause(); }
function play() {
  if (finished.value || artifact.value || detailOpen.value || friendOpen.value) return;
  playing.value = true;
  ticker?.kill();
  const clock = { value: progress.value };
  ticker = gsap.to(clock, { value: 1, duration: Math.max(.1, (1-progress.value)*8), ease: 'none', onUpdate: () => { progress.value=clock.value; }, onComplete: () => next() });
  camera?.resume();
}
function toggle() { if(playing.value)pause();else {if(artifact.value){artifact.value=false;friendOpen.value=false;}play();} }
async function enter(autoplay: boolean) {
  stopMotion(); artifact.value=false; selectedWork.value=null; friendOpen.value=false; eventReady.value=false; detailOpen.value=false; progress.value=0;
  await nextTick();
  if(!open.value || !current.value)return;
  animate(duration => {
    const stage=root.value?.querySelector('.recap-visual');
    const plane=root.value?.querySelector('.recap-photo-motion');
    const copy=root.value?.querySelector('.recap-caption');
    if(stage)gsap.fromTo(stage,{opacity:0},{opacity:1,duration:duration(.4),ease:'power2.out'});
    if(copy)gsap.fromTo(copy,{opacity:0,y:12},{opacity:1,y:0,duration:duration(.4),delay:duration(.1),ease:'power3.out'});
    if(plane){gsap.set(plane,{scale:1});if(!reduced.value)camera=gsap.to(plane,{scale:1.035,duration:8,ease:'none',paused:!autoplay});}
  });
  cue=setTimeout(()=>{eventReady.value=true;},reduced.value?0:1400);
  if(autoplay)play();else pause();
}
function next() {
  if(index.value>=stops.value.length-1){stopMotion();playing.value=false;finished.value=true;return;}
  const autoplay=playing.value;index.value++;enter(autoplay);
}
function choose(position:number) {
  if(position<0||position>=stops.value.length)return;
  const autoplay=playing.value;finished.value=false;index.value=position;enter(autoplay);
}
function discover() {
  pause();artifact.value=true;friendOpen.value=false;
  nextTick(()=>animate(duration=>{const object=root.value?.querySelector('.recap-object');if(object)gsap.fromTo(object,{opacity:0,y:32,scale:.94,rotation:-3},{opacity:1,y:0,scale:1,rotation:0,duration:duration(.48),ease:'power3.out'});}));
}
function backToPhoto() {artifact.value=false;friendOpen.value=false;}
function move(event:PointerEvent) {
  if(reduced.value||artifact.value||event.pointerType!=='mouse'||!root.value)return;
  const plane=root.value.querySelector('.recap-photo-parallax');if(!plane)return;
  const box=root.value.getBoundingClientRect();
  animate(()=>gsap.to(plane,{x:(event.clientX-box.left-box.width/2)/box.width*12,y:(event.clientY-box.top-box.height/2)/box.height*8,duration:.55,ease:'power2.out',overwrite:'auto'}));
}
function resetParallax(){const plane=root.value?.querySelector('.recap-photo-parallax');if(plane)animate(()=>gsap.to(plane,{x:0,y:0,duration:.4,overwrite:'auto'}));}
function openInteraction(){pause();detailOpen.value=true;}
function key(event:KeyboardEvent){if(detailOpen.value)return;if(event.key==='ArrowRight'){event.preventDefault();next();}if(event.key==='ArrowLeft'){event.preventDefault();choose(index.value-1);}if(event.code==='Space'&&event.target===dialog.value){event.preventDefault();toggle();}}
function visibility(){if(document.hidden)pause();}
watch(open,async value=>{
  await nextTick();
  if(value){opener=document.activeElement as HTMLElement;dialog.value?.showModal();index.value=0;finished.value=false;playing.value=!reduced.value;await enter(!reduced.value);for(const stop of stops.value){const img=new Image();img.src=asset(stop.source);}}
  else{stopMotion();playing.value=false;detailOpen.value=false;dialog.value?.close();opener?.focus();}
});
watch(reduced,value=>{if(value){camera?.kill();pause();}});
onMounted(()=>{document.addEventListener('visibilitychange',visibility);window.addEventListener('blur',pause);});
onBeforeUnmount(()=>{stopMotion();dialog.value?.close();document.removeEventListener('visibilitychange',visibility);window.removeEventListener('blur',pause);});
</script>
<template>
  <dialog ref="dialog" class="memory-recap" :aria-label="title + '沉浸回顧'" @cancel.prevent="open=false" @close="open=false" @keydown="key">
    <div ref="root" class="recap-room" :class="{'is-artifact':artifact,'is-finished':finished}" @pointermove="move" @pointerleave="resetParallax">
      <header class="recap-header"><div class="recap-brand"><span class="recap-brand-mark" aria-hidden="true">m.</span><div><span>MEMORY ATLAS</span><h2>{{ title }}</h2></div></div><button class="recap-close" aria-label="結束回顧" @click="open=false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m6 6 12 12M6 18 18 6"/></svg></button></header>
      <template v-if="current && !finished">
        <div class="recap-progress" aria-label="回顧進度"><button v-for="(stop,i) in stops" :key="stop.id" :aria-label="'前往'+stop.title" :aria-current="i===index?'step':undefined" @click="choose(i)"><span :style="{transform:'scaleX('+(i<index?1:i===index?progress:0)+')'}" /></button></div>
        <div :key="current.id" class="recap-visual">
          <img class="recap-ambience" :src="asset(current.source)" alt="" aria-hidden="true" />
          <div class="recap-photo-parallax"><div class="recap-photo-motion"><figure class="recap-photo-frame" :class="{'is-cropped':current.sourceCrop}"><img :src="asset(current.source)" :alt="current.title+'的旅行照片'" /></figure></div></div>
          <div class="recap-photo-shade" aria-hidden="true" />
          <span class="recap-photo-tag">{{ current.date.replaceAll('-','.') }}<span>{{ currentTrip?.location }}</span></span>
          <div v-if="artifact" class="recap-artifact-stage">
            <button class="recap-return-photo" @click="backToPhoto"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M20 12H4m6-6-6 6 6 6"/></svg>回到照片</button>
            <button class="recap-object" :class="'recap-object-'+displayKind" :aria-label="displayKind==='scene'?'探索立體場景':'欣賞'+displayFormat" @click="openInteraction"><img :src="asset(displayImage)" :alt="current.title+' · '+displayFormat" /><span>{{ displayKind==='scene'?'轉動場景、找找照片裡的地方':'打開這件收藏' }} <span aria-hidden="true">↗</span></span></button>
            <button v-if="current.friend && !friendOpen" class="recap-friend-cue" @click="friendOpen=true"><i>{{ current.friend.name.slice(0,1) }}</i><span>{{ current.friend.name }} 也留下了這一天<small>看看同行朋友的留言</small></span><span aria-hidden="true">↗</span></button>
            <aside v-if="friendOpen && current.friend" class="recap-friend-note"><button aria-label="收起朋友的留言" @click="friendOpen=false">×</button><span>同一趟旅行，另一個人的視角</span><h3>{{ current.friend.name }}</h3><p>{{ current.friend.note }}</p><small>同行交換 · 原作與留言一起保留</small><button class="recap-friend-open" @click="openInteraction">查看一起收藏的場景 ↗</button></aside>
          </div>
        </div>
        <div class="recap-caption"><span>{{ artifact ? displayFormat : current.location }}</span><h1>{{ current.title }}</h1><p>{{ artifact ? current.caption : photoCaption }}</p></div>
        <div v-if="canDiscover && eventReady && !artifact" class="recap-discover"><button @click="discover"><span class="recap-discover-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="m12 3 2.4 6.6L21 12l-6.6 2.4L12 21l-2.4-6.6L3 12l6.6-2.4Z"/></svg></span><span>{{ eventLabel }}<small>停在這一刻，慢慢看</small></span><span aria-hidden="true">↗</span></button></div>
        <footer class="recap-controls"><div class="recap-position"><b>{{ String(index+1).padStart(2,'0') }}</b><span>/ {{ String(stops.length).padStart(2,'0') }}</span><small>{{ currentTrip?.title }}</small></div><div class="recap-play-controls"><button aria-label="上一段回憶" :disabled="index===0" @click="choose(index-1)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="m14 6-6 6 6 6"/></svg></button><button class="recap-play-toggle" :aria-label="playing?'暫停回顧':'繼續回顧'" @click="toggle"><svg v-if="playing" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 5h3v14H7zm7 0h3v14h-3z"/></svg><svg v-else viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="m8 5 11 7-11 7z"/></svg><span>{{ playing?'暫停':'繼續' }}</span></button><button aria-label="下一段回憶" @click="next"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="m10 6 6 6-6 6"/></svg></button></div></footer>
      </template>
      <section v-else class="recap-ending"><span class="recap-ending-eyebrow">UNTIL THE NEXT TRIP</span><h1>這些地方，<br>都還記得。</h1><p>{{ stops.length }} 段回憶，來自 {{ new Set(stops.map(s=>s.tripId)).size }} 趟旅行。</p><div class="recap-ending-photos"><button v-for="(stop,i) in stops" :key="stop.id" :aria-label="'再看'+stop.title" @click="choose(i)"><img :src="asset(stop.image)" :alt="stop.title" /><span>{{ stop.title }}</span></button></div><button class="recap-ending-primary" @click="open=false">回到回憶地圖 ↗</button><button class="recap-ending-replay" @click="finished=false;index=0;enter(!reduced)">再看一次</button></section>
    </div>
  </dialog>
  <CreationDialog v-model="detailOpen" :title="current?.title || '這一段回憶'" wide>
    <template v-if="detailOpen && current">
      <nav v-if="current.works.length" class="recap-work-options" aria-label="這一站的其他收藏"><button :aria-pressed="!selectedWork" @click="selectedWork=null">這一刻的收藏</button><button v-for="work in current.works" :key="work.id" :aria-pressed="selectedWork?.id===work.id" @click="selectedWork=work">{{ work.title }}<small>{{ work.receivedFrom ? work.creator+' 的作品' : '你的作品' }}</small></button></nav>
      <UsjMemoryDetail v-if="displayKind==='scene' && current.tripId==='kansai'" embedded />
      <CreationPlayground v-else-if="displayWork && displayWork.photoId!=='nara-deer'" :key="displayWork.id" :work="displayWork" :image="asset('assets/memory/'+displayWork.image)" />
      <CreationPinPlay v-else-if="displayKind==='pin'" creator="你" />
      <div v-else class="recap-simple-detail"><img :src="asset(displayImage)" :alt="current.title+'收藏'" /><h3>{{ current.title }}</h3><p>{{ current.caption }}</p><small>{{ currentTrip?.title }} · {{ current.date }}</small></div>
    </template>
  </CreationDialog>
</template>

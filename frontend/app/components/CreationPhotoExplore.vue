<script setup lang="ts">
import { photoMemories, type PhotoMemory } from '~/data/photo-exploration';
import '~/assets/css/photo-exploration.css';
const emit = defineEmits<{ close: []; notebook: [] }>();
const asset = useAsset();
const source = asset('assets/memory/fuji-editorial.png');
const root = ref<HTMLDialogElement>();
const viewport = ref<HTMLElement>(), plane = ref<HTMLElement>(), flight = ref<HTMLElement>(), albumButton = ref<HTMLElement>();
const detail = ref<HTMLElement>();
const intro = ref<HTMLElement>();
const { gsap, animate, reduced } = useCreationMotion(root);
const selected = ref<PhotoMemory | null>(null);
const hints = ref(false), album = ref(false), writing = ref(false), busy = ref(false);
const collected = useState<string[]>('creation-demo-exploration-collected', () => []), notes = useState<Record<string, string>>('creation-demo-exploration-notes', () => ({})), draft = ref('');
const notice = ref('');
const size = reactive({ w: 1, h: 1 });
const camera = reactive({ scale: 1, x: 0, y: 0 });
const base = computed(() => Math.max(size.w / 1086, size.h / 724));
const planeStyle = computed(() => ({ width: `${1086 * base.value}px`, height: `${724 * base.value}px`, transform: `translate(-50%, -50%) translate(${camera.x}px, ${camera.y}px) scale(${camera.scale})` }));
const hero = computed(() => ({ w: Math.min(340, size.w * .65), h: size.w < 700 ? 175 : 240 }));
const isSaved = computed(() => !!selected.value && collected.value.includes(selected.value.id));
let opener: HTMLElement | null = null, observer: ResizeObserver | undefined;
let timeline: ReturnType<typeof gsap.timeline> | undefined;
let panelOpener: HTMLElement | null = null;
let sceneX: ReturnType<typeof gsap.quickTo> | undefined, sceneY: ReturnType<typeof gsap.quickTo> | undefined;
let captionX: ReturnType<typeof gsap.quickTo> | undefined, captionY: ReturnType<typeof gsap.quickTo> | undefined;
const parallaxEnabled = () => !reduced.value && matchMedia('(hover: hover) and (pointer: fine)').matches;
function resetParallax() { sceneX?.(0); sceneY?.(0); captionX?.(0); captionY?.(0); }
watch(reduced, value => { if(value){
  [sceneX,sceneY,captionX,captionY].forEach(t=>t?.tween.pause());
  if(viewport.value) gsap.set(viewport.value,{x:0,y:0});
  if(intro.value) gsap.set(intro.value,{x:0,y:0});
} });
const clip = useId();

function saveNote() {
  if (!selected.value) return;
  notes.value[selected.value.id] = draft.value.trim().slice(0, 180);
  writing.value = false; notice.value = '已儲存這段回憶。';
}
function stopMotion() { timeline?.kill(); busy.value = false; }
function dismiss() {
  stopMotion(); selected.value = null; writing.value = false;
  nextTick(() => panelOpener?.focus({ preventScroll: true }));
}
function close() { root.value?.close(); emit('close'); }
function escape() { if (album.value) album.value = false; else if (selected.value) dismiss(); else close(); }
function clampCamera() {
  const dx = Math.max(0, (1086 * base.value * camera.scale - size.w) / 2);
  const dy = Math.max(0, (724 * base.value * camera.scale - size.h) / 2);
  camera.x = Math.max(-dx, Math.min(dx, camera.x)); camera.y = Math.max(-dy, Math.min(dy, camera.y));
}
function zoomBy(amount: number) {
  if (selected.value || album.value) return;
  camera.scale = Math.max(1, Math.min(2.5, camera.scale + amount)); clampCamera();
}
function resetCamera() { camera.scale = 1; camera.x = 0; camera.y = 0; }
function heroPosition() {
  return {
    x: size.w < 700 ? (size.w-hero.value.w)/2 : (size.w-380-hero.value.w)/2,
    y: size.w < 700 ? Math.max(90,(size.h-(detail.value?.offsetHeight||300)-hero.value.h)/2) : (size.h-hero.value.h)/2-25,
  };
}
// Pointer events serve mouse drag and two-finger touch; all hotspots share this camera.
const pointers = new Map<number, { x: number; y: number }>();
let last = { x: 0, y: 0 }, distance = 0, moved = false;
function down(e: PointerEvent) {
  if (e.button !== 0 || selected.value || album.value) return;
  viewport.value?.setPointerCapture(e.pointerId);
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  last = { x: e.clientX, y: e.clientY }; moved = false;
  if (pointers.size === 2) { const [a,b] = [...pointers.values()]; distance = Math.hypot(a!.x-b!.x,a!.y-b!.y); }
}
function move(e: PointerEvent) {
  if (!pointers.has(e.pointerId)) {
    if(e.pointerType==='mouse' && parallaxEnabled() && !selected.value && !album.value) {
      const x=e.clientX/size.w-.5,y=e.clientY/size.h-.5;
      sceneX?.(-x*12);sceneY?.(-y*8);captionX?.(x*4);captionY?.(y*3);
    }
    return;
  }
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pointers.size === 2) {
    const [a,b] = [...pointers.values()]; const next = Math.hypot(a!.x-b!.x,a!.y-b!.y);
    if (distance) camera.scale = Math.max(1, Math.min(2.5, camera.scale * next / distance));
    distance = next; moved = true;
  } else {
    const dx = e.clientX-last.x, dy = e.clientY-last.y;
    if (Math.abs(dx)+Math.abs(dy)>2) moved = true;
    camera.x += dx; camera.y += dy;
  }
  last = { x: e.clientX, y: e.clientY }; clampCamera();
}
function up(e: PointerEvent) {
  pointers.delete(e.pointerId); distance = 0;
  const remaining = [...pointers.values()][0]; if (remaining) last = remaining;
  // Hit-test on release: pointer capture retargets the click to the viewport.
  if (!moved && e.type !== 'pointercancel' && !selected.value) {
    const rect = plane.value!.getBoundingClientRect();
    const x = (e.clientX-rect.left)/rect.width*1086, y=(e.clientY-rect.top)/rect.height*724;
    const paths = plane.value!.querySelectorAll<SVGPathElement>('.pe-hotspot path');
    const item = photoMemories.find((p,i) => paths[i]?.isPointInFill(new DOMPoint(x,y)) || Math.hypot(p.x-x,p.y-y)<20);
    if (item) reveal(item);
  }
}
async function reveal(item: PhotoMemory) {
  if (busy.value) return;
  panelOpener = document.activeElement as HTMLElement;
  album.value = false; writing.value = false;
  selected.value = item; draft.value = notes.value[item.id] || ''; busy.value = true;
  await nextTick();
  const bounds = plane.value!.getBoundingClientRect(), dialogBounds = root.value!.getBoundingClientRect();
  const [bx,by,bw,bh] = item.box;
  const sx = bounds.left-dialogBounds.left + bx/1086*bounds.width;
  const sy = bounds.top-dialogBounds.top + by/724*bounds.height;
  const startW = bw/1086*bounds.width, startH = bh/724*bounds.height;
  const limitX=Math.max(0,(bounds.width-size.w)/2),limitY=Math.max(0,(bounds.height-size.h)/2);
  const cameraX=Math.max(-limitX,Math.min(limitX,(543-item.x)*base.value*camera.scale));
  const cameraY=Math.max(-limitY,Math.min(limitY,(362-item.y)*base.value*camera.scale));
  const target = heroPosition();
  resetParallax();
  if(reduced.value) {
    camera.x=cameraX;camera.y=cameraY;
    gsap.set(flight.value!,{...target,scaleX:1,scaleY:1,rotation:0,opacity:1});
    gsap.set(root.value!.querySelector('.pe-photo-fragment'),{opacity:0});
    gsap.set(root.value!.querySelector('.pe-sticker-reveal'),{opacity:1,scale:1});
    busy.value=false;detail.value?.focus({preventScroll:true});return;
  }
  animate(d => {
    timeline = gsap.timeline({ defaults: { ease: 'power3.out' }, onComplete: () => { busy.value=false; detail.value?.focus({preventScroll:true}); } });
    timeline.fromTo(flight.value!, { x:sx, y:sy, scaleX:startW/hero.value.w, scaleY:startH/hero.value.h, rotation:0, opacity:1 },
      { keyframes: [
        { x:(sx+target.x)/2,y:(sy+target.y)/2-20,scaleX:(startW/hero.value.w+1)/2,scaleY:(startH/hero.value.h+1)/2,rotation:-1,duration:d(.24),ease:'power2.out' },
        { x:target.x,y:target.y,scaleX:1,scaleY:1,rotation:-3,duration:d(.34),ease:'power3.out' },
      ] },0)
      .to(camera,{x:cameraX,y:cameraY,duration:d(.58)},0)
      .fromTo('.pe-photo-fragment',{opacity:1},{opacity:0,duration:d(.28)},d(.15))
      .fromTo('.pe-sticker-reveal',{opacity:0,scale:.92},{opacity:1,scale:1,duration:d(.32)},d(.2))
      .fromTo(detail.value!,{y:14,opacity:0},{y:0,opacity:1,duration:d(.25)},d(.3));
  });
}
function collect() {
  if (!selected.value || busy.value) return;
  const item = selected.value;
  notes.value[item.id] = draft.value.trim().slice(0,180);
  if (isSaved.value) { dismiss(); return; }
  // Save on the click, so leaving during the collection animation cannot lose it.
  collected.value.push(item.id);
  const finish = () => {
    notice.value=`已收藏「${item.name}」・${collected.value.length} / 3`;
    selected.value=null; busy.value=false; albumButton.value?.focus({preventScroll:true});
  };
  if(reduced.value) { finish(); return; }
  busy.value = true;
  const target = albumButton.value!.getBoundingClientRect();
  const x = target.left+target.width/2-hero.value.w/2;
  const y = target.top+target.height/2-hero.value.h/2;
  const currentX = Number(gsap.getProperty(flight.value!, 'x'));
  const currentY = Number(gsap.getProperty(flight.value!, 'y'));
  animate(d => {
    timeline = gsap.timeline({ onComplete: finish });
    timeline.to(detail.value!,{opacity:0,y:8,duration:d(.16)},0)
      .to(flight.value!, {x:(currentX+x)/2,y:Math.min(currentY,y)-50,scale:.6,rotation:8,duration:d(.25),ease:'power2.in'},0)
      .to(flight.value!, {x,y,scale:.06,opacity:0,rotation:0,duration:d(.25),ease:'power3.out'})
      .fromTo(albumButton.value!,{scale:1},{scale:1.035,yoyo:true,repeat:1,duration:d(.12)},'-=.08')
      .fromTo('.pe-album-trigger .icon-book-leaf',{rotationY:-55,x:-1},{rotationY:0,x:0,duration:d(.24)},'-=.24');
  });
}
function openAlbum() { if(busy.value) return; dismiss(); album.value=true; nextTick(()=>root.value?.querySelector<HTMLElement>('.pe-album-close')?.focus()); }
onMounted(() => {
  opener=document.activeElement as HTMLElement;
  root.value?.showModal();
  animate(d=>{
    sceneX=gsap.quickTo(viewport.value!,'x',{duration:.65,ease:'power3.out'});
    sceneY=gsap.quickTo(viewport.value!,'y',{duration:.65,ease:'power3.out'});
    captionX=gsap.quickTo(intro.value!,'x',{duration:.85,ease:'power3.out'});
    captionY=gsap.quickTo(intro.value!,'y',{duration:.85,ease:'power3.out'});
    gsap.timeline().fromTo('.pe-intro>*',{y:9,opacity:0},{y:0,opacity:1,duration:d(.48),stagger:reduced.value?0:.07,ease:'power3.out'})
      .fromTo('.pe-header .icon-star-main',{scale:.65,rotation:-15},{scale:1,rotation:0,duration:d(.4),ease:'power3.out'},d(.25));
  });
  observer=new ResizeObserver(([entry])=>{
    if(!entry) return;
    size.w=entry.contentRect.width;size.h=entry.contentRect.height;clampCamera();
    // Keyboard and orientation changes must preserve the open memory and its draft.
    if(selected.value && !busy.value) nextTick(()=>{ if(flight.value) gsap.set(flight.value,heroPosition()); });
  });
  observer.observe(root.value!);
});
onBeforeUnmount(()=>{ stopMotion();observer?.disconnect();root.value?.close();opener?.focus({preventScroll:true}); });
</script>

<template>
  <Teleport to="body">
    <dialog ref="root" class="photo-explore" aria-label="照片探索・富士山" @cancel.prevent="escape" @close="emit('close')">
      <div ref="viewport" class="pe-viewport" :inert="!!selected||album" @pointerdown="down" @pointermove="move" @pointerleave="resetParallax" @pointerup="up" @pointercancel="up" @wheel.prevent="zoomBy($event.deltaY>0?-.12:.12)">
        <div ref="plane" class="pe-plane" :style="planeStyle">
          <svg viewBox="0 0 1086 724" class="pe-photograph" aria-label="藍調時刻的富士山、咖啡店與路燈">
            <image :href="source" width="1086" height="1448" />
            <g v-for="p in photoMemories" :key="p.id" class="pe-hotspot" :class="{'pe-hinted':hints,'pe-found':collected.includes(p.id),'pe-selected':selected?.id===p.id}" tabindex="0" role="button" :aria-label="`探索${p.name}${collected.includes(p.id)?'，已收藏':''}`" @keydown.enter.prevent="reveal(p)" @keydown.space.prevent="reveal(p)">
              <path :d="p.path" />
              <circle :cx="p.x" :cy="p.y" r="13" class="pe-halo" />
              <circle :cx="p.x" :cy="p.y" r="4" class="pe-dot" />
            </g>
          </svg>
        </div>
      </div>
      <div class="pe-scrim" :class="{'is-active':selected||album}" />
      <header class="pe-header">
        <button class="pe-back" aria-label="離開照片探索" autofocus @click="close"><MemoryMotionIcon name="back" /></button>
        <div class="pe-brand"><b>拾光</b><small>PHOTO EXPLORATION</small></div>
        <div class="pe-top-actions"><button aria-label="探索提示" :aria-pressed="hints" :disabled="!!selected||album" @click="hints=!hints"><MemoryMotionIcon name="sparkles" :active="hints" /><span>探索提示</span></button><button ref="albumButton" class="pe-album-trigger" aria-label="開啟拾光收藏冊" :disabled="busy" @click="openAlbum"><MemoryMotionIcon name="book" /><span>收藏冊</span> <b>{{ String(collected.length).padStart(2,'0') }}<small> / 03</small></b></button></div>
      </header>
      <div v-show="!selected&&!album" ref="intro" class="pe-intro"><span>富士山周邊 · 旅行照片</span><h2>那天的風景，<br>再看一眼。</h2><p>點選照片裡的小細節，<br>留成這趟旅行的貼紙。</p></div>
      <div v-if="selected" ref="flight" class="pe-flight" :style="{width:hero.w+'px',height:hero.h+'px'}" aria-hidden="true">
        <svg class="pe-photo-fragment" preserveAspectRatio="none" :viewBox="selected.box.join(' ')"><defs><clipPath :id="clip"><path :d="selected.path" /></clipPath></defs><image :href="source" width="1086" height="1448" :clip-path="`url(#${clip})`" /></svg>
        <div class="pe-sticker-reveal"><CreationStickerSprite :index="selected.sprite" /></div>
      </div>
      <section v-if="selected" ref="detail" class="pe-detail" tabindex="-1" :aria-label="selected.title">
        <div class="pe-panel-top"><span><MemoryMotionIcon :name="isSaved?'check':'sparkles'" />{{ isSaved?'已在你的收藏冊':'從照片裡，留一張貼紙' }}</span><button aria-label="返回照片" @click="dismiss"><MemoryMotionIcon name="close" /></button></div>
        <small class="pe-eyebrow">{{ selected.eyebrow }}</small><h2>{{ selected.title }}</h2><p>{{ selected.description }}</p>
        <button v-if="!writing" class="pe-note-toggle" @click="writing=true"><MemoryMotionIcon name="pen" /><span>{{ draft||'留一句那天的回憶' }}</span></button>
        <div v-else class="pe-note"><label for="pe-note">想記下的事 <span>選填</span></label><textarea id="pe-note" v-model="draft" maxlength="180" :placeholder="selected.prompt" rows="2" /><button @click="saveNote">儲存留言</button></div>
        <button class="pe-collect" :disabled="busy" @click="collect"><MemoryMotionIcon :name="isSaved?'check':'bookmark'" /><span>{{ busy?'整理成貼紙…':isSaved?'已收藏・繼續探索':'收進我的收藏冊' }}</span><MemoryMotionIcon name="arrow" /></button>
        <small class="pe-local">{{ isSaved?'可從收藏冊再次回到照片中的位置。':'留一句那天的回憶，和貼紙一起收藏。' }}</small>
      </section>
      <section v-if="album" class="pe-album" aria-label="拾光收藏冊">
        <div class="pe-panel-top"><span><MemoryMotionIcon name="book" />這趟旅行的收藏</span><button class="pe-album-close" aria-label="關閉收藏冊" @click="album=false;albumButton?.focus()"><MemoryMotionIcon name="close" /></button></div>
        <h2>一張照片，幾個小紀念。</h2><p>富士山周邊 <span>{{ collected.length }} / 3 張貼紙</span></p>
        <div class="pe-album-grid"><button v-for="p in photoMemories" :key="p.id" :class="{'is-collected':collected.includes(p.id)}" @click="reveal(p)"><CreationStickerSprite :index="p.sprite" /><b>{{ collected.includes(p.id)?p.name:'尚未拾起' }}</b><small>{{ collected.includes(p.id)?(notes[p.id]||'回到照片中的位置 ↗'):'去照片裡找找 ↗' }}</small></button></div>
        <button class="pe-notebook" @click="emit('notebook')">打開貼紙手帖 <MemoryMotionIcon name="arrow" /></button><small class="pe-local">想換個排法？手帖裡可以自由拖曳、拼貼。</small>
      </section>
      <footer v-if="!selected&&!album" class="pe-footer">
        <div v-if="hints" class="pe-hint-list"><button v-for="p in photoMemories" :key="p.id" @click="reveal(p)"><MemoryMotionIcon :name="collected.includes(p.id)?'check':'plus'" />{{ p.name }}</button></div>
        <div class="pe-footer-row"><p>{{ collected.length===3?'三張貼紙，都收好了。':'拖曳看照片 · 點光點收集貼紙' }}<small>照片探索 · 富士山範例</small></p><div class="pe-zoom"><button aria-label="縮小照片" :disabled="camera.scale<=1" @click="zoomBy(-.25)"><MemoryMotionIcon name="minus" /></button><button aria-label="重設照片視角" @click="resetCamera">{{ Math.round(camera.scale*100) }}%</button><button aria-label="放大照片" :disabled="camera.scale>=2.5" @click="zoomBy(.25)"><MemoryMotionIcon name="plus" /></button></div></div>
      </footer>
      <p class="pe-announcement" role="status">{{ notice }}</p>
    </dialog>
  </Teleport>
</template>

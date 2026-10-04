<script setup lang="ts">
import type { RevisitStop } from '~/data/revisit';
const props=defineProps<{ previous:RevisitStop; next:RevisitStop; token:number; reduced:boolean }>();
const emit=defineEmits<{ done:[token:number]; cancel:[] }>();
const root=ref<HTMLElement>(), asset=useAsset();
const {gsap,animate}=useCreationMotion(root);
let timeline:ReturnType<typeof gsap.timeline> | undefined;
let disposed=false;
function done(){if(!disposed)emit('done',props.token);}
function visibility(){if(document.hidden)timeline?.pause();else timeline?.resume();}
onMounted(()=>{
  if(props.reduced){nextTick(done);return;}
  animate(()=>{
    timeline=gsap.timeline({onComplete:done});
    timeline.fromTo(root.value!,{opacity:0,scale:.98},{opacity:1,scale:1,duration:.35,ease:'power2.out'})
      .fromTo('.chapter-previous',{y:12,rotation:0},{y:0,rotation:-5,duration:.4,ease:'power2.out'},0)
      .to('.chapter-previous',{x:-18,y:12,scale:.88,opacity:.65,duration:.5,ease:'power3.inOut'},.6)
      .fromTo('.chapter-next',{x:32,y:16,rotation:7,opacity:0},{x:0,y:0,rotation:3,opacity:1,duration:.6,ease:'power3.out'},.95)
      .fromTo('.chapter-date-line i',{scaleX:0},{scaleX:1,duration:.6,ease:'power2.inOut'},1.3)
      .fromTo('.chapter-next-caption',{y:8,opacity:0},{y:0,opacity:1,duration:.35,ease:'power2.out'},1.5)
      .to(root.value!,{opacity:0,scale:1.02,duration:.35,ease:'power2.in'},2.6);
  });
  document.addEventListener('visibilitychange',visibility);
  visibility();
});
watch(()=>props.reduced,value=>{if(value)timeline?.progress(1);});
onBeforeUnmount(()=>{disposed=true;document.removeEventListener('visibilitychange',visibility);});
</script>
<template>
  <div ref="root" class="revisit-chapter-overlay" @keydown.esc.stop.prevent="emit('cancel')">
    <section class="revisit-chapter-card" aria-label="切換到另一趟旅行">
      <div class="chapter-heading" role="status"><span>ANOTHER JOURNEY</span><h2>接著，回到另一趟旅行。</h2><p>時間往前，風景換了一頁。</p></div>
      <div class="chapter-photo-stack" aria-hidden="true">
        <figure class="chapter-previous"><img :src="asset(previous.source)" :class="{'source-crop':previous.sourceCrop}" alt=""/><figcaption>{{ previous.date.slice(0,7).replace('-',' / ') }} · {{ previous.groupLabel || previous.location }}</figcaption></figure>
        <figure class="chapter-next"><img :src="asset(next.source)" :class="{'source-crop':next.sourceCrop}" alt=""/><figcaption>{{ next.date.slice(0,7).replace('-',' / ') }} · {{ next.groupLabel || next.location }}</figcaption></figure>
      </div>
      <div class="chapter-date-line"><span>{{ previous.date.slice(5,7) }} 月</span><i/><span>{{ next.date.slice(5,7) }} 月</span></div>
      <p class="chapter-next-caption">{{ next.date.replaceAll('-','.') }}<b>{{ next.title }}</b></p>
      <div class="chapter-actions"><button @click="emit('cancel')">留在地圖</button><button @click="done">跳過轉場 →</button></div>
    </section>
  </div>
</template>
<style scoped>
.revisit-chapter-overlay{position:absolute;inset:112px 24px 112px;z-index:7;display:grid;place-items:center;pointer-events:none;perspective:1000px}
.revisit-chapter-card{width:min(100%,600px);padding:30px 36px 20px;border:1px solid #fff9;border-radius:25px;background:#fbf9f2f5;box-shadow:0 24px 90px #234d5d35;backdrop-filter:blur(15px);pointer-events:auto;text-align:center;color:#294d59}
.chapter-heading>span{font-size:9px;letter-spacing:.2em;color:#90916d}.chapter-heading h2{font-size:24px;font-weight:500;margin:10px 0 9px}.chapter-heading p{font-size:12px;color:#7c9295}
.chapter-photo-stack{height:218px;position:relative;margin:26px auto 22px;width:min(100%,420px);perspective:900px}
.chapter-photo-stack figure{position:absolute;width:58%;margin:0;padding:8px 8px 12px;background:#fffdf6;border:1px solid #e9e6dc;box-shadow:0 12px 25px #294a5324;transform-origin:center bottom;border-radius:3px}
.chapter-previous{left:0;top:4px;transform:rotate(-5deg)}.chapter-next{right:0;top:0;transform:rotate(3deg)}
.chapter-photo-stack img{display:block;width:100%;height:156px;object-fit:cover}.chapter-photo-stack .source-crop{object-position:top;object-view-box:inset(0 0 50% 0)}
.chapter-photo-stack figcaption{font-size:10px;color:#6e8186;padding-top:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.chapter-date-line{display:flex;align-items:center;gap:16px;margin:0 auto 16px;max-width:290px;color:#957e4b;font-size:11px}.chapter-date-line i{flex:1;height:1px;background:#beaa72;transform-origin:left;position:relative}.chapter-date-line i:after{content:'';position:absolute;right:0;top:-2px;width:5px;height:5px;border-radius:50%;background:#beaa72}
.chapter-next-caption{font-size:10px;color:#89978c;letter-spacing:.08em}.chapter-next-caption b{display:block;font-size:18px;font-weight:500;color:#315462;margin-top:7px;letter-spacing:0}
.chapter-actions{display:flex;justify-content:center;gap:18px;margin-top:10px}.chapter-actions button{font-size:11px;min-height:40px;padding:8px 12px;color:#627b81;border-radius:7px}.chapter-actions button:hover{background:#e8f0eb}.chapter-actions button:last-child{color:#137e9a}
@media(max-width:759px){.revisit-chapter-overlay{inset:139px 18px 112px;align-items:start}.revisit-chapter-card{padding:22px 20px 13px;border-radius:20px}.chapter-heading h2{font-size:18px}.chapter-heading p{font-size:11px}.chapter-photo-stack{height:180px;margin:22px auto 16px}.chapter-photo-stack img{height:125px}.chapter-photo-stack figcaption{font-size:8px}.chapter-next-caption b{font-size:16px}}
@media(max-height:680px){.revisit-chapter-card{padding-top:16px}.chapter-photo-stack{height:135px;margin:16px auto}.chapter-photo-stack img{height:95px}.chapter-heading p{display:none}.chapter-next-caption b{font-size:15px}}
</style>

<script setup lang="ts">
import { buildCollectionEntries, collectionCategories, collectionOpeningOrder, type CollectionEntry } from '~/data/collection';
import { styleById, type CreationId, type CreationWork } from '~/data/creation';
import { tripSummaries } from '~/data/trips';
import '~/assets/css/creation.css';
import '~/assets/css/collection.css';

useHead({title:'旅行收集冊 · 去趣 chicTrip'});
const {activeId,activeTrip,tripHref} = useTripContext();
const {allWorks,collected,exchanges,friends} = useCreation();
const {state:journey} = useJourneyCollection();
const asset = useCreationAsset();
const root = ref<HTMLElement>(), {gsap,animate} = useCreationMotion(root);
const category = ref<'all'|CreationId>('all');
const mode = ref<'catalog'|'owned'|'exchanged'>('catalog');
const page = ref(0), pageSize = ref(8), direction = ref(1);
const selectedId = ref(''), detailOpen = ref(false), playing = ref(false), exchanging = ref(false);
const detailTab = ref<'object'|'source'|'story'>('object');
const exchangeWork = ref<CreationWork|null>(null);
const entries = computed(() => buildCollectionEntries(activeId.value,allWorks.value));
const owned = computed(() => entries.value.filter(item=>item.collected));
const traded = computed(() => owned.value.filter(item=>item.work.receivedFrom));
// 件數跟其他頁一樣算作品（一組貼紙算一件），書頁裡的貼紙才逐枚攤開
const tradedCount = computed(() => collected.value.filter(work=>work.receivedFrom).length);
const pool = computed(() => mode.value==='owned'?owned.value:mode.value==='exchanged'?traded.value:entries.value);
const filtered = computed(() => category.value==='all'?collectionOpeningOrder(pool.value):pool.value.filter(item=>item.work.styleId===category.value));
const pages = computed(() => Math.max(1,Math.ceil(filtered.value.length/pageSize.value)));
const visible = computed(() => filtered.value.slice(page.value*pageSize.value,(page.value+1)*pageSize.value));
const chapter = computed(() => collectionCategories.find(item=>item.id===category.value)!);
const selected = computed(() => entries.value.find(item=>item.id===selectedId.value));
const friend = computed(() => friends.value.find(person=>person.id===selected.value?.work.receivedFrom));
const origin = computed(() => exchanges.value.find(item=>item.id===selected.value?.work.exchangeId));
const sourceTrip = computed(() => tripSummaries.find(trip=>trip.id===(selected.value?.work.sourceTripId||selected.value?.work.tripId)));
const workImage = (work:CreationWork) => work.renderedImage||asset('assets/memory/'+work.image);
const categoryCount = (id:'all'|CreationId) => id==='all'?pool.value.length:pool.value.filter(item=>item.work.styleId===id).length;
const date = (value?:string) => value && !Number.isNaN(Date.parse(value))?new Date(value).toLocaleDateString('zh-TW',{timeZone:'Asia/Taipei',month:'long',day:'numeric'}):'這趟旅行';
let responsive:MediaQueryList|undefined, lastSwipe=0, start:{x:number;y:number}|undefined;
function resize(){pageSize.value=responsive?.matches?4:8;page.value=Math.min(page.value,pages.value-1);}
function reveal(){animate(d=>gsap.fromTo('.collection-spread',{opacity:.45,x:direction.value*10,rotationY:direction.value*3},{opacity:1,x:0,rotationY:0,duration:d(.38),ease:'power2.out',clearProps:'transform,opacity',overwrite:true}));}
onMounted(()=>{
  responsive=matchMedia('(max-width:700px)');resize();responsive.addEventListener('change',resize);
  animate(d=>gsap.fromTo('.collection-hero-art',{y:12,rotation:3},{y:0,rotation:0,duration:d(.55),ease:'power2.out',clearProps:'transform'}));
  reveal();
});
onBeforeUnmount(()=>responsive?.removeEventListener('change',resize));
watch([activeId,category,mode],()=>{page.value=0;detailOpen.value=playing.value=exchanging.value=false;});
watch(activeId,()=>{category.value='all';mode.value='catalog';});
watch(pages,()=>{page.value=Math.min(page.value,pages.value-1);});
watch(()=>`${activeId.value}:${category.value}:${mode.value}:${page.value}:${pageSize.value}`,reveal,{flush:'post'});
function turn(delta:number){const next=page.value+delta;if(next<0||next>=pages.value)return;direction.value=delta;page.value=next;}
function touchStart(event:PointerEvent){if(event.pointerType!=='mouse')start={x:event.clientX,y:event.clientY};}
function touchEnd(event:PointerEvent){if(!start)return;const dx=event.clientX-start.x,dy=event.clientY-start.y;start=undefined;if(Math.abs(dx)>55&&Math.abs(dy)<40){lastSwipe=Date.now();turn(dx<0?1:-1);}}
function open(entry:CollectionEntry){if(Date.now()-lastSwipe<300)return;selectedId.value=entry.id;detailTab.value='object';detailOpen.value=true;}
// 範例不能直接收下：用同一張照片自己做一件，或跟朋友交換來，才算收藏
const isUsjScene = (work:CreationWork) => work.photoId==='usj-scene'&&work.styleId==='scene';
const makeLink = computed(() => !selected.value ? tripHref('/memory') : isUsjScene(selected.value.work) ? tripHref('/memory/usj') : tripHref('/memory',{photo:selected.value.work.photoId,style:selected.value.work.styleId}));
function trade(){if(!selected.value?.collected)return;exchangeWork.value=selected.value.work;detailOpen.value=false;exchanging.value=true;}
function play(){
  if(!selected.value)return;
  if(isUsjScene(selected.value.work)){navigateTo(tripHref('/memory/usj'));return;}
  detailOpen.value=false;playing.value=true;
}
</script>

<template>
  <section ref="root" class="collection-page" aria-labelledby="collection-title">
    <template v-if="activeTrip">
    <nav class="collection-top"><NuxtLink to="/atlas"><MemoryMotionIcon name="back"/>回憶廣場</NuxtLink><NuxtLink :to="tripHref('/memory')">去製作新收藏 <span aria-hidden="true">↗</span></NuxtLink></nav>
    <header class="collection-hero">
      <div><p class="collection-eyebrow">THE TRAVEL COLLECTION</p><h1 id="collection-title">旅行收集冊<span aria-hidden="true">●</span></h1><p class="collection-intro">一枚貼紙，一段票根。<br>把這趟旅行的小東西，好好收起來。</p><div class="collection-tally"><b>{{ collected.length }}</b><span>件已收藏</span><i>·</i><span>{{ tradedCount }} 件來自朋友</span></div></div>
      <img class="collection-hero-art" :src="asset('assets/atlas-plaza/v3/collection.png')" alt="翻開的旅行收集冊，放著小鹿貼紙、富士山照片與票根" />
    </header>
    <div class="collection-shelves" role="group" aria-label="收藏來源"><button :aria-pressed="mode==='catalog'" @click="mode='catalog'">風格圖鑑<span>{{ entries.length }}</span></button><button :aria-pressed="mode==='owned'" @click="mode='owned'">我的收藏<span>{{ collected.length }}</span></button><button :aria-pressed="mode==='exchanged'" @click="mode='exchanged'">交換來的<span>{{ tradedCount }}</span></button></div>
    <nav class="collection-tabs" aria-label="收藏種類"><button v-for="item in collectionCategories" :key="item.id" :aria-pressed="category===item.id" @click="category=item.id"><span class="collection-category-icon" aria-hidden="true">{{ item.symbol }}</span>{{ item.name }}<small>{{ categoryCount(item.id) }}</small></button></nav>

    <div class="collection-book" :class="['collection-book-'+category,{'is-empty':!filtered.length}]" tabindex="0" aria-label="可翻頁的旅行收集冊" @keydown.right.self.prevent="turn(1)" @keydown.left.self.prevent="turn(-1)" @pointerdown="touchStart" @pointerup="touchEnd" @pointercancel="start=undefined">
      <div class="collection-book-title"><span><small>{{ chapter.english }}</small><h2>{{ category==='all'?'這趟旅行的小收藏':chapter.name+'圖鑑' }}</h2></span><span class="collection-book-stamp">{{ activeTrip.english }}<b>{{ activeTrip.startDate.slice(0,4) }}</b></span></div>
      <div v-if="filtered.length" class="collection-spread" :key="category+mode+page" aria-live="polite">
        <button v-for="(entry,index) in visible" :key="entry.id" class="collection-cell" :class="['collection-cell-'+entry.work.styleId,{'is-collected':entry.collected}]" :style="{'--object-tilt':(index%2?-3:3)+'deg'}" :aria-label="'查看'+entry.title+'，'+(entry.work.receivedFrom?'朋友交換':entry.collected?'已收藏':'風格範例')" @click="open(entry)">
          <span class="collection-catalog-number">{{ String(filtered.findIndex(item=>item.id===entry.id)+1).padStart(2,'0') }}</span><span class="collection-cell-status" :class="{'is-traded':entry.work.receivedFrom}">{{ entry.work.receivedFrom?'⇄ 朋友交換':entry.collected?'✓ 已收藏':'範例' }}</span>
          <CollectionObject :entry="entry"/><span class="collection-cell-copy"><b>{{ entry.title }}</b><small>{{ entry.work.location }}</small><span>{{ styleById(entry.work.styleId).name }}<i aria-hidden="true">↗</i></span></span>
        </button>
      </div>
      <div v-else class="collection-empty"><img :src="asset('assets/atlas-plaza/v3/collection.png')" alt=""/><h3>{{ mode==='exchanged'?'這一頁，留給朋友的回憶。':mode==='owned'?'把第一件收藏放進來吧。':'這趟旅行，還沒有'+(category==='all'?'收藏':chapter.name)+'。' }}</h3><p>{{ mode==='exchanged'?'選一件喜歡的收藏，和同行朋友交換。':mode==='owned'?'用這趟旅行的照片製作，或和朋友交換一件。':'用這趟旅行的照片，製作一件新的紀念。' }}</p><button v-if="mode!=='catalog'" class="creation-secondary" @click="mode='catalog';category='all'">逛逛風格圖鑑 ↗</button><NuxtLink v-else class="creation-secondary" :to="tripHref('/memory')">去回憶製造所 ↗</NuxtLink></div>
      <div class="collection-pagination"><button aria-label="上一頁收藏" :disabled="page===0" @click="turn(-1)"><MemoryMotionIcon name="back"/></button><div><b>{{ String(page+1).padStart(2,'0') }}<span>/ {{ String(pages).padStart(2,'0') }}</span></b><small>{{ filtered.length?`${filtered.length} 件收藏 · 點一下拿起來看`:'慢慢收集，每一件都有一段回憶' }}</small></div><button aria-label="下一頁收藏" :disabled="page>=pages-1" @click="turn(1)"><MemoryMotionIcon name="arrow"/></button></div>
    </div>
    <p class="collection-footnote">{{ mode==='catalog'?'圖鑑裡的範例要用照片製作，或和朋友交換，才會變成你的收藏。':'收藏跟著行程保存，原照和交換故事一起留下。' }}</p>

    <CreationDialog v-model="detailOpen" :title="selected?.title||'旅行收藏'" wide>
      <div v-if="selected" class="collection-detail">
        <div class="collection-detail-tabs" role="group" aria-label="查看收藏內容"><button :aria-pressed="detailTab==='object'" @click="detailTab='object'">{{ styleById(selected.work.styleId).name }}</button><button :aria-pressed="detailTab==='source'" @click="detailTab='source'">原照片</button><button :aria-pressed="detailTab==='story'" @click="detailTab='story'">收藏來歷<span v-if="friend"> ⇄</span></button></div>
        <template v-if="detailTab==='object'"><div class="collection-detail-art"><CollectionObject :entry="selected"/><span class="collection-detail-seal">{{ friend?'和 '+friend.name+' 交換':selected.collected?'已收藏':'這趟旅行的風格範例' }}</span></div><div class="collection-detail-caption"><span>{{ activeTrip.title }} · {{ selected.work.location }}</span><h3>{{ selected.title }}</h3><p>{{ selected.kit?'這組貼紙共有 '+selected.kit.motifs.length+' 枚，可以逐枚查看，收藏與交換則以整組為單位。':styleById(selected.work.styleId).caption }}</p></div><button class="collection-play" @click="play">{{ selected.kit?'玩這組貼紙':selected.work.styleId==='scene'&&selected.work.photoId==='usj-scene'?'走進 3D 場景':styleById(selected.work.styleId).interactive }} <span aria-hidden="true">↗</span></button></template>
        <figure v-else-if="detailTab==='source'" class="collection-source"><div :class="{'creation-cropped-source':selected.work.sourceCrop}"><img :src="asset('assets/memory/'+(selected.work.source||selected.work.image))" :alt="selected.work.location+'原照片'"/></div><figcaption>{{ selected.work.location }} · {{ sourceTrip?.dateLabel }}</figcaption></figure>
        <div v-else class="collection-story"><span class="collection-eyebrow">EVERY LITTLE THING HAS A STORY</span><h3>{{ friend?'一件交換來的旅行紀念。':'從這趟旅行，留到這一頁。' }}</h3><dl><div><dt>旅行</dt><dd>{{ activeTrip.title }}</dd></div><div><dt>原作地點</dt><dd>{{ selected.work.location }}</dd></div><div><dt>原創作者</dt><dd>{{ selected.work.creator==='AI 示範'?'旅行風格範例':selected.work.creator }}</dd></div><div><dt>收藏狀態</dt><dd>{{ selected.collected?'已加入收集冊':'風格範例 · 還沒製作' }}</dd></div><div v-if="friend"><dt>交換對象</dt><dd>{{ friend.name }}<span v-if="friend.companion" class="collection-companion-label">同行朋友</span></dd></div><div v-if="friend"><dt>原作旅程</dt><dd>{{ sourceTrip?.title }}</dd></div><div><dt>{{ friend?'交換日期':'作品日期' }}</dt><dd>{{ date(origin?.resolvedAt||selected.work.createdAt) }}</dd></div></dl><blockquote v-if="origin?.note">「{{ origin.note }}」<small>{{ origin.direction==='received'?friend?.name:'你' }} 的留言</small></blockquote><blockquote v-if="origin?.reply||selected.work.id==='journey-usj-companion'&&journey.friendReply">「{{ origin?.reply||journey.friendReply }}」<small>{{ origin?.direction==='received'?'你':friend?.name }} 的回覆</small></blockquote><a :href="workImage(selected.work)" :download="'chictrip-'+selected.work.styleId+'.png'">下載這件收藏 ↓</a></div>
      </div>
      <template v-if="selected" #footer><template v-if="selected.collected"><span class="collection-owned-label">✓ 已收進這趟旅行</span><button class="creation-primary collection-exchange" @click="trade"><img :src="asset('assets/memory/exchange-collectibles.png')" alt=""/>{{ selected.kit?'交換這組貼紙':'與朋友交換' }}</button></template><template v-else><span class="collection-owned-label">風格範例</span><NuxtLink class="creation-primary" :to="makeLink" @click="detailOpen=false">用這張照片製作 <span aria-hidden="true">✦</span></NuxtLink></template></template>
    </CreationDialog>
    <CreationDialog v-model="playing" :title="selected?.title||'互動收藏'" wide><CreationPlayground v-if="playing&&selected" :work="selected.work" :image="workImage(selected.work)" :giver="friend?.name"/></CreationDialog>
    <CreationExchange v-if="exchangeWork" v-model="exchanging" :work="exchangeWork"/>
    </template>
  </section>
</template>

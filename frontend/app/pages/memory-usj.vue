<script setup lang="ts">
import '~/assets/css/creation.css';
import '~/assets/css/usj-memory.css';
definePageMeta({ path: '/memory/usj' });
useHead({ title: '把這一天，收進小世界 · 去趣 chicTrip' });
const asset=useAsset();
const {state,ready,markCreated,saveUsj}=useJourneyCollection();
const generating=ref(false), savedOpen=ref(false);
let timer:ReturnType<typeof setTimeout>|undefined;
function create(){if(generating.value)return;generating.value=true;timer=setTimeout(()=>{markCreated();generating.value=false;},1050);}
function save(){saveUsj();savedOpen.value=true;}
onBeforeUnmount(()=>clearTimeout(timer));
</script>
<template>
  <section class="usj-page" aria-labelledby="usj-title">
    <nav class="usj-breadcrumb"><NuxtLink to="/memory"><MemoryMotionIcon name="back"/>回憶製造所</NuxtLink><span>關西旅行 · 環球影城</span></nav>
    <div class="mascot-perch"><header class="usj-heading"><div><span class="usj-eyebrow">ONE PHOTO, A LITTLE WORLD</span><h1 id="usj-title">把這一天，收進小世界。</h1><p>一張照片，一件收藏。留在你去過的地方。</p></div><span class="usj-style-badge">場景積木 <b>3D</b></span></header><PageMascot /></div>
    <div v-if="!ready || !state.usjCreated" class="usj-create-layout" :aria-busy="generating">
      <div class="usj-source-stage"><img :src="asset('assets/memory/journey/usj-source.png')" alt="環球影城超級任天堂世界，左側蘑菇餐廳、城堡與層疊山丘"/><span class="usj-source-chip">你的照片 · 超級任天堂世界</span><Transition name="usj-photo"><div v-if="generating" class="usj-create-progress" role="status"><span class="creation-spinner"/><b>把照片裡的地方，變成小場景…</b><small>熟悉的風景，正在變成小小世界。</small></div></Transition></div>
      <aside class="usj-create-copy"><span class="usj-eyebrow">把喜歡的地方留下來</span><h2>轉個角度，<br>再逛一次。</h2><p>蘑菇餐廳、城堡和層層山丘，變成可以轉動、輕點的小小場景。</p><div class="usj-placement"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M12 21s7-6 7-12A7 7 0 0 0 5 9c0 6 7 12 7 12Z"/><circle cx="12" cy="9" r="2.5"/></svg><span>收藏的位置<b>關西旅行 / 大阪環球影城</b></span></div><button class="creation-primary usj-create-button" :disabled="generating || !ready" @click="create">{{ generating ? '正在準備…' : '用這張照片製作' }}<span v-if="!generating" aria-hidden="true">↗</span></button><p class="usj-subtle">這次選擇場景積木。旅程中的其他照片，也可以用不同形式留下。</p></aside>
    </div>
    <div v-else class="usj-created-layout"><UsjMemoryDetail/><aside class="usj-save-panel"><span class="usj-eyebrow">你的旅行收藏</span><h2>環球影城的<br>小小世界</h2><p>從照片裡挑出熟悉的地方，變成一件可以再回來玩的紀念。</p><div class="usj-placement"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M12 21s7-6 7-12A7 7 0 0 0 5 9c0 6 7 12 7 12Z"/><circle cx="12" cy="9" r="2.5"/></svg><span>{{ state.usjSaved ? '已收進回憶地圖' : '將加入回憶地圖' }}<b>關西旅行 / 大阪環球影城</b></span></div><button v-if="!state.usjSaved" class="creation-primary" @click="save">加入回憶地圖 <span aria-hidden="true">＋</span></button><NuxtLink v-else class="creation-primary" to="/atlas?journey=kansai&stop=usj">回到這趟旅行 <span aria-hidden="true">↗</span></NuxtLink><div class="usj-next-stops"><span>也在同一趟旅行裡</span><div><img :src="asset('atlas-assets/scenes/1.jpg')" alt=""/><img :src="asset('assets/memory/journey/nara-sticker.png')" alt=""/><img :src="asset('assets/photos/kansai/kiyomizu.jpg')" alt=""/></div><small>道頓堀的夜色、奈良的貼紙、清水寺的照片。</small></div></aside></div>
    <CreationDialog v-model="savedOpen" title="這一站，有了新的收藏"><div class="usj-save-success"><span><MemoryMotionIcon name="check"/></span><h3>已加入關西旅行</h3><p>環球影城的場景積木，和其他地方的回憶放在一起了。</p><div class="usj-success-route">關西旅行 <span>›</span> 大阪環球影城 <span>›</span> 場景積木</div></div><template #footer><button class="creation-secondary" @click="savedOpen=false">繼續看看</button><NuxtLink class="creation-primary" to="/atlas?journey=kansai&stop=usj" @click="savedOpen=false">在地圖上打開 ↗</NuxtLink></template></CreationDialog>
  </section>
</template>

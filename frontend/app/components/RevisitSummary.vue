<script setup lang="ts">
import type { buildRevisitSummary } from '~/utils/revisit-summary';
import { styleById, type CreationWork } from '~/data/creation';
const props = defineProps<{ title:string; summary:ReturnType<typeof buildRevisitSummary> }>();
const emit = defineEmits<{ replay:[]; close:[] }>();
const asset = useCreationAsset(), root = ref<HTMLElement>();
const { animate, gsap } = useCreationMotion(root);
const kinds = {sticker:'貼紙',pin:'徽章',ticket:'票根'};
function workImage(work:CreationWork){ return asset(work.renderedImage || (/^(assets\/|atlas-assets\/|data:|blob:)/.test(work.image)?work.image:'assets/memory/'+work.image)); }
onMounted(() => {
  root.value?.querySelector<HTMLElement>('h2')?.focus({preventScroll:true});
  animate(duration => gsap.fromTo(root.value!.querySelectorAll('[data-recap-entry]'),{y:14,opacity:0},{y:0,opacity:1,duration:duration(.45),stagger:duration(.07),ease:'power3.out',clearProps:'transform,opacity'}));
});
</script>
<template>
  <div ref="root" class="revisit-summary">
    <header class="revisit-summary-heading"><span class="revisit-eyebrow">MEMORY ATLAS · REVISITED</span><button aria-label="關閉總結，回到地圖" @click="emit('close')">×</button></header>
    <div class="revisit-summary-scroll">
      <div class="revisit-summary-title" data-recap-entry><span class="revisit-summary-rule" aria-hidden="true"/><p>{{ title }}</p><h2 tabindex="-1">這次重遊，<br/>又看見了這些。</h2><small>{{ summary.groups.join(' · ') || '旅行回憶' }}<span v-if="summary.photos.length && summary.photos.length<summary.total"> · 還有 {{ summary.total-summary.photos.length }} 處可以慢慢看</span></small></div>
      <dl class="revisit-summary-stats" data-recap-entry><div><dt>回顧景點</dt><dd>{{ summary.photos.length }}<small>/ {{ summary.total }}</small></dd></div><div><dt>打開收藏</dt><dd>{{ summary.opened.length }}<small>件</small></dd></div><div><dt>已有作品</dt><dd>{{ summary.owned.length }}<small>件</small></dd></div></dl>
      <section class="revisit-summary-photos" data-recap-entry aria-label="這次看過的照片"><figure v-for="stop in summary.photos" :key="stop.id"><div><img :src="asset(stop.source)" :alt="stop.title" :class="{'source-crop':stop.sourceCrop}"/></div><figcaption><b>{{ stop.short }}</b><time>{{ stop.date.slice(5).replace('-','.') }}</time></figcaption></figure></section>
      <section v-if="summary.opened.length" class="revisit-summary-objects" data-recap-entry><h3>這次打開的小收藏 <span>{{ summary.opened.length }}</span></h3><div><figure v-for="item in summary.opened" :key="item.id"><img :src="asset(item.image)" :alt="item.title"/><figcaption><b>{{ item.place }} · {{ kinds[item.kind] }}</b><small>{{ item.demo?'示範收藏':'我的收藏' }}</small></figcaption></figure></div><p>打開示範收藏不會新增個人作品。</p></section>
      <p v-else class="revisit-summary-note" data-recap-entry>有照片和走過的地方，就能再走一次。<br/>這次沒有打開收藏，也是一段完整的重遊。</p>
      <section v-if="summary.owned.length" class="revisit-summary-objects" data-recap-entry><h3>留在收藏裡的作品 <span>{{ summary.owned.length }}</span></h3><div><figure v-for="work in summary.owned" :key="work.id"><img :src="workImage(work)" :alt="work.title"/><figcaption><b>{{ work.location }}</b><small>{{ styleById(work.styleId).name }} · {{ work.receivedFrom?'交換來的':'我的收藏' }}</small></figcaption></figure></div><p>已有作品來自這些景點的個人收藏，重遊不會重複新增。</p></section>
    </div>
    <footer class="revisit-summary-actions"><button class="revisit-primary" @click="emit('replay')">再走一次 <span aria-hidden="true">↗</span></button><button @click="emit('close')">回到地圖</button><NuxtLink to="/atlas">回憶廣場 →</NuxtLink></footer>
  </div>
</template>

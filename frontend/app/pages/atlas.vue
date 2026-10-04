<script setup lang="ts">
import '~/assets/css/journey-atlas.css';
const route = useRoute();
const atlasMode = computed(() => route.query.view === 'cities' ? 'cities' : route.query.view === 'journey' || route.query.journey || route.query.scope ? 'journey' : 'plaza');
useHead(() => ({ title: atlasMode.value === 'cities' ? '旅行重遊 · Memory Atlas · 去趣' : '回憶廣場 · Memory Atlas · 去趣' }));
</script>
<template>
  <AtlasPlaza v-if="atlasMode === 'plaza'" />
  <RevisitExperience v-else-if="atlasMode === 'cities'" />
  <template v-else>
    <div class="atlas-return">
      <NuxtLink to="/atlas"><MemoryMotionIcon name="back"/>回憶樂園</NuxtLink>
      <NuxtLink :to="{path:'/atlas',query:{view:'cities'}}">地圖重遊 ↗</NuxtLink>
    </div>
    <TripAtlasCollection />
  </template>
</template>

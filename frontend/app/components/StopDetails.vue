<script setup lang="ts">
import type { Stop } from '~/types/trip';
defineProps<{
    stop: Stop;
}>();
const asset = useAsset();
</script>
<template>
  <img referrerpolicy="no-referrer" class="spot-photo" :src="asset(stop.photo.src)" :alt="stop.photo.alt" :style="{ objectPosition: stop.photo.objectPosition }">
  <h3>第 {{ stop.day + 1 }} 天 · {{ stop.name }}</h3>
  <p>{{ stop.note }}</p>
  <p v-if="stop.transit" class="small-note">{{ stop.transit }}</p>
  <div class="estimate">
    <span>本站預估用量<br><small>{{ stop.stay }}</small></span>
    <strong>{{ stop.range.join('–') }} <small>MB / 人</small></strong>
  </div>
  <p class="small-note">Mock：導航、查詢與照片分享的使用情境；非現場即時用量。影片與熱點會增加需求。</p>
  <a v-if="stop.photo.source" class="photo-credit" :href="stop.photo.source" target="_blank" rel="noopener">實景照片：{{ stop.photo.credit }} · {{ stop.photo.license }} ↗</a>
  <p v-else class="photo-credit">{{ stop.photo.credit }} · {{ stop.photo.license }}</p>
</template>


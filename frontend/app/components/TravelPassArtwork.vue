<script setup lang="ts">
import type { TravelPass } from '~/data/travel-passes';
const props = defineProps<{ pass: TravelPass }>();
const asset = useAsset();
const artworkLabel = computed(() => ({ ticket: '官方票券圖片', map: '官方路線圖', promotion: '官方產品／交通圖片', operator: '官方營運商圖片與規劃範圍示意' }[props.pass.imageKind]));
const areaPaths = computed(() => {
  const points = props.pass.areas.flat();
  const west = Math.min(...points.map(p => p[0]!)), east = Math.max(...points.map(p => p[0]!));
  const south = Math.min(...points.map(p => p[1]!)), north = Math.max(...points.map(p => p[1]!));
  const scale = Math.min(112 / Math.max(east - west, .01), 50 / Math.max(north - south, .01));
  return props.pass.areas.map(area => area.map(p => [80 + (p[0]! - (west + east) / 2) * scale, 30 - (p[1]! - (north + south) / 2) * scale].join(',')).join(' '));
});
</script>
<template>
  <span class="pass-artwork" :class="[pass.imageClass, { operator: pass.imageKind === 'operator' }]">
    <svg v-if="pass.imageKind === 'operator'" viewBox="0 0 160 60" aria-hidden="true"><polygon v-for="(area, i) in areaPaths" :key="i" :points="area" /></svg>
    <img :src="asset(pass.image)" :alt="`${pass.name}・${artworkLabel}`" loading="lazy" decoding="async">
  </span>
</template>
<style scoped>
.pass-artwork{position:relative;display:block;width:100%;aspect-ratio:1.6;border-radius:12px;overflow:hidden;background:#effaff}.pass-artwork img{display:block;width:100%;height:100%;object-fit:contain;padding:10px}.pass-artwork.seoul-leaflet{background:#ab259b;aspect-ratio:1.22}.seoul-leaflet img{position:absolute;width:1351%;height:auto;max-width:none;padding:0;left:-563%;top:-141%}
.operator svg{display:block;width:100%;height:65%;padding:7px 3px 0;fill:#009fc51c;stroke:#009fc5;stroke-width:1.3}.operator img{height:35%;padding:3px 16px 9px}
</style>

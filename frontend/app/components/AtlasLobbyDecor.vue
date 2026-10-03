<script setup lang="ts">
import { atlasPlazaElevations, type AtlasParkZone } from '~/data/atlas-plaza';
const asset = useAsset();
const precincts: { id: AtlasParkZone['id']; x: number; y: number }[] = [
  { id: 'cities', x: 26, y: 40 },
  { id: 'town', x: 74, y: 40 },
  { id: 'collection', x: 24.5, y: 79 },
  { id: 'wardrobe', x: 75.5, y: 79 },
];
const flowerbeds = [
  { x: 37, y: 77, width: 82 },
  { x: 64, y: 80, width: 88 },
  { x: 49, y: 13, width: 104 },
];
// Bottom anchors keep each illustration planted on its own part of the park.
const decorations = [
  { id: 'lakeside-bridge', x: 50, y: 35, width: 178 },
  { id: 'shaded-bench', x: 11, y: 51, width: 108 },
  { id: 'travel-kiosk', x: 89, y: 50, width: 104 },
  { id: 'garden-wayfinder', x: 60, y: 72, width: 77 },
  { id: 'welcome-arbor', x: 50, y: 88, width: 125 },
];
</script>

<template>
  <div class="lobby-decor" aria-hidden="true">
    <div v-for="zone in precincts" :key="zone.id" class="lobby-precinct" :style="{ left: zone.x + '%', top: zone.y + '%', '--zone-lift': atlasPlazaElevations[zone.id] + 'px' }">
      <div class="lobby-precinct-raised">
        <AtlasTerrace :id="zone.id" :height="atlasPlazaElevations[zone.id]" :stair-side="zone.x < 50 ? 'right' : 'left'" />
        <img class="lobby-precinct-art" :src="asset('assets/atlas-plaza/precincts-v1/' + zone.id + '-garden.png')" alt="" draggable="false" />
      </div>
    </div>
    <img v-for="(bed, index) in flowerbeds" :key="index" class="lobby-flowerbed" :src="asset('assets/atlas-plaza/terrain-v1/stone-flower-border.png')" :style="{ left: bed.x + '%', top: bed.y + '%', '--bed-width': bed.width + 'px' }" alt="" draggable="false" />
    <div v-for="item in decorations" :key="item.id" class="lobby-decor-anchor" :class="'decor-' + item.id" :style="{ left: item.x + '%', top: item.y + '%', '--decor-width': item.width + 'px' }">
      <img class="lobby-decor-art" :src="asset('assets/atlas-plaza/decor-v1/' + item.id + '.png')" alt="" draggable="false" decoding="async" />
    </div>
  </div>
</template>

<style scoped>
.lobby-decor{position:absolute;inset:0;pointer-events:none;user-select:none;z-index:1}
.lobby-precinct{position:absolute;width:330px;transform:translate(-50%,-100%)}
.lobby-precinct-raised{position:relative;transform:translateY(calc(-1 * var(--zone-lift) * var(--precinct-scale)))}
.lobby-precinct-art{position:relative;display:block;width:100%;height:auto}
.lobby-flowerbed{position:absolute;width:calc(var(--bed-width)*1.2);height:auto;transform:translate(-50%,-100%)}
.lobby-decor-anchor{position:absolute;width:calc(var(--decor-width)*1.15);transform:translate(-50%,-100%)}
.lobby-decor-art{display:block;width:100%;height:auto;filter:drop-shadow(0 3px 1px #35524a13)}
@media(max-width:620px){.lobby-decor-anchor{width:var(--decor-width)}.lobby-precinct{width:234px}.lobby-flowerbed{width:var(--bed-width)}}
@media(max-width:360px){.lobby-decor-anchor{width:calc(var(--decor-width)*.86)}.lobby-precinct{width:210px}.lobby-flowerbed{width:calc(var(--bed-width)*.86)}}
</style>

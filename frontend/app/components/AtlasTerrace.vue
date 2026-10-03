<script setup lang="ts">
const props = defineProps<{ id: string; height: number; stairSide: 'left' | 'right' }>();
const wall = computed(() => `M10 153Q165 253 320 153V${153 + props.height}Q165 ${253 + props.height} 10 ${153 + props.height}Z`);
const stairCount = computed(() => Math.max(3, Math.ceil(props.height / 8)));
const stairX = computed(() => props.stairSide === 'left' ? 66 : 264);
</script>

<template>
  <svg class="precinct-terrace" viewBox="0 0 330 340" aria-hidden="true">
    <defs>
      <linearGradient :id="id + '-wall-shade'" x1="0" y1="0" x2=".3" y2="1"><stop stop-color="#ece3ca"/><stop offset="1" stop-color="#a8ac94"/></linearGradient>
      <pattern :id="id + '-masonry'" width="58" height="24" patternUnits="userSpaceOnUse">
        <path d="M0 1h58M0 13h58M17 1l1 12M44 13l-1 11" stroke="#526b67" stroke-width=".7" opacity=".65" fill="none"/>
        <path d="M1 3h56M1 15h56" stroke="#fff5da" stroke-width="1.3" opacity=".6"/>
        <path d="m8 7 3 1m20 10 2-1m20-11 2 1m-35 14 2 1" stroke="#7e8b77" stroke-width=".55" opacity=".55"/>
      </pattern>
    </defs>
    <ellipse cx="170" :cy="190 + height" rx="153" ry="31" fill="#25443b" opacity=".13"/>
    <path :d="wall" :fill="'url(#' + id + '-wall-shade)'" stroke="#536c67" stroke-width="1.3"/>
    <path :d="wall" :fill="'url(#' + id + '-masonry)'"/>
    <path :d="`M10 ${153 + height}Q165 ${253 + height} 320 ${153 + height}`" fill="none" stroke="#526e63" stroke-width="2"/>
    <path d="M10 153Q165 253 320 153" fill="none" stroke="#f8efd7" stroke-width="4"/>
    <!-- Treads descend to the common path. The png garden conceals their upper seam. -->
    <g v-for="step in stairCount" :key="step" :transform="`translate(${stairX} ${185 + (step - 1) * (height / stairCount + 3)})`">
      <path d="M-23 0H23L27 6H-27Z" fill="#f1e8d1" stroke="#79877b" stroke-width=".8"/>
      <path :d="`M-27 6H27V${6 + height / stairCount}H-27Z`" fill="#bfc1a9" stroke="#6e7f74" stroke-width=".7"/>
      <path d="M-24 5H24" stroke="#fff7e3" stroke-width="1.3"/>
    </g>
    <path v-if="height > 20" :d="`M48 181q-4 10 1 ${Math.min(height, 24)}m232-23q4 12-1 ${Math.min(height, 19)}`" stroke="#637e63" stroke-width="1.3" fill="none"/>
  </svg>
</template>

<style scoped>
.precinct-terrace{position:absolute;inset:0 auto auto 0;width:100%;height:auto;overflow:visible;pointer-events:none}
</style>

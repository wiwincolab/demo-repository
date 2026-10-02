<script setup lang="ts">
defineProps<{ index: number }>();
const asset = useAsset();
// Individual view boxes from the generated transparent sheet; no raster editing.
const boxes = ['20 172 580 292', '600 176 514 288', '1124 28 389 475', '183 503 212 488', '458 667 654 237', '1172 513 278 474'];
const clip=useId();
</script>
<template><svg :viewBox="boxes[index]" aria-hidden="true" class="motion-sticker-sprite"><defs><clipPath :id="clip"><rect :x="boxes[index]!.split(' ')[0]" :y="boxes[index]!.split(' ')[1]" :width="boxes[index]!.split(' ')[2]" :height="boxes[index]!.split(' ')[3]" /></clipPath></defs><image :clip-path="`url(#${clip})`" :href="asset('assets/memory/motion/stickers.png')" width="1536" height="1024" /></svg></template>

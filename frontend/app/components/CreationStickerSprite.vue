<script setup lang="ts">
import { stickerKit, type StickerKit } from '~/data/creation-motifs';
const props=defineProps<{ index: number; kit?:StickerKit }>();
const asset = useCreationAsset();
const sheet=computed(()=>props.kit || stickerKit());
const box=computed(()=>sheet.value.motifs[props.index]?.box || sheet.value.motifs[0]!.box);
const clip=useId();
</script>
<template><svg :viewBox="box" aria-hidden="true" class="motion-sticker-sprite"><defs><clipPath :id="clip"><rect :x="box.split(' ')[0]" :y="box.split(' ')[1]" :width="box.split(' ')[2]" :height="box.split(' ')[3]" /></clipPath></defs><image :clip-path="`url(#${clip})`" :href="asset(sheet.sheet)" :width="sheet.width" :height="sheet.height" preserveAspectRatio="xMidYMid slice" /></svg></template>

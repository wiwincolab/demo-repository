<script setup lang="ts">
import type { CreationWork } from '~/data/creation';
import '~/assets/css/creation-motion.css';
const props=defineProps<{work:CreationWork;image:string;giver?:string;date?:string;caption?:string}>();
const date=computed(()=>props.date || (props.work.photoId==='fuji-blue'||/^fuji-/.test(props.work.image)?'2026.02.14':props.work.photoId?.startsWith('usj')?'2026.04.06':['nara-deer','kyoto-shrine'].includes(props.work.photoId||'')?'2026.04.05':'日期待補'));
</script>
<template>
  <CreationStickerPlay v-if="work.styleId==='sticker'" :work="work" />
  <CreationPhotoPlay v-else-if="work.styleId==='photo'" :image="image" :location="work.location" :source-crop="work.sourceCrop" />
  <CreationTicketPlay v-else-if="work.styleId==='ticket'" :image="image" :creator="work.creator" :location="work.location" :date="date" :caption="caption || '那天拍下的風景，留在這張票根裡。'" :source-crop="work.preset===false && work.sourceCrop" />
  <CreationPinPlay v-else-if="work.styleId==='pin'" :creator="work.creator" :giver="giver" :image="image" :location="work.location" :date="date" :work="work" />
  <CreationBuildScene v-else-if="work.styleId==='scene' && work.photoId==='fuji-blue' && work.preset!==false" />
  <CreationScenePreviewPlay v-else-if="work.styleId==='scene'" :work="work" />
  <CreationCompanionPlay v-else-if="work.preset!==false" />
  <CreationCompanionPreviewPlay v-else :work="work" />
</template>

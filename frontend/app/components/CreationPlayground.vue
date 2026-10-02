<script setup lang="ts">
import type { CreationWork } from '~/data/creation';
import '~/assets/css/creation-motion.css';
defineProps<{work:CreationWork;image:string;giver?:string}>();
</script>
<template>
  <CreationStickerPlay v-if="work.styleId==='sticker'" />
  <CreationPhotoPlay v-else-if="work.styleId==='photo'" :image="image" />
  <CreationTicketPlay v-else-if="work.styleId==='ticket'" :image="image" :creator="work.creator" />
  <CreationPinPlay v-else-if="work.styleId==='pin'" :creator="work.creator" :giver="giver" />
  <CreationBuildScene v-else-if="work.styleId==='scene'" />
  <CreationCompanionPlay v-else />
</template>

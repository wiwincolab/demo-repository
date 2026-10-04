<script setup lang="ts">
import type { CollectionEntry } from '~/data/collection';
defineProps<{entry:CollectionEntry}>();
</script>
<template>
  <span class="collection-object" :class="'collection-object-'+entry.work.styleId">
    <CreationStickerSprite v-if="entry.motif!==undefined" :index="entry.motif" :kit="entry.kit" />
    <CreationArtwork v-else :work="entry.work" :alt="entry.title" />
  </span>
</template>

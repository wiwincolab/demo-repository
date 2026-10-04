<script setup lang="ts">
import type { CreationWork } from '~/data/creation';
const props = withDefaults(defineProps<{ work: CreationWork; alt?: string; compact?: boolean }>(), { alt: '', compact: false });
const asset = useCreationAsset();
const output = computed(() => props.work.renderedImage || asset('assets/memory/' + props.work.image));
const source = computed(() => asset('assets/memory/' + (props.work.source || props.work.image)));
const composed = computed(() => props.work.preset === false && !props.work.renderedImage);
</script>

<template>
  <span class="creation-artwork" :class="['is-' + work.styleId, { 'is-composed': composed, 'is-compact': compact }]">
    <img v-if="!composed" :src="output" :alt="alt" />
    <template v-else>
      <span v-if="work.styleId === 'sticker'" class="art-sticker">
        <i class="art-sticker-main"><img :src="source" :alt="alt" /></i><i><img :src="source" alt="" /></i><i><img :src="source" alt="" /></i>
      </span>
      <span v-else-if="work.styleId === 'ticket'" class="art-ticket"><i class="art-ticket-photo"><img :src="source" :alt="alt" /></i><i class="art-ticket-copy"><b>MEMORY PASS</b><small>{{ work.location }}</small><em>CHICTRIP · 2026</em></i></span>
      <span v-else-if="work.styleId === 'pin'" class="art-pin"><i><img :src="source" :alt="alt" /></i><b>{{ work.location.split(' · ')[0] }}</b></span>
      <span v-else-if="work.styleId === 'scene'" class="art-scene"><i class="art-scene-card"><img :src="source" :alt="alt" /></i><i class="art-scene-base" /><b>SCENE 01</b></span>
      <span v-else-if="work.styleId === 'companion'" class="art-companion"><img :src="source" :alt="alt" /><i><img :src="asset('assets/memory/references/chictrip-mascot.png')" alt="去趣吉祥物" /></i><b>一起到這裡</b></span>
      <span v-else class="art-photo"><img :src="source" :alt="alt" /></span>
    </template>
  </span>
</template>

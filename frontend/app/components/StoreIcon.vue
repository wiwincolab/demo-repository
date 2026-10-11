<script setup lang="ts">
defineProps<{ name: 'plane' | 'package' | 'route' | 'ticket' | 'bag' | 'sim' | 'points' }>();
const paths = {
  plane: 'm21 3-7 18-3-8-8-3 18-7ZM11 13 21 3',
  package: 'M3 8h18v12H3V8Zm5 0V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v3M8 8v12M16 8v12',
  route: 'M6 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM6 9v5a4 4 0 0 0 4 4h5M9 6h7a2 2 0 0 1 2 2v4',
  ticket: 'M3 5h18v5a2 2 0 0 0 0 4v5H3v-5a2 2 0 0 0 0-4V5Zm12 0v3m0 3v2m0 3v3',
  bag: 'M4 8h16l1 13H3L4 8Zm4 0V6a4 4 0 0 1 8 0v2',
  sim: 'M5 3h10l4 4v14H5V3Zm3 8h8v7H8v-7Zm4 0v7m-4-4h8',
  points: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM9 17V7h4a3 3 0 0 1 0 6H9',
};
</script>
<template><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path :d="paths[name]" /></svg></template>

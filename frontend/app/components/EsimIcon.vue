<script setup lang="ts">
withDefaults(defineProps<{ name: string; size?: number }>(), { size: 22 });
const paths: Record<string,string> = {
  arrow: 'm9 5 7 7-7 7', check: 'm5 12 4 4L19 6',
  signal: 'M4 18v2m5-6v6m5-11v11m5-16v16',
  sim: 'M8 3h7l5 5v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a4 4 0 0 1 4-4ZM8 11h8v6H8zM12 11v6',
  route: 'M6 5a2 2 0 1 0 0 .01M18 17a2 2 0 1 0 0 .01M6 7v5a3 3 0 0 0 3 3h6a3 3 0 0 0 0-6h-3M18 15v-1',
  people: 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM2 21v-3a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v3M17 4a3 3 0 0 1 0 6m1 3a4 4 0 0 1 4 4v3',
  photo: 'M4 4h16v16H4zM4 16l5-5 4 4 3-3 4 4M15 8h.01',
  point: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM10 16V8h3a2 2 0 0 1 0 4h-3',
  info: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 7v6m0-9h.01',
  edit: 'm14 5 5 5M4 20l1-6L16 3l5 5L10 19Z',
  gift: 'M3 8h18v4H3zM5 12v9h14v-9M12 8v13M12 8H8a3 3 0 1 1 3-3Zm0 0h4a3 3 0 1 0-3-3Z',
  phone: 'M8 2h8a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2ZM10 18h4M10 5h4',
};
</script>
<template><svg :width="size" :height="size" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path :d="paths[name] || paths.arrow"/></svg></template>

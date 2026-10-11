<script setup lang="ts">
// Preserve shared eSIM links and recommendation parameters in the combined store.
const route = useRoute();
await navigateTo({ path: '/store', query: { ...route.query, category: 'esim' } }, { replace: true });
</script>
<template><div role="status">正在開啟商城的 eSIM 方案…</div></template>

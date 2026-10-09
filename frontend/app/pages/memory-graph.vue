<script setup lang="ts">
const route = useRoute();
await navigateTo({ path: '/wardrobe', query: { ...route.query, view: 'preferences' } }, { replace: true, redirectCode: 302 });
</script>
<template><div /></template>

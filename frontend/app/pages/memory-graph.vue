<script setup lang="ts">
const route = useRoute();
await navigateTo({ path: '/planner', query: route.query }, { replace: true, redirectCode: 302 });
</script>
<template><div /></template>

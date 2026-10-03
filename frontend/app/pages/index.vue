<script setup lang="ts">
// Keep old shared links such as /#memory working, while new pages use real routes.
const route = useRoute();
onMounted(() => {
    const target = route.hash.slice(1);
    navigateTo(['trip', 'esim', 'memory', 'atlas'].includes(target) ? { path: `/${target}`, query: route.query } : '/trips', { replace: true });
});
</script>
<template>
  <div class="page-heading">
    <NuxtLink class="primary" to="/trips">開啟我的行程</NuxtLink>
  </div>
</template>

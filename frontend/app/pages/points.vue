<script setup lang="ts">
import PointsMarket from '~/components/PointsMarket.vue';
const {tripHref}=useTripContext();
useHead({title:'和泰旅行商店｜去趣'});
</script>
<template><section class="points-page"><NuxtLink :to="tripHref('/trip')">← 我的行程</NuxtLink><div class="mascot-perch"><div><h1>和泰旅行商店</h1><p>把喜歡的服務，先放進這趟旅行。</p></div><PageMascot /></div><NuxtLink class="points-store-link" :to="tripHref('/store')">到和泰商城買機票與行程 →</NuxtLink><PointsMarket/></section></template>

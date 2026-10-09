<script setup lang="ts">
import PointsMarket from '~/components/PointsMarket.vue';
const route=useRoute();
useHead({title:'和泰點數・交通與旅行｜去趣'});
</script>
<template><section class="points-page"><NuxtLink to="/trips">← 我的行程</NuxtLink><div class="mascot-perch"><h1>點數，換下一段旅程。</h1><PageMascot /></div><PointsMarket :planning="route.query.mode==='plan'"/></section></template>

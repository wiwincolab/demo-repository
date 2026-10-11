<script setup lang="ts">
import type { Stop } from '~/types/trip';
import {serviceRecommendations} from '~/utils/points';
const props=defineProps<{stop:Stop;next?:Stop}>();
const {activeTrip,tripHref}=useTripContext();
const services=computed(()=>serviceRecommendations(activeTrip.value?.country || 'japan',props.stop,props.next));
</script>
<template><details v-if="services.length" class="service-recommendations"><summary>沿途適合的和泰服務</summary><NuxtLink v-for="service in services" :key="service.id" :to="tripHref('/points',{product:service.id})"><span>{{service.brand}} · {{service.name}}</span><small>{{service.kind==='transport'?'前往下一站的交通選項':'這趟旅行可以先準備'}} · 查看商店 →</small></NuxtLink></details></template>
<style scoped>
.service-recommendations{margin:10px 0 10px 24px;padding:0 12px;background:#f4f9fa;border:1px solid #e1ecef;border-radius:12px;color:#557788}.service-recommendations summary{min-height:44px;display:flex;align-items:center;font-size:11px;cursor:pointer}.service-recommendations a{display:block;padding:10px 0;color:#3c7086;font-size:12px;text-decoration:none;border-top:1px solid #e1ecef}.service-recommendations small{display:block;margin-top:5px;font-size:10px;color:#75909c}
</style>

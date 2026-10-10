<script setup lang="ts">
import type { RainAlternative } from '~/utils/planner';
const props = defineProps<{ text: string; alternative?: RainAlternative | null }>();
const asset = useAsset();
const photoFailed = ref(false);
watch(() => props.alternative?.photo.src, () => { photoFailed.value = false; });
</script>

<template>
  <details class="rain-plan-card" open>
    <summary>雨天備案</summary>
    <div v-if="alternative" class="rain-plan-choice">
      <img referrerpolicy="no-referrer" v-if="alternative.photo.src && !photoFailed" :src="asset(alternative.photo.src)" :alt="alternative.photo.alt" :style="{ objectPosition: alternative.photo.objectPosition }" width="160" height="112" loading="lazy" decoding="async" @error="photoFailed = true">
      <p v-else class="rain-plan-no-photo">{{ photoFailed ? '照片暫時無法載入' : '景點照片待補' }}</p>
      <div class="rain-plan-copy">
        <strong>{{ alternative.name }}</strong>
        <p>{{ text }}</p>
        <small v-if="alternative.photo.src" class="rain-plan-credit">照片：{{ alternative.photo.credit }}<template v-if="alternative.photo.license"> · <a v-if="alternative.photo.licenseUrl" :href="alternative.photo.licenseUrl" target="_blank" rel="noopener">{{ alternative.photo.license }}</a><template v-else>{{ alternative.photo.license }}</template></template><template v-if="alternative.photo.source"> · <a :href="alternative.photo.source" target="_blank" rel="noopener">來源 ↗</a></template></small>
      </div>
    </div>
    <p v-else>{{ text }}</p>
  </details>
</template>

<style scoped>
.rain-plan-card{margin:12px 0;padding:12px;border:1px solid #d9edf1;border-radius:12px;background:#f0f9fb;color:#45798b;font-size:12px}
.rain-plan-card summary{cursor:pointer;font-weight:600}
.rain-plan-choice{display:grid;grid-template-columns:minmax(100px,140px) minmax(0,1fr);gap:12px;margin-top:12px;align-items:start}
.rain-plan-choice img{display:block;width:100%;height:112px;object-fit:cover;border-radius:9px;background:#e0eef1}
.rain-plan-copy strong{font-size:13px;line-height:1.6}
.rain-plan-card p{margin:7px 0 0;font-size:11px;line-height:1.7}
.rain-plan-card .rain-plan-credit{display:block;margin-top:7px;color:#77929b;font-size:9px;line-height:1.6}
.rain-plan-credit a{color:inherit;text-decoration:underline}
.rain-plan-card .rain-plan-no-photo{display:grid;place-items:center;min-height:112px;margin:0;border-radius:9px;background:#e0eef1;text-align:center;color:#77929b}
@media(max-width:600px){.rain-plan-choice{grid-template-columns:1fr}.rain-plan-choice img{height:140px}}
</style>

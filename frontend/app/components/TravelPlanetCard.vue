<script setup lang="ts">
const asset = useAsset();
const frame = ref<HTMLIFrameElement>();
const height = ref(1600);
function resize(event: MessageEvent) {
  if (event.origin !== window.location.origin || event.source !== frame.value?.contentWindow || event.data?.type !== 'travel-planet:height') return;
  const next = Number(event.data.height);
  if (Number.isFinite(next) && next > 0) height.value = Math.min(6000, Math.max(500, next + 4));
}
onMounted(() => window.addEventListener('message', resize));
onBeforeUnmount(() => window.removeEventListener('message', resize));
</script>
<template>
  <section class="travel-planet-card" aria-label="旅行名片">
    <p class="travel-planet-note">轉動地球，看看走過的世界。日照與城市時間依現在時刻更新；目前旅程為示意資料。</p>
    <iframe ref="frame" :src="asset('demos/travel-planet/travel-card.html?embed=1')" title="旅行名片、吉祥物收藏與即時日夜地球" :style="{ height: `${height}px` }" allow="clipboard-write" />
  </section>
</template>
<style scoped>
.travel-planet-note{color:#7b928a;font-size:12px;line-height:1.8;margin:0 0 18px}.travel-planet-card iframe{display:block;width:100%;border:0;background:transparent}.travel-planet-card{min-width:0}@media(max-width:700px){.travel-planet-note{font-size:11px}}
</style>

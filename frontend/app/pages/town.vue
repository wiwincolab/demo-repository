<script setup lang="ts">
definePageMeta({ layout: false });
useHead({ title: '場景積木世界 · 去趣 chicTrip' });
const base = useRuntimeConfig().app.baseURL;
const help = ref(false);
</script>

<template>
  <main class="town-experience">
    <header class="town-topbar">
      <NuxtLink to="/atlas" class="town-back" aria-label="返回回憶廣場">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m14 5-7 7 7 7M7 12h13" /></svg>
      </NuxtLink>
      <div class="town-heading"><h1>場景積木世界</h1><p>東北亞九景 <span>日本 × 韓國</span></p></div>
      <button class="town-help" aria-label="操作說明" @click="help = true">?</button>
    </header>
    <iframe class="town-frame" :src="`${base}demos/travel-town/index.html`" title="東北亞九景：可旋轉、縮放與切換日夜的 3D 小鎮" sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox" />
    <AppSheet v-model="help" title="逛逛你的小鎮">
      <div class="town-instructions">
        <p>九段風景，透過街道連成一座小鎮。</p>
        <dl><dt>換個角度</dt><dd>單指或滑鼠拖曳旋轉；雙指或滾輪縮放。</dd><dt>走近景點</dt><dd>打開「九景地圖」，選一個街區。按「全景」回到整座小鎮。</dd><dt>等路燈亮起</dt><dd>拖曳光線滑桿，或點選白天、黃昏、夜晚。</dd></dl>
        <p class="town-demo-note">這是預先製作的 3D 小鎮展示，目前可探索與調整光影，尚未開放自由擺放積木。</p>
      </div>
    </AppSheet>
  </main>
</template>

<style scoped>
.town-experience{position:fixed;inset:0;display:flex;flex-direction:column;background:#dfeae8;color:#224652;overflow:hidden;height:100dvh;padding:0}
.town-topbar{display:flex;align-items:center;gap:14px;padding:12px 24px;padding-top:max(12px,env(safe-area-inset-top));background:#fbfdfb;border-bottom:1px solid #dce6e6;flex-shrink:0}
.town-heading{flex:1;min-width:0}.town-heading h1{font-size:19px;line-height:1.4;letter-spacing:.04em;margin:0;font-weight:650}.town-heading p{margin:3px 0 0;font-size:12px;color:#66818a}.town-heading p span{margin-left:10px;color:#85979b}
.town-back,.town-help{width:44px;height:44px;display:grid;place-items:center;flex-shrink:0;border:1px solid #dce6e6;border-radius:50%;background:#fff;color:#296578;text-decoration:none}.town-back svg{width:22px;height:22px}.town-help{font-size:20px;cursor:pointer}.town-back:hover,.town-help:hover{background:#edf7f9}.town-back:focus-visible,.town-help:focus-visible{outline:3px solid #ddb952;outline-offset:3px}
.town-frame{display:block;border:0;width:100%;flex:1;min-height:0;background:#dfeae8}
.town-instructions{line-height:1.75}.town-instructions dt{font-weight:650;color:#214853;margin:20px 0 4px}.town-instructions dd{margin:0;color:#617c84}.town-demo-note{font-size:13px;border-top:1px solid #e1e9ed;margin-top:24px;padding-top:18px;color:#7a8e95}
@media(max-width:600px){.town-topbar{padding-inline:16px;gap:12px}.town-heading h1{font-size:17px}.town-heading p{font-size:11px}}
</style>

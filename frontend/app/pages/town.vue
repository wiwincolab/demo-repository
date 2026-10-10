<script setup lang="ts">
import { isTownLayout, TOWN_LAYOUT_CHANNEL, TOWN_LAYOUT_KEY } from '~/utils/town-layout';
definePageMeta({ layout: false });
useHead({ title: '九景小鎮 · 去趣 chicTrip' });
const base = useRuntimeConfig().app.baseURL;
const { tripHref } = useTripContext();
const help = ref(false);
const townFrame = ref<HTMLIFrameElement | null>(null);
// Keep the opaque-origin iframe isolated. Only this exact frame can read/write
// the single validated layout key, through this narrow message bridge.
function onTownMessage(event: MessageEvent) {
  const frame = townFrame.value?.contentWindow;
  if (!frame || event.source !== frame || event.data?.channel !== TOWN_LAYOUT_CHANNEL) return;
  if (event.data.type === 'load') {
    try {
      const order: unknown = JSON.parse(localStorage.getItem(TOWN_LAYOUT_KEY) || 'null');
      if (isTownLayout(order)) frame.postMessage({ channel: TOWN_LAYOUT_CHANNEL, type: 'load', order }, '*');
    } catch { /* Storage may be unavailable or contain an obsolete save. */ }
  } else if (event.data.type === 'save' && isTownLayout(event.data.order)) {
    let ok = false;
    try {
      localStorage.setItem(TOWN_LAYOUT_KEY, JSON.stringify(event.data.order));
      ok = true;
    } catch { /* Report a session-only save to the editor. */ }
    frame.postMessage({ channel: TOWN_LAYOUT_CHANNEL, type: 'saved', ok }, '*');
  }
}
onMounted(() => window.addEventListener('message', onTownMessage));
onBeforeUnmount(() => window.removeEventListener('message', onTownMessage));
</script>

<template>
  <main class="town-experience">
    <header class="town-topbar">
      <NuxtLink to="/atlas" class="town-back" aria-label="返回回憶廣場">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m14 5-7 7 7 7M7 12h13" /></svg>
      </NuxtLink>
      <div class="town-heading"><h1>九景小鎮</h1><p>東北亞九景 <span>日本 × 韓國</span></p></div>
      <PageMascot />
      <button class="town-help" aria-label="操作說明" @click="help = true">?</button>
    </header>
    <iframe ref="townFrame" class="town-frame" :src="`${base}demos/travel-town/index.html`" title="東北亞九景：可拖移重組、旋轉、縮放與切換日夜的 3D 小鎮" sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox" />
    <AppSheet v-model="help" title="逛逛你的小鎮">
      <div class="town-instructions">
        <p>九段風景，透過街道連成一座小鎮。</p>
        <dl><dt>換個角度</dt><dd>單指或滑鼠拖曳旋轉；雙指或滾輪縮放。</dd><dt>走近景點</dt><dd>打開「九景地圖」，選一個街區。按「全景」回到整座小鎮。</dd><dt>重組小鎮</dt><dd>按「編輯小鎮」，拖動景點方塊交換位置，也可依序點選九宮格中的兩格。支援上一步、原始排列，完成後恢復旋轉。</dd><dt>等路燈亮起</dt><dd>拖曳光線滑桿，或點選白天、黃昏、夜晚。</dd></dl>
        <p class="town-demo-note">九個預製景點可在固定九宮格內交換位置，排列會保存在這個瀏覽器。建築尚不能拆開或旋轉，個人照片收藏尚未匯入小鎮。<NuxtLink :to="tripHref('/memory', { style: 'scene' })">想把自己的照片做成場景積木？到 AI 創作 ↗</NuxtLink></p>
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
.town-instructions{line-height:1.75}.town-instructions dt{font-weight:650;color:#214853;margin:20px 0 4px}.town-instructions dd{margin:0;color:#617c84}.town-demo-note{font-size:13px;border-top:1px solid #e1e9ed;margin-top:24px;padding-top:18px;color:#7a8e95}.town-demo-note a{display:block;margin-top:10px;color:#296578;font-weight:600}
@media(max-width:600px){.town-topbar{padding-inline:16px;gap:12px}.town-heading h1{font-size:17px}.town-heading p{font-size:11px}}
</style>

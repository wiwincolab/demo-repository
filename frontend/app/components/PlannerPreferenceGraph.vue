<script setup lang="ts">
import { plannerKeywords, type PlannerKeywordId } from '~/data/planner-preferences';
import { memoryCategory } from '~/data/memory-categories';
const selected = defineModel<PlannerKeywordId[]>({ required: true });
const focused = ref('food');
const info = ref(false);
const keyword = computed(() => plannerKeywords.find(k => k.id === focused.value));
const { selected: mascot } = useMascot();
const asset = useAsset();
const nodes = computed(() => [{ id: 'profile', title: '我的旅行偏好', tag: '旅程' }, ...plannerKeywords.map(k => ({ id: k.id, title: k.title, tag: k.tag }))]);
const edges = computed(() => plannerKeywords.map(k => ({ key: k.id, source: 'profile', target: k.id })));
function toggle(id: PlannerKeywordId) { selected.value = selected.value.includes(id) ? selected.value.filter(k => k !== id) : [...selected.value,id]; }
</script>
<template>
  <section class="preference-card" aria-label="記憶偏好">
    <header class="preference-heading"><img :src="asset(mascot.image)" alt="你的吉祥物"><div><h2>我記得，你喜歡…</h2><p>{{ selected.length }} 個旅行關鍵字，規劃時可套用。</p></div><button class="info-button" aria-label="了解記憶偏好" @click="info = true">?</button></header>
    <div class="preference-universe" role="region" aria-label="你的 3D 記憶地圖">
      <ClientOnly><MemoryGraph3D :nodes="nodes" :edges="edges" :selected="focused" :visible-ids="['profile', ...selected]" subject="偏好" @select="focused = $event"/><template #fallback><div class="graph-loading" role="status">正在載入你的記憶地圖…</div></template></ClientOnly>
      <div class="preference-detail" aria-live="polite"><template v-if="keyword"><strong>{{ keyword.title }}</strong><button @click="toggle(keyword.id)">{{ selected.includes(keyword.id) ? '移除偏好' : '記住偏好' }}</button></template><template v-else><span>點選關鍵字，查看吉祥物記住的喜好。</span></template></div>
    </div>
    <div class="preference-chips" aria-label="選擇旅行偏好">
      <button v-for="item in plannerKeywords" :key="item.id" :aria-pressed="selected.includes(item.id)" @click="toggle(item.id)"><i :style="{ background: memoryCategory(item.tag).color }"/><span>{{ item.title }}</span><small>{{ selected.includes(item.id) ? '已記住' : '加入' }}</small></button>
    </div>
    <p class="preference-note">點一下即可新增或移除，變更會自動儲存。</p>
    <AppSheet v-model="info" title="關於記憶偏好"><p>這裡管理吉祥物記住的旅行喜好。規劃行程時，可以選擇是否套用；這次的時間、範圍與明確排除條件會優先處理。</p><p>目前是可自行調整的示範資料，尚未從歷史行程自動分析。</p><ul><li v-for="item in plannerKeywords" :key="item.id"><strong>{{ item.title }}</strong>：{{ item.detail }}</li></ul></AppSheet>
  </section>
</template>
<style scoped>
.preference-card{border:1px solid #d7e4e4;border-radius:18px;background:linear-gradient(120deg,#f3faf9,#fffaf0);padding:18px}.preference-heading{display:flex;align-items:center;gap:12px}.preference-heading>img{width:54px;height:54px;border-radius:50%;object-fit:cover}.preference-heading h2{font-size:19px;margin:0 0 6px;color:#254f59}.preference-heading p{font-size:12px;color:#6f8588;margin:0;line-height:1.6}.info-button{margin-left:auto;border:1px solid #d1dedf;border-radius:50%;background:white;color:#4e6970;width:32px;height:32px;flex-shrink:0;cursor:pointer}.preference-views{display:flex;gap:6px;margin:18px 0 12px}.preference-views button{flex:1;border:1px solid #d1dedf;border-radius:9px;background:transparent;padding:10px;color:#6f8588;cursor:pointer;font-size:12px}.preference-views button[aria-pressed=true]{background:#285d68;color:white;border-color:#285d68}.graph-open{margin-top:12px;background:transparent;border:0;color:#397b87;font-size:12px;cursor:pointer;padding:8px 0}.preference-chips{margin-top:16px;display:grid;grid-template-columns:1fr 1fr;gap:8px}.preference-chips button{display:flex;align-items:center;gap:8px;border:1px solid #d1dedf;background:white;border-radius:12px;min-height:52px;padding:10px;color:#4e6970;font-size:12px;cursor:pointer;text-align:left}.preference-chips button[aria-pressed=true]{border-color:#6697a0;background:#e8f3f3;color:#254f59}.preference-chips i{width:7px;height:7px;flex-shrink:0;border-radius:50%}.preference-chips small{font-size:10px;color:#6e898d;margin-left:auto;white-space:nowrap}.preference-note{font-size:11px;color:#829194;margin:14px 0 0}.graph-loading{min-height:220px;display:grid;place-items:center;color:#d3dce3;font-size:13px}.preference-universe{margin-top:16px;border-radius:12px;overflow:hidden;background:#17212c}.preference-universe :deep(.space){min-height:220px;height:min(300px,40dvh)}.preference-detail{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:12px 14px;color:#d3dce3;background:#1d2b36;font-size:12px;min-height:56px}.preference-detail button{background:#eec552;color:#283b44;border:0;border-radius:8px;padding:9px 12px;cursor:pointer;font-size:11px}.preference-card button:focus-visible{outline:3px solid #e6b634;outline-offset:3px}.preference-card li{font-size:13px;line-height:1.8;margin-bottom:8px}@media(max-width:400px){.preference-card{padding:14px}.preference-chips button{flex-wrap:wrap;gap:5px}.preference-chips small{font-size:9px}.preference-heading h2{font-size:17px}.preference-universe :deep(.space){height:min(260px,38dvh)}}
</style>

<script setup lang="ts">
import { plannerKeywords, type PlannerKeywordId } from '~/data/planner-preferences';
import { memoryCategory } from '~/data/memory-categories';
const selected = defineModel<PlannerKeywordId[]>({ required: true });
const enabled = defineModel<boolean>('enabled', { required: true });
const expanded = ref(false), focused = ref('food');
const keyword = computed(() => plannerKeywords.find(k => k.id === focused.value));
const nodes = computed(() => [{ id: 'profile', title: '我的旅行偏好', tag: '旅程' }, ...plannerKeywords.map(k => ({ id: k.id, title: k.title, tag: k.tag }))]);
const edges = computed(() => plannerKeywords.map(k => ({ key: k.id, source: 'profile', target: k.id })));
function toggle(id: PlannerKeywordId) { selected.value = selected.value.includes(id) ? selected.value.filter(k => k !== id) : [...selected.value,id]; }
</script>
<template>
  <section class="preference-card" aria-label="我的旅行偏好">
    <div class="preference-heading"><div><span class="preference-eyebrow">YOUR TRAVEL DNA</span><h2>去趣懂你的旅行偏好</h2><p>圈出範圍，再用你喜歡的關鍵字挑選景點。</p></div><label class="preference-switch"><input v-model="enabled" type="checkbox">這次參考偏好</label></div>
    <div class="preference-chips"><button v-for="item in plannerKeywords" :key="item.id" :aria-pressed="selected.includes(item.id)" :disabled="!enabled" @click="toggle(item.id)"><i :style="{ background: memoryCategory(item.tag).color }"/>{{ item.title }}<span>{{ selected.includes(item.id) ? '已選' : '加入' }}</span></button></div>
    <div class="preference-bottom"><small>{{ enabled ? `本次參考 ${selected.length} 個關鍵字` : '本次僅使用圈選與額外條件' }} · 可自行調整的示範偏好</small><button :aria-expanded="expanded" aria-controls="planner-preference-universe" @click="expanded = !expanded">{{ expanded ? '收起偏好圖' : '打開 3D 偏好圖' }}</button></div>
    <div v-if="expanded" id="planner-preference-universe" class="preference-universe">
      <ClientOnly><MemoryGraph3D :nodes="nodes" :edges="edges" :selected="focused" :visible-ids="['profile', ...(enabled ? selected : [])]" subject="偏好" @select="focused = $event"/></ClientOnly>
      <div class="preference-detail" aria-live="polite"><template v-if="keyword"><span>{{ keyword.tag }} / 偏好關鍵字</span><h3>{{ keyword.title }}</h3><p>{{ keyword.detail }}</p><small>{{ keyword.source }}。只有選用的關鍵字會影響推薦；本次明確排除的需求優先。</small><button :disabled="!enabled" @click="toggle(keyword.id)">{{ selected.includes(keyword.id) ? '本次不參考這個關鍵字' : '加入本次推薦依據' }}</button></template><template v-else><h3>我的旅行偏好</h3><p>點選周圍關鍵字，決定這次想參考哪些喜好。再圈選地點、補充限制，就能看看推薦。</p></template></div>
    </div>
  </section>
</template>
<style scoped>
.preference-card{border:1px solid #d7e4e4;border-radius:18px;background:linear-gradient(120deg,#f3faf9,#fffaf0);padding:20px;margin:22px 0}.preference-heading{display:flex;align-items:center;justify-content:space-between;gap:16px}.preference-eyebrow{font-size:10px;letter-spacing:2px;color:#598890}.preference-heading h2{font-size:20px;margin:8px 0;color:#254f59}.preference-heading p{font-size:13px;color:#6f8588;line-height:1.6}.preference-switch{display:flex;gap:8px;align-items:center;white-space:nowrap;font-size:12px;color:#456b74}.preference-switch input{accent-color:#397b87}.preference-chips{display:flex;flex-wrap:wrap;gap:8px;margin:14px 0}.preference-chips button{display:flex;align-items:center;gap:8px;border:1px solid #d1dedf;background:white;border-radius:24px;padding:10px 13px;color:#4e6970;font-size:12px;cursor:pointer}.preference-chips button[aria-pressed=true]{border-color:#6697a0;background:#e8f3f3;color:#254f59}.preference-chips i{width:7px;height:7px;border-radius:50%}.preference-chips span{font-size:10px;opacity:.65}.preference-card button:disabled{opacity:.45;cursor:default}.preference-bottom{display:flex;gap:12px;justify-content:space-between;align-items:center}.preference-bottom small{font-size:11px;color:#829194}.preference-bottom button,.preference-detail button{background:#285d68;border:0;border-radius:8px;padding:10px 12px;color:white;cursor:pointer;font-size:12px;white-space:nowrap}.preference-universe{display:grid;grid-template-columns:minmax(0,1fr) 220px;border-radius:12px;overflow:hidden;background:#17212c;margin-top:20px}.preference-universe :deep(.space){height:450px}.preference-detail{padding:24px;color:#d3dce3;background:#1d2b36}.preference-detail>span{font-size:10px;color:#d6b870}.preference-detail h3{font-size:19px;margin:15px 0}.preference-detail p{font-size:13px;line-height:1.9}.preference-detail small{font-size:11px;line-height:1.8;display:block;color:#97aab4}.preference-detail button{white-space:normal;margin-top:20px;background:#eec552;color:#283b44}.preference-card button:focus-visible{outline:3px solid #e6b634;outline-offset:3px}@media(max-width:700px){.preference-heading{align-items:flex-start;flex-direction:column}.preference-universe{grid-template-columns:1fr}.preference-bottom{align-items:flex-start;flex-direction:column}.preference-card{padding:16px}.preference-universe :deep(.space){height:360px}}
</style>

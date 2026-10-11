<script setup lang="ts">
import type { Stop } from '~/types/trip';
import { planChanges } from '~/utils/planner-comparison';
const open = defineModel<boolean>({ default: false });
const props = defineProps<{ before: Stop[]; after: Stop[]; notes: string[]; day: number }>();
defineEmits<{ adopt: [] }>();
const asset = useAsset();
const changes = computed(() => planChanges(props.before, props.after));
const failedPhotos = ref<string[]>([]);
const columns = computed(() => [{ title: '調整前', stops: props.before }, { title: 'AI 調整後', stops: props.after }]);
const labels = { added: '新增', removed: '移除', adjusted: '調整' };
</script>
<template>
  <AppSheet v-model="open" class="comparison-sheet" title="行程前後比較">
    <div class="comparison-body" data-planner-comparison>
      <p class="comparison-intro">第 {{ day + 1 }} 天 · 確認調整後，採用就會回到行程主頁。</p>
      <section class="comparison-changes" aria-label="這次調整了什麼">
        <h3>這次調整了什麼</h3>
        <ul v-if="changes.length"><li v-for="change in changes" :key="change.id"><span :class="change.kind">{{ labels[change.kind] }}</span><div><b>{{ change.name }}</b><small v-for="detail in change.details" :key="detail">{{ detail }}</small></div></li></ul>
        <p v-else>景點、順序與時間維持原安排。</p>
      </section>
      <div class="comparison-columns">
        <section v-for="column in columns" :key="column.title" :aria-label="column.title">
          <h3>{{ column.title }} <small>{{ column.stops.length }} 站</small></h3>
          <ol><li v-for="(stop,index) in column.stops" :key="stop.id">
            <div class="comparison-stop-top"><span>{{ index + 1 }}</span><time>{{ stop.time }}</time></div>
            <img v-if="stop.photo.src && !failedPhotos.includes(stop.photo.src)" :src="asset(stop.photo.src)" :alt="stop.photo.alt" width="120" height="70" decoding="async" referrerpolicy="no-referrer" @error="failedPhotos.push(stop.photo.src)">
            <b>{{ stop.name }}</b><small>{{ stop.stay }}</small>
          </li></ol>
        </section>
      </div>
      <details v-if="notes.length" class="comparison-notes"><summary>安排說明與已兌換服務</summary><p v-for="note in notes" :key="note">{{ note }}</p></details>
    </div>
    <div class="comparison-actions"><button class="secondary" @click="open=false">保留原行程</button><button class="primary" @click="$emit('adopt')">採用並返回行程</button></div>
  </AppSheet>
</template>
<style scoped>
.comparison-sheet[open]{display:flex;flex-direction:column;width:min(720px,100%);height:min(790px,86dvh);max-height:86dvh;padding:12px 20px max(16px,env(safe-area-inset-bottom));overflow:hidden;color:#315869}
.comparison-sheet :deep(.sheet-handle),.comparison-sheet :deep(.sheet-heading){flex:none}.comparison-sheet :deep(.sheet-heading){margin-bottom:6px}.comparison-sheet :deep(.sheet-heading h2){font-size:21px}
.comparison-body{overflow:auto;overscroll-behavior:contain;min-height:0;padding:0 2px 12px}.comparison-body .comparison-intro{font-size:12px;line-height:1.7;margin:6px 0 14px}
.comparison-changes{padding:12px;border-radius:12px;background:#f0f9fc;margin-bottom:16px}.comparison-body h3{font-size:14px;margin:0 0 10px}.comparison-changes ul,.comparison-columns ol{list-style:none;margin:0;padding:0}.comparison-changes li{display:flex;gap:8px;padding:6px 0}.comparison-changes li>span{align-self:start;padding:3px 6px;border-radius:5px;background:#dceef5;color:#25617b;font-size:10px;white-space:nowrap}.comparison-changes li>span.added{background:#def3e3;color:#387447}.comparison-changes li>span.removed{background:#fce9e2;color:#986044}.comparison-changes b{font-size:12px}.comparison-changes small{display:block;font-size:11px;line-height:1.7;color:#5e7e8d}.comparison-changes p{font-size:12px;margin:0}
.comparison-columns{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.comparison-columns section{min-width:0}.comparison-columns h3{display:flex;align-items:center;justify-content:space-between;gap:6px;color:#527483}.comparison-columns section:last-child h3{color:#008aad}.comparison-columns h3 small{font-size:10px;font-weight:400}.comparison-columns li{padding:10px;border:1px solid #dce9ed;border-radius:12px;margin-bottom:10px;background:#fff;overflow-wrap:anywhere}.comparison-columns section:last-child li{background:#f6fcff;border-color:#c5e5ee}.comparison-stop-top{display:flex;align-items:center;gap:8px;margin-bottom:8px}.comparison-stop-top span{display:grid;place-items:center;width:22px;height:22px;border-radius:50%;background:#e9f3f6;font-size:11px}.comparison-stop-top time{font-size:14px;font-weight:700}.comparison-columns img{display:block;width:100%;height:80px;object-fit:cover;border-radius:7px;margin-bottom:8px}.comparison-columns b{display:block;font-size:12px;line-height:1.6}.comparison-columns li>small{display:block;color:#6c8895;font-size:10px;margin-top:4px}.comparison-notes{font-size:12px;line-height:1.8;padding:10px 0}.comparison-notes summary{min-height:44px;display:flex;align-items:center;cursor:pointer}.comparison-notes p{font-size:12px}
.comparison-actions{flex:none;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.5fr);gap:10px;padding-top:12px;border-top:1px solid #e3edf0;background:white}.comparison-actions .primary,.comparison-actions .secondary{min-height:48px;width:100%;margin:0;padding:10px 8px;font-size:13px;border-radius:12px}.comparison-actions .secondary{background:#f4f8fa;color:#577a8a}.comparison-actions .primary{background:#009fc5;color:white}.comparison-actions button:focus-visible{outline:3px solid #ffc500;outline-offset:2px}
@media(max-width:600px){.comparison-sheet[open]{padding-inline:14px}.comparison-columns{gap:9px}.comparison-columns li{padding:8px}.comparison-columns img{height:68px}}
</style>

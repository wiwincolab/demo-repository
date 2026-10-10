<script setup lang="ts">
import type { PlannerKeywordId } from '~/data/planner-preferences';
import { createPreferenceGraph, preferenceGraphStorageKey, validPreferenceGraphEdits } from '~/utils/preference-graph';
import { isPlannerCategory, memoryCategories, personalPreferenceLimit, preferenceIdentity, type MemoryCategoryId, type PreferenceSuggestion } from '~/utils/preference-memory';
const selected = defineModel<PlannerKeywordId[]>({ required: true });
const focused = ref('profile');
const edits = useState('preference-graph-edits', () => validPreferenceGraphEdits(null));
const loaded = useState('preference-graph-ready', () => false);
const storageError = ref(false);
const automaticallyRemembered = new Set<PlannerKeywordId>();
onMounted(() => {
  if (loaded.value) return;
  try { edits.value = validPreferenceGraphEdits(JSON.parse(localStorage.getItem(preferenceGraphStorageKey) || 'null')); }
  catch { /* An unreadable saved view starts with the original graph. */ }
  loaded.value = true;
});
watch(edits, value => {
  if (!loaded.value) return;
  try { localStorage.setItem(preferenceGraphStorageKey, JSON.stringify(value)); storageError.value = false; }
  catch { storageError.value = true; }
}, { deep: true });
function remember(id: PlannerKeywordId, automatic = false) {
  if (!automatic) automaticallyRemembered.delete(id);
  if (!selected.value.includes(id)) {
    selected.value = [...selected.value, id];
    if (automatic) automaticallyRemembered.add(id);
  }
}
function forgetAutomaticCategory(categoryId: MemoryCategoryId) {
  if (!isPlannerCategory(categoryId) || !automaticallyRemembered.has(categoryId) || edits.value.preferences.some(preference => preference.categoryId === categoryId && preference.polarity === 'like')) return;
  selected.value = selected.value.filter(id => id !== categoryId);
  automaticallyRemembered.delete(categoryId);
}
function focus(id: string) {
  const node = createPreferenceGraph(edits.value.preferences).nodes.find(node => node.id === id);
  if (!node) return;
  edits.value.hiddenIds = edits.value.hiddenIds.filter(hiddenId => hiddenId !== id && hiddenId !== node.categoryId);
  focused.value = id;
}
function add(items: PreferenceSuggestion[]) {
  const preferences = [...edits.value.preferences];
  const reveal = new Set<string>();
  let lastId = '';
  for (const item of items) {
    if (!item.categoryId) continue;
    let preference = preferences.find(preference => preferenceIdentity(preference) === preferenceIdentity(item));
    if (!preference) {
      if (preferences.length >= personalPreferenceLimit) continue;
      preference = { ...item, categoryId: item.categoryId, id: `personal-${crypto.randomUUID()}` };
      preferences.push(preference);
    }
    lastId = preference.id;
    reveal.add(preference.id); reveal.add(preference.categoryId);
    // A dislike must not turn on the corresponding broad interest for planning.
    if (preference.polarity === 'like' && isPlannerCategory(preference.categoryId)) remember(preference.categoryId, true);
  }
  edits.value = validPreferenceGraphEdits({ ...edits.value, preferences, hiddenIds: edits.value.hiddenIds.filter(id => !reveal.has(id)) });
  if (lastId) focused.value = lastId;
}
function move(id: string, categoryId: MemoryCategoryId) {
  const preference = edits.value.preferences.find(preference => preference.id === id);
  if (!preference || preference.categoryId === categoryId) return;
  const replacement = { ...preference, categoryId };
  const duplicate = edits.value.preferences.find(other => other.id !== id && preferenceIdentity(other) === preferenceIdentity(replacement));
  const preferences = edits.value.preferences.flatMap(item => item.id === id ? duplicate ? [] : [replacement] : [item]);
  edits.value = validPreferenceGraphEdits({ ...edits.value, preferences, hiddenIds: edits.value.hiddenIds.filter(hiddenId => hiddenId !== categoryId) });
  forgetAutomaticCategory(preference.categoryId);
  if (replacement.polarity === 'like' && isPlannerCategory(categoryId)) remember(categoryId, true);
  focused.value = duplicate?.id || id;
}
function moveFromList(id: string, event: Event) {
  const category = memoryCategories.find(category => category.id === (event.target as HTMLSelectElement).value);
  if (category) move(id, category.id);
}
function remove(id: string) {
  const node = createPreferenceGraph(edits.value.preferences).nodes.find(n => n.id === id);
  if (!node || node.kind === 'profile') return;
  if (node.personal) {
    const labels = { ...edits.value.labels }; delete labels[id];
    edits.value = { ...edits.value, labels, preferences: edits.value.preferences.filter(preference => preference.id !== id), hiddenIds: edits.value.hiddenIds.filter(hiddenId => hiddenId !== id) };
    if (node.categoryId) forgetAutomaticCategory(node.categoryId);
  } else {
    edits.value = { ...edits.value, hiddenIds: [...new Set([...edits.value.hiddenIds, id])] };
    if (node.kind === 'keyword') selected.value = selected.value.filter(k => k !== id);
  }
  focused.value = 'profile';
}
function rename(id: string, title: string) {
  if (edits.value.preferences.some(preference => preference.id === id)) {
    const labels = { ...edits.value.labels }; delete labels[id];
    edits.value = validPreferenceGraphEdits({ ...edits.value, labels, preferences: edits.value.preferences.map(preference => preference.id === id ? { ...preference, label: title } : preference) });
  } else edits.value = validPreferenceGraphEdits({ ...edits.value, labels: { ...edits.value.labels, [id]: title } });
}
</script>
<template>
  <div>
    <p v-if="storageError" class="preference-storage-error" role="alert">喜好已加入這次的 map，但瀏覽器無法儲存；重新整理後可能遺失。</p>
    <section class="preference-graph" aria-label="旅行偏好關係圖">
      <header class="preference-map-heading"><div><h2>我的記憶 map</h2><p>拖空白處移動地圖；拉動節點，放開會回原位。</p></div><span>{{ edits.preferences.length }} 個喜好</span></header>
      <PreferenceNetwork :remembered="selected" :selected="focused" :labels="edits.labels" :hidden-ids="edits.hiddenIds" :preferences="edits.preferences" @select="focused = $event" @remember="remember" @remove="remove" @rename="rename" @restore="edits.hiddenIds = []">
        <PreferenceCapture :preferences="edits.preferences" @add="add" @remove="remove" />
      </PreferenceNetwork>
    </section>
    <details v-if="edits.preferences.length" class="personal-preferences">
      <summary><span>已記住的 {{ edits.preferences.length }} 個喜好</span><small>展開管理</small></summary>
      <ul><li v-for="preference in edits.preferences" :key="preference.id" :class="{ 'is-focused': focused === preference.id }">
        <div class="personal-preference-copy"><button class="personal-preference-title" @click="focus(preference.id)"><span :class="{ 'is-avoid': preference.polarity === 'avoid' }">{{ preference.polarity === 'avoid' ? '避開' : '喜歡' }}</span>{{ edits.labels[preference.id] || preference.label }}</button><details><summary>查看原話</summary><p>「{{ preference.evidence }}」</p></details></div>
        <div class="personal-preference-actions"><label><span class="sr-only">{{ preference.label }}的記憶分類</span><select :value="preference.categoryId" @change="moveFromList(preference.id, $event)"><option v-for="category in memoryCategories" :key="category.id" :value="category.id">{{ category.title }}</option></select></label><button :aria-label="`刪除喜好：${preference.label}`" @click="remove(preference.id)"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 6h12M8 3h4M6 6l1 11h6l1-11M9 9v5m2-5v5"/></svg></button></div>
      </li></ul>
    </details>
  </div>
</template>
<style scoped>
.preference-storage-error{background:#fff5e7;border-radius:10px;color:#a16c36;padding:12px 14px;font-size:12px;line-height:1.7}.preference-map-heading{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:20px 24px 0;color:#315c70}.preference-map-heading h2{margin:0;font-size:15px;font-weight:600}.preference-map-heading p{font-size:10px;color:#839aa7;margin:6px 0 0;line-height:1.6}.preference-map-heading>span{font-size:10px;color:#008daf;background:#eaf8fc;border-radius:20px;padding:6px 9px;flex:none}.personal-preferences{margin-top:14px;color:#315c70}.personal-preferences>summary{display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:44px;font-size:12px;cursor:pointer;padding:8px 3px}.personal-preferences>summary small{font-size:10px;color:#8a9da7}.personal-preferences[open]>summary{margin-bottom:9px}.personal-preferences>summary:focus-visible{outline:3px solid #ffc500;outline-offset:3px;border-radius:8px}.personal-preferences header{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:10px}.personal-preferences h3{font-size:13px;margin:0;font-weight:600}.personal-preferences header>span{font-size:10px;color:#879aa4}.personal-preferences ul{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.personal-preferences li{padding:12px;border:1px solid #e0edf2;border-radius:12px;display:flex;align-items:flex-start;gap:8px;background:#fff;min-width:0}.personal-preferences li.is-focused{border-color:#e9c24f;background:#fffdf4}.personal-preference-copy{flex:1;min-width:0}.personal-preference-title{display:flex;align-items:center;gap:6px;border:0;background:transparent;padding:2px 0;color:#315c70;font:inherit;font-size:11px;text-align:left;cursor:pointer;line-height:1.6;overflow-wrap:anywhere}.personal-preference-title span{font-size:9px;padding:2px 5px;background:#e7f6fb;color:#0097be;border-radius:4px;flex:none;white-space:nowrap}.personal-preference-title span.is-avoid{background:#f8ecdf;color:#aa7548}.personal-preference-copy details{font-size:10px;color:#8a9da5;margin-top:5px}.personal-preference-copy summary{cursor:pointer}.personal-preference-copy details p{line-height:1.8;margin:7px 0 0;overflow-wrap:anywhere;color:#6f8b98}.personal-preference-actions{display:flex;align-items:center;gap:3px;flex:none}.personal-preference-actions select{width:103px;min-height:36px;font:inherit;font-size:10px;background:#f7fcfd;color:#5b8092;border:1px solid #daebf1;border-radius:7px;padding:5px 3px;cursor:pointer}.personal-preference-actions>button{display:grid;place-items:center;border:0;background:transparent;color:#94a4ab;min-height:36px;width:30px;cursor:pointer;border-radius:7px}.personal-preference-actions>button:hover{background:#fff1e7;color:#b77c54}.personal-preference-actions svg{width:16px;height:16px;stroke:currentColor;fill:none;stroke-width:1.4}.personal-preferences button:focus-visible,.personal-preferences select:focus-visible,.personal-preferences summary:focus-visible{outline:3px solid #ffc500;outline-offset:3px}.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}@media(max-width:600px){.preference-map-heading{padding:16px 14px 0;align-items:flex-start;flex-wrap:wrap;gap:8px}.preference-map-heading>span{font-size:9px}.personal-preferences ul{grid-template-columns:1fr}.personal-preferences li{padding:11px 9px}.personal-preferences header>span{font-size:9px}.personal-preference-actions select{width:100px}}
.preference-graph{overflow:hidden;border-radius:20px;background:#fff;border:1px solid #d4ecf5}@media(max-width:600px){.preference-graph{border-radius:16px}}
</style>

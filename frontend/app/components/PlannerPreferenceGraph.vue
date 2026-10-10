<script setup lang="ts">
import type { PlannerKeywordId } from '~/data/planner-preferences';
import { createPreferenceGraph, preferenceGraphStorageKey, validPreferenceGraphEdits } from '~/utils/preference-graph';
const selected = defineModel<PlannerKeywordId[]>({ required: true });
const focused = ref('profile');
const edits = ref(validPreferenceGraphEdits(null));
const { notify } = useDemo();
let loaded = false;
onMounted(() => {
  try { edits.value = validPreferenceGraphEdits(JSON.parse(localStorage.getItem(preferenceGraphStorageKey) || 'null')); }
  catch { /* An unreadable saved view starts with the original graph. */ }
  loaded = true;
});
watch(edits, value => {
  if (!loaded) return;
  try { localStorage.setItem(preferenceGraphStorageKey, JSON.stringify(value)); }
  catch { notify('修改暫存於此頁，瀏覽器目前無法儲存。'); }
}, { deep: true });
function remember(id: PlannerKeywordId) { if (!selected.value.includes(id)) selected.value = [...selected.value, id]; }
function remove(id: string) {
  const node = createPreferenceGraph().nodes.find(n => n.id === id);
  if (!node || node.kind === 'profile') return;
  edits.value = { ...edits.value, hiddenIds: [...new Set([...edits.value.hiddenIds, id])] };
  if (node.kind === 'keyword') selected.value = selected.value.filter(k => k !== id);
  focused.value = 'profile';
}
function rename(id: string, title: string) { edits.value = validPreferenceGraphEdits({ ...edits.value, labels: { ...edits.value.labels, [id]: title } }); }
</script>
<template>
  <section class="preference-graph" aria-label="旅行偏好關係圖">
    <PreferenceNetwork :remembered="selected" :selected="focused" :labels="edits.labels" :hidden-ids="edits.hiddenIds" @select="focused = $event" @remember="remember" @remove="remove" @rename="rename" @restore="edits.hiddenIds = []" />
  </section>
</template>
<style scoped>
.preference-graph{overflow:hidden;border-radius:20px;background:#fff;border:1px solid #d4ecf5}@media(max-width:600px){.preference-graph{border-radius:16px}}
</style>

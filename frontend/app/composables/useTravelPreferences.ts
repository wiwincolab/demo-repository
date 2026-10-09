import { plannerKeywords, plannerPreferenceStorageKey, validPlannerKeywords, type PlannerKeywordId } from '~/data/planner-preferences';

export function useTravelPreferences() {
  const keywordIds = useState<PlannerKeywordId[]>('travel-keywords', () => plannerKeywords.filter(k => k.defaultOn).map(k => k.id));
  const enabled = useState('travel-keywords-enabled', () => true);
  const ready = useState('travel-keywords-ready', () => false);
  const { notify } = useDemo();
  onMounted(() => {
    if (ready.value) return;
    try {
      const saved = JSON.parse(localStorage.getItem(plannerPreferenceStorageKey) || 'null');
      if (saved && Array.isArray(saved.ids)) {
        keywordIds.value = validPlannerKeywords(saved.ids);
        enabled.value = saved.enabled !== false;
      }
    } catch { /* Keep the demo preferences if stored data cannot be read. */ }
    ready.value = true;
  });
  watch([keywordIds, enabled], () => {
    if (!ready.value) return;
    try { localStorage.setItem(plannerPreferenceStorageKey, JSON.stringify({ ids: keywordIds.value, enabled: enabled.value })); }
    catch { notify('偏好暫存於此頁，瀏覽器目前無法儲存。'); }
  }, { deep: true });
  return { keywordIds, enabled };
}

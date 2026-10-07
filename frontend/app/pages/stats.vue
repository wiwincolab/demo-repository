<script setup lang="ts">
import '~/assets/css/share.css';

// 即時漏斗：決賽時可以投影，看評審怎麼一路從分享走到存行程、加入、購買。每 5 秒更新。
// 數字都是不重複的裝置數（server/api/stats.get.ts）；沒有後端（GitHub Pages）時顯示說明
type Stats = Record<'sharers' | 'shares' | 'viewers' | 'savers' | 'creators' | 'groups' | 'joined' | 'buyers' | 'unlocked' | 'gifts' | 'claimed' | 'generated' | 'fallback' | 'devices', number> & { at: string };
const { available, check } = useApi();
const stats = ref<Stats | null>(null);
let timer: ReturnType<typeof setInterval> | undefined;
async function load() { try { stats.value = await $fetch<Stats>('/api/stats'); } catch { /* 下一輪再試 */ } }
onMounted(async () => { if (await check()) { await load(); timer = setInterval(load, 5000); } });
onBeforeUnmount(() => clearInterval(timer));
useHead({ title: '即時漏斗 · 去趣 chicTrip' });

const rate = (part: number, whole: number) => whole ? `${Math.round(part / whole * 100)}%` : '—';
const funnels = computed(() => stats.value ? [
    { title: '分享循環', steps: [
        { label: '分享出去', value: stats.value.sharers, note: `${stats.value.shares} 個分享` },
        { label: '朋友打開', value: stats.value.viewers, note: rate(stats.value.viewers, stats.value.sharers) + ' / 分享者' },
        { label: '存成自己的行程', value: stats.value.savers, note: rate(stats.value.savers, stats.value.viewers) + ' / 打開' },
        { label: '我也做一張', value: stats.value.creators, note: rate(stats.value.creators, stats.value.viewers) + ' / 打開' },
    ] },
    { title: '旅伴組隊', steps: [
        { label: '發出邀請', value: stats.value.groups, note: '個旅伴群組' },
        { label: '旅伴加入', value: stats.value.joined, note: '人' },
        { label: '購買 eSIM（示範）', value: stats.value.buyers, note: '人' },
        { label: '解鎖旅伴價', value: stats.value.unlocked, note: '團（4 人以上）' },
    ] },
    { title: '送 eSIM', steps: [
        { label: '送出禮物', value: stats.value.gifts, note: '張' },
        { label: '朋友領取', value: stats.value.claimed, note: rate(stats.value.claimed, stats.value.gifts) },
    ] },
    { title: 'AI 創作', steps: [
        { label: 'Gemini 生成完成', value: stats.value.generated, note: '件' },
        { label: '退回示範圖', value: stats.value.fallback, note: '件' },
    ] },
] : []);
</script>

<template>
  <section class="share-page stats-page" aria-labelledby="stats-title">
    <div>
      <span class="share-eyebrow">即時更新 · 每 5 秒</span>
      <h1 id="stats-title">去趣 social loop 漏斗</h1>
      <p v-if="stats" class="creation-muted">{{ stats.devices }} 台裝置參與 · 更新於 {{ new Date(stats.at).toLocaleTimeString('zh-TW') }}</p>
    </div>
    <p v-if="available === false" class="share-hero"><span>這個版本沒有後端，請到 GCP 版查看即時數字。</span></p>
    <article v-for="funnel in funnels" :key="funnel.title" class="stats-funnel">
      <h2>{{ funnel.title }}</h2>
      <div v-for="step in funnel.steps" :key="step.label" class="stats-step">
        <span>{{ step.label }}</span>
        <i :style="{ width: Math.max(4, Math.min(100, step.value / Math.max(1, funnel.steps[0]!.value) * 100)) + '%' }" />
        <b>{{ step.value }}</b><small>{{ step.note }}</small>
      </div>
    </article>
  </section>
</template>

<script setup lang="ts">
import { renderSVG } from 'uqr';
import type { Usage } from '~/types/trip';
import { esimPlan, usageOptions } from '~/utils/esim';
import { listSentGifts, sendGift, type Gift } from '~/utils/gift-api';
import { getMe, setNickname } from '~/utils/share-api';
import '~/assets/css/share.css';

// 送一張 eSIM 給朋友（有後端時）：選方案 → 產生禮物連結與 QR → 朋友領取後這裡幾秒內顯示「已領取」。
// 命題要的病毒式導購：拿到禮物的人打開的是去趣，看得到行程與 AI 創作。真的開通與付款不在範圍內（示範）
const props = defineProps<{ days: number }>();
const { activeId } = useTripContext();
const { esim, usage, notify } = useDemo();
const chosen = ref<Usage>(esim.value.purchasedUsage || esim.value.selectedUsage || usage.value);
const nickname = ref(''), needName = ref(false), busy = ref(false);
const latest = ref<Gift | null>(null);
const sent = ref<Gift[]>([]);
const url = computed(() => latest.value && import.meta.client ? new URL(latest.value.url, window.location.origin).href : '');
const qr = computed(() => url.value ? renderSVG(url.value, { border: 1 }) : '');
const plans = computed(() => usageOptions.map(option => ({ ...option, plan: esimPlan(option.value, props.days) })));

async function refresh() {
    if (!activeId.value) return;
    try { sent.value = await listSentGifts(activeId.value); } catch { /* 下一輪再試 */ }
}
let timer: ReturnType<typeof setInterval> | undefined;
onMounted(async () => {
    try { needName.value = !(await getMe()).nickname; } catch { needName.value = false; }
    await refresh();
    timer = setInterval(() => { if (document.visibilityState === 'visible') void refresh(); }, 4000);
});
onBeforeUnmount(() => clearInterval(timer));

async function create() {
    if (!activeId.value || busy.value) return;
    busy.value = true;
    try {
        if (needName.value) {
            if (!nickname.value.trim()) { notify('先取一個朋友看得到的名字'); return; }
            await setNickname(nickname.value.trim());
            needName.value = false;
        }
        latest.value = await sendGift(activeId.value, chosen.value);
        await refresh();
    } catch {
        notify('禮物連結沒有建立成功，請再試一次');
    } finally {
        busy.value = false;
    }
}

async function send() {
    if (!latest.value) return;
    const plan = esimPlan(latest.value.usage, props.days);
    const text = `${latest.value.sender}送你一張日本 eSIM（${plan.name} · ${plan.days} 天），打開就能領取。`;
    if (navigator.share) {
        try { await navigator.share({ title: '送你一張 eSIM', text, url: url.value }); return; } catch (error) { if ((error as DOMException).name === 'AbortError') return; }
    }
    try { await navigator.clipboard.writeText(`${text}\n${url.value}`); notify('已複製禮物連結'); } catch { notify('請長按連結自行複製'); }
}
</script>

<template>
  <div class="gift-panel">
    <p class="esim-proposal-note">競賽提案 · 示範領取，不會真的開通或扣款</p>
    <fieldset class="gift-plans">
      <legend>送哪一種方案</legend>
      <label v-for="option in plans" :key="option.value" :class="{ selected: chosen === option.value }">
        <input v-model="chosen" type="radio" name="gift-plan" :value="option.value" />
        <span><b>{{ option.plan.name }}</b><small>{{ option.title }} · {{ option.plan.days }} 天</small></span>
        <strong>NT${{ option.plan.price }}</strong>
      </label>
    </fieldset>
    <template v-if="needName">
      <label class="creation-label" for="gift-name">朋友看到的名字</label>
      <input id="gift-name" v-model="nickname" class="share-input" maxlength="12" placeholder="例如：小安" autocomplete="nickname" />
    </template>
    <button class="esim-cta esim-full" :disabled="busy" @click="create">{{ busy ? '正在產生…' : latest ? '再送一張' : '產生禮物連結' }}</button>
    <div v-if="latest" class="invite-panel">
      <div class="invite-qr" role="img" :aria-label="'禮物連結 QR code：' + url" v-html="qr" />
      <p><b>請朋友掃描領取</b><small>{{ esimPlan(latest.usage, days).name }} · {{ latest.claimed ? '已被' + latest.claimedBy + '領取' : '還沒有人領取' }}</small></p>
      <a :href="url" target="_blank" rel="noopener">{{ url }}</a>
      <button class="primary" @click="send">傳送禮物連結</button>
    </div>
    <ul v-if="sent.length" class="gift-sent">
      <li v-for="gift in sent" :key="gift.id"><span>{{ esimPlan(gift.usage, days).name }}</span><b :class="{ claimed: gift.claimed }">{{ gift.claimed ? gift.claimedBy + ' 已領取' : '等待領取' }}</b></li>
    </ul>
  </div>
</template>

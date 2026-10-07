<script setup lang="ts">
import { renderSVG } from 'uqr';
import { tripSummaries } from '~/data/trips';
import { esimPlan } from '~/utils/esim';
import { claimGift, demoActivationCode, type Gift } from '~/utils/gift-api';
import '~/assets/css/creation.css';
import '~/assets/css/share.css';

// 朋友打開禮物連結的頁面：誰送的、什麼方案 → 領取 → 標示「示範」的安裝 QR 與步驟，
// 再把人帶進這趟行程與 AI 創作（命題的導購：拿到禮物的人第一次打開的就是去趣）
const route = useRoute();
const id = String(route.params.id);
const { selectTrip } = useTripContext();
const { notify } = useDemo();
const { data: gift } = await useFetch<Gift>(`/api/gifts/${id}`);
const trip = computed(() => tripSummaries.find(item => item.id === gift.value?.tripId));
const plan = computed(() => gift.value && trip.value ? esimPlan(gift.value.usage, trip.value.dayCount) : null);
const title = computed(() => gift.value ? `${gift.value.sender}送你一張日本 eSIM · 去趣 chicTrip` : '去趣 chicTrip');
useSeoMeta({ title, ogTitle: title, description: '打開就能領取，順便看看這趟旅行的行程。', ogDescription: '打開就能領取，順便看看這趟旅行的行程。' });

// 伺服器先產生的畫面在 JavaScript 載入完成（hydration）前按不動、輸入的字也會被蓋掉；
// 現場網路慢時差得出來，所以載入完成前先把按鈕與輸入框鎖住，評審看得出還在載入
const ready = ref(false);
onMounted(() => { ready.value = true; });
const busy = ref(false), error = ref('');
const qr = computed(() => gift.value?.claimedByMe ? renderSVG(demoActivationCode(gift.value.id), { border: 1 }) : '');

async function claim() {
    if (!gift.value || busy.value) return;
    busy.value = true;
    error.value = '';
    try {
        gift.value = await claimGift(id);
        notify('已領取，下面是示範安裝步驟');
    } catch (failure) {
        error.value = (failure as { data?: { statusMessage?: string } }).data?.statusMessage || '沒有領取成功，請再試一次';
    } finally {
        busy.value = false;
    }
}
async function openTrip(path: '/trip' | '/memory') {
    if (!gift.value) return;
    selectTrip(gift.value.tripId);
    await navigateTo({ path, query: { trip: gift.value.tripId } });
}
</script>

<template>
  <section class="share-page" aria-labelledby="gift-title">
    <template v-if="gift && plan">
      <div>
        <span class="share-eyebrow">{{ gift.sender }}送你一份禮物</span>
        <h1 id="gift-title">日本 eSIM · {{ plan.name }}</h1>
        <p class="creation-muted">{{ plan.days }} 天 · {{ plan.desc }} · 價值 NT${{ plan.price }}</p>
      </div>
      <div v-if="gift.claimedByMe" class="gift-code">
        <span class="gift-demo-badge">示範 · 無法實際安裝</span>
        <div class="invite-qr" role="img" aria-label="示範用的 eSIM 安裝 QR code" v-html="qr" />
        <ol class="share-stop-list">
          <li><span class="share-avatar">1</span><span><b>出發當天在台灣連上 Wi-Fi</b><small>設定 → 行動服務 → 加入 eSIM，掃描上面的 QR</small></span></li>
          <li><span class="share-avatar">2</span><span><b>抵達日本後開啟這張 eSIM</b><small>行動數據切到旅遊門號，打開數據漫遊</small></span></li>
          <li><span class="share-avatar">3</span><span><b>有問題找 24 小時中文客服</b><small>去趣 eSIM 正式服務提供 LINE 客服</small></span></li>
        </ol>
      </div>
      <div v-else class="share-hero"><p>{{ gift.mine ? '這是你送出的禮物，把連結傳給朋友領取吧。' : gift.claimed ? `這份禮物已經被${gift.claimedBy}領走了。` : `${gift.sender}也在用去趣排「${trip?.title.replace(/。$/, '')}」。領取後可以看看這趟的行程，也做一張自己的旅行作品。` }}</p></div>
      <div class="share-actions">
        <p v-if="error" class="creation-error" role="alert">{{ error }}</p>
        <button v-if="gift.canClaim" class="creation-primary" :disabled="!ready || busy" @click="claim">{{ busy ? '正在領取…' : '領取這張 eSIM' }}</button>
        <button class="creation-secondary" :disabled="!ready" @click="openTrip('/trip')">看看這趟行程</button>
        <button v-if="gift.claimedByMe" class="creation-secondary" :disabled="!ready" @click="openTrip('/memory')">我也做一張旅行作品 ✦</button>
        <p class="share-note">競賽提案示範：不會真的開通 eSIM 或扣款。</p>
      </div>
    </template>
    <div v-else class="share-hero">
      <p><b>這份禮物不存在或已經失效。</b></p>
      <NuxtLink class="creation-primary" to="/trips">看看示範行程</NuxtLink>
    </div>
  </section>
</template>

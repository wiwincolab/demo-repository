<script setup lang="ts">
import { saveShare, shareEvent, type PublicShare } from '~/utils/share-api';
import '~/assets/css/creation.css';
import '~/assets/css/share.css';

// 朋友掃分享圖卡的 QR 進來的頁面（social loop 的入口）：看作品與公開景點 → 存成自己的行程，或自己也做一張。
// 伺服器端先取資料：LINE、FB 貼這個連結時，預覽才看得到作品圖與文案
const route = useRoute();
const id = String(route.params.id);
const asset = useAsset();
const { selectTrip } = useTripContext();
const { notify, rememberSaved } = useDemo();
const { data: share } = await useFetch<PublicShare>(`/api/shares/${id}`);
const origin = useRequestURL().origin;
const title = computed(() => share.value ? `${share.value.nickname}的${share.value.location.split(' · ').pop()} · 去趣 chicTrip` : '去趣 chicTrip');
const description = computed(() => share.value?.caption || '看看朋友的旅行，存成你的行程，也做一張自己的旅行作品。');
useSeoMeta({
    title, ogTitle: title, description, ogDescription: description,
    ogImage: () => share.value?.imageUrl ? origin + share.value.imageUrl : undefined,
    twitterCard: 'summary_large_image',
});

// 伺服器先產生的畫面在 JavaScript 載入完成（hydration）前按不動、輸入的字也會被蓋掉；
// 現場網路慢時差得出來，所以載入完成前先把按鈕與輸入框鎖住，評審看得出還在載入
const ready = ref(false);
onMounted(() => { ready.value = true; });
const busy = ref<'' | 'save' | 'create'>('');
onMounted(() => { if (share.value) shareEvent(id, 'view').catch(() => {}); });

async function save() {
    if (!share.value || busy.value) return;
    busy.value = 'save';
    try {
        const result = await saveShare(id);
        rememberSaved(result.tripId, { shareId: id, stopIds: share.value.stops.map(stop => stop.id), title: result.title, from: share.value.nickname });
        selectTrip(result.tripId);
        notify('已存成你的行程');
        await navigateTo({ path: '/trip', query: { trip: result.tripId } });
    } catch {
        notify('沒有存成功，請再試一次');
        busy.value = '';
    }
}

async function create() {
    if (!share.value || busy.value) return;
    busy.value = 'create';
    shareEvent(id, 'create').catch(() => {});
    selectTrip(share.value.tripId);
    await navigateTo({ path: '/memory', query: { trip: share.value.tripId } });
}
</script>

<template>
  <section class="share-page" aria-labelledby="share-title">
    <PageMascot />
    <template v-if="share">
      <div>
        <span class="share-eyebrow">{{ share.nickname }}分享的旅行</span>
        <h1 id="share-title">{{ share.location }}</h1>
        <p class="creation-muted">{{ share.tripTitle.replace(/。$/, '') }} · {{ share.stops.length }} 個公開景點</p>
      </div>
      <figure class="share-hero">
        <img v-if="share.imageUrl" :src="share.imageUrl" :alt="share.nickname + ' 在' + share.location + '的旅行作品'" />
        <p v-if="share.caption">{{ share.caption }}</p>
      </figure>
      <h2>{{ share.nickname }}去了這些地方</h2>
      <ol class="share-stop-list">
        <li v-for="stop in share.stops" :key="stop.id"><img :src="asset(stop.photo)" alt="" loading="lazy" /><span><b>{{ stop.name }}</b><small>Day {{ stop.day + 1 }}</small></span></li>
      </ol>
      <div class="share-actions">
        <button class="creation-primary" :disabled="!ready || !!busy" @click="save">{{ busy === 'save' ? '正在存…' : '存成我的行程' }}</button>
        <button class="creation-secondary" :disabled="!ready || !!busy" @click="create">我也做一張旅行作品 ✦</button>
        <p class="share-note">只會複製公開的景點，{{ share.nickname }}的行程不受影響。</p>
      </div>
    </template>
    <div v-else class="share-hero">
      <p><b>這個分享不存在或已經失效。</b><br />看看去趣的示範行程，也做一張自己的旅行作品。</p>
      <NuxtLink class="creation-primary" to="/trips">看看示範行程</NuxtLink>
    </div>
  </section>
</template>

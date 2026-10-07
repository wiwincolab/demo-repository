<script setup lang="ts">
import { dayLabel, getJournal, makeDailyCard, pickedUrl, type Journal } from '~/utils/journal-api';
import { renderJournalImage } from '~/utils/journal-card';
import '~/assets/css/creation.css';
import '~/assets/css/share.css';
import '~/assets/css/journal.css';

// 我們的旅行紀錄（social loop 的 ②：把旅行做成作品）：旅伴所有照片（含 Bingo）依天排好、重複的收起來；
// 每天一張 AI 挑的回憶卡（代表、食物、意外）；誰最愛拍食物這類稱號；最後拼成旅行長圖分享出去
const { activeId, activeTrip, tripHref } = useTripContext();
const { notify } = useDemo();
const { available, check } = useApi();
const journal = ref<Journal | null>(null);
const loading = ref(true), making = ref<string | null>(null), shareOpen = ref(false), shareImage = ref(''), drawing = ref(false);
let timer: ReturnType<typeof setInterval> | undefined;

async function load() {
    if (!activeId.value) return;
    try { journal.value = await getJournal(activeId.value); } catch { /* 下一輪再試 */ }
    loading.value = false;
}
onMounted(async () => {
    if (!(await check())) { loading.value = false; return; }
    await load();
    timer = setInterval(() => { if (document.visibilityState === 'visible') void load(); }, 5000);
});
onBeforeUnmount(() => clearInterval(timer));
watch(activeId, (id, old) => { if (id && old && available.value) { journal.value = null; loading.value = true; void load(); } });

async function makeCard(day: string) {
    if (!activeId.value || making.value) return;
    making.value = day;
    try { await makeDailyCard(activeId.value, day); await load(); }
    catch (error) { notify((error as { data?: { statusMessage?: string } }).data?.statusMessage || '卡片沒有開始做，請再試一次'); }
    finally { making.value = null; }
}
async function shareLong() {
    if (!journal.value || !activeTrip.value || drawing.value) return;
    if (!journal.value.days.some(day => day.card?.picks)) { notify('先產生至少一天的回憶卡'); return; }
    drawing.value = true;
    try { shareImage.value = await renderJournalImage(journal.value, activeTrip.value.title); shareOpen.value = true; }
    finally { drawing.value = false; }
}
const tagLabel = { food: '食物', scenery: '風景', people: '人物', other: '' } as const;
useHead({ title: '我們的旅行紀錄 · 去趣 chicTrip' });
</script>

<template>
  <section class="journal-page" aria-labelledby="journal-title">
    <header>
      <span class="share-eyebrow">{{ activeTrip?.title.replace(/。$/, '') }}</span>
      <h1 id="journal-title">我們的旅行紀錄</h1>
      <p class="creation-muted">旅伴的照片和 Bingo 都在這裡，每天一張 AI 挑的回憶卡。</p>
    </header>
    <p v-if="available === false" class="share-hero"><span>共同遊記需要後端，請到 GCP 版看。</span></p>
    <p v-else-if="!activeId" class="share-hero"><span>先選一趟旅行。</span><NuxtLink class="creation-primary" to="/trips?next=/journal">選擇行程</NuxtLink></p>
    <p v-else-if="loading" class="journal-loading" role="status">正在整理大家的照片…</p>
    <template v-else-if="journal">
      <section v-if="journal.stats.titles.length" class="journal-titles" aria-label="旅伴稱號">
        <span v-for="title in journal.stats.titles" :key="title.title"><b>{{ title.title }}</b>{{ title.nickname }} · {{ title.count }}</span>
      </section>
      <div v-if="!journal.days.length" class="share-hero"><p>還沒有照片。到 <NuxtLink :to="tripHref('/memory')">AI 創作</NuxtLink> 加照片、或玩 <NuxtLink :to="tripHref('/bingo')">旅行 Bingo</NuxtLink>，這裡就會出現。</p></div>
      <article v-for="day in journal.days" :key="day.day" class="journal-day">
        <h2>{{ dayLabel(day.day) }}<small>{{ day.items.length }} 張</small></h2>
        <div v-if="day.card?.status === 'queued' || making === day.day" class="journal-card is-waiting" role="status">AI 正在挑今天的照片…</div>
        <div v-else-if="day.card?.picks" class="journal-card">
          <img :src="pickedUrl(day.card, day.card.picks.cover)!" :alt="day.card.picks.title" />
          <div class="journal-card-copy"><b>{{ day.card.picks.title }}</b><p>{{ day.card.picks.coverCaption }}</p></div>
          <div class="journal-card-extra">
            <figure v-if="pickedUrl(day.card, day.card.picks.food)"><img :src="pickedUrl(day.card, day.card.picks.food)!" alt="今日美食" /><figcaption><b>今日美食</b>{{ day.card.picks.foodCaption }}</figcaption></figure>
            <figure v-if="pickedUrl(day.card, day.card.picks.surprise)"><img :src="pickedUrl(day.card, day.card.picks.surprise)!" alt="今日意外" /><figcaption><b>今日意外</b>{{ day.card.picks.surpriseCaption }}</figcaption></figure>
          </div>
          <button class="creation-text-button" @click="makeCard(day.day)">重新挑一次 ✦</button>
        </div>
        <button v-else class="creation-primary journal-make" :disabled="!!making" @click="makeCard(day.day)">產生這天的回憶卡 ✦</button>
        <ul class="journal-album">
          <li v-for="item in day.items" :key="item.id"><img :src="item.url" :alt="item.title" loading="lazy" /><span>{{ item.nickname }}{{ item.me ? '（你）' : '' }}</span><i v-if="item.kind === 'bingo'">Bingo</i><i v-else-if="item.tag && tagLabel[item.tag]">{{ tagLabel[item.tag] }}</i></li>
        </ul>
      </article>
      <p v-if="journal.hidden" class="share-note">收起了 {{ journal.hidden }} 張重複的照片（連拍或同一張傳兩次）。</p>
      <div v-if="journal.days.length" class="share-actions">
        <button class="creation-primary" :disabled="drawing" @click="shareLong">{{ drawing ? '正在拼長圖…' : '產生旅行長圖並分享 ↗' }}</button>
      </div>
    </template>
    <ShareSheet v-if="activeId && shareImage" v-model="shareOpen" :trip-id="activeId" :image="shareImage" :location="(activeTrip?.title || '').replace(/。$/, '') + ' · 旅行紀錄'" kind="trip" />
  </section>
</template>

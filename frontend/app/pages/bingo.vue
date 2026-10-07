<script setup lang="ts">
import { cellPhoto, getBoard, openBoard, submitCell, type BingoBoard, type BingoCell } from '~/utils/bingo-api';
import { renderBingoCard } from '~/utils/bingo-card';
import { resizeToJpeg } from '~/utils/image-resize';
import '~/assets/css/creation.css';
import '~/assets/css/share.css';
import '~/assets/css/bingo.css';

// 旅行 Bingo：拍照完成任務、旅伴一起比（有旅伴群組就整組共用一張）。照片交給 AI 判斷，連成一條線就分享出去，
// 朋友掃 QR 進來又能存成行程、自己也玩一張。中間一欄到哪都能拍，決賽現場一定連得成
const { activeId, activeTrip, tripHref } = useTripContext();
const { notify } = useDemo();
const { available, check } = useApi();
const board = ref<BingoBoard | null>(null);
const loading = ref(true), sending = ref<number | null>(null), celebrate = ref(false), shareOpen = ref(false), shareImage = ref('');
const input = ref<HTMLInputElement>();
const target = ref<BingoCell | null>(null);
let timer: ReturnType<typeof setInterval> | undefined, seenLines = -1;

async function load() {
    if (!activeId.value) return;
    loading.value = true;
    try { board.value = await openBoard(activeId.value); } catch { notify('Bingo 沒有開成功，請重新整理'); }
    loading.value = false;
}
async function refresh() {
    if (!board.value || document.visibilityState !== 'visible') return;
    try { board.value = await getBoard(board.value.id); } catch { /* 下一輪再試 */ }
}
onMounted(async () => {
    if (!(await check())) { loading.value = false; return; }
    await load();
    timer = setInterval(refresh, 3000);
});
onBeforeUnmount(() => clearInterval(timer));
watch(activeId, (id, old) => { if (id && old && available.value) { seenLines = -1; void load(); } });
// 連線數變多才慶祝；第一次載入不算（舊的連線不重複慶祝）
watch(() => board.value?.lines.length, count => {
    if (count === undefined) return;
    if (seenLines >= 0 && count > seenLines) celebrate.value = true;
    seenLines = count;
});

function pick(cell: BingoCell) { if (sending.value !== null) return; target.value = cell; input.value?.click(); }
async function upload(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    (event.target as HTMLInputElement).value = '';
    if (!file || !board.value || !target.value) return;
    sending.value = target.value.index;
    try {
        const { blob } = await resizeToJpeg(file);
        board.value = await submitCell(board.value.id, target.value.index, blob);
    } catch (error) {
        notify((error as { data?: { statusMessage?: string } }).data?.statusMessage || '照片沒有送出，請再試一次');
    } finally {
        sending.value = null;
    }
}
async function shareBoard() {
    if (!board.value || !activeTrip.value) return;
    shareImage.value = await renderBingoCard(board.value, activeTrip.value.title);
    celebrate.value = false;
    shareOpen.value = true;
}
const doneCount = computed(() => board.value?.cells.filter(cell => cell.done).length ?? 0);
const status = (cell: BingoCell) => {
    const mark = cellPhoto(cell);
    if (sending.value === cell.index) return { text: '上傳中…', kind: 'checking' };
    if (cell.done) return { text: mark?.comment || '完成！', kind: 'done' };
    if (mark?.status === 'checking') return { text: 'AI 正在看…', kind: 'checking' };
    if (mark?.status === 'fail') return { text: mark.comment || '好像不太像，再拍一張？', kind: 'fail' };
    return { text: cell.hint, kind: 'todo' };
};
useHead({ title: '旅行 Bingo · 去趣 chicTrip' });
</script>

<template>
  <section class="bingo-page" aria-labelledby="bingo-title">
    <header class="bingo-heading">
      <span class="share-eyebrow">{{ activeTrip?.title.replace(/。$/, '') }}</span>
      <h1 id="bingo-title">旅行 Bingo</h1>
      <p class="creation-muted">拍照完成任務，連成一條線就分享出去。旅伴一起玩同一張。</p>
    </header>
    <p v-if="available === false" class="share-hero"><span>旅行 Bingo 需要 AI 判斷照片，請到 GCP 版玩。</span></p>
    <p v-else-if="!activeId" class="share-hero"><span>先選一趟旅行。</span><NuxtLink class="creation-primary" to="/trips?next=/bingo">選擇行程</NuxtLink></p>
    <p v-else-if="loading && !board" class="bingo-loading" role="status">AI 正在依這趟的景點出題…</p>
    <template v-else-if="board">
      <div class="bingo-progress"><b>{{ doneCount }} / 9</b><span>{{ board.lines.length ? `已連成 ${board.lines.length} 條線` : '中間一欄到哪都能拍' }}</span><button v-if="board.lines.length" class="creation-primary" @click="shareBoard">分享 Bingo ↗</button></div>
      <ol class="bingo-grid">
        <li v-for="cell in board.cells" :key="cell.index" :class="['bingo-cell', 'is-' + status(cell).kind, { anywhere: cell.anywhere, 'in-line': board.lines.some(line => line.includes(cell.index)) }]">
          <button :aria-label="cell.title + '：' + status(cell).text" :disabled="sending !== null" @click="pick(cell)">
            <img v-if="cellPhoto(cell) && status(cell).kind !== 'todo'" :src="cellPhoto(cell)!.photoUrl" alt="" loading="lazy" />
            <span class="bingo-cell-copy"><b>{{ cell.title }}</b><small>{{ status(cell).text }}</small></span>
            <i v-if="cell.anywhere && !cell.done" class="bingo-anywhere">到哪都能拍</i>
            <i v-if="cell.done" class="bingo-check" aria-hidden="true">✓</i>
          </button>
        </li>
      </ol>
      <input ref="input" type="file" accept="image/*" class="sr-only" aria-label="上傳 Bingo 照片" @change="upload" />
      <section v-if="board.leaderboard.length" class="bingo-leaderboard" aria-label="排行榜">
        <h2>誰完成最多格</h2>
        <ol><li v-for="(player, i) in board.leaderboard" :key="player.nickname + i"><span>{{ i + 1 }}</span><b>{{ player.nickname }}{{ player.me ? '（你）' : '' }}</b><em>{{ player.count }} 格</em></li></ol>
      </section>
      <p class="share-note">{{ board.source === 'ai' ? '題目由 AI 依這趟行程的景點介紹出的' : '題目依這趟行程的景點準備' }}；照片交給 AI 判斷，標準寬鬆。<NuxtLink :to="tripHref('/trip')">邀旅伴一起玩 ›</NuxtLink></p>
    </template>
    <div v-if="celebrate" class="bingo-celebrate" role="dialog" aria-label="連成一條線">
      <div><span aria-hidden="true">🎉</span><h2>連成一條線！</h2><p>把這張 Bingo 分享出去，朋友也能存成行程、一起玩。</p><button class="creation-primary" @click="shareBoard">分享我們的 Bingo</button><button class="creation-secondary" @click="celebrate = false">繼續玩</button></div>
    </div>
    <ShareSheet v-if="activeId && shareImage" v-model="shareOpen" :trip-id="activeId" :image="shareImage" :location="(activeTrip?.title || '').replace(/。$/, '') + ' · 旅行 Bingo'" kind="trip" />
  </section>
</template>

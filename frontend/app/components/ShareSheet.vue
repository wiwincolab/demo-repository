<script setup lang="ts">
import { tripItineraries, type TripId } from '~/data/trips';
import { renderStoryCard } from '~/utils/story-card';
import { blobFrom, createShare, getMe, requestCaption, setNickname, shareStory, uploadShareImage } from '~/utils/share-api';
import '~/assets/css/share.css';

// 把作品分享出去（social loop 的起點）：勾公開景點 → 暱稱 → AI 寫文案 → 限動圖卡（含 QR）→ 系統分享選單。
// 朋友掃 QR 進 /s/短碼，可以存成自己的行程、自己也做一張。只有 GCP 版（有後端）會打開這個面板
const open = defineModel<boolean>({ default: false });
const props = defineProps<{ tripId: TripId; image: string; location: string; styleId?: string; kind?: 'creation' | 'trip' }>();
const { notify } = useDemo();

const stops = computed(() => tripItineraries[props.tripId].flatMap(day => day.stops));
const picked = ref<number[]>([]);
const nickname = ref(''), savedNickname = ref(''), caption = ref('');
const writing = ref(false), sharing = ref(false), error = ref('');
const done = ref<{ url: string; card: string; result: string } | null>(null);

// immediate：旅行紀錄頁是長圖畫好才掛上這個面板、一掛上就是打開的，沒有「從關到開」也要初始化，不然公開景點是 0 個
watch(open, async value => {
    if (!value) return;
    picked.value = stops.value.map(stop => stop.id);
    error.value = '';
    if (done.value) URL.revokeObjectURL(done.value.card);
    done.value = null;
    caption.value = `把 ${props.location.split(' · ')[0]} 捨不得忘記的一刻，留成一張回憶。\n#旅行回憶 #去趣`;
    // 只在欄位還空著時帶入：線上要等網路回應，評審可能已經先打了名字，不能蓋掉（10/7 線上實測踩到）
    try { savedNickname.value = (await getMe()).nickname || ''; if (!nickname.value.trim()) nickname.value = savedNickname.value; } catch { /* 讀不到就讓評審自己填 */ }
}, { immediate: true });

async function aiCaption() {
    writing.value = true;
    try {
        const result = await requestCaption({ location: props.location, styleId: props.styleId });
        caption.value = result.caption;
        if (!result.ai) notify('AI 這次沒寫成，先放上範本文字');
    } catch {
        notify('AI 這次沒寫成，可以自己改文字');
    } finally {
        writing.value = false;
    }
}

async function share() {
    error.value = '';
    const name = nickname.value.trim();
    if (!name) { error.value = '取一個分享時顯示的名字吧'; return; }
    if (!picked.value.length) { error.value = '至少公開一個景點，朋友才能存成行程'; return; }
    sharing.value = true;
    try {
        if (name !== savedNickname.value) savedNickname.value = (await setNickname(name)).nickname;
        const created = await createShare({ kind: props.kind || 'creation', tripId: props.tripId, styleId: props.styleId, location: props.location, stopIds: picked.value, caption: caption.value });
        await uploadShareImage(created.id, await blobFrom(props.image));
        const url = new URL(created.url, window.location.origin).href;
        const card = await renderStoryCard({ artwork: props.image, location: props.location, nickname: savedNickname.value, url });
        const result = await shareStory(card, caption.value, url);
        done.value = { url, card: URL.createObjectURL(card), result };
    } catch {
        error.value = '分享沒有建立成功，請再試一次';
    } finally {
        sharing.value = false;
    }
}

async function copyLink() {
    if (!done.value) return;
    try { await navigator.clipboard.writeText(done.value.url); notify('已複製分享連結'); } catch { notify('請長按連結自行複製'); }
}
onBeforeUnmount(() => { if (done.value) URL.revokeObjectURL(done.value.card); });
</script>

<template>
  <CreationDialog v-model="open" title="分享給朋友">
    <template v-if="!done">
      <div class="share-preview"><img :src="image" :alt="location + ' 的作品'" /><span><b>{{ location }}</b><small>朋友掃描圖卡上的 QR，就能看到你公開的景點、存成自己的行程。</small></span></div>
      <label class="creation-label" for="share-nickname">分享時顯示的名字</label>
      <input id="share-nickname" v-model="nickname" class="share-input" maxlength="12" placeholder="例如：小安" autocomplete="nickname" />
      <div class="share-caption-head"><label class="creation-label" for="share-caption">貼文文字</label><button class="creation-text-button" :disabled="writing" @click="aiCaption">{{ writing ? 'AI 正在寫…' : '✦ AI 幫我寫' }}</button></div>
      <textarea id="share-caption" v-model="caption" class="share-input share-textarea" maxlength="500" rows="4" />
      <details class="share-stops">
        <summary>公開的景點 <span>{{ picked.length }} / {{ stops.length }}</span></summary>
        <p class="creation-muted">住宿與旅伴名單不會公開。</p>
        <label v-for="stop in stops" :key="stop.id"><input v-model="picked" type="checkbox" :value="stop.id" /> Day {{ stop.day + 1 }} · {{ stop.name }}</label>
      </details>
      <p v-if="error" class="creation-error" role="alert">{{ error }}</p>
    </template>
    <div v-else class="share-done">
      <img :src="done.card" alt="分享用的限動圖卡" />
      <p><b>{{ done.result === 'shared' ? '已送出分享' : done.result === 'saved' ? '圖卡已下載，文字與連結已複製' : '分享已建立' }}</b><small>朋友打開這個連結就能存成行程：</small><a :href="done.url" target="_blank" rel="noopener">{{ done.url }}</a></p>
    </div>
    <template #footer>
      <template v-if="!done"><button class="creation-secondary" @click="open = false">取消</button><button class="creation-primary" :disabled="sharing" @click="share">{{ sharing ? '正在產生圖卡…' : '產生圖卡並分享' }}</button></template>
      <template v-else><button class="creation-secondary" @click="copyLink">複製連結</button><button class="creation-primary" @click="open = false">完成</button></template>
    </template>
  </CreationDialog>
</template>

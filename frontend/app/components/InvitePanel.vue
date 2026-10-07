<script setup lang="ts">
import { renderSVG } from 'uqr';
import type { GroupSummary } from '~/utils/group-api';
import { getMe, setNickname } from '~/utils/share-api';
import '~/assets/css/share.css';

// 真的邀請旅伴（有後端時取代「模擬一位朋友加入」）：拿到這趟的群組與邀請連結，
// 旁邊的人直接掃 QR，遠的人用系統分享選單傳 LINE。朋友加入後名單幾秒內自動更新（layouts/default.vue 輪詢）。
// 還沒取暱稱就先問：邀請頁上要寫「誰邀請你」
const { invite, notify } = useDemo();
const group = ref<GroupSummary | null>(null);
const needName = ref(false), nickname = ref(''), failed = ref(false), busy = ref(false);
const url = computed(() => group.value && import.meta.client ? new URL(group.value.url, window.location.origin).href : '');
// uqr 產生的 SVG 只有方塊路徑，沒有使用者輸入，可以直接插進頁面
const qr = computed(() => url.value ? renderSVG(url.value, { border: 1 }) : '');

async function create() {
    busy.value = true;
    failed.value = false;
    try { group.value = await invite(); } catch { failed.value = true; } finally { busy.value = false; }
}
onMounted(async () => {
    try { needName.value = !(await getMe()).nickname; } catch { needName.value = false; }
    if (!needName.value) await create();
});
async function saveName() {
    const name = nickname.value.trim();
    if (!name) return;
    busy.value = true;
    try { await setNickname(name); needName.value = false; await create(); } catch { failed.value = true; busy.value = false; }
}

async function send() {
    if (!group.value) return;
    const text = `${group.value.ownerNickname}邀你一起排「${group.value.tripTitle.replace(/。$/, '')}」，加入後可以一起看行程、組隊買 eSIM。`;
    if (navigator.share) {
        try { await navigator.share({ title: '一起去旅行', text, url: url.value }); return; } catch (error) { if ((error as DOMException).name === 'AbortError') return; }
    }
    try { await navigator.clipboard.writeText(`${text}\n${url.value}`); notify('已複製邀請連結'); } catch { notify('請長按連結自行複製'); }
}
</script>

<template>
  <div class="invite-panel" aria-live="polite">
    <template v-if="needName">
      <label for="invite-owner-name"><b>先取一個旅伴看得到的名字</b></label>
      <input id="invite-owner-name" v-model="nickname" class="share-input" maxlength="12" placeholder="例如：小安" autocomplete="nickname" @keyup.enter="saveName" />
      <button class="primary" :disabled="busy || !nickname.trim()" @click="saveName">產生邀請 QR</button>
    </template>
    <template v-else-if="group">
      <div class="invite-qr" role="img" :aria-label="'邀請連結 QR code：' + url" v-html="qr" />
      <p><b>請旅伴用手機掃描加入</b><small>{{ group.members.length }} 人已在這趟 · 最多 8 人 · 購買各自決定</small></p>
      <a :href="url" target="_blank" rel="noopener">{{ url }}</a>
      <button class="primary" @click="send">傳送邀請連結</button>
    </template>
    <p v-else-if="failed" class="muted">邀請連結沒有建立成功，請稍後再試。</p>
    <p v-else class="muted">正在建立邀請連結…</p>
  </div>
</template>

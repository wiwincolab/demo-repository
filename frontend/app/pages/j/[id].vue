<script setup lang="ts">
import type { GroupSummary } from '~/utils/group-api';
import { getMe, setNickname } from '~/utils/share-api';
import '~/assets/css/creation.css';
import '~/assets/css/share.css';

// 旅伴掃邀請 QR 進來的頁面：誰邀請、哪一趟、已經有誰 → 取暱稱 → 加入，之後在自己的手機上一起看行程、各自決定買不買。
// 伺服器端先取資料，LINE 貼邀請連結時預覽看得到是誰邀請
const route = useRoute();
const id = String(route.params.id);
const { selectTrip } = useTripContext();
const { notify } = useDemo();
const { join } = useGroup();
const { data: invite } = await useFetch<GroupSummary>(`/api/groups/${id}`);
const tripName = computed(() => invite.value?.tripTitle.replace(/。$/, '') || '');
const title = computed(() => invite.value ? `${invite.value.ownerNickname}邀你一起去「${tripName.value}」· 去趣 chicTrip` : '去趣 chicTrip');
useSeoMeta({ title, ogTitle: title, description: '加入後可以一起看行程、組隊買 eSIM，4 人成團每人現省 NT$20。', ogDescription: '加入後可以一起看行程、組隊買 eSIM，4 人成團每人現省 NT$20。' });

// 伺服器先產生的畫面在 JavaScript 載入完成（hydration）前按不動、輸入的字也會被蓋掉；
// 現場網路慢時差得出來，所以載入完成前先把按鈕與輸入框鎖住，評審看得出還在載入
const ready = ref(false);
onMounted(() => { ready.value = true; });
const nickname = ref(''), saved = ref(''), busy = ref(false), error = ref('');
const already = computed(() => !!invite.value?.members.some(member => member.me));
// 只在欄位還空著時帶入：網路慢時旅伴可能已經先打了名字，不能蓋掉
onMounted(async () => { try { saved.value = (await getMe()).nickname || ''; if (!nickname.value.trim()) nickname.value = saved.value; } catch { /* 讓旅伴自己填 */ } });

async function accept() {
    if (!invite.value || busy.value) return;
    error.value = '';
    const name = nickname.value.trim();
    if (!already.value && !name) { error.value = '取一個旅伴看得到的名字吧'; return; }
    busy.value = true;
    try {
        if (name && name !== saved.value) await setNickname(name);
        const group = await join(id);
        selectTrip(group.tripId);
        notify(already.value ? '打開這趟行程' : `已加入${invite.value.ownerNickname}的旅伴`);
        await navigateTo({ path: '/trip', query: { trip: group.tripId } });
    } catch (failure) {
        error.value = (failure as { data?: { statusMessage?: string } }).data?.statusMessage || '沒有加入成功，請再試一次';
        busy.value = false;
    }
}
</script>

<template>
  <section class="share-page" aria-labelledby="invite-title">
    <PageMascot />
    <template v-if="invite">
      <div>
        <span class="share-eyebrow">{{ invite.ownerNickname }}邀你一起旅行</span>
        <h1 id="invite-title">{{ tripName }}</h1>
        <p class="creation-muted">{{ invite.members.length }} 人已加入 · 一起看行程、組隊買 eSIM，4 人成團每人現省 NT$20</p>
      </div>
      <ol class="share-stop-list">
        <li v-for="(member, i) in invite.members" :key="member.nickname + i"><span class="share-avatar">{{ member.nickname[0] }}</span><span><b>{{ member.nickname }}{{ member.me ? '（你）' : '' }}</b><small>{{ member.owner ? '發起人' : '旅伴' }} · {{ member.paid ? '已購買 eSIM' : '尚未購買' }}</small></span></li>
      </ol>
      <div class="share-actions">
        <template v-if="!already">
          <label class="creation-label" for="invite-nickname">旅伴看到的名字</label>
          <input id="invite-nickname" v-model="nickname" :disabled="!ready" class="share-input" maxlength="12" placeholder="例如：阿哲" autocomplete="nickname" />
        </template>
        <p v-if="error" class="creation-error" role="alert">{{ error }}</p>
        <button class="creation-primary" :disabled="!ready || busy" @click="accept">{{ busy ? '正在加入…' : already ? '打開這趟行程' : '加入這趟旅行' }}</button>
        <p class="share-note">加入後可以看行程；要不要買 eSIM 是你自己的選擇（示範，不扣款）。</p>
      </div>
    </template>
    <div v-else class="share-hero">
      <p><b>這個邀請不存在或已經失效。</b><br />請朋友重新傳一次邀請連結。</p>
      <NuxtLink class="creation-primary" to="/trips">看看示範行程</NuxtLink>
    </div>
  </section>
</template>

<script setup lang="ts">
const open = defineModel<boolean>({ default: false });
const mode = ref<'invite' | 'deal'>('deal');
const props = defineProps<{
    initialMode?: 'invite' | 'deal';
}>();
const { members, group, buy, addMember } = useDemo();
watch(open, value => { if (value)
    mode.value = props.initialMode || 'deal'; });
const money = (n: number) => n.toLocaleString('zh-TW');
</script>
<template>
  <AppSheet v-model="open" :title="mode === 'invite' ? '旅伴一起排行程' : '旅伴組隊省'">
    <p><b>{{ members.length }} 人共編</b>，其中 <b>{{ group.count }} 人購買 eSIM</b></p>
    <template v-if="mode === 'deal'">
      <span class="mock">優惠與價格皆為 Mock</span>
      <div class="group-total">
        <p>{{ group.count >= 4 ? '旅伴價已解鎖' : '4 人各自購買，每人現省 NT$20' }}</p>
        <strong>{{ group.count ? 'NT$' + money(group.total) : '還沒有人購買' }}</strong>
        <small>{{ group.count ? group.count + ' 人實付合計 · 比一般價省 NT$' + group.saving : '以每人 NT$299 為例，4 人實付 NT$1,116，合省 NT$80。' }}</small>
      </div>
      <div class="unlock-row">
        <div v-for="reward in [{ n: 2, text: '＋500MB' }, { n: 3, text: '30 點回饋' }, { n: 4, text: '現省 NT$20' }]" :key="reward.n" :class="{ unlocked: group.count >= reward.n }">
          <b>{{ group.count >= reward.n ? '✓ ' : '' }}{{ reward.n }} 人購買</b>{{ reward.text }}<small class="reward-note">每位購買者</small>
        </div>
      </div>
      <p class="small-note">福利累加；點數不是現金。示範回饋限下次滿 NT$299 抵用、30 天有效；額外流量限本趟使用。共編人數與購買人數分開計算。</p>
    </template>
    <p v-else class="muted">朋友都能加入共編，購買 eSIM 是各自的選擇。</p>
    <div v-for="(member, i) in members" :key="member.name" class="member-row">
      <span class="avatar">{{ member.name[0] }}</span>
      <span>{{ member.name }}<small>{{ member.paid ? '一般價 NT$' + member.price : '可自由共編 · 尚未購買' }}</small></span>
      <button v-if="mode === 'deal'" :disabled="member.paid" @click="buy(i)">{{ member.paid ? '已購買' : '模擬購買' }}</button>
      <span v-else class="mock">已加入</span>
    </div>
    <button v-if="mode === 'invite'" class="primary" :disabled="members.length >= 8" @click="addMember">{{ members.length >= 8 ? '8 位示範旅伴皆已加入' : '模擬一位朋友加入' }}</button>
    <button v-else class="secondary" @click="mode = 'invite'">邀請更多旅伴共編</button>
    <p class="small-note">僅在本機模擬，不會傳送邀請或建立真實訂單。</p>
  </AppSheet>
</template>


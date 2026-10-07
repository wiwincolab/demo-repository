<script setup lang="ts">
const open = defineModel<boolean>({ default: false });
const { members, group, addMember } = useDemo();
// 有後端（GCP 版）：旅伴用真的邀請連結加入、各自在自己的手機上購買；Pages 版維持本機模擬
const { available: live } = useApi();
</script>
<template>
  <AppSheet v-model="open" title="旅伴一起排行程">
    <p><b>{{ members.length }} 人共編</b>，其中 <b>{{ group.count }} 人購買 eSIM</b></p>
    <p class="muted">朋友都能加入共編，購買 eSIM 是各自的選擇。</p>
    <div v-for="(member, i) in members" :key="member.name + i" class="member-row">
      <span class="avatar">{{ member.name[0] }}</span>
      <span>{{ member.name }}<small>{{ member.paid ? '一般價 NT$' + member.price : '可自由共編 · 尚未購買' }}</small></span>
      <span class="mock">已加入</span>
    </div>
    <InvitePanel v-if="live" />
    <button v-else class="primary" :disabled="members.length >= 8" @click="addMember">{{ members.length >= 8 ? '8 位示範旅伴皆已加入' : '模擬一位朋友加入' }}</button>
    <p class="small-note">{{ live ? '旅伴用自己的手機加入、各自決定要不要買；購買為示範，不扣款。' : '僅在本機模擬，不會傳送邀請或建立真實訂單。' }}</p>
  </AppSheet>
</template>

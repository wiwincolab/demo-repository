<script setup lang="ts">
defineProps<{ compact?: boolean }>();
const { selected } = useMascot();
const asset = useAsset();
</script>
<template>
  <NuxtLink to="/wardrobe" class="mascot-badge" :class="{ compact }" :aria-label="`吉祥物：${selected.name}，管理造型與記憶偏好`">
    <span class="mascot-avatar"><img :src="asset(selected.image)" alt="" /></span>
    <span v-if="!compact" class="mascot-label">吉祥物<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m6 4 4 4-4 4"/></svg></span>
  </NuxtLink>
</template>
<style scoped>
.mascot-badge{display:flex;align-items:center;gap:7px;color:#456673;text-decoration:none;min-height:44px;padding:3px 8px 3px 3px;border:1px solid #dce9eb;border-radius:28px;background:#f5fafb;flex-shrink:0}
.mascot-avatar{display:block;width:38px;height:38px;overflow:hidden;border-radius:50%;background:#ecf1f0}.mascot-avatar img{width:100%;height:100%;object-fit:cover;transform:scale(1.6);transform-origin:50% 60%}
.mascot-label{display:flex;align-items:center;gap:1px;font-size:12px;white-space:nowrap}.mascot-label svg{width:13px;height:13px}.mascot-badge:hover{border-color:#86c6d7}.mascot-badge:focus-visible{outline:3px solid #e7bb42;outline-offset:3px}.mascot-badge.compact{padding:3px}
@media(max-width:360px){.mascot-label{display:none}.mascot-badge{padding:3px}}
</style>

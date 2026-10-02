<script setup lang="ts">
const open = defineModel<boolean>({ default: false });
defineProps<{ title: string; wide?: boolean }>();
const dialog = ref<HTMLDialogElement>();
let opener: HTMLElement | null = null;
watch(open, async value => {
  await nextTick();
  if (value && !dialog.value?.open) {
    opener = document.activeElement as HTMLElement;
    dialog.value?.showModal();
  } else if (!value) {
    dialog.value?.close();
    opener?.focus();
  }
}, { immediate: true });
onBeforeUnmount(() => dialog.value?.close());
</script>
<template>
  <dialog ref="dialog" class="creation-dialog" :class="{ 'creation-dialog-wide': wide }" :aria-label="title" @cancel.prevent="open = false" @close="open = false">
    <header class="creation-dialog-header"><h2>{{ title }}</h2><button class="creation-icon-button" aria-label="關閉視窗" @click="open = false">×</button></header>
    <div class="creation-dialog-body"><slot /></div>
    <footer v-if="$slots.footer" class="creation-dialog-footer"><slot name="footer" /></footer>
  </dialog>
</template>

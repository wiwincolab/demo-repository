<script setup lang="ts">
const open = defineModel<boolean>({ default: false });
defineProps<{
    title: string;
}>();
const dialog = ref<HTMLDialogElement>();
let opener: HTMLElement | null = null;
function dismiss() { open.value = false; }
watch(open, async (value) => {
    await nextTick();
    if (!dialog.value)
        return;
    if (value && !dialog.value.open) {
        opener = document.activeElement as HTMLElement;
        dialog.value.showModal();
        dialog.value.querySelector<HTMLButtonElement>('button')?.focus();
    }
    else if (!value && dialog.value.open) {
        dialog.value.close();
        opener?.focus();
    }
}, { immediate: true });
function outside(event: MouseEvent) {
    if (event.target !== dialog.value)
        return;
    const box = dialog.value!.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom)
        dismiss();
}
onBeforeUnmount(() => dialog.value?.close());
</script>
<template>
  <dialog ref="dialog" class="sheet" :aria-label="title" @cancel.prevent="dismiss" @close="dismiss" @click="outside">
    <div class="sheet-handle" aria-hidden="true" />
    <div class="sheet-heading">
      <h2>{{ title }}</h2>
      <button class="icon-button" aria-label="關閉" @click="dismiss">×</button>
    </div>
    <slot />
  </dialog>
</template>


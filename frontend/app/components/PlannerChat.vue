<script setup lang="ts">
defineProps<{modelValue:string;busy?:boolean;submitLabel:string;submitDisabled:boolean;placeholder:string;messages:{role:'user'|'assistant';text:string}[]}>();
const emit=defineEmits<{ 'update:modelValue':[value:string]; submit:[]; suggestion:[value:string] }>();
const chat = ref<HTMLElement>();
const expanded = ref(false);
function collapseWhenLeaving(event: FocusEvent) {
  if (!chat.value?.contains(event.relatedTarget as Node | null)) expanded.value = false;
}
</script>
<template>
  <section ref="chat" class="planner-chat" aria-label="行程對話" @focusout="collapseWhenLeaving">
    <details v-if="expanded && messages.length" class="planner-conversation"><summary>與 AI 的對話 · {{ messages.length }} 則</summary><div role="log" aria-live="polite"><p v-for="(message,i) in messages.slice(-8)" :key="i" :class="message.role"><small>{{ message.role==='user'?'你':'AI · 示範' }}</small>{{ message.text }}</p></div></details>
    <div v-if="expanded" class="planner-chat-suggestions" aria-label="快速調整行程"><button v-for="text in ['晚一點出發','下雨，改室內','步調悠閒，少一站']" :key="text" :disabled="busy" @click="emit('suggestion',text)">{{ text }}</button></div>
    <form @submit.prevent="emit('submit')"><label for="ai-trip-message" class="chat-input-label">補充需求或微調行程</label><input id="ai-trip-message" :value="modelValue" maxlength="300" :placeholder="placeholder" autocomplete="off" @focus="expanded=true" @input="emit('update:modelValue',($event.target as HTMLInputElement).value)"><button type="submit" :disabled="busy || submitDisabled" :aria-label="submitLabel" :title="submitLabel">{{ busy?'…':'↑' }}</button></form>
  </section>
</template>
<style scoped>
.planner-chat{position:fixed;bottom:calc(92px + env(safe-area-inset-bottom,0px));left:50%;transform:translateX(-50%);width:min(456px,calc(100% - 24px));z-index:25;padding:10px;background:#fff;border:1px solid #dcebef;border-radius:20px;box-shadow:0 5px 28px #244c6326;box-sizing:border-box;color:#315869}.planner-chat form{display:flex;align-items:center;gap:8px;background:#f2f8fa;border:1px solid #d6e7ee;border-radius:14px;padding:5px 6px 5px 12px}.planner-chat input{flex:1;min-width:0;border:0;background:transparent;font:inherit;font-size:16px;min-height:44px;margin:0;padding:0;outline:none}.planner-chat form button{width:44px;height:44px;min-height:44px;border:0;border-radius:50%;background:#008bad;color:white;font-size:23px;cursor:pointer}.planner-chat button:disabled{opacity:.45}.planner-chat-suggestions{display:flex;gap:6px;overflow:auto;margin-bottom:8px}.planner-chat-suggestions button{flex:none;padding:7px 10px;min-height:44px;border-radius:20px;border:1px solid #dcebef;background:#fff;color:#527a8a;font-size:11px;cursor:pointer}.planner-conversation summary{font-size:11px;min-height:44px;display:flex;align-items:center;cursor:pointer}.planner-conversation [role=log]{max-height:150px;overflow:auto;overscroll-behavior:contain}.planner-conversation p{font-size:12px;line-height:1.7;background:#f2f8fa;border-radius:12px;padding:9px;margin:7px 0}.planner-conversation p.user{margin-left:20px;background:#e3f5fa}.planner-conversation small{display:block;font-size:10px;color:#7a97a4}.planner-chat button:focus-visible,.planner-chat input:focus-visible{outline:2px solid #009fc5;outline-offset:2px}
</style>

<style scoped>
.chat-input-label{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
</style>

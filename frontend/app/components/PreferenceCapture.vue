<script setup lang="ts">
import { automaticallyCategorizePreferences, interpretPreferenceText, personalPreferenceLimit, preferenceInputLimit, validPreferenceSuggestions, type PersonalPreference, type PreferenceSuggestion } from '~/utils/preference-memory';

const props = defineProps<{ preferences: PersonalPreference[] }>();
const emit = defineEmits<{ add: [items: PreferenceSuggestion[]]; remove: [id: string] }>();
const input = ref('');
const inputElement = ref<HTMLTextAreaElement>();
const busy = ref(false);
const mode = ref<'ai' | 'local'>('local');
const status = ref('');
const batchIds = ref<string[]>([]);
let request: AbortController | undefined;
async function resizeInput() {
  await nextTick();
  if (!inputElement.value) return;
  inputElement.value.style.height = '24px';
  inputElement.value.style.height = Math.min(88, inputElement.value.scrollHeight) + 'px';
}
watch(input, resizeInput);
async function submit() {
  const text = input.value.trim();
  if (busy.value || !text) return;
  busy.value = true; status.value = ''; batchIds.value = [];
  const previousIds = new Set(props.preferences.map(preference => preference.id));
  const controller = new AbortController(); request = controller;
  try {
    let suggestions: PreferenceSuggestion[];
    mode.value = 'local';
    try {
      const response = await $fetch<{ preferences: unknown; mode: unknown }>('/api/preferences/classify', {
        method: 'POST', body: { text }, retry: 0, timeout: 14_000, signal: controller.signal,
      });
      const accepted = validPreferenceSuggestions(response.preferences, text);
      if (!accepted || !['ai', 'local'].includes(String(response.mode))) throw new Error('Invalid classification');
      suggestions = accepted;
      mode.value = response.mode === 'ai' ? 'ai' : 'local';
    } catch {
      if (controller.signal.aborted) return;
      suggestions = interpretPreferenceText(text);
    }
    if (controller.signal.aborted) return;
    const memories = automaticallyCategorizePreferences(suggestions);
    emit('add', memories);
    await nextTick();
    batchIds.value = props.preferences.filter(preference => !previousIds.has(preference.id)).map(preference => preference.id);
    const added = batchIds.value.length;
    status.value = !memories.length ? '告訴我「我喜歡…」或「我不喜歡…」，就能幫你記住。'
      : added ? `記住了 ${added} 個喜好，已加入 map。`
      : props.preferences.length >= personalPreferenceLimit ? `已記住 ${personalPreferenceLimit} 個喜好，可以先刪除一些。`
      : '這些喜好已經記住了。';
    if (memories.length && (added || props.preferences.length < personalPreferenceLimit)) input.value = '';
  } finally {
    if (request === controller) { busy.value = false; request = undefined; }
  }
}
function enter(event: KeyboardEvent) {
  if (event.key !== 'Enter' || event.shiftKey || event.isComposing || event.keyCode === 229) return;
  event.preventDefault(); void submit();
}
function undo() {
  batchIds.value.forEach(id => emit('remove', id));
  batchIds.value = []; status.value = '已復原這次加入。';
}
onBeforeUnmount(() => request?.abort());
</script>

<template>
  <div class="preference-capture" @pointerdown.stop @wheel.stop @keydown.stop>
    <div v-if="busy || status" class="capture-reply" :aria-busy="busy">
      <p id="capture-result-status" role="status" aria-live="polite">{{ busy ? '正在幫你整理喜好…' : status }}</p>
      <span v-if="!busy && status" class="capture-mode">{{ mode === 'ai' ? 'AI 整理' : '關鍵字整理' }}</span>
      <button v-if="batchIds.length && !busy" type="button" class="capture-undo" aria-label="復原這次加入" @click="undo">復原</button>
    </div>
    <form class="capture-capsule" aria-label="跟我說，你喜歡什麼？" @submit.prevent="submit">
      <span class="capsule-sparkle" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m12 2 2.8 7.2L22 12l-7.2 2.8L12 22l-2.8-7.2L2 12l7.2-2.8Z"/></svg></span>
      <label class="sr-only" for="personal-preference-input">告訴 AI 你的個人喜好</label>
      <textarea id="personal-preference-input" ref="inputElement" v-model="input" rows="1" :maxlength="preferenceInputLimit" :disabled="busy" placeholder="跟我說，你喜歡什麼？" :aria-describedby="status || busy ? 'capture-result-status' : undefined" @keydown="enter" />
      <button class="capsule-send" type="submit" :disabled="busy || !input.trim()" :aria-label="busy ? '正在整理你的喜好' : '送出喜好'" :title="busy ? '正在整理' : '直接加入記憶 map'">
        <span v-if="busy" class="capture-spinner" aria-hidden="true"/><svg v-else viewBox="0 0 24 24" aria-hidden="true"><path d="M12 18V6m-5 5 5-5 5 5"/></svg>
      </button>
    </form>
  </div>
</template>

<style scoped>
.preference-capture{position:absolute;z-index:3;bottom:16px;left:20px;right:20px;max-width:560px;margin-inline:auto;color:#315c70;user-select:text;-webkit-user-select:text}.capture-capsule{display:flex;align-items:center;gap:11px;padding:8px 9px 8px 17px;border:1px solid #b9dfe9;border-radius:32px;background:#ffffffed;box-shadow:0 5px 22px #245d7515;backdrop-filter:blur(12px)}.capture-capsule:focus-within{border-color:#009fcc;box-shadow:0 0 0 3px #009fcc14,0 5px 22px #245d7515}.capsule-sparkle{display:grid;place-items:center;flex:none;color:#e8b823}.capsule-sparkle svg{width:22px;height:22px;fill:currentColor}.capture-capsule textarea{width:100%;min-width:0;flex:1;display:block;resize:none;height:24px;max-height:88px;padding:0;border:0;background:transparent;outline:none;font:inherit;font-size:14px;line-height:24px;color:#315c70;overflow-y:auto;touch-action:auto}.capture-capsule textarea::placeholder{color:#7e9aaa}.capture-capsule textarea:disabled{opacity:.65}.capsule-send{display:grid;place-items:center;flex:none;width:40px;height:40px;border:0;border-radius:50%;background:#009fcc;color:white;cursor:pointer}.capsule-send:disabled{background:#e8f3f7;color:#99b6c1;cursor:default}.capsule-send svg{width:21px;height:21px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}.capsule-send:focus-visible,.capture-undo:focus-visible{outline:3px solid #ffc500;outline-offset:3px}.capture-reply{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:9px 14px;margin:0 auto 8px;max-width:max-content;border-radius:16px;background:#f1fafdeF;box-shadow:0 3px 12px #315c7008;font-size:11px}.capture-reply p{font-size:11px;line-height:1.7;margin:0;color:#36778e}.capture-mode{font-size:9px;color:#91a4ad}.capture-undo{border:0;background:transparent;color:#5e8596;font:inherit;font-size:10px;padding:4px;cursor:pointer;text-decoration:underline;text-underline-offset:3px}.capture-spinner{height:15px;width:15px;border:2px solid currentColor;border-right-color:transparent;border-radius:50%;animation:capture-spin .7s linear infinite}.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}@keyframes capture-spin{to{transform:rotate(360deg)}}@media(max-width:600px){.preference-capture{bottom:14px;left:12px;right:12px}.capture-capsule{gap:8px;padding-left:12px}.capture-capsule textarea{font-size:16px}.capsule-sparkle svg{width:18px;height:18px}.capsule-send{width:38px;height:38px}.capture-reply{font-size:10px;padding:8px 11px}.capture-reply p{font-size:10px}}@media(prefers-reduced-motion:reduce){.capture-spinner{animation:none}}
</style>

<script setup lang="ts">
import ChictripMotion from '~/components/ChictripMotion.vue';
import { advisorMemoryKey, readAdvisorMemory, journeyQuestions, interpretAdvisorAnswer, recommendUsage, type AdvisorAnswer, type AnswerLevel, type AdvisorMemory } from '~/utils/esim-advisor';
import { plannerKeywords, plannerPreferenceStorageKey, validPlannerKeywords } from '~/data/planner-preferences';
import { esimPlan } from '~/utils/esim';
import '~/assets/css/esim-quiz.css';
import type { Usage } from '~/types/trip';
const props = defineProps<{ days: number }>();
const emit = defineEmits<{ apply: [usage: Usage] }>();
const step = ref(0), answers = ref<AdvisorAnswer[]>([]), draft = ref(''), error = ref('');
const phase = ref<'questions' | 'thinking' | 'result'>('questions');
const heading = ref<HTMLElement>();
const memory = ref<AdvisorMemory | null>(null), preferences = ref<string[]>([]);
const useMemory = ref(true), remember = ref(false), storageNote = ref('');
const customAnswer = ref(false);
const hasMemory = computed(() => !!memory.value || preferences.value.length > 0);
const preferenceLabels = computed(() => plannerKeywords.filter(k => preferences.value.includes(k.id)).map(k => k.title));
const questions = computed(() => journeyQuestions(useMemory.value ? preferences.value : [], useMemory.value ? memory.value : null));
const question = computed(() => questions.value[step.value]!);
const shortOptions = [['Wi-Fi 再傳','即時發照片','開直播'],['離線影音','影音 ≤ 30 分／天','影音 ≥ 1 小時／天'],['自己用','偶爾分享','筆電、多裝置']];
const optionIcons = [['route','photo','signal'],['route','photo','signal'],['sim','people','signal']];
const companionLine = computed(() => {
  if (useMemory.value && step.value === 0 && preferenceLabels.value.length) return '旅行偏好：'+preferenceLabels.value.slice(0,2).join('、');
  if (useMemory.value && memory.value && step.value > 0) return '上次：'+shortOptions[step.value]![memory.value.answers[step.value]!.level];
  return ['你會怎麼分享？','平常看多久？','需要分享網路嗎？'][step.value];
});
onMounted(() => {
  try {
    memory.value = readAdvisorMemory(JSON.parse(localStorage.getItem(advisorMemoryKey) || 'null'));
  } catch { /* Ignore malformed answer memory independently of travel preferences. */ }
  try {
    const saved = JSON.parse(localStorage.getItem(plannerPreferenceStorageKey) || 'null');
    if (saved?.enabled !== false) preferences.value = validPlannerKeywords(saved?.ids);
  } catch { /* No saved context: ask the general questions. */ }
});
function toggleMemory() {
  useMemory.value = !useMemory.value;
  answers.value = []; step.value = 0; draft.value = ''; error.value = ''; customAnswer.value = false;
}
function apply() {
  if (phase.value !== 'result' || !plan.value.available) return;
  storageNote.value = '';
  if (remember.value) {
    try { localStorage.setItem(advisorMemoryKey, JSON.stringify({answers:answers.value,savedAt:new Date().toISOString()})); }
    catch { storageNote.value = '瀏覽器無法儲存記憶；可取消勾選後繼續採用方案。'; return; }
  }
  emit('apply',result.value);
}

const answer = computed(() => answers.value[step.value]);
const result = computed(() => answers.value.length === 3 ? recommendUsage(answers.value) : 'normal');
const plan = computed(() => esimPlan(result.value, props.days));
// 有後端時，推薦理由改由 Gemini 依你的回答與這趟景點寫（server/api/esim/recommend.post.ts）；方案與價格仍照規則
const { available: live } = useApi();
const { activeId } = useTripContext();
const aiReason = ref(''), writing = ref(false);
let reasonController: AbortController | undefined;
async function personalReason() {
  reasonController?.abort();
  const controller = new AbortController();
  reasonController = controller;
  aiReason.value = '';
  if (!live.value || !activeId.value) return;
  writing.value = true;
  try {
    const response = await $fetch<{ reason: string; ai: boolean }>('/api/esim/recommend', { method: 'POST', signal: controller.signal, body: { tripId: activeId.value, answers: answers.value } });
    if (response.ai && !controller.signal.aborted) aiReason.value = response.reason;
  } catch { /* 用方案原本的說明 */ } finally { if (reasonController === controller) writing.value = false; }
}
watch(phase, value => {
  if (value === 'result') void personalReason();
  else { reasonController?.abort(); aiReason.value = ''; writing.value = false; }
});
let timer: ReturnType<typeof setTimeout> | undefined;
onBeforeUnmount(() => { clearTimeout(timer); reasonController?.abort(); });
async function focusQuestion() {
  await nextTick();
  heading.value?.focus({preventScroll:true});
  const sheet = heading.value?.closest('dialog');
  if(sheet) sheet.scrollTop = 0;
}
function choose(level: AnswerLevel) {
  answers.value[step.value] = {level, text: question.value.options[level]!, source: 'preset'};
  draft.value = ''; error.value = ''; customAnswer.value = false;
}
function submitText() {
  const level = interpretAdvisorAnswer(step.value, draft.value);
  if(level === null) { error.value = '可以再說明使用方式或時間，也可以點選上方最接近的答案。'; return; }
  answers.value[step.value] = {level,text:draft.value.trim(),source:'text'};
  error.value = '';
}
function back() {
  if(phase.value === 'result') { phase.value = 'questions'; step.value = 2; }
  else step.value = Math.max(0,step.value - 1);
  draft.value = answer.value?.source === 'text' ? answer.value.text : '';
  customAnswer.value = answer.value?.source === 'text';
  error.value = ''; focusQuestion();
}
function next() {
  if(!answer.value) return;
  if(step.value < 2) { step.value++; customAnswer.value = answer.value?.source === 'text'; draft.value = answer.value?.source === 'text' ? answer.value.text : ''; focusQuestion(); }
  else { phase.value = 'thinking'; timer = setTimeout(() => { phase.value = 'result'; focusQuestion(); },750); }
}
</script>

<template>
  <div class="esim-advisor quiz-advisor">
    <div class="quiz-topline"><span class="quiz-brand">上網小測驗</span><span class="quiz-count">{{ phase==='questions' ? step+1 : 3 }} / 3</span></div>
    <div class="quiz-progress" role="progressbar" aria-label="已完成題數" :aria-valuenow="phase==='questions'?step:3" :aria-valuemin="0" :aria-valuemax="3"><span :style="{width: (phase==='questions' ? step/3 : 1)*100+'%'}"/></div>
    <template v-if="phase==='questions'">
      <div class="quiz-body">
        <div class="quiz-chapter">{{ question.chapter }}<span>{{ days }} 天旅行</span></div>
        <h3 ref="heading" tabindex="-1" class="quiz-title">{{ question.title }}</h3>
        <div class="quiz-companion"><ChictripMotion :key="step" class="quiz-mascot" :motion="answer ? 'idle' : 'think'"/><div class="quiz-bubble">{{ companionLine }}</div></div>
        <div :key="step" class="quiz-options" aria-label="選擇你的使用習慣">
          <button v-for="(option,i) in question.options" :key="option" :aria-pressed="answer?.source==='preset' && answer.level===i" @click="choose(i as AnswerLevel)">
            <span class="quiz-option-number">{{ i+1 }}</span><span class="quiz-option-art" :class="'art-'+i" aria-hidden="true"><span class="quiz-art-orbit"/><EsimIcon :name="optionIcons[step]![i]!" :size="52"/><i>✦</i></span>
            <span class="quiz-option-copy"><strong>{{ shortOptions[step]![i] }}</strong></span><span class="quiz-selected" aria-hidden="true">✓</span>
          </button>
        </div>
        <div class="quiz-extras"><button v-if="hasMemory" @click="toggleMemory">{{ useMemory?'不帶入記憶':'帶入記憶' }}</button><button :aria-expanded="customAnswer" @click="customAnswer=!customAnswer">{{ customAnswer?'收起輸入':'我想自己說' }}</button></div>
        <div v-if="customAnswer" class="quiz-custom"><label class="advisor-text-label" for="advisor-text">用自己的話說</label><div class="advisor-textbox"><textarea id="advisor-text" v-model="draft" rows="2" maxlength="280" :placeholder="question.placeholder" :aria-invalid="!!error" @input="error=''"/><button :disabled="!draft.trim()" @click="submitText" aria-label="使用這段描述"><EsimIcon name="arrow" :size="18"/></button></div><p v-if="error" role="alert">{{ error }}</p><p v-else-if="answer?.source==='text'" class="quiz-text-confirmation" role="status">已記下：{{ answer.text }}</p></div>
      </div>
      <div class="quiz-footer" :class="{'has-answer':!!answer}"><div class="quiz-feedback" aria-live="polite"><span v-if="answer" class="quiz-feedback-check">✓</span><span><strong>{{ answer?'已選擇':'選一項' }}</strong></span></div><div class="quiz-footer-actions"><button class="quiz-back" :disabled="step===0" @click="back">上一步</button><button class="quiz-continue" :disabled="!answer || !!draft.trim() && (answer.source!=='text' || draft.trim()!==answer.text)" @click="next">{{ step===2?'看推薦':'繼續' }}<EsimIcon name="arrow" :size="20"/></button></div></div>
    </template>
    <div v-else-if="phase==='thinking'" class="advisor-thinking" role="status"><ChictripMotion motion="think" :size="112"/><h3>整理你的上網習慣</h3></div>
    <template v-else>
      <section class="advisor-result"><ChictripMotion motion="happy" :size="96"/>
        <div class="advisor-result-heading"><span>{{ days }} 天推薦</span><h3 ref="heading" tabindex="-1">{{ plan.label }}上網</h3></div>
        <div class="advisor-tiers"><span v-for="tier in [{id:'light',name:'輕度'},{id:'normal',name:'中度'},{id:'heavy',name:'重度'}]" :key="tier.id" :class="{active:result===tier.id}"><EsimIcon v-if="result===tier.id" name="check" :size="14"/>{{ tier.name }}</span></div>
        <p class="advisor-reason" aria-live="polite">{{ aiReason || plan.reason }}<small v-if="aiReason" class="advisor-ai-note"> ✦ AI 建議</small><small v-else-if="writing" class="advisor-ai-note"> ✦ 整理中…</small></p>
        <div class="advisor-recommendation"><span><small>Docomo · {{ plan.days }} 天</small><strong>{{ plan.name }}</strong></span><b><small>NT$</small>{{ plan.price }}</b></div>
        <p class="advisor-result-detail">{{ plan.desc }}。<template v-if="days!==plan.days">此行程 {{ days }} 天，搭配已查證的 {{ plan.days }} 天方案。</template></p>
        <details class="advisor-recap"><summary>回答摘要 · 預估 {{ plan.range }}GB</summary><ol><li v-for="(a,i) in answers" :key="i">{{ a.text }}</li></ol><p>此為使用情境估算，並非即時用量預測；每日額度無法跨日累積。</p></details>
      </section>
      <label class="advisor-remember"><input v-model="remember" type="checkbox"/><span>記住回答<small>僅存此瀏覽器，下次可修改。</small></span></label><p v-if="storageNote" role="alert">{{ storageNote }}</p>
      <button class="esim-cta esim-full" :disabled="!plan.available" @click="apply">選這個<EsimIcon name="check" :size="18"/></button><button class="esim-text-button" @click="back">修改回答</button>
    </template>
  </div>
</template>

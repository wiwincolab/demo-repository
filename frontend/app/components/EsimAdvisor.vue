<script setup lang="ts">
import { advisorQuestions, interpretAdvisorAnswer, recommendUsage, type AdvisorAnswer, type AnswerLevel } from '~/utils/esim-advisor';
import { esimPlan } from '~/utils/esim';
import type { Usage } from '~/types/trip';
const props = defineProps<{ days: number }>();
const emit = defineEmits<{ apply: [usage: Usage] }>();
const step = ref(0), answers = ref<AdvisorAnswer[]>([]), draft = ref(''), error = ref('');
const phase = ref<'questions' | 'thinking' | 'result'>('questions');
const heading = ref<HTMLElement>();
const question = computed(() => advisorQuestions[step.value]!);
const answer = computed(() => answers.value[step.value]);
const result = computed(() => answers.value.length === 3 ? recommendUsage(answers.value) : 'normal');
const plan = computed(() => esimPlan(result.value, props.days));
// 有後端時，推薦理由改由 Gemini 依你的回答與這趟景點寫（server/api/esim/recommend.post.ts）；方案與價格仍照規則
const { available: live } = useApi();
const { activeId } = useTripContext();
const aiReason = ref(''), writing = ref(false);
async function personalReason() {
  aiReason.value = '';
  if (!live.value || !activeId.value) return;
  writing.value = true;
  try {
    const response = await $fetch<{ reason: string; ai: boolean }>('/api/esim/recommend', { method: 'POST', body: { tripId: activeId.value, answers: answers.value } });
    if (response.ai) aiReason.value = response.reason;
  } catch { /* 用方案原本的說明 */ } finally { writing.value = false; }
}
watch(phase, value => { if (value === 'result') void personalReason(); });
let timer: ReturnType<typeof setTimeout> | undefined;
onBeforeUnmount(() => clearTimeout(timer));
async function focusQuestion() {
  await nextTick();
  heading.value?.focus({preventScroll:true});
  const sheet = heading.value?.closest('dialog');
  if(sheet) sheet.scrollTop = 0;
}
function choose(level: AnswerLevel) {
  answers.value[step.value] = {level, text: question.value.options[level]!, source: 'preset'};
  draft.value = ''; error.value = '';
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
  error.value = ''; focusQuestion();
}
function next() {
  if(!answer.value) return;
  if(step.value < 2) { step.value++; draft.value = answer.value?.source === 'text' ? answer.value.text : ''; focusQuestion(); }
  else { phase.value = 'thinking'; timer = setTimeout(() => { phase.value = 'result'; focusQuestion(); },750); }
}
</script>

<template>
  <div class="esim-advisor">
    <div class="advisor-kicker"><span><EsimIcon name="signal" :size="16"/> AI 流量顧問</span><small>情境示範</small></div>
    <template v-if="phase==='questions'">
      <div class="advisor-progress" aria-label="問答進度"><span v-for="n in 3" :key="n" :class="{done:n<=step+1}"/></div>
      <Transition name="advisor-question" mode="out-in" @after-enter="focusQuestion">
        <section :key="step" class="advisor-question">
          <span class="advisor-step">0{{ step+1 }} <i>/ 03</i></span>
          <h3 ref="heading" tabindex="-1">{{ question.title }}</h3>
          <p>{{ question.hint }}</p>
          <div class="advisor-answers" aria-label="選擇你的使用習慣">
            <button v-for="(option,i) in question.options" :key="option" :aria-pressed="answer?.source==='preset' && answer.level===i" @click="choose(i as AnswerLevel)"><span class="advisor-answer-icon"><EsimIcon :name="['route','photo','signal'][i]!" :size="20"/></span><span>{{ option }}</span><span class="advisor-radio"><EsimIcon v-if="answer?.source==='preset' && answer.level===i" name="check" :size="13"/></span></button>
          </div>
          <label class="advisor-text-label" for="advisor-text">或用自己的話說</label>
          <div class="advisor-textbox"><textarea id="advisor-text" v-model="draft" rows="2" maxlength="280" :placeholder="question.placeholder" :aria-invalid="!!error" :aria-describedby="error?'advisor-error':undefined" @input="error=''"/><button :disabled="!draft.trim()" @click="submitText" aria-label="使用這段描述"><EsimIcon name="arrow" :size="18"/></button></div>
          <p v-if="error" id="advisor-error" class="advisor-error" role="alert">{{ error }}</p>
          <p v-else-if="answer?.source==='text'" class="advisor-ack" aria-live="polite"><EsimIcon name="check" :size="14"/> 已記下：{{ answer.text }}</p>
        </section>
      </Transition>
      <div class="advisor-actions"><button class="advisor-back" :disabled="step===0" @click="back">上一步</button><button class="esim-cta" :disabled="!answer || !!draft.trim() && (answer.source!=='text' || draft.trim()!==answer.text)" @click="next">{{ step===2?'看看我的建議':'下一題' }}<EsimIcon name="arrow" :size="16"/></button></div>
    </template>
    <div v-else-if="phase==='thinking'" class="advisor-thinking" role="status"><div class="advisor-orbit"><EsimIcon name="sim" :size="36"/></div><h3>整理你的上網習慣</h3><p>搭配這趟 {{ days }} 天的行程，找出合適的流量。</p></div>
    <template v-else>
      <section class="advisor-result">
        <div class="advisor-result-heading"><span>適合你的使用方式</span><h3 ref="heading" tabindex="-1">{{ plan.label }}上網<span>剛好，留一點餘裕。</span></h3></div>
        <div class="advisor-tiers"><span v-for="tier in [{id:'light',name:'輕度'},{id:'normal',name:'中度'},{id:'heavy',name:'重度'}]" :key="tier.id" :class="{active:result===tier.id}"><EsimIcon v-if="result===tier.id" name="check" :size="14"/>{{ tier.name }}</span></div>
        <p class="advisor-reason" aria-live="polite">{{ aiReason || plan.reason }}<small v-if="aiReason" class="advisor-ai-note"> ✦ AI 依你的回答與這趟景點寫的</small><small v-else-if="writing" class="advisor-ai-note"> ✦ AI 正在看你的回答…</small></p>
        <div class="advisor-recommendation"><span><small>Docomo · {{ plan.days }} 天</small><strong>{{ plan.name }}</strong></span><b><small>NT$</small>{{ plan.price }}</b></div>
        <p class="advisor-result-detail">{{ plan.desc }}。<template v-if="days!==plan.days">此行程 {{ days }} 天，搭配已查證的 {{ plan.days }} 天方案。</template></p>
        <details class="advisor-recap"><summary>根據你的 3 個回答 · 預估 {{ plan.range }}GB</summary><ol><li v-for="(a,i) in answers" :key="i">{{ a.text }}</li></ol><p>此為使用情境估算，並非即時用量預測；每日額度無法跨日累積。</p></details>
      </section>
      <button class="esim-cta esim-full" @click="emit('apply',result)">採用這個建議<EsimIcon name="check" :size="18"/></button><button class="esim-text-button" @click="back">返回修改回答</button>
    </template>
  </div>
</template>

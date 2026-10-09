<script setup lang="ts">
withDefaults(defineProps<{ motion?: 'idle' | 'think' | 'happy' | 'go'; size?: number }>(), { motion: 'idle', size: 88 });
const host = ref<HTMLElement>();
const visible = ref(true);
let observer: IntersectionObserver | undefined;
onMounted(() => {
  observer = new IntersectionObserver(entries => { visible.value = entries.some(e => e.isIntersecting); });
  if (host.value) observer.observe(host.value);
});
onBeforeUnmount(() => observer?.disconnect());
</script>
<template>
  <span ref="host" class="chictrip-motion" :class="['motion-'+motion, { 'motion-paused': !visible }]" :style="{ width: size+'px', height: size+'px' }" aria-hidden="true">
    <svg :key="motion" viewBox="30 0 447 470" fill="none" focusable="false">
      <ellipse class="motion-shadow" cx="230" cy="435" rx="105" ry="13" fill="currentColor" opacity=".10"/>
      <g class="motion-body">
        <path fill="#00AFD1" d="M96 80C96 38 145 36 160 65L172 367C171 414 96 416 96 369Z"/>
        <path fill="#FFBF00" d="M145 80C145 51 174 34 199 55L401 198C422 213 422 237 401 254L199 394C174 415 145 396 145 368Z"/>
        <g class="motion-eyes">
          <ellipse cx="118" cy="161" rx="41" ry="50" fill="white"/><ellipse cx="205" cy="161" rx="41" ry="50" fill="white"/>
          <g class="motion-pupils" fill="#231916"><circle cx="130" cy="150" r="11"/><circle cx="217" cy="150" r="11"/></g>
          <path class="motion-smile" d="M118 154Q130 133 142 154M205 154Q217 133 229 154" stroke="#231916" stroke-width="8" stroke-linecap="round"/>
        </g>
      </g>
      <g v-if="motion==='think'" class="motion-dots" fill="currentColor"><circle cx="285" cy="65" r="7"/><circle cx="315" cy="65" r="7"/><circle cx="345" cy="65" r="7"/></g>
      <g v-if="motion==='go'" class="motion-lines" stroke="currentColor" opacity=".25" stroke-width="5" stroke-linecap="round"><path d="M50 255H85M35 285H75M50 315H85"/></g>
    </svg>
  </span>
</template>
<style scoped>
.chictrip-motion{display:inline-block;flex-shrink:0;vertical-align:middle;color:#537784;max-width:100%}.chictrip-motion svg{display:block;width:100%;height:100%;overflow:visible}.motion-body{transform-origin:223px 403px}.motion-eyes{transform-origin:160px 161px;animation:chic-blink 5.6s infinite}.motion-smile{opacity:0}.motion-idle .motion-body{animation:chic-breathe 4s ease-in-out infinite}.motion-think .motion-body{animation:chic-think 2.8s ease-in-out infinite}.motion-think .motion-pupils{animation:chic-look 2.8s ease-in-out infinite}.motion-dots circle{animation:chic-dot 1.2s ease-in-out infinite}.motion-dots circle:nth-child(2){animation-delay:.2s}.motion-dots circle:nth-child(3){animation-delay:.4s}.motion-happy .motion-body{animation:chic-jump .9s ease-in-out 2}.motion-happy .motion-smile{animation:chic-smile 1.8s}.motion-happy .motion-pupils{animation:chic-hide 1.8s}.motion-go .motion-body{animation:chic-go 1.8s ease-in-out}.motion-lines{animation:chic-trails 1.8s both}.motion-paused *{animation-play-state:paused!important}
@keyframes chic-breathe{50%{transform:scale(.99,1.02)}}
@keyframes chic-blink{0%,92%,100%{transform:scaleY(1)}96%{transform:scaleY(.08)}}
@keyframes chic-think{0%,100%{transform:rotate(-5deg)}50%{transform:rotate(-2deg) translateY(-4px)}}
@keyframes chic-look{0%,100%{transform:translate(-5px,-6px)}50%{transform:translate(6px,-9px)}}
@keyframes chic-dot{0%,100%{opacity:.2}50%{opacity:.9}}
@keyframes chic-jump{0%,100%{transform:none}18%{transform:scale(1.08,.91)}50%{transform:translateY(-65px) rotate(-4deg) scale(.97,1.03)}80%{transform:scale(1.07,.93)}}
@keyframes chic-smile{0%,95%{opacity:1}100%{opacity:0}}
@keyframes chic-hide{0%,95%{opacity:0}100%{opacity:1}}
@keyframes chic-go{0%,100%{transform:none}20%{transform:translateX(-14px) scale(.94,1.04) rotate(-4deg)}55%{transform:translateX(33px) rotate(7deg) scale(1.05,.97)}}
@keyframes chic-trails{0%,100%{opacity:0}35%,65%{opacity:.3}}
@media(prefers-reduced-motion:reduce){.chictrip-motion *{animation:none!important}.motion-lines{display:none}}
</style>

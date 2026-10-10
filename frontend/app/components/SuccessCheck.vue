<template>
  <div class="success-check" aria-hidden="true">
    <span class="success-check-halo" />
    <span class="success-check-spark success-check-spark-left" />
    <span class="success-check-spark success-check-spark-right" />
    <span class="success-check-dot" />
    <span class="success-check-disc"><EsimIcon name="check" :size="44" /></span>
    <span class="success-check-shadow" />
  </div>
</template>

<style scoped>
.success-check {
  position: relative;
  width: 132px;
  height: 116px;
  margin: 0 auto 22px;
}
.success-check-disc {
  position: absolute;
  top: 8px;
  left: 24px;
  display: grid;
  place-items: center;
  width: 84px;
  height: 84px;
  border-radius: 50%;
  background: var(--blue);
  color: white;
  transform-origin: 50% 85%;
  animation: success-check-bounce 780ms both;
}
.success-check-disc :deep(svg) { stroke-width: 2.4; }
.success-check-disc :deep(path) {
  stroke-dasharray: 26;
  animation: success-check-draw 380ms 250ms ease-out both;
}
.success-check-halo {
  position: absolute;
  top: 8px;
  left: 24px;
  width: 84px;
  height: 84px;
  border-radius: 50%;
  background: var(--tint);
  opacity: 0;
  animation: success-check-ripple 800ms 120ms ease-out both;
}
.success-check-shadow {
  position: absolute;
  bottom: 8px;
  left: 42px;
  width: 48px;
  height: 7px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--blue) 14%, transparent);
  animation: success-check-shadow 780ms both;
}
.success-check-spark {
  position: absolute;
  width: 17px;
  height: 17px;
  opacity: 0;
  animation: success-check-sparkle 650ms 330ms ease-out both;
}
.success-check-spark::before, .success-check-spark::after {
  content: '';
  position: absolute;
  background: var(--yellow);
  border-radius: 3px;
}
.success-check-spark::before { width: 5px; height: 17px; left: 6px; }
.success-check-spark::after { height: 5px; width: 17px; top: 6px; }
.success-check-spark-left { left: 5px; top: 49px; transform: rotate(14deg); }
.success-check-spark-right { right: 4px; top: 9px; animation-delay: 450ms; }
.success-check-dot {
  position: absolute;
  right: 10px;
  top: 70px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--yellow);
  opacity: 0;
  animation: success-check-sparkle 550ms 520ms ease-out both;
}
@keyframes success-check-bounce {
  0% { opacity: 0; transform: translateY(-20px) scale(.58); }
  40% { opacity: 1; transform: translateY(5px) scale(1.08, .94); }
  65% { transform: translateY(-4px) scale(.98, 1.03); }
  82% { transform: translateY(1px) scale(1.01, .99); }
  100% { opacity: 1; transform: none; }
}
@keyframes success-check-draw {
  from { stroke-dashoffset: 26; }
  to { stroke-dashoffset: 0; }
}
@keyframes success-check-ripple {
  0% { opacity: .8; transform: scale(.8); }
  100% { opacity: 0; transform: scale(1.42); }
}
@keyframes success-check-shadow {
  0% { opacity: 0; transform: scale(.4); }
  40% { opacity: 1; transform: scale(1.15); }
  65% { transform: scale(.85); }
  100% { opacity: 1; transform: scale(1); }
}
@keyframes success-check-sparkle {
  0% { opacity: 0; scale: .35; }
  40% { opacity: 1; scale: 1.1; }
  100% { opacity: 0; scale: .75; }
}
@media (prefers-reduced-motion: reduce) {
  .success-check *, .success-check *::before, .success-check *::after { animation: none; }
}
</style>

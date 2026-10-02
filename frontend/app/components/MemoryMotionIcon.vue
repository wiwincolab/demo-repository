<script setup lang="ts">
defineProps<{ name: 'back' | 'sparkles' | 'book' | 'close' | 'bookmark' | 'check' | 'arrow' | 'plus' | 'minus' | 'pen'; active?: boolean }>();
</script>
<template>
  <svg class="memory-icon" :class="['memory-icon-'+name,{'is-active':active}]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
    <g v-if="name==='back'" class="icon-back-stroke"><path d="m10 5-7 7 7 7M3 12h18" /></g>
    <g v-else-if="name==='sparkles'"><path class="icon-star-main" d="m13 5 2.2 5.8L21 13l-5.8 2.2L13 21l-2.2-5.8L5 13l5.8-2.2Z"/><path class="icon-star-small" d="M5 2v6M2 5h6"/></g>
    <g v-else-if="name==='book'"><path d="M12 5v15M12 6C9 3 5 3 2 4v15c4-1 7-1 10 1 3-2 6-2 10-1V4c-3-1-7-1-10 2Z"/><path class="icon-book-leaf" d="M16 7h3M16 10h3M5 7h3M5 10h3"/></g>
    <path v-else-if="name==='close'" d="m6 6 12 12M6 18 18 6" />
    <path v-else-if="name==='bookmark'" class="icon-bookmark-stroke" d="M6 3h12v18l-6-4-6 4Z" />
    <path v-else-if="name==='check'" class="icon-check-stroke" d="m5 12 4 4L19 6" />
    <path v-else-if="name==='arrow'" d="M5 19 19 5M7 5h12v12" />
    <path v-else-if="name==='plus'" d="M12 5v14M5 12h14" />
    <path v-else-if="name==='minus'" d="M5 12h14" />
    <path v-else d="m15 4 5 5M4 20l5-1L21 7a2 2 0 0 0-5-5L4 14Z" />
  </svg>
</template>
<style>
.memory-icon{display:block;width:20px;height:20px;flex:0 0 20px;overflow:visible}
.memory-icon g,.memory-icon path{transform-box:fill-box;transform-origin:center}
button:hover>.memory-icon-back .icon-back-stroke{animation:memory-back .4s ease-out}
button:hover .icon-star-main,button:focus-visible .icon-star-main,.memory-icon.is-active .icon-star-main{animation:memory-star .65s ease-out}
button:hover .icon-star-small,.memory-icon.is-active .icon-star-small{animation:memory-star .45s .13s ease-out both}
button:hover .icon-book-leaf,button:focus-visible .icon-book-leaf{animation:memory-leaf .5s ease-in-out}
button:hover .icon-bookmark-stroke{animation:memory-bookmark .4s ease-out}
.memory-icon-check .icon-check-stroke{stroke-dasharray:25;animation:memory-check .35s ease-out}
@keyframes memory-back{40%{transform:translateX(-2px)}100%{transform:translateX(0)}}
@keyframes memory-star{0%{transform:scale(.8) rotate(-12deg);opacity:.5}60%{transform:scale(1.12) rotate(5deg)}100%{transform:scale(1) rotate(0);opacity:1}}
@keyframes memory-leaf{50%{transform:perspective(30px) rotateY(-45deg) translateX(-1px)}}
@keyframes memory-bookmark{45%{transform:translateY(-2px)}}
@keyframes memory-check{from{stroke-dashoffset:25}to{stroke-dashoffset:0}}
@media(prefers-reduced-motion:reduce){.memory-icon *{animation:none!important}}
</style>

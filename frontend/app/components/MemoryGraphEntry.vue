<template>
  <NuxtLink to="/memory-graph" class="memory-graph-entry" aria-label="開啟 3D 記憶星圖">
    <svg class="entry-constellation" viewBox="0 0 120 80" fill="none" aria-hidden="true">
      <path d="M16 19Q44 0 61 40Q86 47 104 15M61 40Q25 32 17 65M61 40Q84 77 106 62" stroke="#79b6c7" stroke-width=".8"/>
      <circle cx="16" cy="19" r="4" fill="#93d3c7"/><circle cx="104" cy="15" r="3" fill="#d8b5e8"/><circle cx="17" cy="65" r="3" fill="#e8b084"/><circle cx="106" cy="62" r="4" fill="#8fb1e4"/>
      <rect x="43" y="22" width="15" height="38" rx="7.5" fill="#00afd1"/>
      <path d="M57 22Q51 19 51 27V54Q51 62 58 57L79 43Q84 39 78 35Z" fill="#ffc500"/>
      <ellipse cx="51" cy="34" rx="4.5" ry="6" fill="white"/><ellipse cx="62" cy="34" rx="4.5" ry="6" fill="white"/><circle cx="52" cy="33" r="1.8" fill="#252128"/><circle cx="63" cy="33" r="1.8" fill="#252128"/>
    </svg>
    <span class="entry-copy"><small>CHICTRIP MEMORY</small><strong>3D 記憶星圖</strong><span>跟著去趣，串起美食、玩樂和旅伴的回憶。</span></span>
    <svg class="entry-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M5 12h14m-5-5 5 5-5 5"/></svg>
  </NuxtLink>
</template>
<style scoped>
.memory-graph-entry{display:flex;align-items:center;gap:18px;margin:0 0 20px;padding:16px 20px;border-radius:16px;border:1px solid #375361;background:radial-gradient(ellipse at 10% 50%,#244752,#142330 65%);color:#f0ede7;text-decoration:none;transition:border-color .2s,box-shadow .2s}.memory-graph-entry:hover{border-color:#aabb90;box-shadow:0 5px 20px #14233018}.memory-graph-entry:focus-visible{outline:3px solid #e4b83e;outline-offset:4px}.entry-constellation{width:110px;height:74px;flex:none}.entry-copy{display:grid;gap:5px}.entry-copy small{font-size:9px;letter-spacing:1.8px;color:#8eb9c4}.entry-copy strong{font-size:18px;font-weight:600}.entry-copy>span{font-size:12px;color:#a8bcc4;line-height:1.7}.entry-arrow{width:24px;height:24px;flex:none;margin-left:auto;color:#f3c54c}@media(max-width:500px){.memory-graph-entry{gap:12px;padding:12px}.entry-constellation{width:70px;height:64px}.entry-copy strong{font-size:16px}.entry-copy>span{font-size:11px}.entry-arrow{width:18px}}
</style>

<script setup lang="ts">
const emit=defineEmits<{open:[panel:'benefits'|'points']}>();
const asset=useAsset();
</script>
<template>
  <section class="esim-benefits" aria-labelledby="esim-benefits-title">
    <header><div><h2 id="esim-benefits-title">旅行加值</h2></div><small>加值提案</small></header>
    <button class="esim-benefit-art esim-benefit-creation" @click="emit('open','benefits')">
      <span class="esim-benefit-copy"><span class="esim-benefit-tag">AI 創作 1 次</span><strong>照片變收藏</strong><span class="esim-benefit-action">選風格<EsimIcon name="arrow" :size="13"/></span></span>
      <span class="esim-benefit-visual creation-visual" aria-hidden="true"><span class="benefit-photo"><img :src="asset('assets/memory/fuji-editorial.png')" alt=""/><i>THAT DAY, KEPT.</i></span><span class="benefit-ticket"><img :src="asset('assets/memory/fuji-ticket.png')" alt=""/></span><span class="benefit-sticker"><svg viewBox="0 0 90 70"><path d="M5 58 38 12q7-9 14 1l33 44q5 9-6 9H13Q1 66 5 58Z" fill="#82bad0" stroke="white" stroke-width="7"/><path d="m26 29 16-18 11 7 12 23-15-6-10 4-3-10Z" fill="#fff9e8"/><path d="m16 59 25-29 2 29" fill="#477e98"/><path d="M60 47q11-9 24 0" fill="none" stroke="#fff" stroke-width="4"/></svg></span><span class="benefit-spark">✦</span></span>
    </button>
    <button class="esim-benefit-art esim-benefit-reward" @click="emit('open','points')">
      <span class="esim-benefit-copy"><span class="esim-benefit-tag">旅後回饋構想</span><strong>剩餘流量換點數</strong><span class="esim-benefit-action">看回饋<EsimIcon name="arrow" :size="13"/></span></span>
      <span class="esim-benefit-visual reward-visual" aria-hidden="true"><svg viewBox="0 0 170 155"><ellipse cx="89" cy="135" rx="59" ry="8" fill="#496652" opacity=".09"/><g transform="rotate(-10 50 65)"><rect x="16" y="20" width="70" height="105" rx="13" fill="#fffefa" stroke="#acbcb2"/><rect x="26" y="32" width="22" height="18" rx="4" fill="#e1e9df"/><path d="M32 32v18m8-18v18m-14-9h22" stroke="#9aaf9c"/><text x="28" y="76" fill="#426a61" font-size="18" font-weight="700">GB</text><rect x="28" y="88" width="45" height="5" rx="2" fill="#e4eadd"/><rect x="28" y="88" width="18" height="5" rx="2" fill="#648875"/><path d="M28 105h32" stroke="#bbc9bd" stroke-width="3" stroke-linecap="round"/></g><path d="M74 50q43-21 63 10m-12-2 13 4 1-14" fill="none" stroke="#7b997f" stroke-width="2" stroke-linecap="round" stroke-dasharray="3 5"/><g class="benefit-coin"><ellipse cx="123" cy="103" rx="34" ry="35" fill="#c29b48"/><circle cx="120" cy="99" r="34" fill="#efcf79" stroke="#be9845"/><circle cx="120" cy="99" r="27" fill="#f7df9c" stroke="#d6b35e"/><path d="M113 114V84h12a9 9 0 0 1 0 18h-12" fill="none" stroke="#9b7831" stroke-width="4" stroke-linecap="round"/></g><path d="m145 23 2 6 6 2-6 2-2 6-2-6-6-2 6-2Z" fill="#c9a253"/></svg></span>
    </button>
    <p class="esim-benefit-disclosure">創作與回饋為競賽提案；點數以獨立情境示範。</p>
  </section>
</template>

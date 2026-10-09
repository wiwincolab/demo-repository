<script setup lang="ts">
const emit = defineEmits<{ open: [panel: 'benefits' | 'rewards' | 'group'] }>();
</script>

<template>
  <section class="travel-extras" aria-labelledby="travel-extras-title">
    <EsimIcon class="travel-extras-symbol" name="gift" :size="32" aria-hidden="true"/>
    <h2 id="travel-extras-title">旅行加值</h2>
    <p class="travel-extras-value">4 人購買，省 NT$20</p>
    <button class="travel-extras-invite" @click="emit('open', 'group')">邀請旅伴一起省<EsimIcon name="arrow" :size="17" aria-hidden="true"/></button>
    <div class="travel-extras-list">
      <button @click="emit('open', 'group')"><EsimIcon name="check" :size="18" aria-hidden="true"/><span>跟旅伴一起省</span></button>
      <button @click="emit('open', 'benefits')"><EsimIcon name="check" :size="18" aria-hidden="true"/><span>照片變收藏</span></button>
      <button @click="emit('open', 'rewards')"><EsimIcon name="check" :size="18" aria-hidden="true"/><span>流量換點數</span></button>
    </div>
  </section>
</template>

<style scoped>
.travel-extras{padding:26px;margin:0 0 24px;border:1px solid #deded5;border-radius:16px;background:#fdfcf9;color:#282923}
.travel-extras-symbol{color:#b86243;margin-bottom:19px;stroke-width:1.3}
.travel-extras h2{font-family:Georgia,'Songti TC',serif;font-size:29px;line-height:1.3;font-weight:500;margin:0}
.travel-extras .travel-extras-value{color:#282923;font-size:25px!important;font-weight:500;line-height:1.5;letter-spacing:-.5px;margin:25px 0 0}
.travel-extras-invite{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;min-height:48px;border:0;border-radius:9px;padding:12px 10px;background:#30312b;color:#fffef9;font:inherit;font-size:15px;font-weight:500;line-height:1.5;margin:23px 0 0;cursor:pointer}
.travel-extras-list{border-top:1px solid #deded5;margin-top:25px;padding-top:5px}
.travel-extras-list button{display:flex;align-items:center;gap:14px;width:100%;min-height:66px;padding:19px 0;border:0;border-bottom:1px solid #deded5;background:transparent;color:inherit;text-align:left;font:inherit;font-size:16px;cursor:pointer}
.travel-extras-list button:last-child{border-bottom:0}
.travel-extras-list svg{color:#717168;flex-shrink:0}
.travel-extras-list button:hover{color:#a05237}
.travel-extras button:focus-visible{outline:3px solid #b86243;outline-offset:4px}
@media(max-width:360px){.travel-extras{padding:21px}.travel-extras .travel-extras-value{font-size:23px!important}}
</style>

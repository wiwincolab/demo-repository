<script setup lang="ts">
import { unusedChips } from '~/utils/commerce';
import type { Usage } from '~/types/trip';
const { usage, plan, eligible, buy } = useDemo();
const {activeTrip}=useTripContext();
const unused = ref(2), groupOpen = ref(false);
const choices: {
    value: Usage;
    name: string;
}[] = [{ value: 'light', name: '導航聊天' }, { value: 'normal', name: '照片社群' }, { value: 'heavy', name: '影片熱點' }];
</script>
<template>
  <section v-if="activeTrip" class="screen active" aria-labelledby="esim-title">
    <div class="page-heading">
      <span class="eyebrow">{{ activeTrip.location }} {{ activeTrip.dayCount }} 日 · {{ activeTrip.status==='completed'?'這趟的上網方案':'出國準備' }}</span>
      <h1 id="esim-title">網路，也幫你想好了。</h1>
      <p>買多少、付多少、得到什麼，一次看懂。</p>
    </div>
    <div class="panel">
      <div class="row">
        <h2>你的上網習慣</h2>
        <span class="mock">Mock</span>
      </div>
      <div class="choice-row">
        <button v-for="choice in choices" :key="choice.value" :aria-pressed="usage === choice.value" @click="usage = choice.value">{{ choice.name }}</button>
      </div>
      <div class="estimate">
        <span>{{ activeTrip.dayCount }} 天預估用量</span>
        <strong>{{ plan.range }} <small>GB</small></strong>
      </div>
      <p class="muted">{{ plan.reason }}</p>
    </div>
    <div class="plan-card">
      <div class="row">
        <span class="blue-label">{{ eligible ? '模擬選購已完成，可比較其他規格' : '依你的習慣推薦' }}</span>
        <span>日本 · {{ activeTrip.dayCount }} 日</span>
      </div>
      <h2>{{ plan.name }}</h2>
      <p class="muted">{{ plan.desc }}</p>
      <div class="price-row">
        <div>
          <small>模擬一般價</small>
          <strong>NT$<span>{{ plan.price }}</span></strong>
        </div>
        <span class="blue-label">含回憶創作 1 次</span>
      </div>
      <div class="benefit-lines">
        <p>✓ 先看風格，回國留下旅行回憶</p>
        <p>✓ 可自由共編，購買才計入組隊福利</p>
      </div>
      <button class="primary" :disabled="eligible" @click="buy(0)">{{ eligible ? '已完成我的模擬購買' : '模擬我的 eSIM 購買' }}</button>
      <p class="small-note">裝置須支援 eSIM 且無電信鎖；相容性與方案條款需在正式結帳前確認。本頁不會付款。</p>
    </div>
    <button class="link-row" @click="groupOpen = true">看看整團能省多少 <span>旅伴組隊省 ›</span></button>
    <details class="panel">
      <summary>沒用完的網路，能變成下一次的旅金？</summary>
      <p>「趣Chip」先以可結算的總量型方案探索。每日重置的方案不直接套用。</p>
      <label class="range-label" for="unused">試算：10GB 總量方案，剩下 <b>{{ unused }} GB</b></label>
      <input id="unused" v-model.number="unused" type="range" min="0" max="10">
      <div class="estimate">
        <span>可獲趣Chip</span>
        <strong>{{ unusedChips(unused) }}</strong>
      </div>
      <p class="small-note">Mock：每剩 1GB 換 10 點，上限 30 點；限下次 eSIM 訂單滿 NT$299 抵用，30 天有效，非現金。需供應商結算資料與成本驗證。</p>
    </details>
    <GroupSheet v-model="groupOpen" />
  </section>
</template>


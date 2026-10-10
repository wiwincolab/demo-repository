<script setup lang="ts">
import PointsMarket from '~/components/PointsMarket.vue';
import SuccessCheck from '~/components/SuccessCheck.vue';
import { esimPlan, esimQuote, rewardPreview, stopEstimates, usageOptions } from '~/utils/esim';
import { esimPriceSource } from '~/data/esim-catalog';
import type { Usage } from '~/types/trip';
import '~/assets/css/esim.css';
import '~/assets/css/esim-advisor.css';
import '~/assets/css/esim-carousel.css';
import '~/assets/css/esim-integrated.css';
const { usage, eligible, members, group, days, esim, notify, addMember, buy } = useDemo();
// 有後端（GCP 版）：旅伴用真的邀請連結加入、在自己的手機上購買；Pages 版維持「示範加入／示範購買」
const { available: live } = useApi();
const { activeId, activeTrip, tripHref } = useTripContext();
const route = useRoute();
const view = ref<'store' | 'recommend'>(route.query.view === 'recommend' ? 'recommend' : 'store');
const hasRecommendation = computed(() => !!activeTrip.value && (!activeTrip.value.country || activeTrip.value.country === 'japan'));
watch(hasRecommendation, (available) => { if (!available) view.value = 'store'; });
const asset = useAsset();
const { selectedId: myMascotId } = useMascot();
const crewMembers = computed(() => members.value.map((member, i) => i === 0 ? { ...member, mascotId: myMascotId.value } : member));
type Panel = 'habits' | 'analysis' | 'plans' | 'group' | 'benefits' | 'rewards' | 'points' | 'checkout' | 'success' | 'install' | 'help' | 'gift';
const panel = ref<Panel | null>(null);
const page = ref<HTMLElement>();
watch(panel, async (value, previous) => {
  if (!value || !previous) return;
  await nextTick();
  const dialog = page.value?.querySelector('dialog');
  if (dialog) { dialog.scrollTop = 0; dialog.querySelector('button')?.focus(); }
});
const sheetOpen = computed({ get: () => panel.value !== null, set: (open: boolean) => { if (!open) panel.value = null; } });
const titles: Record<Panel,string> = { habits:'流量推薦', analysis:'預估用量', plans:'選擇流量', group:'旅伴一起省', benefits:'照片變收藏', rewards:'流量換點數', points:'和泰點數・交通與旅行', checkout:'確認方案', success:'方案已備妥', install:'安裝 eSIM', help:'方案與展示說明', gift:'送朋友 eSIM' };
const title = computed(() => titles[panel.value || 'help']);
const selectedUsage = computed(() => eligible.value ? esim.value.purchasedUsage || (members.value[0]?.price === 199 ? 'light' : members.value[0]?.price === 499 ? 'heavy' : 'normal') : esim.value.selectedUsage || usage.value);
const card = computed(() => esimPlan(selectedUsage.value, activeTrip.value?.dayCount || 5));
const need = computed(() => esimPlan(usage.value, activeTrip.value?.dayCount || 5));
const underCapacity = computed(() => !eligible.value && card.value.totalGB < need.value.high);
const quote = computed(() => esimQuote(card.value.price, group.value.count, eligible.value));
const completed = computed(() => activeTrip.value?.status === 'completed');
// This hypothetical 10GB settlement is NOT the balance of a daily-reset product.
const reward = rewardPreview(10);
const canClaim = computed(() => eligible.value && completed.value && !esim.value.claimed);
const dayIndex = ref(0), compatible = ref(false), advised = ref(false);
const estimates = computed(() => stopEstimates(days.value, usage.value));
const selectedDay = computed(() => estimates.value[dayIndex.value]);
const locationName = computed(() => activeId.value === 'kansai' ? '關西' : activeId.value === 'fuji' ? '富士山' : activeTrip.value?.location || '東京');
function open(value: Panel) {
  if(value === 'checkout') compatible.value = false;
  panel.value = value;
}
function saveHabits(value: Usage) { usage.value = value; advised.value = true; esim.value = {...esim.value,selectedUsage:null}; panel.value = null; notify('已更新這趟旅行的流量建議'); }
function selectPlan(value: Usage) { if(eligible.value)return; esim.value = {...esim.value,selectedUsage:value}; panel.value = null; }
function purchase() { if(!compatible.value || eligible.value || !card.value.available) return; buy(0); panel.value = 'success'; }
function install() { esim.value = {...esim.value, installed:true}; panel.value = null; notify('已完成安裝示範，出發前準備就緒'); }
function claim() { if(!canClaim.value)return; esim.value = {...esim.value,claimed:true}; notify('已加入 '+reward.points+' 點回饋示範紀錄'); }
function friendPurchase(index: number) { if(index === 0) open('checkout'); else buy(index); }
watch(activeId, () => { panel.value = null; dayIndex.value = 0; compatible.value = false; advised.value = false; });
useHead({title:'eSIM 商城 · 旅行上網 · 去趣'});
</script>

<template>
  <div v-if="hasRecommendation" class="esim-view-tabs" aria-label="eSIM 頁面">
    <button :aria-pressed="view==='store'" @click="view='store';panel=null">eSIM 商城</button>
    <button :aria-pressed="view==='recommend'" @click="view='recommend'">本趟推薦</button>
  </div>
  <EsimStore v-if="view==='store' || !hasRecommendation"/>
  <section v-else-if="activeTrip && hasRecommendation" ref="page" class="esim-page" aria-labelledby="esim-title">
    <div class="mascot-perch"><header class="esim-heading">
      <div><h1 id="esim-title">旅行上網</h1><p>{{ locationName }} · {{ activeTrip.dayCount }} 天</p></div>
      <button class="esim-info" aria-label="方案與展示說明" @click="open('help')"><EsimIcon name="info" :size="20"/></button>
    </header><PageMascot /></div>

    <button v-if="!eligible" class="esim-advisor-entry" @click="open('habits')">
      <span class="esim-advisor-symbol"><EsimIcon name="signal" :size="25"/><i/></span>
      <span><strong>{{ advised?'調整需求':'幫我挑方案' }}</strong><span>回答 3 題</span></span>
      <span class="esim-entry-arrow"><EsimIcon name="arrow" :size="18"/></span>
    </button>

    <EsimPlanCarousel :model-value="selectedUsage" :days="activeTrip.dayCount" :cover="activeTrip.cover" :location="locationName" :purchased="eligible" :advised="advised" @update:model-value="selectPlan" @compare="open('plans')"/>

    <button class="esim-estimate-link" @click="open(eligible?'install':'analysis')"><span class="esim-line-icon"><EsimIcon :name="eligible?'sim':'route'" :size="20"/></span><span><strong>{{ eligible?esim.installed?'已完成安裝示範':'安裝與啟用':'這趟預估 '+need.range+' GB' }}</strong></span><EsimIcon name="arrow" :size="16"/></button>
    <p v-if="underCapacity" class="esim-capacity-note"><EsimIcon name="info" :size="15"/>每日流量可能不足，建議調整。</p>

    <EsimBenefits @open="open"/>

    <!-- 有後端時才有：真的產生禮物連結，朋友領取後這裡看得到（GiftPanel.vue） -->
    <button v-if="live" class="esim-advisor-entry" @click="open('gift')">
      <span class="esim-advisor-symbol"><EsimIcon name="sim" :size="25"/><i/></span>
      <span><strong>送朋友 eSIM</strong><span>掃碼領取 · 示範</span></span>
      <span class="esim-entry-arrow"><EsimIcon name="arrow" :size="18"/></span>
    </button>

    <div class="esim-checkout-dock"><div><small>{{ eligible?'我的方案':quote.discount?'含組隊優惠提案':'方案參考價' }}</small><strong>{{ eligible?esim.installed?'已安裝':'待安裝':'NT$'+quote.total }}</strong></div><button class="esim-cta" :disabled="!card.available" @click="open(eligible?'install':'checkout')">{{ eligible?'查看 eSIM':'選這個' }}<EsimIcon name="arrow" :size="17"/></button></div>

    <AppSheet v-model="sheetOpen" :title="title" class="esim-sheet" :class="{'esim-quiz-sheet':panel==='habits','points-sheet':panel==='points'}">
      <template v-if="panel==='analysis'">
        <div class="esim-analysis-total"><span>{{ activeTrip.dayCount }} 天旅行・預估總需求</span><strong>{{ need.range }} <small>GB</small></strong></div>
        <button class="esim-sheet-row" :disabled="eligible" @click="open('habits')"><span><small>目前上網習慣</small><strong>{{ usageOptions.find(o=>o.value===usage)?.title }}</strong></span><span>調整 <EsimIcon name="edit" :size="17"/></span></button>
        <div class="esim-day-tabs" role="tablist" aria-label="每日流量估算"><button v-for="(day,i) in estimates" :key="i" role="tab" :aria-selected="dayIndex===i" @click="dayIndex=i">第 {{ i+1 }} 天</button></div>
        <h3 class="esim-day-title">{{ selectedDay?.area }}</h3>
        <div v-for="stop in selectedDay?.stops" :key="stop.id" class="esim-stop"><img :src="asset(stop.photo.src)" :alt="stop.photo.alt"/><span><strong>{{ stop.name }}</strong><small>{{ stop.stay }} · 導航與查詢</small></span><b>{{ stop.estimate.join('–') }}<small>MB</small></b></div>
        <p class="esim-fine-print">各站顯示導航與查詢的情境估算；總需求另含上傳、社群及移動空檔。數值為示範，不是電信即時用量。</p>
      </template>
      <template v-else-if="panel==='habits'">
        <EsimAdvisor :days="activeTrip.dayCount" @apply="saveHabits"/>
      </template>
      <template v-else-if="panel==='plans'">
        <p class="esim-intro">Docomo (IIJ) · {{ card.days }} 天 · 4G。依每日用量選擇，額度不跨日累積。</p>
        <div class="esim-options"><button v-for="option in usageOptions" :key="option.value" :aria-pressed="selectedUsage===option.value" @click="selectPlan(option.value)"><span><strong>{{ esimPlan(option.value,activeTrip.dayCount).name }} <small>{{ esimPlan(option.value,activeTrip.dayCount).label }}</small></strong><small>{{ option.title }}</small></span><span class="esim-option-price">NT${{ esimPlan(option.value,activeTrip.dayCount).price }}<EsimIcon v-if="selectedUsage===option.value" name="check" :size="16"/></span></button></div><p class="esim-fine-print">官網價格查核於 2026-10-03，實際售價以官網為準。標準吃到飽每日 10GB 高速，用盡後降至 256kbps；每日定量用盡後降至 128kbps。</p><button class="esim-text-button" @click="open('habits')">幫我挑方案</button>
      </template>
      <template v-else-if="panel==='group'">
        <EsimCrew :members="crewMembers" :count="group.count" :location="locationName" :live="live === true" @invite="addMember" @purchase="friendPurchase" @open="page?.querySelector('#crew-invite')?.scrollIntoView({ behavior: 'smooth', block: 'center' })">
          <template #invite><InvitePanel v-if="live" link-only/></template>
        </EsimCrew>
      </template>
      <template v-else-if="panel==='benefits'">
        <p class="esim-proposal-note">創作權益為本 Demo 的加值提案</p><div class="esim-memory-preview"><img :src="asset('assets/atlas-plaza/v3/collection.png')" alt="旅行照片做成貼紙與票根的收藏示意"/><div><h3>照片變收藏</h3></div></div>
        <div class="esim-perk-list"><p><EsimIcon name="photo"/><span><b>AI 回憶創作 1 次</b><small>貼紙卡、專業攝影、票根、琺瑯徽章、場景積木、景點旅伴，任選一種。</small></span></p><p><EsimIcon name="people"/><span><b>和朋友交換作品</b><small>交換作品、留下留言。</small></span></p><p><EsimIcon name="route"/><span><b>收藏到回憶地圖</b><small>收藏照片、作品與地點。</small></span></p></div>
        <NuxtLink :to="tripHref('/memory')" class="esim-cta esim-full" @click="panel=null">{{ eligible?'開始創作':'看看風格' }}<EsimIcon name="arrow" :size="17"/></NuxtLink>
      </template>
      <template v-else-if="panel==='rewards'">
        <div class="esim-analysis-total"><span>旅後回饋情境</span><strong>{{ reward.remainingGB }} <small>GB → {{ reward.points }} 點</small></strong></div>
        <p class="esim-intro">沒用完的流量，留給下一次出發。</p>
        <p class="esim-fine-print">這是獨立的總量型方案回饋提案，以 10GB 情境試算；不是上方每日重置方案的剩餘流量，也不會發放真實點數。</p>
        <button class="esim-cta esim-full" :disabled="!canClaim" @click="claim">{{ esim.claimed ? '已記錄回饋示範' : !eligible ? '購買後可體驗回饋' : !completed ? '旅程結束後可體驗回饋' : '記錄 '+reward.points+' 點回饋示範' }}</button>
        <button class="esim-text-button" @click="open('points')">看看點數可以換什麼<EsimIcon name="arrow" :size="16"/></button>
      </template>
      <template v-else-if="panel==='points'"><PointsMarket/></template>
      <template v-else-if="panel==='checkout'">
        <div class="esim-order-title"><EsimIcon name="sim" :size="34"/><span><strong>日本 {{ card.name }} · {{ card.days }} 天</strong><small>{{ activeTrip.dateLabel }}</small></span></div>
        <dl class="esim-receipt"><div><dt>官網參考價</dt><dd>NT${{ card.price }}</dd></div><div v-if="quote.discount"><dt>旅伴優惠提案</dt><dd>− NT$20</dd></div><div v-if="quote.countAfterPurchase>=2"><dt>旅伴加贈流量</dt><dd>500MB</dd></div><div v-if="quote.countAfterPurchase>=3"><dt>旅伴點數回饋</dt><dd>30 點</dd></div><div><dt>AI 創作加值提案</dt><dd>1 次</dd></div><div class="esim-receipt-total"><dt>本次合計</dt><dd>NT${{ quote.total }}</dd></div></dl>
        <p class="esim-fine-print">{{ card.desc }}。首次於當地連網當日算第 1 天，至台灣時間 23:59；使用前請確認官網最新規則。組隊折扣與創作權益是提案，此處不會建立官方訂單。</p>
        <p v-if="underCapacity" class="esim-capacity-note">每日流量可能不足，請確認。</p>
        <label class="esim-device-check"><input v-model="compatible" type="checkbox"/><span>我的手機支援 eSIM，且沒有電信鎖</span></label>
        <button class="esim-cta esim-full" :disabled="!compatible || eligible" @click="purchase">完成選購 · Demo 不扣款</button>
      </template>
      <template v-else-if="panel==='success'">
        <div class="esim-success" role="status"><SuccessCheck/><h3>方案已備妥</h3><p>{{ card.name }} · {{ card.days }} 天</p><small>示範訂單已儲存</small></div><button class="esim-cta esim-full" @click="open(completed?'points':'install')">{{ completed?'查看旅後回饋':'安裝 eSIM' }}<EsimIcon name="arrow" :size="18"/></button><button class="esim-text-button" @click="panel=null">返回方案</button>
      </template>
      <template v-else-if="panel==='gift'">
        <GiftPanel :days="activeTrip.dayCount" />
      </template>
      <template v-else-if="panel==='install'">
        <div class="esim-install-card"><EsimIcon name="sim" :size="34"/><span><strong>日本 {{ card.name }}</strong><small>{{ esim.installed?'已完成安裝示範':'尚未安裝' }} · {{ card.days }} 天</small></span></div>
        <ol class="esim-install-steps"><li><b>先連上穩定的 Wi-Fi</b><p>官網建議於使用當天，在台灣以穩定網路安裝；抵達日本後啟用旅遊門號。</p></li><li><b>加入這張旅遊 eSIM</b><p>正式服務會提供安裝指引或 QR Code；目前僅展示操作流程。</p></li><li><b>抵達後，切換行動數據</b><p>選擇旅遊 eSIM 並開啟資料漫遊；原本門號保留收簡訊。</p></li></ol><button class="esim-cta esim-full" :disabled="esim.installed" @click="install">{{ esim.installed?'安裝示範已完成':'完成安裝示範' }}</button>
      </template>
      <template v-else>
        <div class="esim-help"><h3>可操作的 eSIM 概念展示</h3><p>方案規格與價格參考去趣官網，查核日 2026-10-03。問答以本機規則模擬，未串接 AI；估算、付款及安裝均為示範。</p><h3>以這趟旅行為單位</h3><p>切換行程後，方案、同行旅伴、購買與回饋紀錄會分開保存於本機。流量建議以天數及使用習慣計算。</p><h3>官方價格來源</h3><p><a :href="esimPriceSource.daily" target="_blank" rel="noopener noreferrer">日本每日定量方案 ↗</a> · <a :href="esimPriceSource.unlimited" target="_blank" rel="noopener noreferrer">日本吃到飽方案 ↗</a></p><h3>組隊、創作與 Points 是加值提案</h3><p>兌換比例、使用期限及可抵用項目為 Demo 規則，尚未串接和泰會員或實際發點服務。</p></div>
      </template>
    </AppSheet>
  </section>
</template>

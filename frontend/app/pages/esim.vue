<script setup lang="ts">
import { esimPlan, esimQuote, rewardPreview, stopEstimates, usageOptions } from '~/utils/esim';
import type { Usage } from '~/types/trip';
import '~/assets/css/esim.css';
const { usage, eligible, members, group, days, esim, notify, addMember, buy } = useDemo();
const { activeId, activeTrip, tripHref } = useTripContext();
const asset = useAsset();
type Panel = 'habits' | 'analysis' | 'plans' | 'group' | 'benefits' | 'points' | 'checkout' | 'success' | 'install' | 'help';
const panel = ref<Panel | null>(null);
const page = ref<HTMLElement>();
watch(panel, async (value, previous) => {
  if (!value || !previous) return;
  await nextTick();
  const dialog = page.value?.querySelector('dialog');
  if (dialog) { dialog.scrollTop = 0; dialog.querySelector('button')?.focus(); }
});
const sheetOpen = computed({ get: () => panel.value !== null, set: (open: boolean) => { if (!open) panel.value = null; } });
const titles: Record<Panel,string> = { habits:'你的上網習慣', analysis:'這趟旅行，會用多少網路？', plans:'選擇流量', group:'旅伴一起省', benefits:'這張 eSIM，還多了這些', points:'把剩下的流量，留給下一趟', checkout:'確認你的上網方案', success:'上網方案準備好了', install:'安裝你的 eSIM', help:'方案與展示說明' };
const title = computed(() => titles[panel.value || 'help']);
const selectedUsage = computed(() => eligible.value ? esim.value.purchasedUsage || (members.value[0]?.price === 199 ? 'light' : members.value[0]?.price === 499 ? 'heavy' : 'normal') : esim.value.selectedUsage || usage.value);
const card = computed(() => esimPlan(selectedUsage.value, activeTrip.value?.dayCount || 5));
const need = computed(() => esimPlan(usage.value, activeTrip.value?.dayCount || 5));
const underCapacity = computed(() => !eligible.value && card.value.totalGB < need.value.high);
const quote = computed(() => esimQuote(card.value.price, group.value.count, eligible.value));
const completed = computed(() => activeTrip.value?.status === 'completed');
const reward = computed(() => rewardPreview(card.value.totalGB));
const canClaim = computed(() => eligible.value && completed.value && !esim.value.claimed);
const draftUsage = ref<Usage>('normal'), hotspot = ref(false), dayIndex = ref(0), compatible = ref(false);
const draftPlan = computed(() => esimPlan(hotspot.value ? 'heavy' : draftUsage.value, activeTrip.value?.dayCount || 5));
const estimates = computed(() => stopEstimates(days.value, usage.value));
const selectedDay = computed(() => estimates.value[dayIndex.value]);
const nextReward = computed(() => group.value.count < 2 ? '2 人購買，每人多 500MB' : group.value.count < 3 ? '再 1 人，每人多 30 點' : group.value.count < 4 ? '再 1 人，每人省 NT$20' : '每人省 NT$20，福利全解鎖');
const locationName = computed(() => activeId.value === 'kansai' ? '關西' : activeId.value === 'fuji' ? '富士山' : '東京');
function open(value: Panel) {
  if(value === 'habits'){draftUsage.value = usage.value; hotspot.value = false;}
  if(value === 'checkout') compatible.value = false;
  panel.value = value;
}
function saveHabits() { usage.value = hotspot.value ? 'heavy' : draftUsage.value; esim.value = {...esim.value,selectedUsage:null}; panel.value = null; notify('已更新這趟旅行的流量建議'); }
function selectPlan(value: Usage) { esim.value = {...esim.value,selectedUsage:value}; panel.value = null; }
function purchase() { if(!compatible.value || eligible.value) return; buy(0); panel.value = 'success'; }
function install() { esim.value = {...esim.value, installed:true}; panel.value = null; notify('已完成安裝示範，出發前準備就緒'); }
function claim() { if(!canClaim.value)return; esim.value = {...esim.value,claimed:true}; notify('已加入 '+reward.value.points+' 點回饋示範紀錄'); }
function friendPurchase(index: number) { if(index === 0) open('checkout'); else buy(index); }
watch(activeId, () => { panel.value = null; dayIndex.value = 0; compatible.value = false; });
useHead({title:'旅行上網 · eSIM · 去趣'});
</script>

<template>
  <section v-if="activeTrip" ref="page" class="esim-page" aria-labelledby="esim-title">
    <header class="esim-heading"><div><span class="esim-overline">chicTrip eSIM</span><h1 id="esim-title">{{ eligible ? '這趟，安心連線。' : '下一站，網路準備好。' }}</h1></div><button class="esim-info" aria-label="方案與展示說明" @click="open('help')"><EsimIcon name="info" :size="20"/></button></header>

    <article class="esim-pass" :class="{'is-purchased':eligible}">
      <div class="esim-pass-top"><span class="esim-pass-country"><span class="esim-japan"/>日本 <i>JAPAN</i></span><span class="esim-pass-status"><span/>{{ eligible ? completed ? '旅程已結束' : esim.installed ? '安裝完成' : '待安裝' : esim.selectedUsage ? '我的選擇' : '為這趟推薦' }}</span></div>
      <div class="esim-pass-main"><div class="esim-pass-number"><strong>{{ card.totalGB }}</strong><span>GB<small>旅程總量</small></span></div><div class="esim-pass-landscape"><img :src="asset(activeTrip.cover)" :alt="locationName+'旅行風景'"/><span><EsimIcon name="signal" :size="18"/>一路保持連線</span></div></div>
      <div class="esim-pass-caption"><span>{{ locationName }} · {{ card.days }} 天彈性使用</span><button v-if="!eligible" @click="open('plans')">換個流量 <EsimIcon name="arrow" :size="13"/></button><span v-else class="esim-owned"><EsimIcon name="check" :size="15"/>{{ group.count>=2 ? "另贈 500MB" : "已購買" }}</span></div>
      <div class="esim-pass-bottom"><div><span>{{ eligible ? '我的方案金額' : '本趟方案' }}</span><strong><small>NT$</small>{{ quote.total }}<del v-if="quote.discount">{{ card.price }}</del></strong></div><div class="esim-pass-bonus"><EsimIcon name="gift" :size="16"/><span>含 AI 回憶創作 1 次<br><small>總量型・流量不每日歸零</small></span></div></div>
    </article>

    <button v-if="!eligible" class="esim-estimate-link" @click="open('analysis')"><span class="esim-line-icon"><EsimIcon name="route"/></span><span><strong>這趟預估 {{ need.range }} GB</strong><small>依行程與上網習慣估算 · 看每站用量</small></span><EsimIcon name="arrow" :size="17"/></button>
    <button v-else class="esim-estimate-link" @click="open(completed?'points':'install')"><span class="esim-line-icon"><EsimIcon :name="completed?'point':'phone'"/></span><span><strong>{{ completed ? esim.claimed ? '已領取 '+reward.points+' 點旅後回饋' : '剩餘 '+reward.remainingGB+'GB 可轉回饋' : esim.installed ? '已完成出發前準備' : '出發前，先把 eSIM 安裝好' }}</strong><small>{{ completed ? '查看旅後結算示範' : '安裝步驟與啟用提醒' }}</small></span><EsimIcon name="arrow" :size="17"/></button>

    <p v-if="underCapacity" class="esim-capacity-note"><EsimIcon name="info" :size="15"/>此方案低於預估需求 {{ need.range }}GB，建議保留一些餘裕。</p>
    <section class="esim-crew-card"><button class="esim-crew-open" @click="open('group')"><span class="esim-crew-heading"><EsimIcon name="people" :size="20"/><strong>{{ group.count >= 4 ? '旅伴優惠已到齊' : '和旅伴一起，每人省 $20' }}</strong><EsimIcon name="arrow" :size="17"/></span><span class="esim-crew-summary"><span class="esim-avatar-stack"><i v-for="(member,i) in members.slice(0,4)" :key="member.name" :style="{'--avatar-tone':i}" :class="{paid:member.paid}">{{ member.name[0] }}</i><i v-if="members.length<4" class="esim-avatar-empty">＋</i></span><span><b>{{ group.count }}</b>{{ group.count>=4 ? " 人已購買" : " / 4 人已購買" }}<small>{{ nextReward }}</small></span></span></button><div class="esim-crew-track" aria-hidden="true"><span v-for="n in 4" :key="n" :class="{filled:group.count>=n}"/></div></section>

    <div class="esim-extra-heading"><h2>上網之外，也把回憶帶回來</h2><span>方案已包含</span></div>
    <div class="esim-extra-grid">
      <button class="esim-extra esim-extra-memory" @click="open('benefits')"><EsimIcon name="photo" :size="23"/><strong>照片變成旅行收藏</strong><span>6 種 AI 風格 · 創作 1 次</span><EsimIcon name="arrow" :size="14"/></button>
      <button class="esim-extra esim-extra-points" @click="open('points')"><EsimIcon name="point" :size="23"/><strong>剩餘流量轉點數</strong><span>{{ esim.claimed ? '已領取 '+reward.points+' 點回饋' : '旅後結算 · 下次繼續用' }}</span><EsimIcon name="arrow" :size="14"/></button>
    </div>
    <button class="esim-demo-note" @click="open('help')">Demo 方案與優惠 · 查看說明</button>

    <div class="esim-checkout-dock"><div><small>{{ eligible ? completed ? '旅後回饋' : '上網準備' : quote.discount ? '旅伴價' : '本趟合計' }}</small><strong>{{ eligible ? completed ? reward.points+' 點' : esim.installed ? '已就緒' : '待安裝' : 'NT$'+quote.total }}</strong></div><button class="esim-cta" @click="open(eligible ? completed ? 'points' : 'install' : 'checkout')">{{ eligible ? completed ? '查看回饋' : esim.installed ? '查看安裝資訊' : '安裝 eSIM' : '確認方案' }}<EsimIcon name="arrow" :size="18"/></button></div>

    <AppSheet v-model="sheetOpen" :title="title" class="esim-sheet">
      <template v-if="panel==='analysis'">
        <div class="esim-analysis-total"><span>{{ activeTrip.dayCount }} 天旅行・預估總需求</span><strong>{{ need.range }} <small>GB</small></strong><p>包含導航、查資料、照片與社群等日常使用。</p></div>
        <button class="esim-sheet-row" :disabled="eligible" @click="open('habits')"><span><small>目前上網習慣</small><strong>{{ usageOptions.find(o=>o.value===usage)?.title }}</strong></span><span>調整 <EsimIcon name="edit" :size="17"/></span></button>
        <div class="esim-day-tabs" role="tablist" aria-label="每日流量估算"><button v-for="(day,i) in estimates" :key="i" role="tab" :aria-selected="dayIndex===i" @click="dayIndex=i">第 {{ i+1 }} 天</button></div>
        <h3 class="esim-day-title">{{ selectedDay?.area }}</h3>
        <div v-for="stop in selectedDay?.stops" :key="stop.id" class="esim-stop"><img :src="asset(stop.photo.src)" :alt="stop.photo.alt"/><span><strong>{{ stop.name }}</strong><small>{{ stop.stay }} · 導航與查詢</small></span><b>{{ stop.estimate.join('–') }}<small>MB</small></b></div>
        <p class="esim-fine-print">各站顯示導航與查詢的情境估算；總需求另含上傳、社群及移動空檔。數值為示範，不是電信即時用量。</p>
      </template>
      <template v-else-if="panel==='habits'">
        <p class="esim-intro">告訴我們怎麼用，比自己猜 GB 容易。</p><h3>旅途中，你通常會？</h3>
        <div class="esim-options"><button v-for="option in usageOptions" :key="option.value" :aria-pressed="draftUsage===option.value" @click="draftUsage=option.value"><span><strong>{{ option.title }}</strong><small>{{ option.detail }}</small></span><i :class="{selected:draftUsage===option.value}"><EsimIcon v-if="draftUsage===option.value" name="check" :size="14"/></i></button></div>
        <h3>會開熱點給其他裝置嗎？</h3><div class="esim-binary"><button :aria-pressed="!hotspot" @click="hotspot=false">不太會</button><button :aria-pressed="hotspot" @click="hotspot=true">會，經常分享</button></div>
        <div class="esim-inline-result">預估 {{ draftPlan.range }} GB <strong>建議 {{ draftPlan.totalGB }}GB</strong></div><button class="esim-cta esim-full" @click="saveHabits">更新我的建議</button>
      </template>
      <template v-else-if="panel==='plans'">
        <p class="esim-intro">日本 {{ activeTrip.dayCount }} 天 · 都是總量型，可自由分配每天用量。</p>
        <div class="esim-options"><button v-for="option in usageOptions" :key="option.value" :aria-pressed="selectedUsage===option.value" @click="selectPlan(option.value)"><span><strong>{{ esimPlan(option.value,activeTrip.dayCount).totalGB }}GB <small>{{ option.range }}</small></strong><small>{{ option.title }}</small></span><span class="esim-option-price">NT${{ esimPlan(option.value,activeTrip.dayCount).price }}<EsimIcon v-if="selectedUsage===option.value" name="check" :size="16"/></span></button></div><p class="esim-fine-print">三種方案皆含 AI 創作 1 次及旅後流量回饋資格。價格為 Demo 示範。</p><button class="esim-text-button" @click="open('habits')">不確定怎麼選？調整上網習慣</button>
      </template>
      <template v-else-if="panel==='group'">
        <div class="esim-group-hero"><span>{{ members.length }} 人同行 · {{ group.count }} 人已購買</span><strong>{{ group.count>=4 ? '每人省 NT$20' : '還差 '+(4-group.count)+' 人，解鎖旅伴價' }}</strong><p>朋友自由加入行程，購買 eSIM 才計入優惠。</p></div>
        <div class="esim-milestones"><div v-for="tier in [{n:2,label:'多 500MB'},{n:3,label:'多 30 點'},{n:4,label:'省 NT$20'}]" :key="tier.n" :class="{unlocked:group.count>=tier.n}"><i>{{ group.count>=tier.n?'✓':tier.n }}</i><strong>{{ tier.label }}</strong><small>{{ tier.n }} 人購買</small></div></div>
        <div v-for="(member,i) in members" :key="member.name" class="esim-friend"><span class="esim-friend-avatar">{{ member.name[0] }}</span><span><strong>{{ member.name }}</strong><small>{{ member.paid ? '方案 NT$'+member.price+(group.count>=4?' · 回饋 $20':'') : '已加入行程' }}</small></span><button :disabled="member.paid" @click="friendPurchase(i)">{{ member.paid?'已購買':i===0?'選購方案':'示範購買' }}</button></div>
        <button class="esim-cta esim-full" :disabled="members.length>=8" @click="addMember">{{ members.length>=8?'旅伴已全數加入':'邀請旅伴 · 示範加入' }}</button><p class="esim-fine-print">優惠累加，達 4 人後已購買者同享 $20 回饋。500MB 限本趟；30 點為下一次滿 $299 可用的示範回饋，有效 30 天。此處不發送真實邀請。</p>
      </template>
      <template v-else-if="panel==='benefits'">
        <div class="esim-memory-preview"><img :src="asset('assets/atlas-plaza/v3/collection.png')" alt="旅行照片做成貼紙與票根的收藏示意"/><div><span>帶回一份自己的紀念</span><h3>把旅遊照片，<br>變成能收藏的回憶。</h3></div></div>
        <div class="esim-perk-list"><p><EsimIcon name="photo"/><span><b>AI 回憶創作 1 次</b><small>貼紙卡、專業攝影、票根、琺瑯徽章、場景積木、景點旅伴，任選一種。</small></span></p><p><EsimIcon name="people"/><span><b>和朋友交換作品</b><small>留下留言，也保留這份回憶從誰而來。</small></span></p><p><EsimIcon name="route"/><span><b>收藏到回憶地圖</b><small>照片、作品與地點，留在同一趟旅行。</small></span></p></div>
        <NuxtLink :to="tripHref('/memory')" class="esim-cta esim-full" @click="panel=null">{{ eligible?'使用本趟創作權益':'先看看創作風格' }}<EsimIcon name="arrow" :size="17"/></NuxtLink>
      </template>
      <template v-else-if="panel==='points'">
        <div class="esim-reward-hero"><EsimIcon name="point" :size="36"/><span>{{ completed && eligible ? '旅後結算示範' : '旅後回饋預覽' }}</span><strong>{{ reward.points }} <small>點</small></strong><p>和泰 Points 回饋提案</p></div>
        <div class="esim-reward-flow"><span><small>方案總量</small><b>{{ card.totalGB }}GB</b></span><span>→</span><span><small>示例剩餘</small><b>{{ reward.remainingGB }}GB</b></span><span>→</span><span><small>可轉回饋</small><b>{{ reward.points }} 點</b></span></div>
        <p class="esim-fine-print">用量資料：旅程結束後的示範結算快照，非電信即時資料。示例已用 {{ reward.usedGB }}GB；2 人組隊加贈的流量不列入回饋。實際可領取需等待電信商完成結算。</p>
        <div class="esim-reward-rules"><h3>留給下一次旅行</h3><p>每剩 1GB 換 10 點，單趟上限 30 點；小數點以下捨去。</p><p>領取後 30 天內，下次 eSIM 滿 NT$299 可抵用。此 Demo 不會寫入真實和泰帳戶。</p></div>
        <button class="esim-cta esim-full" :disabled="!canClaim" @click="claim">{{ esim.claimed ? '已加入回饋紀錄' : completed && eligible ? '領取 '+reward.points+' 點 · 示範' : '旅程結束並完成結算後可領取' }}</button>
      </template>
      <template v-else-if="panel==='checkout'">
        <div class="esim-order-title"><EsimIcon name="sim" :size="34"/><span><strong>日本 {{ card.totalGB }}GB · {{ card.days }} 天</strong><small>{{ activeTrip.dateLabel }}</small></span></div>
        <dl class="esim-receipt"><div><dt>方案金額</dt><dd>NT${{ card.price }}</dd></div><div v-if="quote.discount"><dt>旅伴優惠</dt><dd>− NT$20</dd></div><div v-if="quote.countAfterPurchase>=2"><dt>旅伴加贈流量</dt><dd>500MB</dd></div><div v-if="quote.countAfterPurchase>=3"><dt>旅伴點數回饋</dt><dd>30 點</dd></div><div><dt>附贈 AI 創作</dt><dd>1 次</dd></div><div class="esim-receipt-total"><dt>本次合計</dt><dd>NT${{ quote.total }}</dd></div></dl>
        <p class="esim-fine-print">總量可跨天使用；從首次連網起算 {{ card.days }} 天。此為預製方案展示，實際電信商、熱點規則與適用裝置需在正式產品確認。</p>
        <p v-if="underCapacity" class="esim-capacity-note">所選 {{ card.totalGB }}GB 低於預估 {{ need.range }}GB，請確認符合你的使用安排。</p>
        <label class="esim-device-check"><input v-model="compatible" type="checkbox"/><span>我的手機支援 eSIM，且沒有電信鎖</span></label>
        <button class="esim-cta esim-full" :disabled="!compatible || eligible" @click="purchase">完成選購 · Demo 不扣款</button>
      </template>
      <template v-else-if="panel==='success'">
        <div class="esim-success"><span><EsimIcon name="check" :size="34"/></span><h3>這趟的網路，準備好了。</h3><p>{{ card.totalGB }}GB 上網 + AI 回憶創作 1 次</p><small>已儲存這趟行程的示範訂單</small></div><button class="esim-cta esim-full" @click="open(completed?'points':'install')">{{ completed?'查看旅後回饋':'接著安裝 eSIM' }}<EsimIcon name="arrow" :size="18"/></button><button class="esim-text-button" @click="panel=null">回到我的方案</button>
      </template>
      <template v-else-if="panel==='install'">
        <div class="esim-install-card"><EsimIcon name="sim" :size="34"/><span><strong>日本 {{ card.totalGB }}GB</strong><small>{{ esim.installed?'已完成安裝示範':'尚未安裝' }} · {{ card.days }} 天</small></span></div>
        <ol class="esim-install-steps"><li><b>先連上穩定的 Wi-Fi</b><p>出發前先安裝，抵達日本後再啟用旅遊門號。</p></li><li><b>加入這張旅遊 eSIM</b><p>正式服務會提供安裝指引或 QR Code；目前僅展示操作流程。</p></li><li><b>抵達後，切換行動數據</b><p>選擇旅遊 eSIM 並開啟資料漫遊；原本門號保留收簡訊。</p></li></ol><button class="esim-cta esim-full" :disabled="esim.installed" @click="install">{{ esim.installed?'安裝示範已完成':'完成安裝示範' }}</button>
      </template>
      <template v-else>
        <div class="esim-help"><h3>可操作的 eSIM 概念展示</h3><p>價格、流量估算、組隊優惠、點數與安裝皆為預製示範，不會付款或連接電信服務。</p><h3>以這趟旅行為單位</h3><p>切換行程後，方案、同行旅伴、購買與回饋紀錄會分開保存於本機。流量建議以天數及使用習慣計算。</p><h3>和泰 Points 是回饋提案</h3><p>兌換比例、使用期限及可抵用項目為 Demo 規則，尚未串接和泰會員或實際發點服務。</p></div>
      </template>
    </AppSheet>
  </section>
</template>

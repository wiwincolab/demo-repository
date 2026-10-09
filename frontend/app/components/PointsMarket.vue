<script setup lang="ts">
import { pointsProducts, pointsQuote, replacementReason, type PointsProduct, type Payment } from '~/utils/points';
import '~/assets/css/points-market.css';
const props=withDefaults(defineProps<{planning?:boolean}>(),{planning:false});
const {activeId,activeTrip}=useTripContext();
const {days}=useDemo();
const {wallet,ready,error,busy,redeem}=usePointsWallet();
const mode=ref(props.planning?'plan':'shop'),category=ref('all'),affordable=ref(false),selected=ref<PointsProduct|null>(null),payment=ref<Payment>('full'),attach=ref(false),done=ref(false),targetKey=ref('');
const heading=ref<HTMLElement>(),broken=ref<Record<string,boolean>>({});
const stops=computed(()=>days.value.flatMap(d=>d.stops));
const target=computed(()=>stops.value.find(s=>`${s.day}:${s.id}`===targetKey.value));
const nextStop=computed(()=>{const list=days.value[target.value?.day??-1]?.stops||[];return list[list.findIndex(s=>s.id===target.value?.id)+1];});
const reason=(p:PointsProduct)=>replacementReason(p,activeTrip.value?.country||'japan',target.value,nextStop.value);
const products=computed(()=>pointsProducts.filter(p=>category.value==='all'||p.kind===category.value).filter(p=>!affordable.value||wallet.value.balance>=p.partial));
const quote=computed(()=>selected.value?pointsQuote(selected.value,payment.value):{points:0,cash:0});
const orders=computed(()=>[...wallet.value.orders].reverse());
const fmt=(n:number)=>n.toLocaleString('zh-TW');
function reset(){selected.value=null;done.value=false;attach.value=false;}
watch(activeId,()=>{reset();targetKey.value='';});
watch([targetKey,mode],()=>{attach.value=false;});
async function focus(){await nextTick();heading.value?.focus();}
function open(p:PointsProduct){selected.value=p;payment.value=wallet.value.balance>=p.price?'full':'partial';done.value=false;attach.value=mode.value==='plan'&&!reason(p);focus();}
async function confirm(){const p=selected.value;if(!p||!activeId.value||attach.value&&reason(p))return;if(await redeem(p,payment.value,activeId.value,attach.value?target.value:undefined)){done.value=true;focus();}}
</script>
<template>
 <section class="pm" aria-label="和泰點數商品">
  <div class="pm-wallet"><div><span>我的和泰 Points · 示範帳戶</span><strong>{{fmt(wallet.balance)}} <small>點</small></strong><p>起始 1,200 點 · 與真實和泰帳戶無關</p></div><span class="pm-coin" aria-hidden="true">P</span></div>
  <div class="pm-tabs"><button :aria-pressed="mode==='shop'" @click="mode='shop';reset()">旅後兌換</button><button :aria-pressed="mode==='plan'" @click="mode='plan';reset()">修改行程</button></div>
  <p class="pm-note">概念商品與示範價格，照片為情境參考；不會實際扣點、付款或預訂。日期、庫存及服務範圍尚待確認。</p>
  <p v-if="error" class="pm-error" role="alert">{{error}}</p>
  <template v-if="done && selected">
   <div class="pm-success" role="status"><span>✓</span><h3 ref="heading" tabindex="-1">示範安排已儲存</h3><p>{{selected.name}}</p><p>使用 {{fmt(quote.points)}} 點，另付 NT${{fmt(quote.cash)}}（未實際付款）。</p><p>{{attach?'行程中的這一站已替換。':'已存入旅後服務券，原行程不變。'}}</p></div><button class="pm-primary" @click="reset">繼續挑選商品</button>
  </template>
  <template v-else-if="selected">
   <button class="pm-back" @click="reset">← 返回商品</button>
   <div class="pm-photo detail"><img v-if="!broken[selected.id]" :src="selected.image" :alt="selected.name+'實景參考照片'" referrerpolicy="no-referrer" @error="broken[selected.id]=true"><span v-else>照片暫時無法載入</span><a :href="selected.source" target="_blank" rel="noopener noreferrer">照片：{{selected.credit}} ↗</a></div>
   <p class="pm-brand">{{selected.brand}} · {{selected.location}}</p><h3 ref="heading" tabindex="-1">{{selected.name}}</h3>
   <div class="pm-options"><button :aria-pressed="payment==='full'" @click="payment='full'">全點數換服務券<small>{{fmt(selected.price)}} 點{{wallet.balance<selected.price?' · 還差 '+fmt(selected.price-wallet.balance)+' 點':''}}</small></button><button :aria-pressed="payment==='partial'" @click="payment='partial'">預訂時折抵<small>{{fmt(selected.partial)}} 點＋NT${{fmt(selected.price-selected.partial)}}</small></button></div>
   <dl class="pm-receipt"><div><dt>本次使用</dt><dd>{{fmt(quote.points)}} 點</dd></div><div><dt>使用後餘額</dt><dd>{{wallet.balance>=quote.points?fmt(wallet.balance-quote.points)+' 點':'點數不足'}}</dd></div><div><dt>另付金額</dt><dd>NT${{fmt(quote.cash)}}</dd></div></dl>
   <p class="pm-note">{{payment==='partial'?'此示範設定折抵 50%，餘額另付。':'兌換後存入服務券。'}} 正式商品之有效日期、預約方式與退改規則待合作方確認。</p>
   <template v-if="mode==='plan'"><p class="pm-note">{{reason(selected)||'附近的室內候選，所選時段足夠；實際交通仍需確認。'}}</p><label v-if="!reason(selected)" class="pm-check"><input v-model="attach" type="checkbox">替換第 {{(target?.day||0)+1}} 天 {{target?.time}} 的「{{target?.name}}」</label><p v-else class="pm-note">可先存為旅後服務券，不會改動這趟行程。</p></template>
   <button class="pm-primary" :disabled="!ready||busy||!activeId||wallet.balance<quote.points||attach&&!!reason(selected)" @click="confirm">{{busy?'儲存中…':wallet.balance<quote.points?'點數不足':attach?'模擬兌換並替換景點':'模擬兌換，存入服務券'}}</button>
  </template>
  <template v-else>
   <h3>{{mode==='shop'?'下一趟，用點數出發。':'看看這一站能用多少點數。'}}</h3>
   <template v-if="mode==='plan'"><label class="pm-target">想調整哪一站？<select v-model="targetKey"><option value="">選擇行程景點</option><option v-for="s in stops" :key="`${s.day}:${s.id}`" :value="`${s.day}:${s.id}`">第 {{s.day+1}} 天 {{s.time}} · {{s.name}}</option></select></label><p class="pm-note">{{activeTrip?.title}} · 海外與不同地區的商品不會替換目前景點。交通券另存為旅後使用。</p></template>
   <div class="pm-categories"><button v-for="c in [{id:'all',name:'全部體驗'},{id:'transport',name:'交通服務'},{id:'activity',name:'景點與體驗'}]" :key="c.id" :aria-pressed="category===c.id" @click="category=c.id">{{c.name}}</button></div><label class="pm-check"><input v-model="affordable" type="checkbox">只看目前點數足夠的方案（含點數＋現金）</label>
   <div class="pm-grid"><article v-for="p in products" :key="p.id" class="pm-card"><div class="pm-photo"><img v-if="!broken[p.id]" :src="p.image" :alt="p.name+'實景參考照片'" referrerpolicy="no-referrer" loading="lazy" @error="broken[p.id]=true"><span v-else>照片暫時無法載入</span><b>{{p.kind==='activity'?'旅遊體驗':'交通服務'}}</b><a :href="p.source" target="_blank" rel="noopener noreferrer">照片：{{p.credit}} ↗</a></div><div class="pm-card-body"><small>{{p.brand}} · {{p.location}}</small><h4>{{p.name}}</h4><span class="pm-tag">和泰 Points · 示範</span><strong>{{fmt(p.price)}} <small>點全額兌換</small></strong><p class="pm-availability">{{wallet.balance>=p.price?'✓ 目前點數可全額兌換':wallet.balance>=p.partial?fmt(p.partial)+' 點＋NT$'+fmt(p.price-p.partial):'折抵方案還差 '+fmt(p.partial-wallet.balance)+' 點'}}</p><p v-if="mode==='plan'" class="pm-fit">{{reason(p)||'✓ 地區與預留時間符合，可替換此站'}}</p><button class="pm-primary" @click="open(p)">選擇兌換方案 →</button></div></article></div><p v-if="!products.length" class="pm-note">目前沒有符合的商品，取消篩選可查看其他選項。</p>
  </template>
  <details class="pm-vouchers"><summary>我的示範服務券 · {{orders.length}} 張</summary><p v-if="!orders.length">兌換成功後會顯示在這裡。</p><article v-for="o in orders" :key="o.id"><b>{{pointsProducts.find(p=>p.id===o.productId)?.name}}</b><small>{{o.points}} 點＋NT${{o.cash}} · {{o.targetId===null?'旅後使用，未變更行程':'已加入第 '+((o.day||0)+1)+' 天'}}</small><span>未實際預訂 · 僅存此瀏覽器</span></article></details>
 </section>
</template>

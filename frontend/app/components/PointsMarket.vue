<script setup lang="ts">
import { pointsProducts, pointsQuote, pointsKindLabels, type PointsProduct, type Payment } from '~/utils/points';
import '~/assets/css/points-market.css';
defineProps<{planning?:boolean}>();
const {activeId,activeTrip,tripHref}=useTripContext();
const {wallet,ready,error,busy,redeem,cancel}=usePointsWallet();
const asset=useAsset(),route=useRoute();
const category=ref('all'),brand=ref(''),query=ref(''),affordable=ref(false),selected=ref<PointsProduct|null>(null),payment=ref<Payment>('full'),done=ref(false);
const heading=ref<HTMLElement>(),broken=ref<Record<string,boolean>>({});
const products=computed(()=>pointsProducts.filter(p=>category.value==='all'||p.kind===category.value).filter(p=>!brand.value||p.brand===brand.value).filter(p=>!query.value||(p.name+p.brand+p.location).toLowerCase().includes(query.value.toLowerCase())).filter(p=>!affordable.value||wallet.value.balance>=p.partial));
const brands=[...new Set(pointsProducts.map(p=>p.brand))];
const quote=computed(()=>selected.value?pointsQuote(selected.value,payment.value):{points:0,cash:0});
const orders=computed(()=>[...wallet.value.orders].filter(o=>o.tripId===activeId.value).reverse());
const owned=computed(()=>!!selected.value&&orders.value.some(o=>o.productId===selected.value!.id));
const fmt=(n:number)=>n.toLocaleString('zh-TW');
function reset(){selected.value=null;done.value=false;}
watch(activeId,reset);
async function focus(){await nextTick();heading.value?.focus();}
function open(p:PointsProduct){selected.value=p;payment.value=wallet.value.balance>=p.price?'full':'partial';done.value=false;void focus();}
async function confirm(){const p=selected.value;if(!p||!activeId.value||owned.value)return;if(await redeem(p,payment.value,activeId.value)){done.value=true;void focus();}}
onMounted(()=>{const p=pointsProducts.find(p=>p.id===route.query.product);if(p)open(p);});
</script>
<template>
 <section class="pm" aria-label="和泰旅行商店">
  <div class="pm-wallet"><div><span>我的和泰 Points · 示範帳戶</span><strong>{{fmt(wallet.balance)}} <small>點</small></strong><p>起始 1,200 點 · {{activeTrip?.title || '請先選擇旅行'}} </p></div><span class="pm-coin" aria-hidden="true">P</span></div>
  <p class="pm-note">先兌換，再讓 AI 參考已兌換服務安排旅行。商品、價格與兌換為 Demo；未連接真實帳戶，不會實際扣點、付款或預訂。</p>
  <p v-if="error" class="pm-error" role="alert">{{error}}</p>
  <template v-if="done && selected">
   <div class="pm-success" role="status"><span>✓</span><h3 ref="heading" tabindex="-1">已加入我的服務券</h3><p>{{selected.brand}} · {{selected.name}}</p><p>示範使用 {{fmt(quote.points)}} 點{{quote.cash?'，另付 NT$'+fmt(quote.cash):''}}。</p><p>AI 排行程會參考這張券的地區與服務，安排合適的景點和交通。</p></div>
   <NuxtLink class="pm-plan-link" :to="tripHref('/planner',{redeemed:'1'})">帶著已兌換服務，AI 排行程 →</NuxtLink><button class="pm-back" @click="reset">繼續逛商店</button>
  </template>
  <template v-else-if="selected">
   <button class="pm-back" @click="reset">← 返回商店</button>
   <div class="pm-photo detail"><img v-if="selected.image && !broken[selected.id]" :src="asset(selected.image)" :alt="selected.name+'參考照片'" referrerpolicy="no-referrer" decoding="async" @error="broken[selected.id]=true"><span v-else class="pm-brand-art">{{selected.brand}}<small>{{pointsKindLabels[selected.kind]}}</small></span><a :href="selected.source" target="_blank" rel="noopener noreferrer">{{selected.image?'照片／':'服務'}}來源：{{selected.credit}} ↗</a></div>
   <p class="pm-brand">{{selected.brand}} · {{selected.location}}</p><h3 ref="heading" tabindex="-1">{{selected.name}}</h3><p class="pm-note">{{selected.description || '兌換後存入這趟旅行，AI 依景點位置、時間與服務範圍提出建議。'}}</p>
   <div v-if="selected.price" class="pm-options"><button :aria-pressed="payment==='full'" @click="payment='full'">全點數兌換<small>{{fmt(selected.price)}} 點{{wallet.balance<selected.price?' · 還差 '+fmt(selected.price-wallet.balance)+' 點':''}}</small></button><button :aria-pressed="payment==='partial'" @click="payment='partial'">點數＋現金<small>{{fmt(selected.partial)}} 點＋NT${{fmt(selected.price-selected.partial)}}</small></button></div>
   <dl class="pm-receipt"><div><dt>示範使用點數</dt><dd>{{fmt(quote.points)}} 點</dd></div><div><dt>使用後餘額</dt><dd>{{wallet.balance>=quote.points?fmt(wallet.balance-quote.points)+' 點':'點數不足'}}</dd></div><div v-if="quote.cash"><dt>另付金額</dt><dd>NT${{fmt(quote.cash)}}（示範）</dd></div></dl>
   <p class="pm-note">服務適用地區：{{selected.location}}。正式商品的日期、庫存、使用與退改規則依合作通路。</p>
   <button class="pm-primary" :disabled="!ready||busy||!activeId||owned||wallet.balance<quote.points" @click="confirm">{{busy?'儲存中…':owned?'這趟旅行已兌換':wallet.balance<quote.points?'點數不足':selected.price?'示範兌換，存入我的服務券':'加入服務準備清單'}}</button>
  </template>
  <template v-else>
   <h3>和泰服務，一起帶上旅程。</h3>
   <div class="pm-search"><label><span class="sr-only">搜尋和泰服務</span><input v-model="query" type="search" placeholder="找交通、上網、體驗或品牌"></label><select v-model="brand" aria-label="篩選和泰品牌"><option value="">所有品牌</option><option v-for="b in brands" :key="b">{{b}}</option></select></div>
   <div class="pm-categories"><button :aria-pressed="category==='all'" @click="category='all'">全部服務</button><button v-for="(label,id) in pointsKindLabels" :key="id" :aria-pressed="category===id" @click="category=id">{{label}}</button></div>
   <label class="pm-check"><input v-model="affordable" type="checkbox">只看目前點數足夠的方案</label><p class="pm-note">{{products.length}} 項服務 · {{brands.length}} 個品牌</p>
   <div class="pm-grid"><article v-for="p in products" :key="p.id" class="pm-card"><div class="pm-photo"><img v-if="p.image && !broken[p.id]" :src="asset(p.image)" :alt="p.name+'參考照片'" referrerpolicy="no-referrer" loading="lazy" decoding="async" @error="broken[p.id]=true"><span v-else class="pm-brand-art">{{p.brand}}<small>{{pointsKindLabels[p.kind]}}</small></span><b>{{pointsKindLabels[p.kind]}}</b><a :href="p.source" target="_blank" rel="noopener noreferrer">來源：{{p.credit}} ↗</a></div><div class="pm-card-body"><small>{{p.brand}} · {{p.location}}</small><h4>{{p.name}}</h4><span class="pm-tag">{{p.price?'和泰 Points · 示範兌換':'服務諮詢 · 不扣示範點數'}}</span><strong>{{p.price?fmt(p.price)+' 點':'加入準備清單'}}</strong><p class="pm-availability">{{orders.some(o=>o.productId===p.id)?'✓ 這趟旅行已兌換':wallet.balance>=p.price?'✓ 可加入這趟旅行':fmt(p.partial)+' 點＋NT$'+fmt(p.price-p.partial)}}</p><button class="pm-primary" @click="open(p)">{{orders.some(o=>o.productId===p.id)?'查看已兌換服務':'查看與兌換 →'}}</button></div></article></div><p v-if="!products.length" class="pm-note">沒有符合的服務，試試其他品牌或取消篩選。</p>
  </template>
  <details class="pm-vouchers"><summary>這趟旅行的服務券 · {{orders.length}} 張</summary><p v-if="!orders.length">兌換後，AI 排行程會讀取這裡的服務。</p><article v-for="o in orders" :key="o.id"><b>{{pointsProducts.find(p=>p.id===o.productId)?.brand}} · {{pointsProducts.find(p=>p.id===o.productId)?.name}}</b><small>{{o.points}} 點{{o.cash?'＋NT$'+o.cash:''}} · {{activeTrip?.title}}</small><span>示範紀錄 · 未實際預訂</span><button :disabled="busy" @click="cancel(o.id)">取消示範兌換，退回 {{o.points}} 點</button></article></details>
  <a class="pm-official" href="https://www.hotaimember.com.tw/partners/" target="_blank" rel="noopener">官方合作通路與使用條件 ↗</a>
 </section>
</template>

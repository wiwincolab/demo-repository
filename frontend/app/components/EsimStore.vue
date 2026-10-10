<script setup lang="ts">
import { esimProducts, esimDestinations, esimKindLabels, esimProductSpecs, esimStoreSource, type EsimProduct, type EsimProductKind } from '~/data/esim-store';
import '~/assets/css/esim-store.css';

const asset = useAsset();
const search = ref('');
const destination = ref('all');
const kind = ref<EsimProductKind | 'all'>('all');
const sort = ref('popular');
const page = ref(1);
const pageSize = 12;
const resultsHeading = ref<HTMLElement>();
const selected = ref<EsimProduct | null>(null);
const detailsOpen = computed({ get: () => selected.value !== null, set: (open: boolean) => { if (!open) selected.value = null; } });
const specs = computed(() => selected.value ? esimProductSpecs[`${selected.value.destinationCode}/${selected.value.kind}`] : undefined);
const kinds = [{ value: 'all' as const, label: '全部方案' }, ...Object.entries(esimKindLabels).map(([value, label]) => ({ value: value as EsimProductKind, label }))];
const shortcuts = ['japan', 'korea', 'thailand', 'hongkong-macau', 'china', 'vietnam', 'europe', 'unitedstates'];
const popularDestinations = esimDestinations.filter(d => shortcuts.includes(d.code));
const filtered = computed(() => {
  const query = search.value.trim().toLocaleLowerCase();
  const items = esimProducts.filter(product =>
    (destination.value === 'all' || product.destinationCode === destination.value) &&
    (kind.value === 'all' || product.kind === kind.value) &&
    (!query || [product.name, product.destinationCode, ...product.tags].join(' ').toLocaleLowerCase().includes(query)),
  );
  if (sort.value === 'price-asc') return items.sort((a, b) => a.price - b.price);
  if (sort.value === 'price-desc') return items.sort((a, b) => b.price - a.price);
  return items;
});
const pageCount = computed(() => Math.ceil(filtered.value.length / pageSize));
const visibleProducts = computed(() => filtered.value.slice((page.value - 1) * pageSize, page.value * pageSize));
const money = (value: number) => value.toLocaleString('zh-TW');
watch([search, destination, kind, sort], () => { page.value = 1; });
async function changePage(value: number) {
  page.value = value;
  await nextTick();
  resultsHeading.value?.scrollIntoView({ block: 'start', behavior: 'instant' });
  resultsHeading.value?.focus({ preventScroll: true });
}
function resetFilters() { search.value = ''; destination.value = 'all'; kind.value = 'all'; }
</script>

<template>
  <section class="esim-store" aria-labelledby="esim-store-title">
    <header class="esim-store-heading">
      <div><h1 id="esim-store-title">eSIM 商城</h1><p>旅行上網，選好再出發</p></div>
      <a :href="esimStoreSource.help" target="_blank" rel="noopener noreferrer" class="esim-store-help" aria-label="eSIM 常見問題" title="eSIM 常見問題"><EsimIcon name="info" :size="23"/></a>
    </header>

    <label class="esim-store-search"><span class="esim-store-label">搜尋方案</span><input v-model="search" type="search" placeholder="國家、地區或電信商" autocomplete="off"/></label>
    <div class="esim-store-destinations" aria-label="熱門目的地">
      <button :aria-pressed="destination==='all'" @click="destination='all'">全部</button>
      <button v-for="place in popularDestinations" :key="place.code" :aria-pressed="destination===place.code" @click="destination=place.code">{{ place.name }}</button>
    </div>
    <div class="esim-store-filters">
      <label><span>目的地</span><select v-model="destination"><option value="all">所有目的地</option><option v-for="place in esimDestinations" :key="place.code" :value="place.code">{{ place.name }}</option></select></label>
      <label><span>排序</span><select v-model="sort"><option value="popular">熱門商品</option><option value="price-asc">價格低到高</option><option value="price-desc">價格高到低</option></select></label>
    </div>
    <div class="esim-store-kinds" aria-label="流量類型"><button v-for="option in kinds" :key="option.value" :aria-pressed="kind===option.value" @click="kind=option.value">{{ option.label }}</button></div>

    <div ref="resultsHeading" class="esim-store-results" tabindex="-1"><h2>{{ destination==='all'?'全部商品':esimDestinations.find(d=>d.code===destination)?.name+'上網方案' }}</h2><span role="status" aria-live="polite">{{ filtered.length }} 項商品</span></div>
    <div v-if="visibleProducts.length" class="esim-store-grid">
      <article v-for="product in visibleProducts" :key="product.id" class="esim-store-product">
        <button :aria-label="`${product.name}，NT$${money(product.price)}起，查看方案`" @click="selected=product">
          <div class="esim-store-image"><img :src="asset(product.image)" :alt="product.name+' 官方商品圖片'" width="1080" height="1080" loading="lazy"/><span class="esim-store-discount">85 折</span></div>
          <div class="esim-store-product-copy">
            <strong>{{ product.destination }} eSIM</strong><span class="esim-store-product-kind">{{ esimKindLabels[product.kind] }}</span><span class="esim-store-carrier">{{ product.carrier }}</span>
            <div class="esim-store-tags"><span v-for="tag in product.tags.slice(1)" :key="tag">{{ tag }}</span></div>
            <div class="esim-store-price"><strong><small>NT$</small>{{ money(product.price) }}<small>起</small></strong><del>NT${{ money(product.originalPrice) }}</del></div>
            <span class="esim-store-product-action">查看方案<EsimIcon name="arrow" :size="15"/></span>
          </div>
        </button>
      </article>
    </div>
    <div v-else class="esim-store-empty"><EsimIcon name="sim" :size="36"/><h3>沒有符合的方案</h3><button @click="resetFilters">查看全部商品</button></div>

    <nav v-if="pageCount>1" class="esim-store-pagination" aria-label="商品分頁">
      <button aria-label="上一頁商品" title="上一頁" :disabled="page===1" @click="changePage(page-1)"><EsimIcon name="arrow" :size="19"/></button><span>第 {{ page }} / {{ pageCount }} 頁</span><button aria-label="下一頁商品" title="下一頁" :disabled="page===pageCount" @click="changePage(page+1)"><EsimIcon name="arrow" :size="19"/></button>
    </nav>
    <footer class="esim-store-footer"><p>價格查核 {{ esimStoreSource.checkedAt }} · 規格與售價以官網為準</p><a :href="esimStoreSource.customerService" target="_blank" rel="noopener noreferrer">24 小時中文客服<EsimIcon name="arrow" :size="15"/></a></footer>

    <AppSheet v-model="detailsOpen" title="方案詳情" class="esim-store-sheet">
      <template v-if="selected">
        <img class="esim-store-detail-image" :src="asset(selected.image)" :alt="selected.name+' 官方商品圖片'" width="1080" height="1080"/>
        <h3>{{ selected.name }}</h3>
        <div class="esim-store-detail-tags"><span v-for="tag in selected.tags" :key="tag">{{ tag }}</span></div>
        <div class="esim-store-detail-price"><strong>NT${{ money(selected.price) }}<small> 起</small></strong><del>NT${{ money(selected.originalPrice) }}</del></div>
        <dl v-if="specs" class="esim-store-specs"><div><dt>{{ selected.kind==='daily-data'?'每日流量':'流量規格' }}</dt><dd>{{ specs.volumes.join(' / ') }}</dd></div><div><dt>電信商</dt><dd>{{ specs.carriers.join(' / ') }}</dd></div><div><dt>使用天數</dt><dd>{{ specs.days.join('、') }} 天</dd></div></dl>
        <p class="esim-store-price-note">以上為商品最低起價；各流量、電信商與天數的可用組合及金額，請至官網選擇確認。</p>
        <a class="esim-store-buy" :href="selected.source" target="_blank" rel="noopener noreferrer">前往官網選規格<EsimIcon name="arrow" :size="18"/></a>
        <div class="esim-store-support"><a :href="esimStoreSource.help" target="_blank" rel="noopener noreferrer">安裝與支援裝置</a><a :href="esimStoreSource.customerService" target="_blank" rel="noopener noreferrer">中文客服</a></div>
      </template>
    </AppSheet>
  </section>
</template>

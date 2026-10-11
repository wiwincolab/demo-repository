<script setup lang="ts">
import { storeCategories, storeServices } from '~/data/travel-store';
import '~/assets/css/travel-store.css';
const route = useRoute();
const router = useRouter();
const { activeTrip, activeId, tripHref } = useTripContext();
const category = computed(() => storeCategories.find(item => item.id === route.query.category)?.id || 'all');
const services = computed(() => storeServices.filter(item => category.value === 'all' || item.category === category.value));
const pointsHref = computed(() => activeId.value ? tripHref('/points') : { path: '/trips', query: { next: '/points' } });
function chooseCategory(id: typeof storeCategories[number]['id']) {
  void router.replace({ path: '/store', query: { ...route.query, category: id === 'all' ? undefined : id } });
}
useHead({ title: '和泰商城 · eSIM、機票與旅遊行程 · 去趣', meta: [{ name: 'description', content: '從去趣出發，在同一商城挑選 eSIM、機票、旅遊行程、景點體驗與 HOTAI購旅行用品。' }] });
</script>

<template>
  <section class="travel-store" aria-labelledby="travel-store-title">
    <header class="store-heading">
      <div><p class="store-eyebrow">TRAVEL & MORE</p><h1 id="travel-store-title">和泰商城 <PageMascot /></h1><p>eSIM、機票與行程，一次準備好。</p></div>
      <NuxtLink class="store-journey-link" :to="activeTrip ? tripHref('/trip') : '/trips'">{{ activeTrip ? '回到我的行程' : '我的行程' }} <span aria-hidden="true">→</span></NuxtLink>
    </header>

    <div v-if="category !== 'esim'" class="store-welcome">
      <span class="store-welcome-icon"><StoreIcon name="bag" /></span>
      <div><strong>從想去，到準備出發。</strong><p>挑選上網方案、機票與旅行好物。</p></div>
    </div>

    <nav class="store-categories" aria-label="商城服務分類">
      <button v-for="item in storeCategories" :key="item.id" :aria-pressed="category === item.id" @click="chooseCategory(item.id)">{{ item.label }}</button>
    </nav>

    <div v-if="category === 'esim'" class="store-esim-panel"><EsimExperience /></div>
    <template v-else>
    <div class="store-results-heading"><h2>{{ category === 'all' ? '旅行預訂與選購' : storeCategories.find(item => item.id === category)?.label }}</h2><span role="status" aria-live="polite">{{ services.length + (category === 'all' ? 1 : 0) }} 個購買入口</span></div>
    <div class="store-grid">
      <article v-if="category === 'all'" class="store-card store-card-esim">
        <div class="store-card-top"><span class="store-service-icon"><StoreIcon name="sim" /></span><span class="store-provider">去趣 eSIM</span></div>
        <h3>旅行上網，選好再出發</h3><p>瀏覽各國上網方案，比較流量、電信商與天數，也能查看本趟推薦。</p>
        <button class="store-purchase" @click="chooseCategory('esim')">選購 eSIM <span aria-hidden="true">→</span></button><small>在商城內瀏覽方案，至去趣官網完成購買</small>
      </article>
      <article v-for="service in services" :key="service.id" class="store-card" :class="`store-card-${service.category}`">
        <div class="store-card-top"><span class="store-service-icon"><StoreIcon :name="service.icon" /></span><span class="store-provider">{{ service.provider }}</span></div>
        <h3>{{ service.title }}</h3><p>{{ service.description }}</p>
        <a class="store-purchase" :href="service.url" target="_blank" rel="noopener noreferrer" :aria-label="`${service.action}，前往 ${service.provider}（另開分頁）`">{{ service.action }} <span aria-hidden="true">↗</span></a>
        <small>於 {{ service.provider }} 完成{{ service.category === 'shopping' ? '選購與付款' : '預訂與付款' }}</small>
      </article>
    </div>
    <p class="store-booking-note">商品價格、名額、退改與點數折抵規則，以各平台商品及結帳頁為準。預訂完成後，請至購買平台查看訂單。</p>
    </template>

    <section class="store-preparation" aria-labelledby="store-preparation-title">
      <h2 id="store-preparation-title">出發前，再準備一下</h2>
      <div class="store-preparation-links">
        <button v-if="category !== 'esim'" @click="chooseCategory('esim')"><span class="store-prep-icon"><StoreIcon name="sim" /></span><span><strong>去趣 eSIM</strong><small>挑選旅行上網方案</small></span><span aria-hidden="true">→</span></button>
        <NuxtLink :to="pointsHref"><span class="store-prep-icon store-prep-points"><StoreIcon name="points" /></span><span><strong>和泰點數服務</strong><small>查看這趟旅行的示範兌換</small></span><span aria-hidden="true">→</span></NuxtLink>
      </div>
    </section>
    <a class="store-offer-link" href="https://www.chictrip.com.tw/blog/country/world/chictripkkday_promo" target="_blank" rel="noopener noreferrer">查看去趣 × KKday 最新優惠與使用條件 <span aria-hidden="true">↗</span></a>
  </section>
</template>

<script setup lang="ts">
import type { Poi, PoiCatalog, PoiCountry, PoiRegion, PoiSnapshot } from '~/types/poi';
import { filterPois } from '~/utils/poi';
import { createPoiRepository } from '~/utils/planner-poi';
const asset=useAsset(), route=useRoute();
const catalog=shallowRef<PoiCatalog | null>(null), pois=shallowRef<Poi[]>([]), country=ref<PoiCountry>('JP'), regionId=ref('jp-tokyo');
const loading=ref(true), error=ref(''), query=ref(''), category=ref(''), photosOnly=ref(false), limit=ref(36), selected=ref<string | null>(null);
const repository=createPoiRepository((url,signal)=>$fetch(url,{timeout:8000,signal}),asset);
const countries=[{id:'JP' as const,name:'日本'},{id:'KR' as const,name:'韓國'},{id:'TW' as const,name:'台灣'}];
const regions=computed(()=>catalog.value?.regions.filter(r=>r.country===country.value) || []);
const region=computed<PoiRegion | null>(()=>catalog.value?.regions.find(r=>r.id===regionId.value) || null);
const categories=computed(()=>[...new Map(pois.value.map(p=>[p.category,p.categoryLabel])).entries()].sort((a,b)=>a[1].localeCompare(b[1],'zh-Hant')));
const filtered=computed(()=>filterPois(pois.value,query.value,category.value,photosOnly.value));
const cards=computed(()=>filtered.value.slice(0,limit.value));
const detail=computed(()=>pois.value.find(p=>p.id===selected.value) || null);
const imageFailures=ref<string[]>([]);
let controller:AbortController | undefined;
async function loadRegion() {
  controller?.abort();controller=new AbortController();const signal=controller.signal;
  pois.value=[];selected.value=null;query.value='';category.value='';limit.value=36;imageFailures.value=[];error.value='';loading.value=true;
  if(!region.value?.file){loading.value=false;error.value='這個區域的景點資料尚未完成，請先查看其他區域。';return;}
  try {
    const data=await repository.region(region.value,signal);
    if(!signal.aborted)pois.value=data.pois;
  } catch {if(!signal.aborted)error.value='景點載入失敗，請重試。';}
  finally {if(!signal.aborted)loading.value=false;}
}
watch(country,()=>{const available=regions.value.find(r=>r.file) || regions.value[0];if(available)regionId.value=available.id;}, {flush:'sync'});
watch(regionId,()=>{if(catalog.value)void loadRegion();});
watch([query,category,photosOnly],()=>{limit.value=36;selected.value=null;});
onMounted(async()=>{
  try {
    catalog.value=await repository.catalog();
    const initial=catalog.value.regions.find(r=>r.id===route.query.region && r.file) || catalog.value.regions.find(r=>r.id==='jp-tokyo' && r.file) || catalog.value.regions.find(r=>r.file);
    if(initial){country.value=initial.country;regionId.value=initial.id;await loadRegion();}
    else {loading.value=false;error.value='景點資料正在整理中。';}
  } catch {loading.value=false;error.value='景點資料暫時無法開啟，請重新整理後再試。';}
});
onBeforeUnmount(()=>controller?.abort());
function show(id:string){selected.value=id;}
function imageFailed(id:string){if(!imageFailures.value.includes(id))imageFailures.value.push(id);}
</script>
<template>
  <section class="screen active poi-screen">
    <div class="page-heading"><span class="eyebrow">EXPLORE JAPAN · KOREA · TAIWAN</span><h1>下一站，想去哪裡？</h1><p>從地圖找景點，看看照片，再決定想去的地方。</p></div>
    <div class="poi-countries" aria-label="目的地國家"><button v-for="item in countries" :key="item.id" :aria-pressed="country===item.id" @click="country=item.id">{{ item.name }}</button></div>
    <div class="poi-filters"><label>旅遊區域<select v-model="regionId"><option v-for="r in regions" :key="r.id" :value="r.id" :disabled="!r.file">{{ r.name }}{{ !r.file ? ' · 整理中' : '' }}</option></select></label><label>景點分類<select v-model="category"><option value="">全部景點</option><option v-for="[id,name] in categories" :key="id" :value="id">{{ name }}</option></select></label></div>
    <label class="poi-search"><span>找景點</span><input v-model="query" type="search" placeholder="搜尋名稱、地址或特色" maxlength="100"></label>
    <div class="poi-summary"><span role="status">{{ loading ? '正在載入景點…' : `${region?.name || ''} · ${filtered.length.toLocaleString()} 個景點` }}</span><label><input v-model="photosOnly" type="checkbox">只看有照片</label></div>
    <p v-if="error" class="poi-error" role="alert">{{ error }} <button v-if="catalog" @click="loadRegion">重試</button></p>
    <PoiMap :pois="filtered" :region="region" :selected="selected" @select="show" />
    <p class="poi-note">照片圓點可查看景點照片，灰點的照片待補；數字代表附近景點，點選可放大。旅遊區域可能包含周邊景點。</p>
    <p v-if="!loading && !filtered.length && !error" class="poi-empty">沒有符合條件的景點，試試其他分類或搜尋文字。</p>
    <div class="poi-cards"><button v-for="p in cards" :key="p.id" class="poi-card" @click="show(p.id)"><img referrerpolicy="no-referrer" v-if="p.photo && !imageFailures.includes(p.id)" :src="asset(p.photo.src)" :alt="p.name + '景點照片'" loading="lazy" decoding="async" width="320" height="200" @error="imageFailed(p.id)"><span v-else class="poi-no-photo">{{ p.photo ? '照片暫時無法載入' : '景點照片待補' }}</span><span class="poi-card-text"><small>{{ p.categoryLabel }}</small><b>{{ p.name }}</b><span>{{ p.description || p.address || p.localName }}</span></span></button></div>
    <button v-if="filtered.length > limit" class="secondary" @click="limit+=36">再看更多景點（{{ filtered.length-limit }}）</button>
    <p v-if="catalog" class="poi-note">已整理 {{ catalog.totalUnique.toLocaleString() }} 個景點，其中 {{ catalog.totalWithPhoto.toLocaleString() }} 個有照片。<a :href="asset('poi/index.json')" target="_blank" rel="noopener">資料目錄 ↗</a> · <a v-if="region?.file" :href="asset('poi/' + region.file)" target="_blank" rel="noopener">下載此區資料 ↗</a></p>
    <p class="poi-note">景點資料 © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap contributors（ODbL）</a>；中文名稱與簡介來自 <a href="https://www.wikidata.org/wiki/Wikidata:Licensing" target="_blank" rel="noopener">Wikidata（CC0）</a>。照片來源與授權資訊列在各景點詳情。資料更新：{{ region?.fetchedAt ? new Date(region.fetchedAt).toLocaleDateString('zh-TW', { timeZone:'Asia/Taipei' }) : '整理中' }}。</p>
    <AppSheet :model-value="!!detail" :title="detail?.name || '景點詳情'" @update:model-value="selected=null">
      <template v-if="detail">
        <img referrerpolicy="no-referrer" v-if="detail.photo && !imageFailures.includes(detail.id)" class="poi-detail-photo" :src="asset(detail.photo.src)" :alt="detail.name + '景點照片'" @error="imageFailed(detail.id)">
        <p v-else class="poi-empty">{{ detail.photo ? '照片暫時無法載入。' : '尚未找到這個景點的照片。' }}</p>
        <p v-if="detail.photo" class="poi-note">照片：{{ detail.photo.credit }} · <a v-if="detail.photo.licenseUrl" :href="detail.photo.licenseUrl" target="_blank" rel="noopener">{{ detail.photo.license }}</a><template v-else>{{ detail.photo.license }}</template> · <a :href="detail.photo.source" target="_blank" rel="noopener">原始來源 ↗</a></p>
        <p>{{ detail.description || detail.categoryLabel }}</p>
        <dl class="poi-details"><template v-if="detail.localName!==detail.name"><dt>當地名稱</dt><dd>{{ detail.localName }}</dd></template><dt>座標</dt><dd>{{ detail.at[1]?.toFixed(5) }}, {{ detail.at[0]?.toFixed(5) }}</dd><template v-if="detail.address"><dt>地址</dt><dd>{{ detail.address }}</dd></template><template v-if="detail.openingHours"><dt>開放時間</dt><dd>{{ detail.openingHours }}</dd></template><template v-if="detail.phone"><dt>電話</dt><dd>{{ detail.phone }}</dd></template><template v-if="detail.fee"><dt>收費標記</dt><dd>{{ detail.fee }}</dd></template><template v-if="detail.wheelchair"><dt>輪椅通行標記</dt><dd>{{ detail.wheelchair }}</dd></template></dl>
        <p class="poi-note">開放時間、收費與設施以現場及官網公告為準；空白欄位代表來源未提供。</p>
        <div class="poi-links"><a v-if="detail.website" class="primary" :href="detail.website" target="_blank" rel="noopener">景點官網 ↗</a><a class="secondary" :href="detail.source.url" target="_blank" rel="noopener">OpenStreetMap 景點 ↗</a><a v-if="detail.wikidata && !detail.wikidataMismatch" :href="'https://www.wikidata.org/wiki/' + detail.wikidata" target="_blank" rel="noopener">Wikidata 來源 ↗</a></div>
      </template>
    </AppSheet>
  </section>
</template>
<style scoped>
.poi-screen{padding:0 18px 30px}.poi-screen .page-heading{padding-inline:0}.poi-countries{display:flex;gap:8px;margin:12px 0 18px}.poi-countries button{flex:1;padding:12px;border:1px solid #d3e3ea;background:white;border-radius:12px;color:#476777;font-weight:600}.poi-countries button[aria-pressed=true]{background:#e7f6fb;border-color:#009fc5;color:#007f9e}.poi-filters{display:grid;grid-template-columns:1.5fr 1fr;gap:12px}.poi-filters label,.poi-search{display:flex;flex-direction:column;gap:6px;font-size:12px;color:#476777}.poi-filters select,.poi-search input{width:100%;min-width:0;padding:12px;border:1px solid #d3e3ea;border-radius:10px;background:white;color:#274e64;font:inherit;font-size:14px}.poi-search{margin:14px 0}.poi-summary{display:flex;justify-content:space-between;align-items:center;gap:12px;margin:16px 0;font-size:12px;color:#426879}.poi-summary label{white-space:nowrap;display:flex;gap:5px;align-items:center}.poi-cards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:18px 0}.poi-card{padding:0;background:white;border:1px solid #dbe6eb;border-radius:14px;text-align:left;overflow:hidden;min-width:0;color:#244e64}.poi-card img,.poi-no-photo{display:block;width:100%;height:120px;object-fit:cover}.poi-no-photo{display:grid;place-items:center;background:#edf3f5;color:#718894;font-size:11px}.poi-card-text{display:flex;flex-direction:column;gap:5px;padding:12px}.poi-card-text small{font-size:10px;color:#008daf}.poi-card-text b{font-size:14px;line-height:1.5}.poi-card-text>span{font-size:11px;color:#718894;line-height:1.6;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.poi-note{font-size:11px;line-height:1.8;color:#718894;margin:14px 0}.poi-note a{color:#007fa2}.poi-error{padding:12px;background:#fff4eb;color:#95532a;font-size:13px;border-radius:10px}.poi-empty{padding:24px;text-align:center;color:#718894}.poi-detail-photo{width:100%;max-height:340px;object-fit:cover;border-radius:12px}.poi-details{display:grid;grid-template-columns:92px 1fr;gap:10px;font-size:13px;line-height:1.7}.poi-details dt{color:#718894}.poi-details dd{margin:0;overflow-wrap:anywhere}.poi-links{display:flex;flex-direction:column;gap:10px}.poi-card:focus-visible,.poi-countries button:focus-visible{outline:3px solid #ffc500;outline-offset:2px}@media(min-width:720px){.poi-cards{grid-template-columns:repeat(3,minmax(0,1fr))}.poi-card img,.poi-no-photo{height:160px}}
</style>

<style scoped>
@media(max-width:600px){.poi-screen{box-sizing:border-box;padding-inline:max(12px,env(safe-area-inset-left)) max(12px,env(safe-area-inset-right))}.poi-screen :deep(.poi-map-wrap){margin-inline:0}.poi-screen input:not([type=checkbox]),.poi-screen select{font-size:16px;min-height:44px}.poi-filters{grid-template-columns:repeat(2,minmax(0,1fr))}.poi-filters label{min-width:0}.poi-screen select{max-width:100%}}
</style>

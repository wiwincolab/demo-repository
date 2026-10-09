<script setup lang="ts">
import { mascots, type MascotId } from '~/data/mascots';
useHead({ title: '我的吉祥物 · 去趣 chicTrip' });
const asset = useAsset();
const { selectedId, ready, select } = useMascot();
const previewId = ref<MascotId>(selectedId.value);
const message = ref('');
const countries = ['全部', '日本', '台灣', '韓國'] as const;
const country = ref<typeof countries[number]>('全部');
const visibleMascots = computed(() => mascots.filter(mascot => country.value === '全部' || mascot.country === country.value));
watch(ready, value => { if (value) previewId.value = selectedId.value; }, { immediate: true });
const preview = computed(() => mascots.find(m => m.id === previewId.value)!);
const applied = computed(() => selectedId.value === previewId.value);
function show(id: MascotId) { previewId.value = id; message.value = ''; }
function browseCountry(value: typeof countries[number]) {
  country.value = value;
  if (!visibleMascots.value.some(mascot => mascot.id === previewId.value) && visibleMascots.value[0]) {
    show(visibleMascots.value[0].id);
  }
}
function apply() {
  const saved = select(previewId.value);
  message.value = saved ? `已換上${preview.value.name}，會陪你出現在 App 裡。` : '已換上。此瀏覽器暫時無法儲存，關閉後可能需要重新選擇。';
}
</script>

<template>
  <section class="wardrobe-page">
    <div class="wardrobe-top"><NuxtLink to="/atlas"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="m14 5-7 7 7 7M7 12h13"/></svg>回憶廣場</NuxtLink><span>景點限定系列 · {{ mascots.length }}</span></div>
    <header class="wardrobe-heading"><p>TRAVEL COMPANIONS</p><h1>今天，帶誰一起走？</h1><span>選一個喜歡的造型，當你的去趣吉祥物。</span></header>
    <div class="wardrobe-content">
      <div class="wardrobe-preview" :style="{ '--mascot-tone': preview.color }">
        <div class="wardrobe-art">
          <Transition name="companion" mode="out-in"><img :key="preview.id" :src="asset(preview.image)" :alt="`${preview.name}，${preview.outfit}`" /></Transition>
          <span class="wardrobe-location"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M16 8c0 4-6 9-6 9S4 12 4 8a6 6 0 0 1 12 0Z"/><circle cx="10" cy="8" r="2"/></svg>{{ preview.place }}</span>
        </div>
        <div class="wardrobe-caption"><div><span class="wardrobe-no">{{ String(mascots.findIndex(m => m.id === preview.id) + 1).padStart(2, '0') }} / {{ String(mascots.length).padStart(2, '0') }}</span><h2>{{ preview.name }}</h2></div><span v-if="applied" class="wardrobe-equipped">✓ 使用中</span><p>{{ preview.description }}</p><small>{{ preview.outfit }}</small></div>
      </div>
      <div class="wardrobe-collection">
        <div class="wardrobe-collection-title"><h2>旅伴圖鑑</h2><span>{{ visibleMascots.length }} 款造型</span></div>
        <div class="wardrobe-countries" role="group" aria-label="選擇造型地區">
          <button v-for="item in countries" :key="item" :aria-pressed="country === item" @click="browseCountry(item)">{{ item }} <span>{{ item === '全部' ? mascots.length : mascots.filter(mascot => mascot.country === item).length }}</span></button>
        </div>
        <div class="wardrobe-grid" role="group" aria-label="預覽吉祥物造型">
          <button v-for="mascot in visibleMascots" :key="mascot.id" :aria-pressed="previewId === mascot.id" :aria-label="`預覽${mascot.country}・${mascot.name}${selectedId === mascot.id ? '，使用中' : ''}`" @click="show(mascot.id)">
            <span class="wardrobe-thumb"><img :src="asset(mascot.image)" alt="" loading="lazy" decoding="async" /><span v-if="selectedId === mascot.id" class="wardrobe-check" aria-hidden="true">✓</span></span>
            <small>{{ mascot.country }} · {{ mascot.trip }}</small><strong>{{ mascot.name }}</strong>
          </button>
        </div>
        <div class="wardrobe-action"><button class="wardrobe-apply" :disabled="applied || !ready" @click="apply">{{ applied ? '目前的吉祥物' : '選為我的吉祥物' }}<span aria-hidden="true">{{ applied ? '✓' : '→' }}</span></button><p role="status" aria-live="polite">{{ message || '套用後，所有行程共用這個造型。' }}</p></div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.wardrobe-countries{display:flex;gap:7px;flex-wrap:wrap;margin:0 0 20px}.wardrobe-countries button{display:flex;align-items:center;gap:6px;min-height:44px;padding:8px 12px;border:1px solid #dce9eb;border-radius:22px;background:#f5fafb;color:#456673;font:inherit;font-size:12px;cursor:pointer}.wardrobe-countries button span{font-size:10px;opacity:.75}.wardrobe-countries button[aria-pressed=true]{background:#009fcc;border-color:#009fcc;color:white}.wardrobe-countries button:focus-visible{outline:3px solid #e6b84c;outline-offset:3px}
.wardrobe-page{max-width:1000px;margin:auto;padding:20px 32px 30px;color:#244653}.wardrobe-top{display:flex;justify-content:space-between;align-items:center;font-size:12px;color:#7b9198;gap:12px}.wardrobe-top a{display:flex;align-items:center;gap:8px;min-height:44px;color:#587c89;text-decoration:none}.wardrobe-top svg{width:20px;height:20px}.wardrobe-heading{margin:20px 0 28px}.wardrobe-heading p{font-size:10px;letter-spacing:.2em;color:#72909a;font-weight:600;margin:0 0 10px}.wardrobe-heading h1{font-size:30px;letter-spacing:.02em;line-height:1.4;margin:0 0 8px}.wardrobe-heading>span{font-size:14px;color:#78909a}.wardrobe-content{display:grid;grid-template-columns:1.05fr 1fr;gap:32px;align-items:start}.wardrobe-preview{background:var(--mascot-tone);border-radius:24px;overflow:hidden;transition:background .3s}.wardrobe-art{position:relative;aspect-ratio:1;overflow:hidden}.wardrobe-art>img{width:100%;height:100%;object-fit:cover;display:block}.wardrobe-location{position:absolute;left:16px;bottom:16px;padding:8px 11px;border:1px solid #ffffff90;border-radius:20px;background:#ffffffe6;backdrop-filter:blur(12px);font-size:11px;display:flex;gap:5px;align-items:center;color:#365966}.wardrobe-location svg{width:15px;height:15px}.wardrobe-caption{padding:20px;display:flex;align-items:center;flex-wrap:wrap;justify-content:space-between}.wardrobe-no{font-size:10px;letter-spacing:.12em;color:#69838b}.wardrobe-caption h2{margin:5px 0 0;font-size:22px}.wardrobe-caption p{width:100%;font-size:13px;line-height:1.7;margin:12px 0 4px}.wardrobe-caption small{font-size:11px;color:#6e858b}.wardrobe-equipped{font-size:11px;background:#ffffffbb;border-radius:15px;padding:7px 10px;color:#28795e}.wardrobe-collection-title{display:flex;justify-content:space-between;align-items:center;margin:3px 0 18px}.wardrobe-collection-title h2{margin:0;font-size:17px}.wardrobe-collection-title>span{font-size:12px;color:#889b9f}.wardrobe-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px 12px}.wardrobe-grid button{min-width:0;text-align:left;cursor:pointer;border:0;background:transparent;padding:0;color:#3a5662}.wardrobe-thumb{display:block;aspect-ratio:1;position:relative;border-radius:16px;box-shadow:0 0 0 1px #e7edef;overflow:hidden;border:3px solid transparent}.wardrobe-thumb img{display:block;width:100%;height:100%;object-fit:cover;transition:transform .25s}.wardrobe-grid button:hover img{transform:scale(1.04)}.wardrobe-grid button[aria-pressed=true] .wardrobe-thumb{border-color:#009fc5;box-shadow:0 0 0 3px #d9f1f8}.wardrobe-grid button:focus-visible{outline:3px solid #e6b84c;outline-offset:4px;border-radius:16px}.wardrobe-grid small{display:block;margin:9px 0 4px;color:#83969d;font-size:10px}.wardrobe-grid strong{display:block;font-size:12px;font-weight:600;line-height:1.4}.wardrobe-check{position:absolute;bottom:4px;right:4px;width:22px;height:22px;display:grid;place-items:center;border:2px solid #fff;border-radius:50%;background:#148b78;color:white;font-size:11px}.wardrobe-action{margin-top:28px;padding-top:22px;border-top:1px solid #e4ecef}.wardrobe-apply{display:flex;align-items:center;justify-content:center;gap:18px;width:100%;min-height:50px;border:0;border-radius:16px;background:#009fcc;color:#fff;font-size:15px;font-weight:600;cursor:pointer;transition:background .2s}.wardrobe-apply:disabled{background:#e9f1f2;color:#728b93;cursor:default}.wardrobe-apply:focus-visible{outline:3px solid #e6b84c;outline-offset:3px}.wardrobe-action p{font-size:12px;line-height:1.6;min-height:38px;color:#758d95;text-align:center;margin:12px 0 0}.companion-enter-active,.companion-leave-active{transition:opacity .16s,transform .2s}.companion-enter-from{opacity:0;transform:translateY(5px)}.companion-leave-to{opacity:0}
@media(max-width:700px){.wardrobe-page{padding:10px 20px 22px}.wardrobe-top{font-size:10px}.wardrobe-heading{margin:10px 0 18px}.wardrobe-heading h1{font-size:24px}.wardrobe-heading>span{font-size:12px}.wardrobe-content{grid-template-columns:1fr;gap:24px}.wardrobe-preview{border-radius:20px}.wardrobe-art{aspect-ratio:1.28}.wardrobe-art>img{object-position:50% 51%}.wardrobe-caption{padding:16px}.wardrobe-caption h2{font-size:20px}.wardrobe-caption p{font-size:12px;margin-top:9px}.wardrobe-location{left:12px;bottom:12px;font-size:10px}.wardrobe-grid{gap:16px 12px}.wardrobe-action{margin-top:20px;padding-top:18px}.wardrobe-action p{margin-bottom:0}.wardrobe-heading p{font-size:9px}}
@media(prefers-reduced-motion:reduce){.companion-enter-active,.companion-leave-active,.wardrobe-preview,.wardrobe-thumb img{transition:none}}
@media(max-width:700px){.wardrobe-art{aspect-ratio:auto;height:260px}.wardrobe-art>img{object-fit:contain}.wardrobe-location{bottom:10px}.wardrobe-heading{margin:5px 0 16px}.wardrobe-caption{padding:14px 16px}.wardrobe-content{gap:20px}}
</style>

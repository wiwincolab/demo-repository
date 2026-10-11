<script setup lang="ts">
import type {PoiCountry} from '~/types/poi';
import type {TripTransport} from '~/data/trips';
import {newTripError, tripDates, transportLabels} from '~/utils/custom-trips';
const asset=useAsset();
const {create}=useTripLibrary();
const {selectTrip}=useTripContext();
const {catalog,snapshots,loading,error:poiError,loadCatalog,loadRegions}=usePlannerPois();
const step=ref(1), title=ref(''), transport=ref<TripTransport>('public-transit'), country=ref<PoiCountry>('JP'), regionId=ref('jp-tokyo');
const today=useState('new-trip-today',()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()));
const startDate=ref(today.value), endDate=ref(today.value);
const error=ref(''), saving=ref(false), coverIndex=ref(0);
const countries=[{id:'JP' as const,name:'日本'},{id:'KR' as const,name:'韓國'},{id:'TW' as const,name:'台灣'}];
const regions=computed(()=>catalog.value?.regions.filter(r=>r.country===country.value&&r.file)||[]);
const region=computed(()=>regions.value.find(r=>r.id===regionId.value));
const photos=computed(()=>{
  const pois=snapshots.value.find(s=>s.region.id===regionId.value)?.pois || [];
  const featured=/淺草寺|晴空塔|清水寺|金閣寺|大阪城|景福宮|海雲臺|海雲台|釜山塔|札幌時計|首里城|台北101/;
  return [...pois].filter(p=>p.photo).sort((a,b)=>Number(featured.test(b.name))-Number(featured.test(a.name))).slice(0,4);
});
const cover=computed(()=>photos.value[coverIndex.value]?.photo);
const input=computed(()=>({title:title.value,startDate:startDate.value,endDate:endDate.value,transport:transport.value}));
const dayCount=computed(()=>tripDates(startDate.value,endDate.value));
watch(startDate,value=>{if(endDate.value<value)endDate.value=value;});
watch([region,step],()=>{coverIndex.value=0;if(step.value===2&&region.value)void loadRegions([region.value]);});
function chooseCountry(value:PoiCountry){country.value=value;regionId.value=regions.value[0]?.id || '';}
function next(){error.value=newTripError(input.value);if(!error.value)step.value=2;}
async function finish(){
  error.value=newTripError(input.value);if(error.value||saving.value)return;
  if(!region.value){error.value='請選擇旅遊地區。';return;}
  if(!cover.value){error.value='請等封面照片載入，或重新載入景點。';return;}
  saving.value=true;
  try{
    const trip=create(input.value,region.value,{src:cover.value.src,source:cover.value.source,credit:cover.value.credit});
    selectTrip(trip.id);
    await navigateTo({path:'/trip',query:{trip:trip.id}});
  }catch(e){error.value=e instanceof Error?e.message:'行程沒有建立成功，請再試一次。';}
  finally{saving.value=false;}
}
onMounted(()=>void loadCatalog());
useHead({title:'建立新行程 · 去趣 chicTrip'});
</script>
<template>
  <section class="new-trip-page">
    <NuxtLink class="new-trip-back" to="/trips">‹ 我的行程</NuxtLink>
    <header><p class="trips-eyebrow">A NEW JOURNEY</p><h1>建立新行程</h1><p>從一個念頭，開始下一趟旅行。</p></header>
    <ol class="new-trip-steps" aria-label="建立行程步驟"><li :aria-current="step===1?'step':undefined" :class="{active:step===1}"><b>{{step===2?'✓':'1'}}</b>行程設定</li><li :aria-current="step===2?'step':undefined" :class="{active:step===2}"><b>2</b>旅遊地區與封面</li></ol>
    <form class="new-trip-form" @submit.prevent="step===1?next():finish()">
      <div v-if="step===1" class="new-trip-fields">
        <label class="new-trip-field">行程名稱<input v-model="title" aria-label="行程名稱" maxlength="60" placeholder="例如：釜山，慢慢玩三天" required /></label>
        <fieldset class="new-trip-dates"><legend>行程日期</legend><label>出發日期<input v-model="startDate" type="date" aria-label="出發日期" required /></label><label>結束日期<input v-model="endDate" type="date" aria-label="結束日期" :min="startDate" required /></label></fieldset>
        <p class="new-trip-hint">{{dayCount?`${dayCount} 天 ${Math.max(0,dayCount-1)} 夜`:'請選擇 1 至 30 天的旅遊日期'}} · 建立後可逐日安排景點</p>
        <fieldset class="new-trip-transport"><legend>主要交通方式</legend><label v-for="(label,id) in transportLabels" :key="id" :class="{selected:transport===id}"><input v-model="transport" type="radio" name="transport" :value="id"/><span aria-hidden="true">{{id==='public-transit'?'▣':id==='driving'?'↗':'♧'}}</span><b>{{label}}</b></label></fieldset>
      </div>
      <div v-else class="new-trip-fields">
        <div class="new-trip-summary"><strong>{{title}}</strong><span>{{startDate}} — {{endDate}} · {{dayCount}} 天</span><small>{{transportLabels[transport]}}</small></div>
        <fieldset class="new-trip-country"><legend>想去哪裡？</legend><label v-for="item in countries" :key="item.id" :class="{selected:country===item.id}"><input type="radio" name="country" :checked="country===item.id" :value="item.id" @change="chooseCountry(item.id)">{{item.name}}</label></fieldset>
        <label class="new-trip-field">旅遊地區<select v-model="regionId" aria-label="旅遊地區" :disabled="!regions.length"><option v-for="item in regions" :key="item.id" :value="item.id">{{item.name}}</option></select></label>
        <div class="new-trip-covers"><p>選一張旅行封面</p><div v-if="loading||!catalog" class="new-trip-cover-loading" role="status"><span class="photo-skeleton" aria-hidden="true"/>正在找這個地區的照片…</div><fieldset v-else-if="photos.length"><legend class="new-trip-visually-hidden">旅行封面照片</legend><label v-for="(photo,i) in photos" :key="photo.id" :class="{selected:coverIndex===i}"><input v-model="coverIndex" type="radio" name="cover" :value="i" :aria-label="'使用'+photo.name+'作為封面'"><img :src="asset(photo.photo!.src)" :alt="photo.name" width="240" height="160" decoding="async" referrerpolicy="no-referrer"><span>{{photo.name}}</span><b v-if="coverIndex===i" aria-hidden="true">✓</b></label></fieldset><p v-else role="status">{{poiError||'這個地區的封面暫時無法載入。'}}</p><button v-if="poiError||(!loading&&!photos.length)" type="button" class="new-trip-retry" @click="loadCatalog().then(()=>region&&loadRegions([region]))">重新載入景點</button></div>
        <p class="new-trip-hint">建立 {{dayCount}} 天的空白行程，再交給 AI 或自己選景點。行程會儲存在這台裝置。</p>
      </div>
      <p v-if="error" class="new-trip-error" role="alert">{{error}}</p>
      <footer class="new-trip-footer"><button v-if="step===2" type="button" class="secondary" :disabled="saving" @click="step=1;error=''">上一步</button><NuxtLink v-else class="secondary" to="/trips">取消</NuxtLink><button class="primary" type="submit" :disabled="saving||(step===2&&(!cover||loading))">{{saving?'正在建立…':step===1?'下一步 →':'＋ 建立行程'}}</button></footer>
    </form>
  </section>
</template>

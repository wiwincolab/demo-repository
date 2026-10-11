<script setup lang="ts">
import type { Poi, PoiRegion } from '~/types/poi';
import { visibleMapTarget } from '~/utils/planner-map';
import { createMapClusterClient } from '~/utils/map-cluster-client';
import type { MapClusterFeature } from '~/utils/map-cluster-engine';
import { loadScript } from '~/utils/loadScript';
import { attachTransitMap, preparePlannerBasemap, type TransitLegendLine } from '~/utils/transit-map';
const props=defineProps<{pois:Poi[];region:PoiRegion | null;selected:string | null}>();
const emit=defineEmits<{select:[id:string]}>();
const asset=useAsset();
useHead({link:[{rel:'stylesheet',href:asset('vendor/maplibre-gl.css')}]});
const container=ref<HTMLElement>(), error=ref(''), ready=ref(false), showLabels=ref(false), transitLines=ref<TransitLegendLine[]>([]), failedPhotos=ref<string[]>([]);
type Pin={key:string;x:number;y:number;count:number;clusterId?:number;expansionZoom?:number;id?:string;name:string;photo:boolean;src?:string;version:number};
const pins=shallowRef<Pin[]>([]);
const clusterRenderer=ref('pending');
let map:any, observer:ResizeObserver|undefined, disposed=false, version=0, frame=0, clusterClient:ReturnType<typeof createMapClusterClient>|undefined, features:MapClusterFeature[]=[], poiById=new Map<string,Poi>(), photoUrls=new Map<string,string>(), disposeTransit:(()=>void)|undefined;
let pointerStart:[number,number]|undefined;
function beginPointer(event:PointerEvent){pointerStart=[event.clientX,event.clientY];}
function photoFailed(src:string){if(!failedPhotos.value.includes(src))failedPhotos.value.push(src);}
function renderPins() {
  if(!ready.value || disposed || props.selected)return;
  const bounds=map.getBounds(), zoom=map.getZoom();
  showLabels.value=zoom>=12;
  pins.value=features.map(feature=>{
    const at=map.project(feature.at);
    if(feature.clusterId!==undefined)return {key:`cluster:${feature.clusterId}`,x:at.x,y:at.y,count:feature.count,clusterId:feature.clusterId,expansionZoom:feature.expansionZoom,name:'',photo:feature.photoCount>0,version};
    const id=String(feature.id), p=poiById.get(id);
    return {key:id,x:at.x,y:at.y,count:1,id,name:p?.name || '',photo:feature.photoCount>0,src:photoUrls.get(id),version};
  }).filter(pin=>visibleMapTarget([pin.x,pin.y],container.value!.clientWidth,container.value!.clientHeight));
  clusterClient?.query([bounds.getWest(),bounds.getSouth(),bounds.getEast(),bounds.getNorth()],zoom);
}
function schedule() {if(frame || props.selected)return;frame=requestAnimationFrame(()=>{frame=0;renderPins();});}
let clusterRadius=0;
function update() {
  if(!clusterClient)return;
  poiById=new Map(props.pois.map(p=>[p.id,p]));
  photoUrls=new Map(props.pois.filter(p=>p.photo).map(p=>[p.id,asset(p.photo!.src)]));
  features=[];pins.value=[];
  clusterRadius=(container.value?.clientWidth || 720)<=600 ? 60 : 45;
  clusterClient.load(props.pois.map(p=>({id:p.id,at:[...p.at],photo:!!p.photo})),{mode:'places',radius:clusterRadius});
  version=clusterClient.revision;schedule();
}
function fit() {
  if(!map || !props.region)return;
  const [w,s,e,n]=props.region.bbox;
  map.fitBounds([[w,s],[e,n]],{padding:35,duration:0,maxZoom:12});
}
function choose(pin:Pin) {
  if(pin.id && poiById.has(pin.id)){emit('select',pin.id);return;}
  if(pin.version!==version)return;
  if(pin.clusterId!==undefined)map.easeTo({center:map.unproject([pin.x,pin.y]),zoom:pin.expansionZoom,duration:matchMedia('(prefers-reduced-motion: reduce)').matches?0:400});
}
function chooseAtPointer(event:MouseEvent) {
  if(!ready.value || !container.value || (event.target as Element).closest('button,summary,a'))return;
  if(pointerStart && Math.hypot(event.clientX-pointerStart[0],event.clientY-pointerStart[1])>8)return;
  // WebGL can receive a pointer over an HTML photo overlay. Resolve the same
  // projected hit area, while keeping drags and map controls independent.
  const box=container.value.getBoundingClientRect(), x=event.clientX-box.left, y=event.clientY-box.top;
  const hit=pins.value.map(pin=>({pin,distance:Math.hypot(x-pin.x,y-pin.y)})).filter(({pin,distance})=>distance<=(pin.src || pin.clusterId!==undefined ? 24 : 14)).sort((a,b)=>a.distance-b.distance)[0];
  if(hit){event.stopPropagation();choose(hit.pin);}
}
watch(()=>props.pois,update);
watch(()=>props.region?.id,fit);
// Opening a photo must not also animate and repaint a map behind the modal.
watch(()=>props.selected,id=>{if(id){map?.stop();cancelAnimationFrame(frame);frame=0;}else schedule();});
onMounted(async()=>{
  clusterClient=createMapClusterClient(()=>new Worker(new URL('../workers/poi-clusters.worker.ts',import.meta.url),{type:'module'}),(next)=>{features=next;clusterRenderer.value=clusterClient!.mode;schedule();});
  update();
  try {
    await loadScript(asset('vendor/maplibre-gl.js'));if(disposed)return;
    const gl=(window as any).maplibregl;
    map=new gl.Map({container:container.value,style:'https://tiles.openfreemap.org/styles/liberty',center:[139.75,35.68],zoom:10,attributionControl:true,dragRotate:false,touchPitch:false,maxZoom:18});
    map.touchZoomRotate.disableRotation();map.scrollZoom.disable();map.addControl(new gl.NavigationControl({showCompass:false}),'top-right');fit();
    observer=new ResizeObserver(()=>{map?.resize();const radius=container.value!.clientWidth<=600 ? 60 : 45;if(radius!==clusterRadius)update();else schedule();});observer.observe(container.value!);
    map.on('error',()=>{error.value='道路圖資暫時無法載入，仍可從下方清單查看景點。';});
    map.on('load',()=>{if(disposed)return;ready.value=true;error.value='';preparePlannerBasemap(map);disposeTransit=attachTransitMap(map,asset,lines=>{transitLines.value=lines;});update();map.on('move',schedule);});
  } catch {error.value='地圖暫時無法開啟，請從下方清單查看景點。';}
});
onBeforeUnmount(()=>{disposed=true;cancelAnimationFrame(frame);observer?.disconnect();disposeTransit?.();clusterClient?.dispose();map?.remove();});
</script>
<template>
  <div class="poi-map-wrap" :data-cluster-renderer="clusterRenderer" :data-map-paused="!!selected" @pointerdown.capture="beginPointer" @click.capture="chooseAtPointer">
    <div ref="container" class="poi-map" role="region" aria-label="日韓台景點地圖，可拖曳、縮放，點選景點查看照片" />
    <div class="poi-pin-layer"><button v-for="pin in pins" :key="pin.key" class="poi-pin" :class="{cluster:pin.clusterId!==undefined,unavailable:!pin.photo,selected:pin.id===selected,thumbnail:pin.src && !failedPhotos.includes(pin.src)}" :style="{left:pin.x+'px',top:pin.y+'px','--label-top':(container && pin.y+66>container.clientHeight-8 ? '-28px' : '44px'),'--label-shift':Math.max(-60,Math.min(60,container ? container.clientWidth/2-pin.x : 0))+'px'}" :aria-label="pin.clusterId!==undefined ? pin.count+' 個景點，點選放大' : pin.name+'，查看景點照片'" @click.stop="choose(pin)"><span v-if="pin.clusterId!==undefined">{{ pin.count }}</span><img referrerpolicy="no-referrer" v-else-if="pin.src && !failedPhotos.includes(pin.src)" :src="pin.src" :alt="pin.name" loading="lazy" decoding="async" @error="photoFailed(pin.src)"><span v-if="pin.clusterId===undefined && showLabels" class="poi-pin-label">{{ pin.name }}</span></button></div>
    <details v-if="transitLines.length" class="poi-transit-legend"><summary>地鐵路線顏色</summary><ul><li v-for="line in transitLines" :key="line.key"><i :style="{background:line.colour}" />{{ line.ref }} {{ line.name }}</li></ul></details>
    <p v-if="error" class="poi-map-status" role="status">{{ error }}</p>
    <span v-else-if="!ready" class="poi-map-status" role="status">正在開啟景點地圖…</span>
    <span v-else class="poi-map-hint">點選數字放大 · 點選景點查看照片</span>
  </div>
</template>
<style scoped>
.poi-pin img{pointer-events:none;user-select:none;-webkit-user-drag:none}
.poi-map-wrap{position:relative;isolation:isolate;border-radius:18px;overflow:hidden;border:1px solid #d5e5eb;background:#edf5f2}.poi-map{height:clamp(340px,55dvh,580px)}.poi-map-status,.poi-map-hint{position:absolute;top:12px;left:12px;right:55px;z-index:2;background:#fffffff0;padding:9px 12px;border-radius:9px;font-size:12px;color:#315869;pointer-events:none}.poi-map-hint{right:auto;font-size:11px}.poi-pin-layer{position:absolute;inset:0;pointer-events:none;z-index:1}.poi-pin{position:absolute;transform:translate(-50%,-50%);width:22px;height:22px;border:2px solid white;border-radius:50%;background:#008eb2;box-shadow:0 1px 5px #14364855;pointer-events:auto;color:white;padding:0;cursor:pointer}.poi-pin.cluster{width:40px;height:40px;font-size:12px;font-weight:600}.poi-pin.unavailable{background:#8799a0}.poi-pin.selected{border-color:#ffc500;box-shadow:0 0 0 4px #ffc50066}.poi-pin:focus-visible{outline:3px solid #ffc500;outline-offset:3px}.poi-pin-label{position:absolute;top:24px;left:50%;transform:translateX(-50%);max-width:140px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;background:#fffffff0;border-radius:4px;padding:2px 5px;color:#22506a;font-size:10px;pointer-events:none}
</style>
<style scoped>
.poi-pin.thumbnail{width:42px;height:42px;background:white}.poi-pin.thumbnail img{display:block;width:100%;height:100%;border-radius:50%;object-fit:cover}.poi-pin.thumbnail .poi-pin-label{top:43px}.poi-transit-legend{position:absolute;right:12px;bottom:35px;z-index:2;max-width:75%;border-radius:9px;background:#fffffff5;border:1px solid #d5e5eb;color:#315869;font-size:11px}.poi-transit-legend summary{padding:8px 10px;cursor:pointer}.poi-transit-legend ul{list-style:none;margin:0;padding:0 10px 9px;max-height:150px;overflow:auto}.poi-transit-legend li{display:flex;align-items:center;gap:6px;font-size:10px;margin:6px 0}.poi-transit-legend i{width:20px;height:4px;border:1px solid #0002;border-radius:2px;flex:none}
</style>

<style scoped>
.poi-pin-label,.poi-pin.thumbnail .poi-pin-label{margin-left:var(--label-shift,0px);top:var(--label-top,44px)}
.poi-pin{width:44px;height:44px;background:none;border:0;box-shadow:none;display:grid;place-items:center}
.poi-pin:not(.thumbnail):not(.cluster):before{content:'';width:18px;height:18px;border:2px solid white;border-radius:50%;background:#008eb2;box-shadow:0 1px 5px #14364855}
.poi-pin.unavailable:not(.thumbnail):not(.cluster):before{background:#8799a0}
.poi-pin.cluster{width:44px;height:44px;border:2px solid white;background:#008eb2;box-shadow:0 1px 5px #14364855}
.poi-pin.cluster.unavailable{background:#8799a0}
.poi-map-wrap :deep(.maplibregl-ctrl-group button){width:44px;height:44px}
.poi-transit-legend summary{min-height:44px;display:flex;align-items:center}
.poi-pin.thumbnail{width:44px;height:44px;border:2px solid white}.poi-pin.selected{border-color:#ffc500}
@media(max-width:600px){.poi-map-wrap{margin-inline:12px}.poi-map-hint{font-size:11px;max-width:calc(100% - 78px)}.poi-pin-label{max-width:120px}}
</style>

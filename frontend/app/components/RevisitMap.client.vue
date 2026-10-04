<script setup lang="ts">
import { revisitLeg, type RevisitStop } from '~/data/revisit';
import { loadScript } from '~/utils/loadScript';
import { createVehicles } from '~/utils/atlas-vehicles';
import { createRevisitRun } from '~/utils/revisit-run';
import { waitForRevisitTiles } from '~/utils/revisit-tiles';
import { revisitCamera } from '~/utils/revisit-camera';
import aerialSheets from '~/data/revisit-aerial.json';
import regionalSheets from '~/data/revisit-regional.json';

const props = defineProps<{ stops: RevisitStop[]; selected: string | null; command: { token: number; id: string | null; from: string | null; transitioning: boolean }; three: boolean; panelHeight: number; reduced: boolean }>();
const emit = defineEmits<{ select: [id: string]; arrive: [token: number]; approach:[value:{token:number;stage:'survey'|'descending'|'framing';progress:number}]; explore: []; unavailable: []; ready: []; travel: [value:{stage:'departing'|'riding'|'landing';progress:number}] }>();
const asset = useAsset();
useHead({ link: [{ rel: 'stylesheet', href: asset('vendor/maplibre-gl.css') }] });
const canvas = ref<HTMLElement>(), loading = ref(true), error = ref('');
// Vendored MapLibre is shared with the existing trip maps; keep its runtime isolated here.
let map: any, library: any, disposed = false, loaded = false, observer: ResizeObserver | undefined;
let loadTimer: ReturnType<typeof setTimeout> | undefined;
let run: ReturnType<typeof createRevisitRun> | undefined;
const {gsap,animate}=useCreationMotion(canvas);
const approachStage=ref('');
let landingSource:string|undefined, regionalSource:string|undefined;
const travelling = ref(false), terrainFailed = ref(false), imageryFailed = ref(false);
const satelliteFailed=ref(false);
const imageryStage = ref<'context' | 'preparing' | 'detailed'>('context');
let allowDetail = false, allowLandingDetail=false, aerialEnabled = false;
const revealed = new Set<string>();
function sourceReady(id: string) { return !!map?.getSource(id) && map.isSourceLoaded(id); }
function holdImagery() {
  allowDetail = false; allowLandingDetail=false; revealed.clear(); imageryStage.value = 'context';
  for(const id of [landingSource,regionalSource])if(id && map?.getLayer(id))map.setPaintProperty(id,'raster-opacity',0);
  for (const id of ['revisit-satellite','revisit-aerial']) {
    if (!map?.getLayer(id)) continue;
    map.setPaintProperty(id,'raster-opacity-transition',{duration:0,delay:0});
    // Keep the source active and fetching while the coherent coarse mosaic is visible.
    map.setPaintProperty(id,'raster-opacity',.001);
  }
}
function revealImagery() {
  if (!loaded || disposed || !allowDetail || travelling.value) return;
  for (const [id, enabled] of [['revisit-satellite',!satelliteFailed.value],['revisit-aerial',aerialEnabled && !imageryFailed.value]] as const) {
    if (!enabled || revealed.has(id) || !sourceReady(id)) continue;
    revealed.add(id);
    map.setPaintProperty(id,'raster-opacity-transition',{duration:props.reduced?0:650,delay:0});
    map.setPaintProperty(id,'raster-opacity',id==='revisit-aerial'?.96:.95);
  }
  if(props.command.id && regionalSource && sourceReady(regionalSource) && !revealed.has(regionalSource)){revealed.add(regionalSource);map.setPaintProperty(regionalSource,'raster-opacity',1);}
  if(allowLandingDetail && landingSource && sourceReady(landingSource)){if(!revealed.has(landingSource)){revealed.add(landingSource);map.setPaintProperty(landingSource,'raster-opacity',1);}imageryStage.value='detailed';return;}
  const destinationLayer = aerialEnabled && !imageryFailed.value ? 'revisit-aerial' : 'revisit-satellite';
  imageryStage.value = revealed.has(destinationLayer) ? 'detailed' : 'preparing';

}
let vehicles: ReturnType<typeof createVehicles> | undefined, vehicleFrame = 0;
const markers: { marker: any; element: HTMLDivElement; button: HTMLButtonElement; id: string; tripId: string; group: boolean }[] = [];
function cancel() {
  run?.cancel(); run = undefined; travelling.value = false;
  approachStage.value='';
  cancelAnimationFrame(vehicleFrame); vehicles?.hide();
  if (loaded) map?.getSource('revisit-travel')?.setData({type:'FeatureCollection',features:[]});
  map?.stop();
}
function padding(arrival = false) {
  const narrow = (canvas.value?.clientWidth || 390) < 760;
  const height=canvas.value?.clientHeight || 700;
  return narrow ? { top: Math.min(136,height*.2), bottom: arrival ? Math.min(height*.48,height-220) : Math.min(props.panelHeight + 85,height*.4), left: 24, right: 60 }
    : { top: 130, bottom: 85, left: arrival?55:410, right: arrival?510:70 };
}
function scenePadding(){return {top:105,bottom:110,left:60,right:60};}
function bounds(stops: RevisitStop[]) {
  const result = new library.LngLatBounds();
  stops.forEach(stop => result.extend(stop.coords));
  return result;
}
function syncMarkers() {
  if (!loaded) return;
  const grouped = map.getZoom() < 9.5;
  for (const item of markers) {
    item.element.hidden = item.group !== grouped;
    item.button.tabIndex = item.element.hidden || (approachStage.value && item.id !== props.selected) ? -1 : 0;
    item.button.setAttribute('aria-pressed', String(!item.group && item.id === props.selected));
    item.element.classList.toggle('is-current', !item.group && item.id === props.selected);
  }
}
function makeMarkers() {
  markers.splice(0).forEach(item => item.marker.remove());
  const entries = props.stops.map(stop => ({ stop, group: false, count: 1 }));
  for (const groupId of new Set(props.stops.map(stop => stop.groupId || stop.tripId))) {
    const stops = props.stops.filter(stop => (stop.groupId || stop.tripId) === groupId);
    entries.push({ stop: stops[0]!, group: true, count: stops.length });
  }
  for (const { stop, group, count } of entries) {
    const element = document.createElement('div');
    element.className = 'revisit-anchor';
    element.setAttribute('role','group');
    const button = document.createElement('button');
    button.className = 'revisit-pin' + (group ? ' is-group' : '');
    const groupLabel=stop.groupLabel || (stop.tripId === 'fuji' ? '富士山' : '關西');
    button.setAttribute('aria-label', group ? `展開${groupLabel}的 ${count} 段回憶` : `重遊${stop.title}`);
    const image = document.createElement('img'); image.src = asset(stop.source); image.alt = ''; image.draggable = false; if(stop.sourceCrop) image.className='source-crop';
    const name = document.createElement('span'); name.textContent = group ? `${groupLabel} · ${count}` : stop.short;
    button.append(image, name); element.append(button);
    button.onclick = () => {
      if (!group) { emit('select', stop.id); return; }
      cancel(); holdImagery(); allowDetail=true; emit('explore');
      map.flyTo({ center: stop.coords, zoom: 10.5, pitch: 25, padding: padding(), duration: props.reduced ? 0 : 1200 });
    };
    const marker = new library.Marker({ element, anchor: 'bottom' }).setLngLat(stop.coords).addTo(map);
    markers.push({ marker, element, button, id: stop.id, tripId: stop.tripId, group });
  }
  syncMarkers();
}
function drawRoute() {
  const index = props.stops.findIndex(stop => stop.id === props.selected);
  const features = props.stops.slice(1).flatMap((stop, i) => {
    const previous = props.stops[i]!;
    // Different journeys are separate chapters, not one invented continuous route.
    if (previous.tripId !== stop.tripId) return [];
    return [{ type: 'Feature', properties: { visited: index >= i + 1 }, geometry: { type: 'LineString', coordinates: [previous.coords, stop.coords] } }];
  });
  map.getSource('revisit-route')?.setData({ type: 'FeatureCollection', features });
}
async function execute(skip = false) {
  if (!loaded || disposed || !props.stops.length) return;
  cancel(); syncMarkers(); drawRoute();
  holdImagery();
  const token = props.command.token;
  const session = createRevisitRun(); run=session;
  const valid=()=>session.active && !disposed && token===props.command.token;
  // Only this camera command can finish this step. stop/resize/old moveend are unrelated.
  function camera(method:'flyTo'|'fitBounds', options:any, area?:any):Promise<boolean> {
    return new Promise(resolve=>{
      let done=false;
      const end=(event:any)=>{ if(event?.revisitToken===token)complete(); };
      const complete=()=>{if(done)return;done=true;map.off('moveend',end);clearTimeout(timeout);release();resolve(valid());};
      const abort=()=>{if(done)return;done=true;map.off('moveend',end);clearTimeout(timeout);resolve(false);};
      const release=session.own(abort);
      const timeout=setTimeout(complete,(options.duration || 0)+180);
      map.on('moveend',end);
      if(method==='fitBounds')map.fitBounds(area,options,{revisitToken:token});
      else map.flyTo(options,{revisitToken:token});
    });
  }
  const target = props.stops.find(stop => stop.id === props.command.id);
  aerialEnabled = !!target && (target.tripId !== 'last-year' || target.groupId === '2025-osaka');
  imageryFailed.value = false;
  map.setLayoutProperty('revisit-aerial','visibility',aerialEnabled ? 'visible' : 'none');
  if (!target) {
    await camera('fitBounds', { padding: padding(), maxZoom: props.stops.length === 1 ? 11 : 10.5, pitch: 0, bearing: 0, duration: props.reduced ? 0 : 1000 }, bounds(props.stops));
    if(valid()){ allowDetail = true; revealImagery(); }
    return;
  }
  const previous = props.stops.find(stop=>stop.id===props.command.from);
  const leg = revisitLeg(target, previous);
  if (props.command.transitioning) {
    map.fitBounds(bounds(previous?[previous,target]:[target]),{padding:padding(),maxZoom:6.5,pitch:0,bearing:0,duration:props.reduced?0:850});
    return;
  }
  if(regionalSource){if(map.getLayer(regionalSource))map.removeLayer(regionalSource);if(map.getSource(regionalSource))map.removeSource(regionalSource);regionalSource=undefined;}
  const regional=regionalSheets.find(item=>item.id===target.id && item.template);
  if(regional){
    regionalSource='revisit-region';
    map.addSource(regionalSource,{type:'raster',tiles:[asset(regional.template)+'?v=20261004b'],tileSize:256,minzoom:9,maxzoom:regional.tileZoom,bounds:regional.bounds});
    void Promise.all(regional.tiles.map(url=>fetch(asset(url)+'?v=20261004b').catch(()=>undefined)));
    map.addLayer({id:regionalSource,type:'raster',source:regionalSource,paint:{'raster-opacity':1,'raster-fade-duration':0,'raster-opacity-transition':{duration:300,delay:0}}},'revisit-buildings');
  }
  const local=aerialSheets.find(item=>item.id===target.id && item.template);
  // Destination imagery is prepared locally and preloaded before descending, using terrain-compatible XYZ tiles.
  if(landingSource){if(map.getLayer(landingSource))map.removeLayer(landingSource);if(map.getSource(landingSource))map.removeSource(landingSource);landingSource=undefined;}
  if(local){
    landingSource='revisit-landing';
    map.addSource(landingSource,{type:'raster',tiles:[asset(local.template)],tileSize:256,minzoom:9,maxzoom:local.tileZoom,bounds:local.bounds,attribution:'国土地理院 航空写真'});
    void Promise.all(local.tiles.map(url=>fetch(asset(url)).catch(()=>undefined)));
    map.addLayer({id:landingSource,type:'raster',source:landingSource,layout:{visibility:'none'},paint:{'raster-opacity':.001,'raster-fade-duration':0,'raster-opacity-transition':{duration:400,delay:0}}},'revisit-buildings');
    // The local sheet supplies Japan detail; don't expose partially fetched online aerial tiles.
    map.setLayoutProperty('revisit-aerial','visibility','none');
  }
  const view=revisitCamera(target.zoom,target.bearing,target.id,props.three);
  const approach=(stage:'survey'|'descending'|'framing',progress:number)=>{
    approachStage.value=stage;syncMarkers();emit('approach',{token,stage,progress});
  };
  function descend():Promise<boolean>{
    return new Promise(resolve=>{
      const state={zoom:map.getZoom(),pitch:map.getPitch(),bearing:view.survey.bearing};
      let done=false, timeline:any;
      const finish=(active:boolean)=>{if(done)return;done=true;release();resolve(active);};
      const release=session.own(()=>{timeline?.kill();finish(false);});
      const update=()=>{if(!valid())return;map.jumpTo({...state,center:target!.coords,padding:scenePadding()},{revisitToken:token});if(local && !allowLandingDetail && state.zoom>=view.scene.zoom-1){map.setLayoutProperty('revisit-landing','visibility','visible');allowLandingDetail=true;revealImagery();}};
      animate(()=>{
        timeline=gsap.timeline({paused:true,onComplete:()=>finish(valid())});
        timeline.addLabel('drop').to(state,{...view.descend,duration:1.05,ease:'power2.inOut',onStart:()=>approach('descending',.18),onUpdate:()=>{update();approach('descending',.18+timeline.progress()*.64);}},'drop')
          .addLabel('reveal').to(state,{...view.scene,duration:1.4,ease:'power3.out',onStart:()=>approach('framing',.62),onUpdate:()=>{update();approach('framing',.18+timeline.progress()*.64);}},'reveal');
        timeline.play();
      });
    });
  }
  const settle = async () => {
    if(!valid())return;
    emit('travel',{stage:'landing',progress:1});travelling.value=false;
    vehicles?.hide();map.getSource('revisit-travel')?.setData({type:'FeatureCollection',features:[]});
    approach('survey',0);
    const instant=props.reduced||skip;
    if(!await camera('flyTo',{center:target.coords,...(instant?view.scene:view.survey),padding:scenePadding(),duration:instant?0:800,essential:true}))return;
    const sources=[...(regional?['revisit-region']:['revisit-satellite']),...(!local && aerialEnabled?['revisit-aerial']:[])];
    if(!terrainFailed.value && props.three)sources.push('revisit-dem');
    await waitForRevisitTiles(map,sources,session,instant?250:1100);
    if(!valid())return;
    allowDetail=true;allowLandingDetail=instant;if(instant && local)map.setLayoutProperty('revisit-landing','visibility','visible');
    // Show a coherent regional mosaic at altitude; destination detail appears only after it fills the view.
    // The local pyramid is already prefetched; do not let unrelated pending
    // terrain requests hold its opacity at zero throughout the descent.
    if(regional && regionalSource){map.setPaintProperty(regionalSource,'raster-opacity',1);revealed.add(regionalSource);}
    revealImagery();
    if(!instant && (!await session.wait(350) || !await descend()))return;
    if(local){map.setLayoutProperty('revisit-landing','visibility','visible');await waitForRevisitTiles(map,['revisit-landing'],session,instant?250:700);if(!valid())return;allowLandingDetail=true;revealImagery();}
    approach('framing',.9);
    // Let the destination itself be seen before reframing for its photograph.
    if(!await session.wait(instant?0:650) || !valid())return;
    if(!await camera('flyTo',{center:target.coords,...view.scene,padding:padding(true),duration:instant?0:500,essential:true}))return;
    if(!valid())return;
    approachStage.value='';syncMarkers();emit('arrive',token);
  };
  // A different trip is a new memory chapter, not another flight from Taiwan.
  if (!leg || leg.chapter || props.reduced || !vehicles || skip) { await settle(); return; }
  travelling.value=true;
  emit('travel',{stage:'departing',progress:0});
  const coordinates: [number,number][] = Array.from({length:81},(_,i)=>{
    const t=i/80;
    return [leg.from[0]+(leg.to[0]-leg.from[0])*t,leg.from[1]+(leg.to[1]-leg.from[1])*t+(leg.vehicle==='plane'?Math.sin(t*Math.PI)*1.3:0)];
  });
  const travelBounds=new library.LngLatBounds(); coordinates.forEach(point=>travelBounds.extend(point));
  const air=leg.vehicle==='plane';
  const distance=Math.hypot((leg.to[0]-leg.from[0])*91,(leg.to[1]-leg.from[1])*111);
  const routeZoom=air?5:distance>60?9:distance>15?11:13;
  const departure=air ? map.cameraForBounds(travelBounds,{padding:padding(),maxZoom:5}) : {center:leg.from,zoom:routeZoom};
  if(!await camera('flyTo',{...departure,padding:padding(),pitch:air?0:42,bearing:0,duration:props.reduced?0:700,essential:true}))return;
  emit('travel',{stage:'riding',progress:0});
  let started=0, lastTrace=0;
  const duration=air?3600:distance>20?3200:2600;
  function travel(now:number) {
    if(!valid())return;
    if(!started)started=now;
    const elapsed=Math.min(1,(now-started)/duration), t=elapsed*elapsed*(3-2*elapsed), sample=t*80, n=Math.min(79,Math.floor(sample)), blend=sample-n;
    const a=coordinates[n]!, b=coordinates[n+1]!;
    const point: [number,number]=[a[0]+(b[0]-a[0])*blend,a[1]+(b[1]-a[1])*blend];
    const meters=Math.max(1,Math.hypot((leg!.to[0]-leg!.from[0])*91000,(leg!.to[1]-leg!.from[1])*111000));
    vehicles?.move(leg!.vehicle,point,b,(behind:number)=>coordinates[Math.min(80,Math.max(0,Math.floor((t-behind/meters)*80)))],{terrain:true,city:target!.groupId?.replace('2025-','')});
    if(!air)map.jumpTo({center:point,zoom:routeZoom,padding:padding(),pitch:props.three?42:0,bearing:0},{revisitToken:token});
    emit('travel',{stage:'riding',progress:elapsed});
    if(now-lastTrace>=80 || elapsed===1){
      lastTrace=now;
      map.getSource('revisit-travel')?.setData({type:'FeatureCollection',features:[{type:'Feature',properties:{},geometry:{type:'LineString',coordinates:[...coordinates.slice(0,n+1),point]}}]});
    }
    if(elapsed<1)vehicleFrame=requestAnimationFrame(travel);
    else void settle();
  }
  vehicleFrame=requestAnimationFrame(travel);
}
function fail() {
  if (disposed) return;
  clearTimeout(loadTimer); loading.value = false;
  error.value = '地圖暫時連不上，照片與回憶仍在這裡。'; emit('unavailable');
}
function interrupt(event: { originalEvent?: Event }) {
  if (!event.originalEvent) return;
  cancel(); holdImagery(); allowDetail=true; emit('explore');
}
watch(() => props.command.token, () => void execute());
watch(() => props.stops.map(stop => stop.id).join(','), () => { if (loaded) { makeMarkers(); execute(); } });
watch(() => props.three, value => {
  if (!loaded) return;
  cancel(); emit('explore');
  holdImagery(); allowDetail=true;
  map.setLayoutProperty('revisit-buildings', 'visibility', value ? 'visible' : 'none');
  if(!terrainFailed.value)map.setTerrain(value?{source:'revisit-dem',exaggeration:1.15}:null);
  map.easeTo({ pitch: value ? 52 : 0, duration: props.reduced ? 0 : 500 });
});
watch(() => props.reduced, value => { if (value && loaded) { cancel(); emit('explore'); } });
onMounted(async () => {
  loadTimer = setTimeout(fail, 14000);
  try {
    const [style] = await Promise.all([$fetch<any>(asset('atlas-assets/map-style.json')),loadScript(asset('vendor/maplibre-gl.js')),loadScript(asset('vendor/three.min.js'))]);
    if (disposed) return;
    library = (window as any).maplibregl;
    if (disposed) return;
    // Quiet the map while preserving geographic context and attribution.
    style.layers = style.layers.filter((layer: any) => !/poi|housenumber/i.test(layer.id) && (layer.type!=='symbol'||/^label_(country|city|town)|water_name/.test(layer.id)));
    for (const layer of style.layers) {
      if (layer.id === 'water') layer.paint['fill-color'] = '#afd2d9';
      if (layer.id === 'background') layer.paint['background-color'] = '#c7d6bd';
      if (/wood|park/.test(layer.id) && layer.type === 'fill') layer.paint['fill-color'] = '#d3dfca';
    }
    map = new library.Map({ container: canvas.value, style, center: [135.4, 35.1], zoom: 8.2, attributionControl: false, maxPitch: 60, minZoom: 3, maxZoom: 18, pixelRatio:Math.min(window.devicePixelRatio || 1,2), cancelPendingTileRequestsWhileZooming:false });
    map.addControl(new library.AttributionControl({ compact: true }), 'bottom-right');
    map.on('load', () => {
      if (disposed) return;
      clearTimeout(loadTimer);
      const label = map.getStyle().layers.find((layer: any) => layer.type === 'symbol')?.id;
      // A few reusable low-resolution tiles keep a continuous landscape under destination detail.
      map.addSource('revisit-context',{type:'raster',tiles:['https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless_3857/default/g/{z}/{y}/{x}.jpg'],tileSize:256,maxzoom:8,attribution:'<a href="https://maps.eox.at/" target="_blank" rel="noopener">EOX Sentinel-2 cloudless 2016 · modified Copernicus data</a>'});
      map.addLayer({id:'revisit-context',type:'raster',source:'revisit-context',paint:{'raster-opacity':1,'raster-saturation':-.1,'raster-fade-duration':0}},label);
      // 2016 is the EOX global mosaic available under CC BY 4.0 (no commercial-only key).
      map.addSource('revisit-satellite',{type:'raster',tiles:['https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless_3857/default/g/{z}/{y}/{x}.jpg'],tileSize:256,maxzoom:14,attribution:'<a href="https://maps.eox.at/" target="_blank" rel="noopener">EOX Sentinel-2 cloudless 2016 · modified Copernicus data</a>'});
      map.addLayer({id:'revisit-satellite',type:'raster',source:'revisit-satellite',paint:{'raster-opacity':.001,'raster-saturation':-.1,'raster-fade-duration':0}},label);
      // Official Japanese aerial imagery is streamed, with vector cartography underneath.
      map.addSource('revisit-aerial',{type:'raster',tiles:['https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/{z}/{x}/{y}.jpg'],tileSize:256,minzoom:9,maxzoom:18,bounds:[122,20,154,46],attribution:'<a href="https://maps.gsi.go.jp/development/ichiran.html" target="_blank" rel="noopener">国土地理院 航空写真</a>'});
      map.addLayer({id:'revisit-aerial',type:'raster',source:'revisit-aerial',minzoom:9,paint:{'raster-opacity':.001,'raster-saturation':-.12,'raster-fade-duration':0}},label);
      map.addSource('revisit-dem',{type:'raster-dem',tiles:['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],tileSize:256,maxzoom:12,encoding:'terrarium',attribution:'<a href="https://github.com/tilezen/joerd/blob/master/docs/attribution.md" target="_blank" rel="noopener">Mapzen terrain</a>'});
      if(props.three)map.setTerrain({source:'revisit-dem',exaggeration:1.15});
      if(typeof map.setSky==='function')map.setSky({'sky-color':'#bddbe7','horizon-color':'#e9eee0','fog-color':'#e4eee9','fog-ground-blend':.25});
      map.addLayer({ id: 'revisit-buildings', type: 'fill-extrusion', source: 'openmaptiles', 'source-layer': 'building', minzoom: 14,
        layout: { visibility: props.three ? 'visible' : 'none' },
        paint: { 'fill-extrusion-color': ['interpolate',['linear'],['coalesce',['get','render_height'],9],0,'#8f9c8f',30,'#aca58e',100,'#7d94a0'], 'fill-extrusion-height': ['coalesce', ['get', 'render_height'], 9],
          'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0], 'fill-extrusion-opacity': .12 } }, label);
      map.addSource('revisit-route', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addLayer({ id: 'revisit-route-line', type: 'line', source: 'revisit-route',
        paint: { 'line-color': ['case', ['get', 'visited'], '#348a9d', '#799eaa'], 'line-width': 2, 'line-opacity': .65, 'line-dasharray': [2, 3] } });
      map.addSource('revisit-travel',{type:'geojson',data:{type:'FeatureCollection',features:[]}});
      map.addLayer({id:'revisit-travel-line',type:'line',source:'revisit-travel',paint:{'line-color':'#b59b57','line-width':3,'line-opacity':.85}});
      vehicles=createVehicles(map,(window as any).THREE,library);
      loaded = true; loading.value = false; error.value = ''; emit('ready'); makeMarkers(); execute();
    });
    map.on('zoomend', syncMarkers);
    map.on('movestart', interrupt);
    map.on('idle', revealImagery);
    map.on('sourcedata', revealImagery);
    map.on('moveend', revealImagery);
    map.on('error', (event:any) => {
      if(event.sourceId==='revisit-dem'){terrainFailed.value=true;map.setTerrain(null);return;}
      if(event.sourceId==='revisit-aerial'){imageryFailed.value=true;map.setPaintProperty('revisit-aerial','raster-opacity',.001);revealImagery();return;}
      if(event.sourceId==='revisit-satellite'){satelliteFailed.value=true;map.setLayoutProperty('revisit-satellite','visibility','none');return;}
      // A missing single tile is not a failed map. The initial load has a bounded timeout.
    });
    map.on('webglcontextlost', fail);
    observer = new ResizeObserver(() => {
      map?.resize();
      // Rotation/resizing must replace the desktop inset, not carry it into a narrow phone.
      if(loaded)map.setPadding(padding(!!props.selected && !travelling.value));
    }); observer.observe(canvas.value!);
  } catch { fail(); }
});
defineExpose({ cancel, skip:()=>void execute(true) });
onBeforeUnmount(() => { disposed = true; clearTimeout(loadTimer); observer?.disconnect(); cancel(); markers.forEach(item => item.marker.remove()); map?.remove(); });
</script>
<template>
  <div class="revisit-map" :class="{'is-travelling':travelling,'is-approaching':!!approachStage}" :data-approach="approachStage" :data-imagery="imageryStage" aria-label="旅行重遊立體地圖">
    <div ref="canvas" class="revisit-map-canvas" />
    <div v-if="loading || error" class="revisit-map-status" role="status"><span>{{ error ? '照片回憶模式' : '正在展開旅行地圖' }}</span><p>{{ error || '沿著走過的地方，再看一次。' }}</p></div>
    <span v-else class="revisit-map-material">{{ satelliteFailed?'地理底圖':'衛星底圖' }}{{ imageryFailed?' · 部分航照缺圖':' · 日本航照' }} · {{ terrainFailed ? '平面地形' : '地形與建物示意' }}</span>
  </div>
</template>

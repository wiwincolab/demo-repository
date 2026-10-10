<script setup lang="ts">
import type { Stop } from '~/types/trip';
import { paintBase, projection, type BaseMap, type Point } from '~/utils/map';
import { mapDetailLevel, visibleMapDetails, withinPlanningAreas, isUsableMapStroke, visibleMapTarget, sampleMapStroke } from '~/utils/planner-map';
import { indexRing } from '~/utils/polygon-index';
import { plannerStopClusters, individualSelectionLimit } from '~/utils/planner-poi';
import { loadScript } from '~/utils/loadScript';
import { attachTransitMap, preparePlannerBasemap, type TransitLegendLine } from '~/utils/transit-map';
import { benefitLabels, benefitLocationFrame, type PassBenefitPlace } from '~/data/pass-benefits';
import { coveragePolygons, coverageExtent, coverageAccess, passAccessLabels, type PassAccess, type PassCoverage } from '~/utils/pass-coverage';
const props = defineProps<{
  places: Stop[]; selected: number[]; drawing: boolean; hasRange: boolean; rangeIds: number[];
  boundary?: Point[]; areas?: Point[][]; benefits?: PassBenefitPlace[]; resetKey?: number; route?: number[]; coverage?: PassCoverage | null; bounds?: number[] | null;
}>();
const emit = defineEmits<{ range: [ids: number[], boundary: Point[], selectAll?: boolean]; select: [ids: number[]]; cancel: []; viewport: [bounds: number[], zoom: number]; inspect: [id: number] }>();
const asset = useAsset();
useHead({ link: [{ rel: 'stylesheet', href: asset('vendor/maplibre-gl.css') }] });
const box = ref<HTMLElement>(), geography = ref<HTMLElement>(), canvas = ref<HTMLCanvasElement>(), gesture = ref<SVGSVGElement>();
const size = reactive({ width: 720, height: 480 });
const points = ref<{ stop: Stop; point: Point }[]>([]), stroke = ref<Point[]>([]);
const selectedSet = computed(() => new Set(props.selected)), rangeSet = computed(() => new Set(props.rangeIds));
const groupedPoints = ref<{id:number;count:number;at:Point;point:Point;outside:boolean;selected:boolean}[]>([]), failedPhotos = ref<string[]>([]);
let clusterIndex = plannerStopClusters([]), stopById = new Map<number,Stop>();
const polygons = ref<Point[][]>([]), routePoints = ref<Point[]>([]);
const coveragePaths = ref<string[]>([]), coverageTracks = ref<{points:Point[];access:PassAccess}[]>([]);
const tourStops = ref<{name:string;point:Point;source?:string}[]>([]), focusedStop = ref('');
const fallbackNetworks=computed(()=> (props.coverage?.features || []).filter(f=>f.properties.role==='network').flatMap(f=>{
  const lines:Point[][]=f.geometry.type==='MultiLineString' ? f.geometry.coordinates : f.geometry.type==='LineString' ? [f.geometry.coordinates] : [];
  return lines.map(coordinates=>({coordinates,access:f.properties.access || 'unlimited' as PassAccess,bbox:coordinates.reduce((b,p)=>[Math.min(b[0]!,p[0]!),Math.min(b[1]!,p[1]!),Math.max(b[2]!,p[0]!),Math.max(b[3]!,p[1]!)],[Infinity,Infinity,-Infinity,-Infinity])}));
}));
const accessTypes = computed(() => coverageAccess(props.coverage));
const accessColours:Record<PassAccess,string> = {unlimited:'#ffc500','round-trip':'#e78529','one-way':'#e78529','through-service':'#8663c9','exit-only':'#d64783','scheduled-tour':'#287caf'};
const benefitPoints = ref<{ place: PassBenefitPlace; point: Point; frame: Point[] }[]>([]);
const focusedBenefit = ref('');
const zoom = ref(10), fallback = ref(true), loading = ref(true);
const transitLines = ref<TransitLegendLine[]>([]);
const detailLevel = computed(() => mapDetailLevel(zoom.value));
const details = computed(() => visibleMapDetails([...points.value].sort((a,b)=>Number(!!b.stop.photo.src)-Number(!!a.stop.photo.src)), props.selected, size.width, size.height, detailLevel.value));
const geographicAreas = computed(() => props.coverage ? coverageExtent(props.coverage) : props.areas?.length ? props.areas : props.boundary?.length ? [props.boundary] : []);
const benefitDetails = computed(() => {
  const occupied = details.value.map(p => p.point), result: typeof benefitPoints.value = [];
  for (const p of [...benefitPoints.value].sort((a,b) => Number(b.place.id === focusedBenefit.value) - Number(a.place.id === focusedBenefit.value))) {
    if (detailLevel.value === 'dots' && p.place.id !== focusedBenefit.value) continue;
    const expanded=detailLevel.value==='photos' || p.place.id===focusedBenefit.value;
    const width=expanded ? 185 : 135,height=expanded ? 180 : 48;
    if (p.point[0]! < width / 2 + 8 || p.point[0]! > size.width - width / 2 - 8 || p.point[1]! < height || p.point[1]! > size.height - 15) continue;
    if (p.place.id !== focusedBenefit.value && occupied.some(at => Math.abs(at[0]! - p.point[0]!) < width && Math.abs(at[1]! - p.point[1]!) < height)) continue;
    occupied.push(p.point); result.push(p);
  }
  return result;
});
const isTokyo = computed(() => props.places.length > 0 && props.places.every(s => s.at[0]! > 139.5 && s.at[0]! < 140 && s.at[1]! > 35.5 && s.at[1]! < 35.9));
let map: any, library: any, observer: ResizeObserver | undefined, disposed = false, basemapReady = false, frame = 0, disposeTransit: ReturnType<typeof attachTransitMap> | undefined;
let base: BaseMap | undefined, activePointer: number | undefined;
let clickStart: Point | undefined;
let cachedExtent: Point[] | Stop[] | undefined, cachedWidth = 0, cachedHeight = 0, originalProjection: ReturnType<typeof projection> | undefined;
const camera = { scale: 1, x: 0, y: 0 };
const fallbackExtent = ref<Point[]>([]);
const pointers = new Map<number, Point>();
let pinch = 0, strokeFrame = 0, clusterFrame = 0;
let strokeBuffer: Point[] = [];
function state(id: number) { return selectedSet.value.has(id) ? 'selected' : props.hasRange && !rangeSet.value.has(id) ? 'outside' : 'candidate'; }
function beginMapClick(event:PointerEvent) { clickStart=[event.clientX,event.clientY]; }
function chooseMapClick(event:MouseEvent) {
  if(props.drawing || !box.value || (event.target as Element).closest('button,summary,a'))return;
  if(clickStart && Math.hypot(event.clientX-clickStart[0]!,event.clientY-clickStart[1]!)>8)return;
  // Resolve HTML markers if the WebGL surface receives their pointer event.
  const hit=[...box.value.querySelectorAll<HTMLButtonElement>('.planner-location,.planner-place-detail,.planner-poi-cluster')].reverse().find(button=>{
    const r=button.getBoundingClientRect();return !button.disabled && event.clientX>=r.left && event.clientX<=r.right && event.clientY>=r.top && event.clientY<=r.bottom;
  });
  if(!hit)return;
  event.stopPropagation();
  if(hit.dataset.stopId && stopById.has(Number(hit.dataset.stopId)))toggle(Number(hit.dataset.stopId));
  else {const group=groupedPoints.value.find(g=>g.id===Number(hit.dataset.clusterId));if(group)expandCluster(group);}
}
function photoFailed(src:string) { if (!failedPhotos.value.includes(src)) failedPhotos.value.push(src); }
function rebuildClusters() { stopById = new Map(props.places.map(p=>[p.id,p])); clusterIndex = plannerStopClusters(props.places,props.selected,props.rangeIds,props.hasRange,(box.value?.clientWidth || size.width) <= 600 ? 60 : 44); refresh(); }
function scheduleClusters() { if (clusterFrame) return; clusterFrame=requestAnimationFrame(()=>{clusterFrame=0;rebuildClusters();}); }
function currentBounds() {
  if (!fallback.value && map) { const b=map.getBounds(); return [b.getWest(),b.getSouth(),b.getEast(),b.getNorth()]; }
  const [w,n]=invert([0,0]), [e,s]=invert([size.width,size.height]);
  return [w!,s!,e!,n!];
}
function reportViewport() { if (!disposed && (props.places.length || props.bounds)) emit('viewport', currentBounds(), zoom.value); }
function zoomBy(amount: number) {
  if (props.drawing) return;
  if (!fallback.value && map) map.zoomTo(Math.max(2,Math.min(18,map.getZoom()+amount)),{duration:matchMedia('(prefers-reduced-motion: reduce)').matches?0:200});
  else { fallbackZoom(2 ** amount); reportViewport(); }
}
function selectVisibleArea(selectAll = false) {
  cancelStroke();
  const boundary = [[16,16],[size.width-16,16],[size.width-16,size.height-16],[16,size.height-16]].map(invert);
  emit('range',props.places.filter(s=>withinPlanningAreas(s.at,[boundary])).map(s=>s.id),boundary,selectAll);
}
function expandCluster(group:typeof groupedPoints.value[number]) {
  if (props.drawing) return;
  const nextZoom=clusterIndex.getClusterExpansionZoom(group.id);
  if (!fallback.value && map) map.easeTo({center:group.at,zoom:nextZoom,duration:matchMedia('(prefers-reduced-motion: reduce)').matches?0:350});
  else { fallbackZoom(2 ** (nextZoom-zoom.value),group.point); reportViewport(); }
}
function fallbackProject() {
  const extent = fallbackExtent.value.length ? fallbackExtent.value : props.places;
  if (!originalProjection || cachedExtent !== extent || cachedWidth !== size.width || cachedHeight !== size.height) {
    originalProjection = projection(fallbackExtent.value.length ? fallbackExtent.value.map(at => ({at})) : props.places, size.width, size.height);
    cachedExtent = extent; cachedWidth = size.width; cachedHeight = size.height;
  }
  const original = originalProjection;
  const project = (at: Point): Point => {
    const p = original(at);
    return [(p[0]! - size.width / 2) * camera.scale + size.width / 2 + camera.x, (p[1]! - size.height / 2) * camera.scale + size.height / 2 + camera.y];
  };
  return Object.assign(project, { invert: (p: Point) => original.invert([(p[0]! - size.width / 2 - camera.x) / camera.scale + size.width / 2, (p[1]! - size.height / 2 - camera.y) / camera.scale + size.height / 2]) });
}
function project(at: Point): Point {
  if (!fallback.value && map) { const p = map.project(at); return [p.x, p.y]; }
  return fallbackProject()(at);
}
function invert(point: Point): Point {
  if (!fallback.value && map) { const p = map.unproject(point); return [p.lng, p.lat]; }
  return fallbackProject().invert(point);
}
function refresh() {
  if (!box.value || disposed) return;
  size.width = box.value.clientWidth; size.height = box.value.clientHeight;
  zoom.value = !fallback.value && map ? map.getZoom() : 10 + Math.log2(camera.scale);
  const bounds=currentBounds();
  const features=clusterIndex.getClusters(bounds as [number,number,number,number], Math.max(0,Math.floor(zoom.value)));
  groupedPoints.value=features.flatMap(f=>'cluster' in f.properties ? [{id:f.properties.cluster_id,count:f.properties.point_count,at:f.geometry.coordinates,point:project(f.geometry.coordinates),outside:props.hasRange && !f.properties.inRange,selected:f.properties.selectedCount>0}] : []).filter(p=>visibleMapTarget(p.point,size.width,size.height));
  const visibleIds=new Set(features.flatMap(f=>'cluster' in f.properties ? [] : [f.properties.id]));
  if(props.selected.length<=individualSelectionLimit)for(const id of props.selected) { const p=stopById.get(id);if(p && p.at[0]!>=bounds[0]! && p.at[0]!<=bounds[2]! && p.at[1]!>=bounds[1]! && p.at[1]!<=bounds[3]!)visibleIds.add(id); }
  points.value=[...visibleIds].flatMap(id=>{const stop=stopById.get(id);const point=stop ? project(stop.at) : [];return stop && visibleMapTarget(point,size.width,size.height) ? [{stop,point}] : [];});
  polygons.value = props.coverage ? [] : geographicAreas.value.map(area => area.map(project));
  coveragePaths.value = fallback.value ? coveragePolygons(props.coverage).map(rings => rings.map(ring => ring.map((at,i) => `${i ? 'L' : 'M'}${project(at).join(',')}`).join(' ') + ' Z').join(' ')) : [];
  coverageTracks.value = fallback.value ? fallbackNetworks.value.filter(line=>line.bbox[2]!>=bounds[0]! && line.bbox[0]!<=bounds[2]! && line.bbox[3]!>=bounds[1]! && line.bbox[1]!<=bounds[3]!).slice(0,1000).map(line=>({points:line.coordinates.map(project),access:line.access})) : [];
  tourStops.value = (props.coverage?.features || []).filter(f => f.properties.role === 'stop' && f.geometry.type === 'Point').map(f => ({name:f.properties.name || '停靠點',point:project(f.geometry.coordinates),source:f.properties.source})).filter(p=>visibleMapTarget(p.point,size.width,size.height));
  benefitPoints.value = (props.benefits || []).map(place => ({ place, point: project(place.at), frame: benefitLocationFrame(place.at).map(project) })).filter(p=>visibleMapTarget(p.point,size.width,size.height));
  routePoints.value = (props.route || []).flatMap(id => { const stop=stopById.get(id);return stop ? [project(stop.at)] : []; });
  if (!fallback.value && map) { zoom.value = map.getZoom(); return; }
  zoom.value = 10 + Math.log2(camera.scale);
  if (!canvas.value) return;
  const dpr = Math.min(devicePixelRatio, 2);
  canvas.value.width = size.width * dpr; canvas.value.height = size.height * dpr;
  const ctx = canvas.value.getContext('2d')!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (base && isTokyo.value) paintBase(ctx, base, project, size.width, size.height);
  else {
    ctx.fillStyle = '#edf5f2'; ctx.fillRect(0, 0, size.width, size.height);
    ctx.strokeStyle = '#dceae7'; ctx.lineWidth = 1;
    const gap = 40 * camera.scale;
    for (let x = camera.x % gap; x < size.width; x += gap) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, size.height); ctx.stroke(); }
    for (let y = camera.y % gap; y < size.height; y += gap) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(size.width, y); ctx.stroke(); }
  }
}
function updateCoverage() {
  if (!map || !basemapReady) return;
  const data = props.coverage ? {type:'FeatureCollection',features:props.coverage.features} : { type: 'FeatureCollection', features: [] };
  disposeTransit?.setCoverage(coveredTransitWays());
  if (map.getSource('travel-pass-coverage')) { map.getSource('travel-pass-coverage').setData(data); return; }
  map.addSource('travel-pass-coverage', { type: 'geojson', data, attribution: 'Pass routes © OpenStreetMap contributors (ODbL)' });
  map.addLayer({ id:'travel-pass-contour-fill',type:'fill',source:'travel-pass-coverage',filter:['==',['get','role'],'planning-contour'],paint:{'fill-color':'#009fc5','fill-opacity':.08} });
  map.addLayer({ id:'travel-pass-contour-outline',type:'line',source:'travel-pass-coverage',filter:['==',['get','role'],'planning-contour'],paint:{'line-color':'#009fc5','line-width':1.5,'line-dasharray':[3,2]} });
  map.addLayer({ id:'travel-pass-network',type:'line',source:'travel-pass-coverage',filter:['all',['==',['get','role'],'network'],['==',['get','access'],'unlimited']],layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':'#ffc500','line-width':8,'line-opacity':.45} });
  map.addLayer({ id:'travel-pass-limited',type:'line',source:'travel-pass-coverage',filter:['all',['==',['get','role'],'network'],['!=',['get','access'],'unlimited']],layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':['match',['get','access'],'exit-only','#d64783','through-service','#8663c9','#e78529'],'line-width':5,'line-opacity':.8,'line-dasharray':[2,2]} });
}
function coveredTransitWays() {
  return props.coverage?.metadata.mode === 'network' ? props.coverage.features.filter(f=>f.properties.role==='network').flatMap(f=>f.properties.osmIds || (Number.isInteger(f.properties.osmId) ? [f.properties.osmId!] : [])) : null;
}
function scheduleRefresh() { cancelAnimationFrame(frame); frame = requestAnimationFrame(refresh); }
function fit(areas = false) {
  const b=props.bounds;
  const coordinates = areas && geographicAreas.value.length ? geographicAreas.value.flat() : b ? [[b[0]!,b[1]!],[b[2]!,b[3]!]] : props.places.map(s => s.at);
  if (!coordinates.length) return;
  if (fallback.value || !map) { fallbackExtent.value = coordinates; camera.scale = 1; camera.x = camera.y = 0; refresh(); reportViewport(); return; }
  const bounds = new library.LngLatBounds(); coordinates.forEach(p => bounds.extend(p));
  map.fitBounds(bounds, { padding: { top: 65, bottom: 45, left: 45, right: 45 }, maxZoom: 12, duration: 0 });
  refresh();
}
function cancelStroke() { cancelAnimationFrame(strokeFrame); strokeFrame=0; strokeBuffer=[]; stroke.value = []; activePointer = undefined; pointers.clear(); pinch = 0; }
function drawingMode() {
  cancelStroke();
  if (props.drawing) gesture.value?.focus({ preventScroll: true });
  if (!map) return;
  if (props.drawing) { map.stop(); map.dragPan.disable(); map.doubleClickZoom.disable(); }
  else { map.dragPan.enable(); map.doubleClickZoom.enable(); }
}
function coordinate(e: PointerEvent | WheelEvent): Point { const r = box.value!.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
function start(e: PointerEvent) {
  if (e.button !== 0 || (!props.drawing && !fallback.value)) return;
  const p = coordinate(e); pointers.set(e.pointerId, p);
  (e.currentTarget as Element).setPointerCapture(e.pointerId);
  if (pointers.size > 1) { activePointer = undefined; cancelAnimationFrame(strokeFrame); strokeFrame=0; strokeBuffer=[]; stroke.value=[]; return; }
  if (props.drawing) { activePointer = e.pointerId; strokeBuffer=[p]; stroke.value = [p]; }
}
function move(e: PointerEvent) {
  const previous = pointers.get(e.pointerId); if (!previous) return;
  const p = coordinate(e); pointers.set(e.pointerId, p);
  if (pointers.size === 2 && fallback.value) {
    const [a, b] = [...pointers.values()]; const distance = Math.hypot(a![0]! - b![0]!, a![1]! - b![1]!);
    if (pinch) fallbackZoom(distance / pinch, [(a![0]! + b![0]!) / 2, (a![1]! + b![1]!) / 2]);
    pinch = distance; return;
  }
  if (props.drawing && activePointer === e.pointerId) {
    const last = strokeBuffer.at(-1)!;
    if (Math.hypot(p[0]! - last[0]!, p[1]! - last[1]!) >= 3 && strokeBuffer.length < 4000) {
      strokeBuffer.push(p);
      if (!strokeFrame) strokeFrame=requestAnimationFrame(()=>{strokeFrame=0;stroke.value=sampleMapStroke(strokeBuffer);});
    }
  } else if (!props.drawing && fallback.value && pointers.size === 1) {
    camera.x += p[0]! - previous[0]!; camera.y += p[1]! - previous[1]!; scheduleRefresh();
  }
}
function finish(e: PointerEvent) {
  if (e.pointerId === activePointer) {
    activePointer = undefined;
    const sampled=sampleMapStroke(strokeBuffer);
    if (e.type !== 'pointercancel' && isUsableMapStroke(sampled)) {
      const boundary = sampled.map(invert), contains=indexRing(boundary);
      emit('range', props.places.filter(s => contains(s.at)).map(s => s.id), boundary);
    }
    cancelStroke();
  }
  pointers.delete(e.pointerId); pinch = 0;
  const target = e.currentTarget as Element;
  if (target.hasPointerCapture(e.pointerId)) target.releasePointerCapture(e.pointerId);
  if (fallback.value && !props.drawing) reportViewport();
}
function fallbackZoom(factor: number, point: Point = [size.width / 2, size.height / 2]) {
  const at = invert(point); camera.scale = Math.max(.5, Math.min(64, camera.scale * factor));
  const after = project(at); camera.x += point[0]! - after[0]!; camera.y += point[1]! - after[1]!; refresh();
}
function wheel(e: WheelEvent) {
  e.preventDefault();
  if (props.drawing) cancelStroke();
  if (fallback.value) { fallbackZoom(Math.exp(-e.deltaY * .002), coordinate(e)); reportViewport(); }
  else if (map) map.zoomTo(Math.max(2, Math.min(18, map.getZoom() - e.deltaY * .004)), { around: invert(coordinate(e)), duration: 0 });
}
function keyboard(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.drawing) { stroke.value = []; emit('cancel'); return; }
  if (e.key === 'Enter' && props.drawing) {
    e.preventDefault();
    selectVisibleArea(true); return;
  }
  if (!fallback.value) return;
  const actions: Record<string, () => void> = { '+': () => fallbackZoom(1.5), '=': () => fallbackZoom(1.5), '-': () => fallbackZoom(1 / 1.5), '0': () => fit(), ArrowLeft: () => camera.x += 40, ArrowRight: () => camera.x -= 40, ArrowUp: () => camera.y += 40, ArrowDown: () => camera.y -= 40 };
  if (actions[e.key]) { e.preventDefault(); actions[e.key]!(); refresh(); reportViewport(); }
}
function toggle(id: number) {
  if (props.drawing) return;
  if (!props.hasRange) { emit('inspect',id); return; }
  emit('select', props.selected.includes(id) ? props.selected.filter(n => n !== id) : [...props.selected, id]);
}
watch(() => props.drawing, drawingMode, { flush: 'post' });
watch(() => props.boundary, () => { cancelStroke(); refresh(); }, { deep: true });
watch(() => [props.areas, props.coverage], () => { cancelStroke(); updateCoverage(); if (props.coverage || props.areas?.length) fit(true); else refresh(); });
watch(() => props.route, scheduleRefresh, { deep: true });
watch(() => props.benefits, () => { focusedBenefit.value = ''; scheduleRefresh(); });
watch(() => props.resetKey, () => { cancelStroke(); fit(); });
watch(() => props.places, scheduleClusters);
watch(() => [props.selected,props.rangeIds,props.hasRange], scheduleClusters);
watch(() => props.bounds, () => { cancelStroke(); fit(); });
onMounted(async () => {
  rebuildClusters();
  observer = new ResizeObserver(() => { map?.resize(); scheduleClusters(); }); observer.observe(box.value!); refresh();
  if (isTokyo.value) $fetch<BaseMap>(asset('assets/tokyo-map.json')).then(value => { if (!disposed) { base = value; refresh(); } }).catch(() => {});
  try {
    await loadScript(asset('vendor/maplibre-gl.js')); if (disposed) return;
    library = (window as any).maplibregl;
    // MapLibre measures the container during construction. Reveal it first so
    // v-show does not leave the canvas at its hidden-container 400 × 300 default.
    fallback.value = false; await nextTick(); if (disposed) return;
    map = new library.Map({ container: geography.value, style: 'https://tiles.openfreemap.org/styles/liberty', center: props.places[0]?.at || [139.75, 35.68], zoom: 10, attributionControl: true, dragRotate: false, touchPitch: false, maxZoom: 18 });
    map.touchZoomRotate.disableRotation(); map.scrollZoom.disable(); fit(!!geographicAreas.value.length); drawingMode();
    map.on('move', scheduleRefresh); map.on('moveend', reportViewport); map.on('load', () => { basemapReady = true; loading.value = false; preparePlannerBasemap(map); updateCoverage(); disposeTransit = attachTransitMap(map, asset, lines => { transitLines.value = lines; }); disposeTransit.setCoverage(coveredTransitWays()); refresh(); reportViewport(); });
    map.on('error', () => {
      loading.value = false;
      if (map && !basemapReady && !map.isStyleLoaded()) { disposeTransit?.(); map.remove(); map = undefined; fallback.value = true; fit(!!geographicAreas.value.length); }
    });
  } catch { fallback.value = true; loading.value = false; refresh(); }
});
onBeforeUnmount(() => { disposed = true; cancelAnimationFrame(frame); cancelAnimationFrame(clusterFrame); cancelAnimationFrame(strokeFrame); observer?.disconnect(); pointers.clear(); disposeTransit?.(); map?.remove(); });
</script>
<template>
  <div class="planner-map-panel">
    <div class="planner-map-actions" aria-label="地圖操作" @pointerdown.stop @wheel.stop>
      <button type="button" class="planner-select-view" :disabled="!places.length" @click="selectVisibleArea()">選這一區</button>
      <button type="button" aria-label="重新置中地圖" :disabled="drawing" @click="fit(!!geographicAreas.length)">置中</button>
      <button type="button" aria-label="放大地圖" :disabled="drawing || zoom >= 18" @click="zoomBy(1)">＋</button>
      <button type="button" aria-label="縮小地圖" :disabled="drawing || zoom <= 2" @click="zoomBy(-1)">−</button>
    </div>
  <div ref="box" class="route-map planner-map" :class="{ drawing }" @keydown="keyboard" @wheel="wheel" @pointerdown.capture="beginMapClick" @click.capture="chooseMapClick">
    <div ref="geography" v-show="!fallback" class="planner-geography" aria-label="排行程地圖，可拖曳平移、滾輪或雙指縮放查看景點詳情" />
    <canvas v-show="fallback" ref="canvas" aria-hidden="true" />
    <svg class="planner-overlay" :viewBox="`0 0 ${size.width} ${size.height}`" aria-hidden="true">
      <polygon v-for="(area, i) in polygons" :key="i" :points="area.map(p => p.join(',')).join(' ')" fill="#009fc51a" stroke="#009fc5" stroke-width="2" stroke-dasharray="5 4" />
      <path v-for="(path,i) in coveragePaths" :key="`coverage-${i}`" :d="path" fill="#009fc516" fill-rule="evenodd" stroke="#009fc5" stroke-width="1.5" stroke-dasharray="5 4" />
      <polyline v-for="(track,i) in coverageTracks" :key="`track-${i}`" :points="track.points.map(p=>p.join(',')).join(' ')" fill="none" :stroke="accessColours[track.access]" stroke-width="6" stroke-opacity=".6" :stroke-dasharray="track.access === 'unlimited' ? undefined : '6 6'" />
      <polyline v-if="routePoints.length > 1" :points="routePoints.map(p => p.join(',')).join(' ')" fill="none" stroke="#009fc5" stroke-width="3" stroke-dasharray="6 5" />
      <template v-if="detailLevel !== 'dots'"><polygon v-for="p in benefitPoints" :key="p.place.id" :points="p.frame.map(at => at.join(',')).join(' ')" fill="#ffc50016" stroke="#e1ad00" stroke-width="1.5" /></template>
    </svg>
    <button v-for="group in drawing ? [] : groupedPoints" :key="`cluster-${group.id}`" class="planner-poi-cluster" :data-cluster-id="group.id" :class="{outside:group.outside,selected:group.selected}" :style="{left:group.point[0]+'px',top:group.point[1]+'px'}" :aria-label="group.count+' 個景點，點選放大'" :disabled="drawing" @click="expandCluster(group)">{{ group.count }}</button>
    <button v-for="p in drawing ? [] : points" :key="p.stop.id" class="planner-location" :data-stop-id="p.stop.id" :class="state(p.stop.id)" :style="{ left: p.point[0] + 'px', top: p.point[1] + 'px' }" :aria-label="p.stop.name + (selectedSet.has(p.stop.id) ? '，已加入，再點移除' : hasRange ? '，點選加入行程' : '，查看景點照片')" :disabled="drawing" :aria-pressed="selectedSet.has(p.stop.id)" @click="toggle(p.stop.id)"><img referrerpolicy="no-referrer" v-if="p.stop.photo.src && !failedPhotos.includes(p.stop.photo.src)" :src="asset(p.stop.photo.src)" :alt="p.stop.photo.alt" loading="lazy" @error="photoFailed(p.stop.photo.src)"><i v-else class="planner-poi-dot" aria-hidden="true"/><span v-if="route?.includes(p.stop.id)">{{ route.indexOf(p.stop.id) + 1 }}</span></button>
    <button v-for="p in drawing ? [] : details" :key="`detail-${p.stop.id}`" class="planner-place-detail" :data-stop-id="p.stop.id" :class="[state(p.stop.id), { photo: detailLevel === 'photos' }]" :style="{ left: p.point[0] + 'px', top: (p.point[1]! - 18) + 'px' }" :disabled="drawing" :aria-pressed="selectedSet.has(p.stop.id)" :aria-label="`${p.stop.name}，${p.stop.stay}${hasRange ? selectedSet.has(p.stop.id) ? '，點選移除' : '，點選加入' : '，查看景點照片'}`" @click="toggle(p.stop.id)">
      <img referrerpolicy="no-referrer" v-if="p.stop.photo.src && !failedPhotos.includes(p.stop.photo.src)" :src="asset(p.stop.photo.src)" :alt="p.stop.photo.alt" loading="lazy" @error="photoFailed(p.stop.photo.src)">
      <small v-else-if="detailLevel === 'photos'" class="planner-photo-placeholder">{{ p.stop.photo.src ? '照片暫時無法載入' : '景點照片待補' }}</small>
      <span><b>{{ p.stop.name }}</b><small v-if="detailLevel === 'photos'">{{ p.stop.stay }}</small><p v-if="detailLevel === 'photos'">{{ p.stop.note }}</p></span>
      <i v-if="selectedSet.has(p.stop.id)" aria-hidden="true">✓</i>
    </button>
    <button v-for="p in drawing ? [] : benefitPoints" :key="`benefit-${p.place.id}`" class="planner-benefit-point" :style="{left:p.point[0]+'px',top:p.point[1]+'px'}" :aria-label="p.place.name+'，'+benefitLabels[p.place.benefit]+(p.place.status === 'temporarily-closed' ? '，暫停開放' : '')" :disabled="drawing" @click="focusedBenefit = focusedBenefit === p.place.id ? '' : p.place.id"><span>{{ p.place.status === 'temporarily-closed' ? '×' : p.place.benefit === 'discount' ? '%' : '✓' }}</span></button>
    <template v-for="p in drawing ? [] : tourStops" :key="p.name">
      <button class="planner-tour-stop" :style="{left:p.point[0]+'px',top:p.point[1]+'px'}" :aria-label="p.name+'，指定停靠點'" :disabled="drawing" @click="focusedStop = focusedStop === p.name ? '' : p.name">●</button>
      <article v-if="focusedStop === p.name" class="planner-tour-label" :style="{left:Math.max(108,Math.min(size.width-108,p.point[0]!))+'px',top:Math.max(110,p.point[1]! - 22)+'px'}"><b>{{ p.name }}</b><small>指定停靠點</small><a v-if="p.source" :href="p.source" target="_blank" rel="noopener">官方行程 ↗</a></article>
    </template>
    <article v-for="p in drawing ? [] : benefitDetails" :key="`benefit-detail-${p.place.id}`" class="planner-benefit-detail" :class="{expanded:detailLevel === 'photos' || focusedBenefit === p.place.id}" :style="{left:p.point[0]+'px',top:(p.point[1]! - 20)+'px'}">
      <b>{{ p.place.name }}</b><small>{{ p.place.status === 'temporarily-closed' ? '暫停開放 · ' : '' }}{{ benefitLabels[p.place.benefit] }}</small>
      <template v-if="detailLevel === 'photos' || focusedBenefit === p.place.id"><p>{{ p.place.note }}</p><a :href="p.place.source" target="_blank" rel="noopener">官方使用條件 ↗</a></template>
    </article>
    <svg v-if="drawing || fallback" ref="gesture" class="planner-gesture" :viewBox="`0 0 ${size.width} ${size.height}`" tabindex="0" role="group" :aria-label="drawing ? '拖曳畫出範圍；Enter 選取目前可見區域，Escape 取消圈選' : '地圖可拖曳平移，加減鍵、滾輪或雙指縮放'" @pointerdown="start" @pointermove="move" @pointerup="finish" @pointercancel="finish">
      <polygon v-if="stroke.length > 2" :points="stroke.map(p => p.join(',')).join(' ')" fill="#009fc51a" stroke="#009fc5" stroke-width="2" stroke-dasharray="5 4" />
    </svg>
    <span v-if="drawing" class="planner-map-hint">畫出範圍，放開即完成；也可按「選這一區」</span>
    <span v-if="loading && fallback" class="planner-map-credit">正在載入道路地圖…</span>
    <a v-else-if="fallback && isTokyo" class="planner-map-credit" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">© OpenStreetMap contributors</a>
    <span v-else-if="fallback" class="planner-map-credit">景點位置示意</span>
  </div>
    <span v-if="!drawing" class="planner-map-legend"><span v-for="access in accessTypes" :key="access"><i :style="{background:accessColours[access],borderTopColor:accessColours[access]}" :class="{limited:access !== 'unlimited'}" />{{ passAccessLabels[access] }}</span><span v-if="coverage"><i class="contour" />沿線／景點規劃輪廓</span><span v-if="benefits?.length"><i class="venue" />合作景點定位圈</span><template v-if="!fallback"><span><i class="line-colours" />地鐵依路線標色</span><span><i class="high-speed" />新幹線／高鐵</span></template></span>
    <details v-if="!drawing && !fallback && transitLines.length" class="planner-transit-legend" @wheel.stop @keydown.stop><summary>地鐵路線顏色 · {{ transitLines.length }} 條</summary><ul><li v-for="line in transitLines" :key="line.key" :class="{ excluded: line.covered === false }"><i :style="{ background: line.colour }" /><b v-if="line.ref">{{ line.ref }}</b>{{ line.name }}<small v-if="line.covered !== undefined">{{ line.covered ? '券內適用' : '未包含' }}{{ line.colour === '#778896' ? '・色彩待查核' : '' }}</small><small v-else-if="line.colour === '#778896'">色彩待查核</small></li></ul></details>
  </div>
</template>
<style scoped>
.planner-location img,.planner-place-detail img{pointer-events:none;user-select:none;-webkit-user-drag:none}
.planner-poi-cluster.outside{background:#a3acb3}.planner-poi-cluster.selected{border-color:#ffc500}
.planner-poi-cluster{position:absolute;transform:translate(-50%,-50%);z-index:3;width:40px;height:40px;border:2px solid white;border-radius:50%;background:#008eb2;color:#fff;font-size:12px;font-weight:600;box-shadow:0 2px 7px #244c6333;cursor:pointer}.planner-poi-cluster:focus-visible{outline:3px solid #ffc500;outline-offset:2px}.planner-poi-dot{display:block;width:17px;height:17px;border:2px solid white;border-radius:50%;background:#008eb2;box-shadow:0 2px 5px #244c6333}.planner-location.selected .planner-poi-dot{border-color:#ffc500}.planner-location.outside .planner-poi-dot{background:#a3acb3}.planner-photo-placeholder{display:grid!important;place-items:center;height:78px;background:#edf3f5;color:#718894;margin:0!important}
</style>
<style scoped>
.planner-tour-stop{position:absolute;transform:translate(-50%,-50%);z-index:4;width:36px;height:36px;background:#fff;border:2px solid #287caf;border-radius:50%;color:#287caf;cursor:pointer}.planner-tour-label{position:absolute;transform:translate(-50%,-100%);z-index:6;width:200px;background:#fff;border:1px solid #287caf;border-radius:9px;padding:10px;color:#315869;font-size:11px;box-shadow:0 3px 12px #244c6322}.planner-tour-label small{display:block;margin:5px 0}.planner-tour-label a{color:#0085a6}.planner-map-legend i.limited{background:none!important;border-top:3px dashed #e78529}
.planner-map{height:clamp(430px,65dvh,620px);margin:0;border:1px solid #d6e9ec;border-radius:20px;background:#edf5f2;isolation:isolate}.planner-geography,.planner-overlay,.planner-gesture{position:absolute;inset:0;width:100%;height:100%}.planner-overlay{z-index:1;pointer-events:none}.planner-gesture{z-index:2;touch-action:none;cursor:grab;outline:none}.drawing .planner-gesture{z-index:6;cursor:crosshair}.planner-gesture:focus-visible{outline:2px solid #009fc5;outline-offset:-3px}.planner-location{position:absolute;transform:translate(-50%,-50%);width:36px;height:36px;border:0;background:none;display:grid;place-items:center;z-index:3;padding:0;cursor:pointer}.planner-location span{display:grid;place-items:center;width:15px;height:15px;border:2px solid white;border-radius:50%;background:#009fc5;box-shadow:0 2px 5px #244c6333;color:white;font-size:9px}.planner-location.candidate span{background:#fff;border-color:#009fc5}.planner-location.selected span{width:20px;height:20px;background:#009fc5}.planner-location.outside span{background:#a3acb3;border-color:#fff}.planner-location:disabled{cursor:inherit;opacity:1}.planner-place-detail{position:absolute;transform:translate(-50%,-100%);z-index:4;width:112px;max-height:36px;min-height:29px;border:1px solid #d5e9eb;border-radius:9px;background:#fffffff5;color:#29596c;box-shadow:0 2px 6px #244c6314;padding:6px 9px;text-align:center;cursor:pointer}.planner-place-detail.photo{width:150px;max-height:171px;padding:0;overflow:hidden;text-align:left;border-radius:13px}.planner-place-detail span{display:block}.planner-place-detail.photo span{padding:8px 10px}.planner-place-detail b{display:block;font-size:11px;line-height:1.5;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.planner-place-detail small{display:block;font-size:10px;margin-top:3px;color:#738e9b}.planner-place-detail p{font-size:10px;line-height:1.5;margin:5px 0 0;color:#688692;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.planner-place-detail img{display:block;width:100%;height:78px;object-fit:cover}.planner-place-detail.outside{border-color:#dbe0e3;color:#7a858d;background:#fafcfddd}.planner-place-detail.selected{border-color:#009fc5}.planner-place-detail i{position:absolute;top:5px;right:5px;font-style:normal;background:#ffc500;border:2px solid white;border-radius:50%;width:19px;height:19px;color:#315a66;display:grid;place-items:center;font-size:10px}.planner-place-detail:disabled{cursor:inherit;opacity:1}.planner-map-hint{position:absolute;top:12px;left:12px;z-index:7;pointer-events:none;border-radius:9px;background:#fffffff0;padding:8px 11px;color:#537988;font-size:10px;box-shadow:0 2px 8px #29596c09}.drawing .planner-map-hint{color:#007f9f;border:1px solid #bee7ee}.planner-map-credit{position:absolute;bottom:8px;right:8px;font-size:9px;background:#ffffffe6;padding:3px 6px;color:#67838a;z-index:7}.planner-location:focus-visible,.planner-place-detail:focus-visible{outline:3px solid #ffc500;outline-offset:2px}@media(max-width:600px){.planner-map{height:65dvh;min-height:420px;max-height:570px;border-radius:16px}}

.planner-map-legend{position:absolute;bottom:35px;left:12px;right:12px;display:flex;flex-wrap:wrap;gap:7px 13px;z-index:7;pointer-events:none;width:fit-content;background:#fffffff0;color:#537988;border-radius:8px;padding:6px 9px;font-size:9px}.planner-map-legend>span{display:flex;align-items:center;gap:4px}.planner-map-legend i{width:14px;height:3px;border-radius:2px;background:#009fc5}.planner-map-legend i.light-rail{background:#7e74bf}.planner-map-legend i.high-speed{background:#e57667}.planner-map-legend i.venue{height:10px;width:10px;background:#fff8d7;border:1.5px solid #e1ad00;border-radius:2px}.planner-benefit-point{position:absolute;transform:translate(-50%,-50%);z-index:3;width:36px;height:36px;border:0;padding:0;background:none;display:grid;place-items:center;cursor:pointer}.planner-benefit-point span{display:grid;place-items:center;background:#ffc500;border:2px solid white;box-shadow:0 2px 6px #90792035;border-radius:6px;width:21px;height:21px;color:#675520;font-size:10px;font-weight:700}.planner-benefit-point:focus-visible{outline:3px solid #009fc5;border-radius:8px}.planner-benefit-detail{position:absolute;transform:translate(-50%,-100%);z-index:5;width:135px;padding:7px 9px;border:1px solid #ecd581;border-radius:9px;background:#fffef5f5;box-shadow:0 3px 10px #90792013;color:#5c572e;text-align:center;pointer-events:none}.planner-benefit-detail.expanded{width:185px;text-align:left;pointer-events:auto}.planner-benefit-detail b{display:block;font-size:10px;line-height:1.5;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.planner-benefit-detail small{display:block;font-size:9px;color:#978030;margin-top:2px}.planner-benefit-detail p{font-size:10px;line-height:1.6;margin:7px 0;color:#7b704b}.planner-benefit-detail a{font-size:10px;color:#007f9f}
</style>
<style scoped>
.planner-location{width:44px;height:44px}.planner-location img{width:34px;height:34px;object-fit:cover;border:2px solid white;border-radius:50%;box-shadow:0 2px 7px #244c6344}.planner-location.candidate img{border-color:#009fc5}.planner-location.selected img{border-color:#ffc500;box-shadow:0 0 0 3px #009fc544}.planner-location.outside img{filter:grayscale(.7);opacity:.55}.planner-location span{position:absolute;right:-1px;bottom:-1px;width:18px;height:18px;font-size:10px}.planner-place-detail:not(.photo){display:flex;align-items:center;gap:6px;width:140px;min-height:40px;max-height:44px;padding:4px;text-align:left}.planner-place-detail:not(.photo) img{width:32px;height:32px;object-fit:cover;border-radius:6px;flex:none}.planner-place-detail:not(.photo) span{min-width:0}
</style>
<style scoped>
.planner-transit-legend{position:absolute;right:12px;top:12px;z-index:7;max-width:min(280px,65%);border:1px solid #d5e5eb;border-radius:10px;background:#fffffff5;color:#315869;font-size:11px;box-shadow:0 2px 8px #244c6314}.planner-transit-legend summary{padding:9px 11px;cursor:pointer}.planner-transit-legend ul{list-style:none;margin:0;padding:4px 11px 10px;max-height:185px;overflow:auto;overscroll-behavior:contain}.planner-transit-legend li{display:flex;align-items:center;gap:6px;padding:5px 0;font-size:10px}.planner-transit-legend i{width:20px;height:4px;border:1px solid #0002;border-radius:3px;flex:none}.planner-transit-legend b{font-size:9px}.planner-transit-legend small{color:#8b6a45;font-size:9px}
</style>
<style scoped>
.planner-map-legend i.line-colours{background:linear-gradient(90deg,#ff9500 0 25%,#f62e36 25% 50%,#00a84d 50% 75%,#0052a4 75%)}.planner-map-legend i.pass-network{background:#ffc500;height:5px}.planner-map-legend i.contour{background:#009fc522;border:1px dashed #009fc5;height:8px;width:14px}.planner-map-legend i.venue{border-radius:50%}
</style>
<style scoped>
.planner-transit-legend li.excluded{opacity:.45}.planner-transit-legend li small{margin-left:auto;white-space:nowrap}.planner-map-hint{max-width:45%;font-size:9px}
</style>
<style scoped>
.planner-map-actions{position:absolute;top:10px;left:10px;right:10px;z-index:8;display:flex;gap:6px;pointer-events:none}
.planner-map-actions button{pointer-events:auto;min-width:44px;min-height:44px;padding:0 10px;border:1px solid #cfe1e7;border-radius:10px;background:#fffffff5;color:#315869;font-size:13px;font-weight:600;box-shadow:0 2px 8px #244c6314;touch-action:manipulation}
.planner-map-actions .planner-select-view{margin-right:auto;background:#008bad;color:#fff;border-color:#008bad;font-size:14px}
.planner-map-hint{top:66px;max-width:calc(100% - 24px);font-size:11px}
.planner-transit-legend{top:66px;max-width:calc(100% - 24px)}
.planner-transit-legend summary{min-height:44px;display:flex;align-items:center}
.planner-poi-cluster{width:44px;height:44px}
@media(max-width:600px){.planner-map{height:50svh;min-height:320px;max-height:440px}.planner-map-legend{bottom:28px;left:8px;right:8px;font-size:9px;padding:5px 7px;gap:5px 9px}.planner-transit-legend summary{padding:8px 10px}.planner-map :deep(.maplibregl-ctrl-attrib){max-width:calc(100% - 16px);font-size:9px}.planner-place-detail.photo{width:132px}.planner-place-detail.photo p{display:none}}
</style>

<style scoped>
.planner-map-panel{min-width:0;box-sizing:border-box}
.planner-map-actions{position:static;display:grid;grid-template-columns:minmax(0,1fr) auto 44px 44px;gap:8px;margin-bottom:10px;pointer-events:auto}
.planner-map-actions .planner-select-view{margin-right:0}
.planner-map-hint{top:12px}
.planner-map-legend{position:static;margin:10px 0 0;max-width:100%;box-sizing:border-box;background:#f4f9fa;font-size:10px}
.planner-transit-legend{position:static;margin-top:8px;max-width:100%;width:100%;box-sizing:border-box;box-shadow:none}
.planner-map{contain:layout paint}
@media(max-width:600px){.planner-map-panel{padding-inline:12px}.planner-map-actions button{font-size:14px}.planner-map-legend{font-size:10px}.planner-transit-legend summary{font-size:12px}}
</style>

<style scoped>
.planner-benefit-point,.planner-tour-stop{width:44px;height:44px}.planner-benefit-detail.expanded{max-height:160px;overflow:auto}.planner-tour-label{max-height:100px;overflow:auto}
</style>

<script setup lang="ts">
import type { Stop } from '~/types/trip';
import { paintBase, projection, type BaseMap, type Point } from '~/utils/map';
import { plannerMarkerState, mapDetailLevel, visibleMapDetails, withinPlanningAreas, isUsableMapStroke } from '~/utils/planner-map';
import { loadScript } from '~/utils/loadScript';
import { attachTransitMap, preparePlannerBasemap } from '~/utils/transit-map';
import { benefitLabels, benefitLocationFrame, type PassBenefitPlace } from '~/data/pass-benefits';
const props = defineProps<{
  places: Stop[]; selected: number[]; drawing: boolean; hasRange: boolean; rangeIds: number[];
  boundary?: Point[]; areas?: Point[][]; benefits?: PassBenefitPlace[]; resetKey?: number; route?: number[];
}>();
const emit = defineEmits<{ range: [ids: number[], boundary: Point[]]; select: [ids: number[]]; cancel: [] }>();
const asset = useAsset();
useHead({ link: [{ rel: 'stylesheet', href: asset('vendor/maplibre-gl.css') }] });
const box = ref<HTMLElement>(), geography = ref<HTMLElement>(), canvas = ref<HTMLCanvasElement>(), gesture = ref<SVGSVGElement>();
const size = reactive({ width: 720, height: 480 });
const points = ref<{ stop: Stop; point: Point }[]>([]), stroke = ref<Point[]>([]);
const polygons = ref<Point[][]>([]), routePoints = ref<Point[]>([]);
const benefitPoints = ref<{ place: PassBenefitPlace; point: Point; frame: Point[] }[]>([]);
const focusedBenefit = ref('');
const zoom = ref(10), fallback = ref(true), loading = ref(true);
const detailLevel = computed(() => mapDetailLevel(zoom.value));
const details = computed(() => visibleMapDetails(points.value, props.selected, size.width, size.height, detailLevel.value));
const geographicAreas = computed(() => props.areas?.length ? props.areas : props.boundary?.length ? [props.boundary] : []);
const benefitDetails = computed(() => {
  const occupied = details.value.map(p => p.point), result: typeof benefitPoints.value = [];
  const width = detailLevel.value === 'photos' ? 185 : 135, height = detailLevel.value === 'photos' ? 156 : 48;
  for (const p of [...benefitPoints.value].sort((a,b) => Number(b.place.id === focusedBenefit.value) - Number(a.place.id === focusedBenefit.value))) {
    if (detailLevel.value === 'dots' && p.place.id !== focusedBenefit.value) continue;
    if (p.point[0]! < width / 2 || p.point[0]! > size.width - width / 2 || p.point[1]! < height || p.point[1]! > size.height - 15) continue;
    if (p.place.id !== focusedBenefit.value && occupied.some(at => Math.abs(at[0]! - p.point[0]!) < width && Math.abs(at[1]! - p.point[1]!) < height)) continue;
    occupied.push(p.point); result.push(p);
  }
  return result;
});
const isTokyo = computed(() => props.places.length > 0 && props.places.every(s => s.at[0]! > 139.5 && s.at[0]! < 140 && s.at[1]! > 35.5 && s.at[1]! < 35.9));
let map: any, library: any, observer: ResizeObserver | undefined, disposed = false, basemapReady = false, frame = 0, disposeTransit: (() => void) | undefined;
let base: BaseMap | undefined, activePointer: number | undefined;
let cachedExtent: Point[] | Stop[] | undefined, cachedWidth = 0, cachedHeight = 0, originalProjection: ReturnType<typeof projection> | undefined;
const camera = { scale: 1, x: 0, y: 0 };
const fallbackExtent = ref<Point[]>([]);
const pointers = new Map<number, Point>();
let pinch = 0;
function state(id: number) { return plannerMarkerState(id, props.selected, props.rangeIds, props.hasRange); }
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
  points.value = props.places.map(stop => ({ stop, point: project(stop.at) }));
  polygons.value = geographicAreas.value.map(area => area.map(project));
  benefitPoints.value = (props.benefits || []).map(place => ({ place, point: project(place.at), frame: benefitLocationFrame(place.at).map(project) })).filter(p => p.point[0]! > -200 && p.point[0]! < size.width + 200 && p.point[1]! > -200 && p.point[1]! < size.height + 200);
  routePoints.value = (props.route || []).flatMap(id => { const p = points.value.find(p => p.stop.id === id); return p ? [p.point] : []; });
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
function scheduleRefresh() { cancelAnimationFrame(frame); frame = requestAnimationFrame(refresh); }
function fit(areas = false) {
  const coordinates = areas && geographicAreas.value.length ? geographicAreas.value.flat() : props.places.map(s => s.at);
  if (!coordinates.length) return;
  if (fallback.value || !map) { fallbackExtent.value = coordinates; camera.scale = 1; camera.x = camera.y = 0; refresh(); return; }
  const bounds = new library.LngLatBounds(); coordinates.forEach(p => bounds.extend(p));
  map.fitBounds(bounds, { padding: { top: 65, bottom: 45, left: 45, right: 45 }, maxZoom: 12, duration: 0 });
  refresh();
}
function cancelStroke() { stroke.value = []; activePointer = undefined; pointers.clear(); pinch = 0; }
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
  if (pointers.size > 1) { activePointer = undefined; stroke.value = []; return; }
  if (props.drawing) { activePointer = e.pointerId; stroke.value = [p]; }
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
    const last = stroke.value.at(-1)!;
    if (Math.hypot(p[0]! - last[0]!, p[1]! - last[1]!) >= 3 && stroke.value.length < 4000) stroke.value.push(p);
  } else if (!props.drawing && fallback.value && pointers.size === 1) {
    camera.x += p[0]! - previous[0]!; camera.y += p[1]! - previous[1]!; refresh();
  }
}
function finish(e: PointerEvent) {
  if (e.pointerId === activePointer) {
    activePointer = undefined;
    if (e.type !== 'pointercancel' && isUsableMapStroke(stroke.value)) {
      const boundary = stroke.value.map(invert);
      emit('range', props.places.filter(s => withinPlanningAreas(s.at, [boundary])).map(s => s.id), boundary);
    }
    stroke.value = [];
  }
  pointers.delete(e.pointerId); pinch = 0;
  const target = e.currentTarget as Element;
  if (target.hasPointerCapture(e.pointerId)) target.releasePointerCapture(e.pointerId);
}
function fallbackZoom(factor: number, point: Point = [size.width / 2, size.height / 2]) {
  const at = invert(point); camera.scale = Math.max(.5, Math.min(64, camera.scale * factor));
  const after = project(at); camera.x += point[0]! - after[0]!; camera.y += point[1]! - after[1]!; refresh();
}
function wheel(e: WheelEvent) {
  e.preventDefault();
  if (props.drawing) cancelStroke();
  if (fallback.value) fallbackZoom(Math.exp(-e.deltaY * .002), coordinate(e));
  else if (map) map.zoomTo(Math.max(2, Math.min(18, map.getZoom() - e.deltaY * .004)), { around: invert(coordinate(e)), duration: 0 });
}
function keyboard(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.drawing) { stroke.value = []; emit('cancel'); return; }
  if (e.key === 'Enter' && props.drawing) {
    e.preventDefault();
    const boundary = [[20, 20], [size.width - 20, 20], [size.width - 20, size.height - 20], [20, size.height - 20]].map(invert);
    emit('range', props.places.filter(s => withinPlanningAreas(s.at, [boundary])).map(s => s.id), boundary); return;
  }
  if (!fallback.value) return;
  const actions: Record<string, () => void> = { '+': () => fallbackZoom(1.5), '=': () => fallbackZoom(1.5), '-': () => fallbackZoom(1 / 1.5), '0': () => fit(), ArrowLeft: () => camera.x += 40, ArrowRight: () => camera.x -= 40, ArrowUp: () => camera.y += 40, ArrowDown: () => camera.y -= 40 };
  if (actions[e.key]) { e.preventDefault(); actions[e.key]!(); refresh(); }
}
function toggle(id: number) {
  if (!props.hasRange || props.drawing) return;
  emit('select', props.selected.includes(id) ? props.selected.filter(n => n !== id) : [...props.selected, id]);
}
watch(() => props.drawing, drawingMode, { flush: 'post' });
watch(() => [props.boundary, props.areas], () => { cancelStroke(); fit(true); }, { deep: true });
watch(() => props.route, scheduleRefresh, { deep: true });
watch(() => props.benefits, () => { focusedBenefit.value = ''; scheduleRefresh(); });
watch(() => props.resetKey, () => { cancelStroke(); fit(); });
watch(() => props.places, () => fit());
onMounted(async () => {
  observer = new ResizeObserver(() => { map?.resize(); refresh(); }); observer.observe(box.value!); refresh();
  if (isTokyo.value) $fetch<BaseMap>(asset('assets/tokyo-map.json')).then(value => { if (!disposed) { base = value; refresh(); } }).catch(() => {});
  try {
    await loadScript(asset('vendor/maplibre-gl.js')); if (disposed) return;
    library = (window as any).maplibregl;
    map = new library.Map({ container: geography.value, style: 'https://tiles.openfreemap.org/styles/liberty', center: props.places[0]?.at || [139.75, 35.68], zoom: 10, attributionControl: true, dragRotate: false, touchPitch: false, maxZoom: 18 });
    map.touchZoomRotate.disableRotation(); map.scrollZoom.disable(); fallback.value = false; fit(!!geographicAreas.value.length); drawingMode();
    map.on('move', scheduleRefresh); map.on('load', () => { basemapReady = true; loading.value = false; preparePlannerBasemap(map); disposeTransit = attachTransitMap(map, asset); refresh(); });
    map.on('error', () => {
      loading.value = false;
      if (map && !basemapReady && !map.isStyleLoaded()) { disposeTransit?.(); map.remove(); map = undefined; fallback.value = true; fit(!!geographicAreas.value.length); }
    });
  } catch { fallback.value = true; loading.value = false; refresh(); }
});
onBeforeUnmount(() => { disposed = true; cancelAnimationFrame(frame); observer?.disconnect(); pointers.clear(); disposeTransit?.(); map?.remove(); });
</script>
<template>
  <div ref="box" class="route-map planner-map" :class="{ drawing }" @keydown="keyboard" @wheel="wheel">
    <div ref="geography" v-show="!fallback" class="planner-geography" aria-label="排行程地圖，可拖曳平移、滾輪或雙指縮放查看景點詳情" />
    <canvas v-show="fallback" ref="canvas" aria-hidden="true" />
    <svg class="planner-overlay" :viewBox="`0 0 ${size.width} ${size.height}`" aria-hidden="true">
      <polygon v-for="(area, i) in polygons" :key="i" :points="area.map(p => p.join(',')).join(' ')" fill="#009fc51a" stroke="#009fc5" stroke-width="2" stroke-dasharray="5 4" />
      <polyline v-if="routePoints.length > 1" :points="routePoints.map(p => p.join(',')).join(' ')" fill="none" stroke="#009fc5" stroke-width="3" stroke-dasharray="6 5" />
      <template v-if="detailLevel !== 'dots'"><polygon v-for="p in benefitPoints" :key="p.place.id" :points="p.frame.map(at => at.join(',')).join(' ')" fill="#ffc50016" stroke="#e1ad00" stroke-width="1.5" /></template>
    </svg>
    <button v-for="p in points" :key="p.stop.id" class="planner-location" :class="state(p.stop.id)" :style="{ left: p.point[0] + 'px', top: p.point[1] + 'px' }" :aria-label="p.stop.name + (selected.includes(p.stop.id) ? '，已加入，再點移除' : hasRange ? '，點選加入行程' : '，先選擇遊玩範圍')" :disabled="drawing || !hasRange" :aria-pressed="selected.includes(p.stop.id)" @click="toggle(p.stop.id)"><span>{{ route?.includes(p.stop.id) ? route.indexOf(p.stop.id) + 1 : '' }}</span></button>
    <button v-for="p in details" :key="`detail-${p.stop.id}`" class="planner-place-detail" :class="[state(p.stop.id), { photo: detailLevel === 'photos' }]" :style="{ left: p.point[0] + 'px', top: (p.point[1]! - 18) + 'px' }" :disabled="drawing || !hasRange" :aria-pressed="selected.includes(p.stop.id)" :aria-label="`${p.stop.name}，${p.stop.stay}${hasRange ? selected.includes(p.stop.id) ? '，點選移除' : '，點選加入' : ''}`" @click="toggle(p.stop.id)">
      <img v-if="detailLevel === 'photos'" :src="asset(p.stop.photo.src)" :alt="p.stop.photo.alt" loading="lazy">
      <span><b>{{ p.stop.name }}</b><small v-if="detailLevel === 'photos'">{{ p.stop.stay }}</small><p v-if="detailLevel === 'photos'">{{ p.stop.note }}</p></span>
      <i v-if="selected.includes(p.stop.id)" aria-hidden="true">✓</i>
    </button>
    <button v-for="p in benefitPoints" :key="`benefit-${p.place.id}`" class="planner-benefit-point" :style="{left:p.point[0]+'px',top:p.point[1]+'px'}" :aria-label="p.place.name+'，'+benefitLabels[p.place.benefit]+(p.place.status === 'temporarily-closed' ? '，暫停開放' : '')" :disabled="drawing" @click="focusedBenefit = focusedBenefit === p.place.id ? '' : p.place.id"><span>{{ p.place.status === 'temporarily-closed' ? '×' : p.place.benefit === 'discount' ? '%' : '✓' }}</span></button>
    <article v-for="p in benefitDetails" :key="`benefit-detail-${p.place.id}`" class="planner-benefit-detail" :class="{expanded:detailLevel === 'photos' || focusedBenefit === p.place.id}" :style="{left:p.point[0]+'px',top:(p.point[1]! - 20)+'px'}">
      <b>{{ p.place.name }}</b><small>{{ p.place.status === 'temporarily-closed' ? '暫停開放 · ' : '' }}{{ benefitLabels[p.place.benefit] }}</small>
      <template v-if="detailLevel === 'photos' || focusedBenefit === p.place.id"><p>{{ p.place.note }}</p><a :href="p.place.source" target="_blank" rel="noopener">官方使用條件 ↗</a></template>
    </article>
    <svg v-if="drawing || fallback" ref="gesture" class="planner-gesture" :viewBox="`0 0 ${size.width} ${size.height}`" tabindex="0" role="group" :aria-label="drawing ? '拖曳畫出範圍；Enter 選取目前可見區域，Escape 取消圈選' : '地圖可拖曳平移，加減鍵、滾輪或雙指縮放'" @pointerdown="start" @pointermove="move" @pointerup="finish" @pointercancel="finish">
      <polygon v-if="stroke.length > 2" :points="stroke.map(p => p.join(',')).join(' ')" fill="#009fc51a" stroke="#009fc5" stroke-width="2" stroke-dasharray="5 4" />
    </svg>
    <span class="planner-map-hint">{{ drawing ? '拖曳畫出想逛的範圍，放開就完成' : '放大地圖看景點 · 雙指或滾輪縮放' }}</span>
    <span v-if="!drawing" class="planner-map-legend"><span v-if="benefits?.length"><i class="venue" />合作景點定位框</span><template v-if="!fallback"><span><i class="metro" />地鐵</span><span><i class="light-rail" />輕軌</span><span><i class="high-speed" />新幹線／高鐵</span></template></span>
    <span v-if="loading && fallback" class="planner-map-credit">正在載入道路地圖…</span>
    <a v-else-if="fallback && isTokyo" class="planner-map-credit" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">© OpenStreetMap contributors</a>
    <span v-else-if="fallback" class="planner-map-credit">景點位置示意</span>
  </div>
</template>
<style scoped>
.planner-map{height:clamp(430px,65dvh,620px);margin:0;border:1px solid #d6e9ec;border-radius:20px;background:#edf5f2;isolation:isolate}.planner-geography,.planner-overlay,.planner-gesture{position:absolute;inset:0;width:100%;height:100%}.planner-overlay{z-index:1;pointer-events:none}.planner-gesture{z-index:2;touch-action:none;cursor:grab;outline:none}.drawing .planner-gesture{z-index:6;cursor:crosshair}.planner-gesture:focus-visible{outline:2px solid #009fc5;outline-offset:-3px}.planner-location{position:absolute;transform:translate(-50%,-50%);width:36px;height:36px;border:0;background:none;display:grid;place-items:center;z-index:3;padding:0;cursor:pointer}.planner-location span{display:grid;place-items:center;width:15px;height:15px;border:2px solid white;border-radius:50%;background:#009fc5;box-shadow:0 2px 5px #244c6333;color:white;font-size:9px}.planner-location.candidate span{background:#fff;border-color:#009fc5}.planner-location.selected span{width:20px;height:20px;background:#009fc5}.planner-location.outside span{background:#a3acb3;border-color:#fff}.planner-location:disabled{cursor:inherit;opacity:1}.planner-place-detail{position:absolute;transform:translate(-50%,-100%);z-index:4;width:112px;max-height:36px;min-height:29px;border:1px solid #d5e9eb;border-radius:9px;background:#fffffff5;color:#29596c;box-shadow:0 2px 6px #244c6314;padding:6px 9px;text-align:center;cursor:pointer}.planner-place-detail.photo{width:150px;max-height:171px;padding:0;overflow:hidden;text-align:left;border-radius:13px}.planner-place-detail span{display:block}.planner-place-detail.photo span{padding:8px 10px}.planner-place-detail b{display:block;font-size:11px;line-height:1.5;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.planner-place-detail small{display:block;font-size:10px;margin-top:3px;color:#738e9b}.planner-place-detail p{font-size:10px;line-height:1.5;margin:5px 0 0;color:#688692;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.planner-place-detail img{display:block;width:100%;height:78px;object-fit:cover}.planner-place-detail.outside{border-color:#dbe0e3;color:#7a858d;background:#fafcfddd}.planner-place-detail.selected{border-color:#009fc5}.planner-place-detail i{position:absolute;top:5px;right:5px;font-style:normal;background:#ffc500;border:2px solid white;border-radius:50%;width:19px;height:19px;color:#315a66;display:grid;place-items:center;font-size:10px}.planner-place-detail:disabled{cursor:inherit;opacity:1}.planner-map-hint{position:absolute;top:12px;left:12px;z-index:7;pointer-events:none;border-radius:9px;background:#fffffff0;padding:8px 11px;color:#537988;font-size:10px;box-shadow:0 2px 8px #29596c09}.drawing .planner-map-hint{color:#007f9f;border:1px solid #bee7ee}.planner-map-credit{position:absolute;bottom:8px;right:8px;font-size:9px;background:#ffffffe6;padding:3px 6px;color:#67838a;z-index:7}.planner-location:focus-visible,.planner-place-detail:focus-visible{outline:3px solid #ffc500;outline-offset:2px}@media(max-width:600px){.planner-map{height:65dvh;min-height:420px;max-height:570px;border-radius:16px}}

.planner-map-legend{position:absolute;bottom:35px;left:12px;right:12px;display:flex;flex-wrap:wrap;gap:7px 13px;z-index:7;pointer-events:none;width:fit-content;background:#fffffff0;color:#537988;border-radius:8px;padding:6px 9px;font-size:9px}.planner-map-legend>span{display:flex;align-items:center;gap:4px}.planner-map-legend i{width:14px;height:3px;border-radius:2px;background:#009fc5}.planner-map-legend i.light-rail{background:#7e74bf}.planner-map-legend i.high-speed{background:#e57667}.planner-map-legend i.venue{height:10px;width:10px;background:#fff8d7;border:1.5px solid #e1ad00;border-radius:2px}.planner-benefit-point{position:absolute;transform:translate(-50%,-50%);z-index:3;width:36px;height:36px;border:0;padding:0;background:none;display:grid;place-items:center;cursor:pointer}.planner-benefit-point span{display:grid;place-items:center;background:#ffc500;border:2px solid white;box-shadow:0 2px 6px #90792035;border-radius:6px;width:21px;height:21px;color:#675520;font-size:10px;font-weight:700}.planner-benefit-point:focus-visible{outline:3px solid #009fc5;border-radius:8px}.planner-benefit-detail{position:absolute;transform:translate(-50%,-100%);z-index:5;width:135px;padding:7px 9px;border:1px solid #ecd581;border-radius:9px;background:#fffef5f5;box-shadow:0 3px 10px #90792013;color:#5c572e;text-align:center;pointer-events:none}.planner-benefit-detail.expanded{width:185px;text-align:left;pointer-events:auto}.planner-benefit-detail b{display:block;font-size:10px;line-height:1.5;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.planner-benefit-detail small{display:block;font-size:9px;color:#978030;margin-top:2px}.planner-benefit-detail p{font-size:10px;line-height:1.6;margin:7px 0;color:#7b704b}.planner-benefit-detail a{font-size:10px;color:#007f9f}
</style>

<script setup lang="ts">
import type { Stop } from '~/types/trip';
import { dayColors } from '~/utils/map';
import { loadScript } from '~/utils/loadScript';
import { directionsUrl } from '~/utils/directions';
const props = defineProps<{ stops: Stop[]; selected: number; overview?: boolean }>();
const emit = defineEmits<{ select: [id: number]; day: [day: number] }>();
const asset = useAsset();
const element = ref<HTMLElement>(), ready = ref(false), error = ref(''), playing = ref(false);
let map: any, library: any, disposed = false, observer: ResizeObserver | undefined;
let timer: ReturnType<typeof setTimeout> | undefined;
let markers: Array<{ stop: Stop; marker: any; button: HTMLButtonElement }> = [];
useHead({ link: [{ rel: 'stylesheet', href: asset('vendor/maplibre-gl.css') }] });
const index = computed(() => props.stops.findIndex(s => s.id === props.selected));
const onward = computed(() => index.value >= 0 ? props.stops[index.value + 1] : undefined);
function pause() { playing.value = false; clearTimeout(timer); }
function next(auto = false) {
  if (props.overview || props.stops.length < 2) return;
  if (!auto) pause();
  const target = props.stops[(Math.max(0, index.value) + 1) % props.stops.length]!;
  emit('select', target.id);
  if (auto && target === props.stops.at(-1)) pause();
  else if (auto) timer = setTimeout(() => next(true), 2000);
}
function toggle() { if (playing.value) pause(); else { playing.value = true; next(true); } }
function fit() {
  if (!ready.value || !props.stops.length) return;
  const bounds = new library.LngLatBounds();
  props.stops.forEach(s => bounds.extend(s.at));
  map.fitBounds(bounds, { padding: 55, maxZoom: 14, duration: 0 });
}
function selection() {
  markers.forEach(({stop, button}) => button.setAttribute('aria-pressed', String(!props.overview && stop.id === props.selected)));
}
function sync() {
  if (!ready.value) return;
  markers.forEach(m => m.marker.remove());
  markers = props.stops.map((stop, i) => {
    const button = document.createElement('button');
    button.className = 'route-location-pin';
    button.style.setProperty('--day', dayColors[stop.day % dayColors.length]!);
    button.textContent = props.overview ? `${stop.day + 1}·${i + 1}` : String(i + 1);
    button.setAttribute('aria-label', props.overview ? `第 ${stop.day + 1} 天・${stop.name}` : `${i + 1} ${stop.name}`);
    button.title = stop.name;
    button.onclick = () => { pause(); props.overview ? emit('day', stop.day) : emit('select', stop.id); };
    return { stop, button, marker: new library.Marker({ element: button }).setLngLat(stop.at).addTo(map) };
  });
  map.getSource('itinerary').setData({ type: 'FeatureCollection', features: props.stops.slice(1).map((s, i) => ({
    type: 'Feature', properties: { color: dayColors[s.day % dayColors.length], overnight: props.stops[i]!.day !== s.day },
    geometry: { type: 'LineString', coordinates: [props.stops[i]!.at, s.at] }
  })) });
  selection(); fit();
}
watch(() => [props.stops, props.overview], () => { pause(); sync(); }, { deep: true });
watch(() => props.selected, () => {
  selection();
  const stop = props.stops[index.value];
  if (ready.value && stop && !props.overview) map.easeTo({ center: stop.at, duration: matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 450 });
});
onMounted(async () => {
  try {
    await loadScript(asset('vendor/maplibre-gl.js'));
    if (disposed) return;
    library = (window as any).maplibregl;
    map = new library.Map({ container: element.value, style: 'https://tiles.openfreemap.org/styles/liberty', center: props.stops[0]?.at || [121, 24], zoom: 8, attributionControl: true, cooperativeGestures: true });
    map.addControl(new library.NavigationControl({ showCompass: false }), 'top-right');
    map.on('error', () => { error.value = '部分地圖資源暫時無法載入，可使用下方交通路線連結。'; });
    map.on('load', () => {
      if (disposed) return;
      map.addSource('itinerary', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addLayer({ id: 'itinerary-lines', type: 'line', source: 'itinerary', filter: ['==', ['get', 'overnight'], false], paint: { 'line-color': ['get', 'color'], 'line-width': 3, 'line-opacity': .8 } });
      map.addLayer({ id: 'itinerary-overnight', type: 'line', source: 'itinerary', filter: ['==', ['get', 'overnight'], true], paint: { 'line-color': ['get', 'color'], 'line-width': 2, 'line-dasharray': [2, 3] } });
      ready.value = true; sync();
    });
    observer = new ResizeObserver(() => map?.resize());
    observer.observe(element.value!);
  } catch { error.value = '地圖暫時無法載入，可使用下方交通路線連結。'; }
});
onBeforeUnmount(() => { disposed = true; pause(); observer?.disconnect(); markers.forEach(m => m.marker.remove()); map?.remove(); });
</script>
<template>
  <div class="route-map geographic-route-map">
    <div ref="element" class="route-geography" aria-label="行程景點與道路地圖" />
    <span v-if="!ready" class="route-loading" role="status">{{ error || '正在載入道路地圖…' }}</span>
    <button v-if="ready" class="route-fit" @click="fit">顯示全部景點</button>
    <span class="route-map-legend">連線為行程順序示意，實際走法請查看交通路線</span>
  </div>
  <p v-if="error && ready" class="page-note" role="status">{{ error }}</p>
  <div class="play-bar">
    <span role="status">{{ overview ? '點選景點查看當天行程' : `${index + 1} / ${stops.length} 站` }}</span>
    <button :disabled="overview || stops.length < 2" @click="toggle">{{ playing ? '暫停' : '播放旅程' }}</button>
    <button :disabled="overview || stops.length < 2" @click="next()">下一站 →</button>
  </div>
  <a v-if="!overview && onward && stops[index]" class="route-directions-link" :href="directionsUrl(stops[index]!, onward)" target="_blank" rel="noopener noreferrer">{{ stops[index]!.name }} → {{ onward.name }} · 查看交通路線 ↗</a>
</template>
<style>
.geographic-route-map { height: 390px; }
.geographic-route-map .route-geography { position:absolute; inset:0; width:100%; height:100%; }
.route-location-pin { min-width:32px; height:32px; padding:0 7px; border-radius:18px; border:2px solid white; background:var(--day); color:white; font-weight:700; box-shadow:0 2px 7px #17374755; cursor:pointer; }
.route-location-pin[aria-pressed="true"] { outline:3px solid #ffd83e; z-index:2; }
.route-location-pin:focus-visible { outline:3px solid #16364c; }
.route-fit { position:absolute; top:12px; left:12px; background:white; border:0; border-radius:16px; padding:8px 12px; box-shadow:0 2px 8px #0002; }
.route-map-legend { position:absolute; bottom:32px; left:8px; right:8px; width:fit-content; background:#fffffff0; padding:4px 7px; border-radius:5px; font-size:11px; pointer-events:none; }
.route-loading { position:absolute; top:55px; left:16px; right:55px; padding:12px; background:white; border-radius:8px; }
.route-directions-link { display:block; padding:12px 14px; font-size:13px; color:#186b85; background:#eef7f8; border-radius:10px; line-height:1.7; }
</style>

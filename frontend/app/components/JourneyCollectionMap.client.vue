<script setup lang="ts">
import { loadScript } from '~/utils/loadScript';
const { stops, state } = useJourneyCollection();
const props = defineProps<{ selected: string }>();
const emit = defineEmits<{ select: [id: string] }>();
const asset = useAsset();
const element = ref<HTMLElement>(), ready = ref(false), error = ref('');
let map: any, library: any, disposed = false;
const markers: Array<{ id: string; marker: any; element: HTMLButtonElement }> = [];
useHead({ link: [{ rel: 'stylesheet', href: asset('vendor/maplibre-gl.css') }] });
function duration() { return matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 550; }
function overview() {
  if (!map || !ready.value) return;
  const bounds = new library.LngLatBounds();
  stops.forEach(stop => bounds.extend(stop.coords));
  map.fitBounds(bounds, { padding: { top: 65, right: 58, bottom: 65, left: 58 }, duration: duration(), maxZoom: 10.2 });
}
function syncMarkers() {
  markers.forEach(item => {
    item.element.setAttribute('aria-pressed', String(item.id === props.selected));
    item.element.classList.toggle('is-selected', item.id === props.selected);
    item.element.classList.toggle('is-photo', item.id === 'usj' && !state.value.usjSaved);
    item.element.style.zIndex = item.id === props.selected ? '3' : '1';
  });
}
watch(() => props.selected, () => {
  syncMarkers();
  if (!ready.value) return;
  const stop = stops.find(s => s.id === props.selected);
  if (stop) map.easeTo({ center: stop.coords, zoom: Math.max(map.getZoom(), 10.1), duration: duration() });
});
watch(() => state.value.usjSaved, syncMarkers);
onMounted(async () => {
  try {
    await loadScript(asset('vendor/maplibre-gl.js'));
    if (disposed) return;
    library = (window as any).maplibregl;
    const style = await $fetch(asset('atlas-assets/map-style.json'));
    if (disposed) return;
    map = new library.Map({ container: element.value, style, center: [135.6, 34.85], zoom: 9, attributionControl: true, cooperativeGestures: true });
    map.addControl(new library.NavigationControl({ showCompass: false }), 'bottom-right');
    map.on('load', () => {
      if (disposed) return;
      map.addSource('journey-links', { type: 'geojson', data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: stops.map(stop => stop.coords) } } });
      map.addLayer({ id: 'journey-links', type: 'line', source: 'journey-links', paint: { 'line-color': '#2c8ba0', 'line-width': 2, 'line-opacity': .55, 'line-dasharray': [2, 3] } });
      stops.forEach((stop, index) => {
        const button = document.createElement('button');
        button.className = 'journey-map-marker';
        button.setAttribute('aria-label', '查看' + stop.name);
        const badge = document.createElement('span');
        badge.textContent = String(index + 1).padStart(2, '0');
        const name = document.createElement('b');
        name.textContent = stop.short;
        button.append(badge, name);
        button.onclick = () => emit('select', stop.id);
        const anchor = stop.id === 'usj' ? 'bottom-right' : stop.id === 'dotonbori' ? 'top-left' : 'bottom';
        const marker = new library.Marker({ element: button, anchor }).setLngLat(stop.coords).addTo(map);
        markers.push({ id: stop.id, marker, element: button });
      });
      ready.value = true;
      error.value = '';
      syncMarkers();
      overview();
    });
    map.on('error', () => { if (!ready.value) error.value = '底圖暫時無法載入，你仍可從下方選擇旅程中的回憶。'; });
  } catch { error.value = '底圖暫時無法載入，你仍可從下方選擇旅程中的回憶。'; }
});
onBeforeUnmount(() => { disposed = true; markers.forEach(item => item.marker.remove()); map?.remove(); });
</script>
<template>
  <div class="journey-map" aria-label="關西旅行收藏地圖">
    <div ref="element" class="journey-map-canvas" />
    <div v-if="!ready" class="journey-map-wait" role="status"><span>關西旅行地圖</span><p>{{ error || '正在打開地圖…' }}</p></div>
    <div class="journey-map-heading"><span>KANSAI, JAPAN</span><strong>沿著走過的地方，<br>找回留下的回憶。</strong></div>
    <button v-if="ready" class="journey-map-overview" @click="overview" aria-label="顯示整趟旅行的所有地點"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M4 9V4h5m6 0h5v5m0 6v5h-5m-6 0H4v-5"/></svg>整趟旅行</button>
    <small class="journey-map-note">連線為回憶順序示意</small>
  </div>
</template>

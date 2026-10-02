<script setup lang="ts">
import trip from '~/data/atlas.json';
import { loadScript } from '~/utils/loadScript';
import { createVehicles } from '~/utils/atlas-vehicles';
import { createLandmarks } from '~/utils/atlas-landmarks';
const props = defineProps<{
    selected: number;
    city: string;
    three: boolean;
    paused: boolean;
}>();
const emit = defineEmits<{
    select: [
        id: number
    ];
    arrive: [
        id: number
    ];
}>();
const asset = useAsset();
useHead({ link: [{ rel: 'stylesheet', href: asset('vendor/maplibre-gl.css') }] });
const element = ref<HTMLElement>(), ready = ref(false), error = ref(''), notice = ref('台灣出發，沿著旅程回到每個地方。');
let map: any = null, library: any = null, vehicles: any = null, landmarks: any = null;
let frame = 0, pulse = 0, canceled = false;
const markers: any[] = [];
const collection = (features: object[]) => ({ type: 'FeatureCollection', features });
function path(from: number[], to: number[], flight: boolean) {
    return Array.from({ length: 81 }, (_, i) => { const t = i / 80; return [from[0]! + (to[0]! - from[0]!) * t, from[1]! + (to[1]! - from[1]!) * t + (flight ? Math.sin(t * Math.PI) * Math.abs(to[0]! - from[0]!) * .16 : 0)]; });
}
function routeData(coordinates: number[][]) { return collection([{ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates } }]); }
function overview() {
    if (!ready.value)
        return;
    cancelAnimationFrame(frame);
    cancelAnimationFrame(pulse);
    vehicles?.hide();
    landmarks?.clear();
    if (props.city === 'all')
        map.fitBounds([[111, 22], [141, 38]], { padding: 32, duration: 600, pitch: 0 });
    else {
        const city = trip.cities.find(c => c.id === props.city)!;
        map.easeTo({ center: city.at, zoom: 11, pitch: props.three ? 40 : 0, bearing: city.bearing, duration: 600 });
    }
}
function visit() {
    if (!ready.value || props.selected < 0) {
        overview();
        return;
    }
    cancelAnimationFrame(frame);
    cancelAnimationFrame(pulse);
    landmarks?.clear();
    const stop = trip.stops[props.selected]!;
    const previous = trip.stops[props.selected - 1];
    const from = previous?.at || trip.origin.at;
    const flight = stop.vehicle === 'plane';
    const coordinates = path(from, stop.at, flight);
    map.getSource('memory-progress').setData(routeData([from, from]));
    notice.value = '正在前往 ' + stop.name + ' · ' + stop.mode;
    if (flight)
        map.fitBounds([from, stop.at], { padding: 60, duration: 650, pitch: 0, bearing: 0 });
    else
        map.easeTo({ center: coordinates[40], zoom: Math.min(stop.zoom, 15), pitch: props.three ? 50 : 0, duration: 650 });
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let elapsed = 0, last = 0;
    const duration = reduced ? 1 : flight ? 3500 : 2200;
    function tick(now: number) {
        if (canceled)
            return;
        if (!last)
            last = now;
        if (!props.paused)
            elapsed += now - last;
        last = now;
        const t = Math.min(1, elapsed / duration), f = t * (coordinates.length - 1), index = Math.min(coordinates.length - 2, Math.floor(f)), blend = f - index;
        const a = coordinates[index]!, b = coordinates[index + 1]!;
        const point = [a[0]! + (b[0]! - a[0]!) * blend, a[1]! + (b[1]! - a[1]!) * blend];
        vehicles?.move(stop.vehicle, point, b, (meters: number) => {
            const latitudeScale = 111320 * Math.cos(point[1]! * Math.PI / 180);
            const totalMeters = Math.max(1, Math.hypot((stop.at[0]! - from[0]!) * latitudeScale, (stop.at[1]! - from[1]!) * 111320));
            const sample = Math.max(0, Math.min(1, t - meters / totalMeters));
            const n = Math.min(79, Math.floor(sample * 80));
            return coordinates[n];
        }, { city: stop.city });
        map.getSource('memory-progress').setData(routeData([...coordinates.slice(0, index + 1), point]));
        if (t < 1)
            frame = requestAnimationFrame(tick);
        else {
            vehicles?.hide();
            map.easeTo({ center: stop.at, zoom: stop.zoom, pitch: props.three ? 54 : 0, bearing: trip.cities.find(c => c.id === stop.city)!.bearing, duration: reduced ? 0 : 800 });
            landmarks?.start(stop);
            const start = performance.now();
            function glow(time: number) { landmarks?.update(time - start, reduced); if (time - start < 1800)
                pulse = requestAnimationFrame(glow);
            else
                landmarks?.settle(); }
            pulse = requestAnimationFrame(glow);
            emit('arrive', stop.id);
        }
    }
    frame = requestAnimationFrame(tick);
}
watch(() => props.selected, visit);
watch(() => props.city, () => { if (props.selected < 0)
    overview(); });
watch(() => props.three, value => { if (ready.value) {
    map.setLayoutProperty('memory-buildings', 'visibility', value ? 'visible' : 'none');
    map.easeTo({ pitch: value && props.selected >= 0 ? 54 : 0, duration: 450 });
} });
onMounted(async () => {
    try {
        await Promise.all([loadScript(asset('vendor/maplibre-gl.js')), loadScript(asset('vendor/three.min.js'))]);
        if (canceled)
            return;
        library = (window as any).maplibregl;
        const style = await $fetch(asset('atlas-assets/map-style.json'));
        if (canceled)
            return;
        map = new library.Map({ container: element.value, style, center: [127, 30], zoom: 3.6, attributionControl: true, maxPitch: 65 });
        map.addControl(new library.NavigationControl(), 'top-right');
        map.on('load', () => {
            if (canceled)
                return;
            const firstLabel = map.getStyle().layers.find((l: any) => l.type === 'symbol')?.id;
            map.addLayer({ id: 'memory-buildings', type: 'fill-extrusion', source: 'openmaptiles', 'source-layer': 'building', minzoom: 14, filter: ['!=', ['get', 'hide_3d'], true], paint: { 'fill-extrusion-color': '#c1cfce', 'fill-extrusion-height': ['coalesce', ['get', 'render_height'], 12], 'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0], 'fill-extrusion-opacity': .87 } }, firstLabel);
            map.addSource('memory-progress', { type: 'geojson', data: collection([]) });
            map.addLayer({ id: 'memory-progress-line', type: 'line', source: 'memory-progress', paint: { 'line-color': '#148dba', 'line-width': 3.5 }, layout: { 'line-cap': 'round' } });
            trip.stops.forEach(s => {
                const button = document.createElement('button');
                button.className = 'map-pin atlas-marker';
                button.style.setProperty('--day', trip.cities.find(c => c.id === s.city)!.color);
                button.setAttribute('aria-label', s.name);
                const circle = document.createElement('span');
                circle.textContent = String(s.id + 1);
                button.appendChild(circle);
                button.onclick = () => emit('select', s.id);
                markers.push(new library.Marker({ element: button }).setLngLat(s.at).addTo(map));
            });
            vehicles = createVehicles(map, (window as any).THREE, library);
            landmarks = createLandmarks(map, (message: string) => notice.value = message);
            ready.value = true;
            error.value = '';
            if (props.selected >= 0)
                visit();
            else
                overview();
        });
        map.on('error', () => { if (!ready.value)
            error.value = '地圖資料暫時無法載入；仍可用下方景點清單查看照片與收藏。'; });
    }
    catch {
        error.value = '地圖無法啟動，仍可用下方景點清單查看照片與收藏。';
    }
});
onBeforeUnmount(() => { canceled = true; cancelAnimationFrame(frame); cancelAnimationFrame(pulse); markers.forEach(m => m.remove()); map?.remove(); });
</script>
<template>
  <div class="atlas-map">
    <div ref="element" style="position:absolute;inset:0" />
    <div v-if="!ready" class="atlas-overlay">{{ error || '正在打開你的旅行地圖…' }}</div>
    <span v-else class="map-note">{{ notice }}</span>
  </div>
</template>


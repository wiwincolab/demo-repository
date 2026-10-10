<script setup lang="ts">
import type { Stop } from '~/types/trip';
import { paintBase, projection, pointInPolygon } from '~/utils/map';
import type { BaseMap, Point } from '~/utils/map';
const props = defineProps<{
    places: Stop[];
    selected: number[];
    drawing: boolean;
    boundary?: Point[];
    resetKey?: number;
    route?: number[];
}>();
const emit = defineEmits<{
    range: [ids: number[], boundary: Point[]];
    select: [
        ids: number[]
    ];
}>();
const box = ref<HTMLElement>(), canvas = ref<HTMLCanvasElement>();
const points = ref<{
    stop: Stop;
    point: Point;
}[]>([]), polygon = ref<Point[]>([]);
const routePoints = computed(() => (props.route || []).map(id => points.value.find(p => p.stop.id === id)?.point).filter((p): p is Point => !!p));
const size = ref({ width: 1, height: 300 });
const asset = useAsset();
const isTokyo=computed(()=>props.places.length>0&&props.places.every(s=>s.at[0]!>139.5&&s.at[0]!<140&&s.at[1]!>35.5&&s.at[1]!<35.9));
let observer: ResizeObserver | null = null, data: BaseMap | null = null, active = false;
function draw() {
    if (!box.value || !canvas.value || !props.places.length)
        return;
    size.value = { width: box.value.clientWidth, height: box.value.clientHeight };
    const dpr = Math.min(devicePixelRatio, 2);
    canvas.value.width = size.value.width * dpr;
    canvas.value.height = size.value.height * dpr;
    const ctx = canvas.value.getContext('2d')!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const project = projection(props.places, size.value.width, size.value.height);
    ctx.fillStyle = '#edf1e9';
    ctx.fillRect(0, 0, size.value.width, size.value.height);
    if (data&&isTokyo.value)
        paintBase(ctx, data, project, size.value.width, size.value.height);
    else {
      ctx.strokeStyle='#dce5e4';ctx.lineWidth=1;
      for(let x=0;x<size.value.width;x+=36){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,size.value.height);ctx.stroke();}
      for(let y=0;y<size.value.height;y+=36){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(size.value.width,y);ctx.stroke();}
    }
    points.value = props.places.map(stop => ({ stop, point: project(stop.at) }));
    polygon.value = (props.boundary || []).map(project);
}
function coordinate(event: PointerEvent): Point { const r = box.value!.getBoundingClientRect(); return [event.clientX - r.left, event.clientY - r.top]; }
function start(event: PointerEvent) {
    if (!props.drawing || event.button !== 0)
        return;
    active = true;
    polygon.value = [coordinate(event)];
    (event.currentTarget as Element).setPointerCapture(event.pointerId);
}
function move(event: PointerEvent) { if (active)
    polygon.value.push(coordinate(event)); }
function finish() {
    if (!active)
        return;
    active = false;
    if (polygon.value.length < 3) {
        cancel();
        return;
    }
    const project = projection(props.places, size.value.width, size.value.height);
    emit('range', points.value.filter(p => pointInPolygon(p.point, polygon.value)).map(p => p.stop.id), polygon.value.map(project.invert));
}
function cancel() { active = false; draw(); }
function toggle(id: number) { emit('select', props.selected.includes(id) ? props.selected.filter(n => n !== id) : [...props.selected, id]); }
watch(() => props.resetKey, () => { active = false; polygon.value = []; });
watch(() => props.places, () => { polygon.value = []; draw(); });
watch(() => props.boundary, draw);
onMounted(async () => { observer = new ResizeObserver(draw); observer.observe(box.value!); draw(); if(!isTokyo.value)return; try {
    data = await $fetch<BaseMap>(asset('assets/tokyo-map.json'));
    draw();
}
catch { } });
onBeforeUnmount(() => observer?.disconnect());
</script>
<template>
  <div ref="box" class="route-map planner-map" :class="{ drawing }">
    <canvas ref="canvas" aria-hidden="true" />
    <svg class="planner-route" :viewBox="'0 0 ' + size.width + ' ' + size.height" aria-hidden="true"><polyline v-if="routePoints.length > 1" :points="routePoints.map(p => p.join(',')).join(' ')" fill="none" stroke="#148dba" stroke-width="3" stroke-dasharray="6 5" /></svg>
    <svg class="planner-draw" :viewBox="'0 0 ' + size.width + ' ' + size.height" aria-label="在地圖上圈選景點" @pointerdown="start" @pointermove="move" @pointerup="finish" @pointercancel="cancel">
      <polygon v-if="polygon.length > 2" :points="polygon.map(p => p.join(',')).join(' ')" fill="#009fe822" stroke="#009fe8" stroke-width="2" stroke-dasharray="5 5" />
    </svg>
    <button v-for="(p, i) in points" :key="p.stop.id" class="map-pin" :style="{ left: p.point[0] + 'px', top: p.point[1] + 'px', '--day': selected.includes(p.stop.id) ? '#009fe8' : '#929ba3' }" :aria-label="p.stop.name + (selected.includes(p.stop.id) ? '・已選取' : '・未選取，可加入')" :disabled="drawing" :aria-pressed="selected.includes(p.stop.id)" @click="toggle(p.stop.id)">
      <span>{{ route?.includes(p.stop.id) ? route.indexOf(p.stop.id) + 1 : route?.length ? '·' : i + 1 }}</span>
    </button>
    <span class="map-note">{{ drawing ? '拖曳圈出範圍，放開後查看景點' : '藍色已選取・灰色未選取，可用文字加入' }}</span>
    <a v-if="isTokyo" class="map-credit" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">© OpenStreetMap contributors</a>
    <span v-else class="map-credit">景點位置示意・非道路地圖</span>
  </div>
</template>


<style scoped>
.planner-map .map-pin[aria-pressed=true]>span{background:#009fe8;border:2px solid white;animation:none}
.planner-map.drawing .planner-draw{z-index:5;cursor:crosshair}
.planner-map:not(.drawing) .planner-draw{pointer-events:none}
.map-note{pointer-events:none}
</style>

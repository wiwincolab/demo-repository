<script setup lang="ts">
import type { Stop } from '~/types/trip';
import { projection, paintBase, dayColors } from '~/utils/map';
import type { BaseMap, Point } from '~/utils/map';
const props = defineProps<{
    stops: Stop[];
    selected: number;
    overview?: boolean;
}>();
const emit = defineEmits<{
    select: [
        id: number
    ];
    day: [
        day: number
    ];
}>();
const asset = useAsset();
const box = ref<HTMLElement>();
const baseCanvas = ref<HTMLCanvasElement>();
const routeCanvas = ref<HTMLCanvasElement>();
const points = ref<{
    stop: Stop;
    point: Point;
}[]>([]);
const playing = ref(false);
const isTokyo=computed(()=>props.stops.length>0&&props.stops.every(s=>s.at[0]!>139.5&&s.at[0]!<140&&s.at[1]!>35.5&&s.at[1]!<35.9));
const error = ref('');
let map: BaseMap | null = null, observer: ResizeObserver | null = null, frame = 0;
let timer: ReturnType<typeof setTimeout> | undefined;
let size = { width: 0, height: 0 };
const pins = computed(() => {
    if (!props.overview)
        return points.value.map((p, i) => ({ ...p, label: String(i + 1), days: [] as number[] }));
    const groups=isTokyo.value?[[0, 4], [1, 3], [2]]:[...new Set(points.value.map(p=>p.stop.day))].map(day=>[day]);
    return groups.map(group => {
        const groupPoints = points.value.filter(p => group.includes(p.stop.day));
        if(!groupPoints.length)return null;
        return { stop: groupPoints[0]!.stop, point: [groupPoints.reduce((s, p) => s + p.point[0]!, 0) / groupPoints.length, groupPoints.reduce((s, p) => s + p.point[1]!, 0) / groupPoints.length], label: group.map(n => n + 1).join('·'), days: group };
    }).filter((pin):pin is NonNullable<typeof pin>=>pin!==null);
});
const cluster = ref<number[]>([]);
function stop() { playing.value = false; cancelAnimationFrame(frame); clearTimeout(timer); }
function paintRoute(traveler?: Point) {
    const ctx = routeCanvas.value?.getContext('2d');
    if (!ctx)
        return;
    ctx.clearRect(0, 0, size.width, size.height);
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    points.value.slice(1).forEach((p, i) => {
        const a = points.value[i]!;
        ctx.beginPath();
        ctx.moveTo(a.point[0]!, a.point[1]!);
        ctx.lineTo(p.point[0]!, p.point[1]!);
        ctx.strokeStyle = dayColors[p.stop.day]!;
        ctx.setLineDash(a.stop.day === p.stop.day ? [] : [4, 6]);
        ctx.stroke();
    });
    ctx.setLineDash([]);
    if (traveler) {
        ctx.beginPath();
        ctx.arc(traveler[0]!, traveler[1]!, 7, 0, Math.PI * 2);
        ctx.fillStyle = '#16364c';
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#ffd83e';
        ctx.stroke();
    }
}
function draw() {
    if (!box.value || !baseCanvas.value || !routeCanvas.value || !props.stops.length)
        return;
    size = { width: box.value.clientWidth, height: box.value.clientHeight };
    if (!size.width)
        return;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    for (const canvas of [baseCanvas.value, routeCanvas.value]) {
        canvas.width = size.width * dpr;
        canvas.height = size.height * dpr;
        canvas.getContext('2d')!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    const project = projection(props.stops, size.width, size.height);
    const ctx = baseCanvas.value.getContext('2d')!;
    ctx.fillStyle = '#edf1e9';
    ctx.fillRect(0, 0, size.width, size.height);
    if (map&&isTokyo.value)
        paintBase(ctx, map, project, size.width, size.height);
    else {
      ctx.strokeStyle='#dce5e4';ctx.lineWidth=1;
      for(let x=0;x<size.width;x+=36){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,size.height);ctx.stroke();}
      for(let y=0;y<size.height;y+=36){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(size.width,y);ctx.stroke();}
    }
    points.value = props.stops.map(stop => ({ stop, point: project(stop.at) }));
    paintRoute();
}
function next(auto = false) {
    if (props.overview || points.value.length < 2)
        return;
    if (!auto)
        stop();
    const index = Math.max(0, points.value.findIndex(p => p.stop.id === props.selected));
    const nextIndex = (index + 1) % points.value.length;
    const from = points.value[index]!.point, target = points.value[nextIndex]!;
    const start = performance.now(), reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    function tick(now: number) {
        const t = reduced ? 1 : Math.min(1, (now - start) / 1100), u = t * t * (3 - 2 * t);
        paintRoute([from[0]! + (target.point[0]! - from[0]!) * u, from[1]! + (target.point[1]! - from[1]!) * u]);
        if (t < 1)
            frame = requestAnimationFrame(tick);
        else {
            emit('select', target.stop.id);
            if (auto && playing.value) {
                if (nextIndex === points.value.length - 1)
                    stop();
                else
                    timer = setTimeout(() => next(true), 2000);
            }
        }
    }
    frame = requestAnimationFrame(tick);
}
function toggle() { if (playing.value)
    stop();
else {
    playing.value = true;
    next(true);
} }
watch(() => props.stops, () => { stop(); nextTick(draw); }, { deep: true });
watch(() => props.selected, () => { paintRoute(); });
onMounted(async () => {
    observer = new ResizeObserver(() => { stop(); draw(); });
    observer.observe(box.value!);
    draw();
    if(!isTokyo.value)return;
    try {
        map = await $fetch<BaseMap>(asset('assets/tokyo-map.json'));
        draw();
    }
    catch {
        error.value = '底圖載入失敗，仍可透過下方清單查看行程。';
    }
});
onBeforeUnmount(() => { stop(); observer?.disconnect(); });
</script>
<template>
  <div ref="box" class="route-map">
    <canvas ref="baseCanvas" aria-hidden="true" />
    <canvas ref="routeCanvas" aria-hidden="true" />
    <div id="map-pins">
      <button v-for="pin in pins" :key="pin.stop.id" class="map-pin" :style="{ left: pin.point[0] + 'px', top: pin.point[1] + 'px', '--day': dayColors[pin.stop.day] }" :aria-label="overview ? '查看第 ' + pin.label + ' 天的行程' : pin.label + ' ' + pin.stop.name" :aria-pressed="!overview && selected === pin.stop.id" @click="stop(); overview ? (cluster = pin.days) : emit('select', pin.stop.id)">
        <span>{{ pin.label }}</span>
      </button>
    </div>
    <span class="map-note">{{ isTokyo ? '路線示意・非導航' : '景點位置示意・非道路地圖' }}</span>
    <a v-if="isTokyo" class="map-credit" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">© OpenStreetMap contributors</a>
  </div>
  <p v-if="error" class="page-note">{{ error }}</p>
  <div class="play-bar">
    <span role="status">{{ overview ? '點選日子展開景點' : (stops.findIndex(s => s.id === selected) + 1) + ' / ' + stops.length + ' 站' }}</span>
    <button :disabled="overview" @click="toggle">{{ playing ? '暫停' : '播放旅程' }}</button>
    <button :disabled="overview" @click="next()">下一站 →</button>
  </div>
  <AppSheet :model-value="cluster.length > 0" title="這一帶的行程" @update:model-value="cluster = []">
    <button v-for="day in cluster" :key="day" class="link-row" @click="emit('day', day); cluster = []">第 {{ day + 1 }} 天<span>查看景點 ›</span></button>
  </AppSheet>
</template>


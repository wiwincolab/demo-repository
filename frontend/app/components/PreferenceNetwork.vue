<script setup lang="ts">
import type { PlannerKeywordId } from '~/data/planner-preferences';
import { createPreferenceGraph, stepPreferenceGraph, type PreferenceNode } from '~/utils/preference-graph';

const props = defineProps<{ remembered: PlannerKeywordId[]; selected: string; labels: Record<string, string>; hiddenIds: string[] }>();
const emit = defineEmits<{ select: [id: string]; remember: [id: PlannerKeywordId]; remove: [id: string]; rename: [id: string, title: string]; restore: [] }>();
const graph = createPreferenceGraph();
// Settle first so reduced motion and the server render also have a readable layout.
for (let i = 0; i < 180; i++) stepPreferenceGraph(graph.nodes, graph.links);
const nodes = ref(graph.nodes);
const svg = ref<SVGSVGElement>();
const hover = ref('');
const editorInput = ref<HTMLInputElement>();
const menu = ref<{ id: string; x: number; y: number; editing: boolean }>();
const draft = ref('');
const menuNode = computed(() => nodes.value.find(n => n.id === menu.value?.id));
const view = reactive({ x: 0, y: 0, scale: 1 });
const size = reactive({ width: 720, height: 550 });
const screenUnit = computed(() => Math.max(720 / size.width, 550 / size.height) / view.scale);
const showTopicLabels = computed(() => size.width >= 560 || view.scale >= 1.3);
const active = computed(() => {
  const node = nodes.value.find(n => n.id === (hover.value || props.selected));
  return node?.keywordId || node?.id;
});
const shown = computed(() => nodes.value.filter(n => !props.hiddenIds.includes(n.id) && !props.hiddenIds.includes(n.keywordId || '')));
const links = computed(() => {
  const byId = new Map(shown.value.map(n => [n.id, n]));
  return graph.links.flatMap(link => {
    const a = byId.get(link.source), b = byId.get(link.target);
    return a && b ? [{ ...link, a, b }] : [];
  });
});
const viewBox = computed(() => `${-360 / view.scale - view.x} ${-275 / view.scale - view.y} ${720 / view.scale} ${550 / view.scale}`);
function remembered(node: PreferenceNode) { return node.kind === 'profile' || !!node.keywordId && props.remembered.includes(node.keywordId); }
function related(node: PreferenceNode) { return hover.value === 'profile' || node.id === active.value || node.keywordId === active.value || (active.value !== 'profile' && node.kind === 'profile'); }
function title(node: PreferenceNode) { return props.labels[node.id] || node.title; }
function choose(node: PreferenceNode) { menu.value = undefined; emit('select', node.id); }
function openMenu(node: PreferenceNode, x?: number, y?: number) {
  cancelAnimationFrame(frame); ticks = 0;
  emit('select', node.id);
  const rect = svg.value?.getBoundingClientRect();
  if (!rect) return;
  if (x === undefined || y === undefined) {
    const point = new DOMPoint(node.x, node.y).matrixTransform(svg.value!.getScreenCTM()!);
    x = point.x; y = point.y;
  }
  menu.value = { id: node.id, x: Math.max(12, Math.min(rect.width - 202, x - rect.left)), y: Math.max(12, Math.min(rect.height - 180, y - rect.top + 14)), editing: false };
}
async function editName() {
  if (!menu.value || !menuNode.value) return;
  draft.value = title(menuNode.value); menu.value.editing = true;
  await nextTick(); editorInput.value?.focus(); editorInput.value?.select();
}
function saveName() {
  if (!menu.value || !draft.value.trim()) return;
  emit('rename', menu.value.id, draft.value.trim()); menu.value = undefined;
}
function removeNode() { if (menu.value) emit('remove', menu.value.id); menu.value = undefined; }
function rememberNode() { if (menuNode.value?.keywordId) emit('remember', menuNode.value.keywordId); menu.value = undefined; }
function restoreNodes() { emit('restore'); menu.value = undefined; }
function zoom(factor: number) { view.scale = Math.max(.65, Math.min(2.6, view.scale * factor)); }
function reset() { view.x = 0; view.y = 0; view.scale = 1; }
function coordinate(e: PointerEvent) {
  const matrix = svg.value?.getScreenCTM();
  if (!matrix) return { x: 0, y: 0 };
  return new DOMPoint(e.clientX, e.clientY).matrixTransform(matrix.inverse());
}
const pointers = new Map<number, { x: number; y: number }>();
let drag: { id: number; node?: PreferenceNode; startX: number; startY: number; offsetX: number; offsetY: number; moved: boolean; longPressed: boolean } | undefined;
let longPress: ReturnType<typeof setTimeout> | undefined;
function cancelLongPress() { clearTimeout(longPress); longPress = undefined; }
let pinch = 0, frame = 0, ticks = 0, reduced = false;
function animate() {
  cancelAnimationFrame(frame);
  if (reduced || ticks <= 0) return;
  stepPreferenceGraph(nodes.value, graph.links, drag?.node?.id);
  ticks--;
  frame = requestAnimationFrame(animate);
}
function down(e: PointerEvent) {
  if (e.button !== 0) return;
  menu.value = undefined; cancelLongPress();
  // Holding a node must not move its branch, even if an earlier drag is settling.
  cancelAnimationFrame(frame); ticks = 0;
  const target = (e.target as Element).closest('[data-node]');
  const node = nodes.value.find(n => n.id === target?.getAttribute('data-node'));
  const point = coordinate(e);
  if (!pointers.size) drag = { id: e.pointerId, node, startX: e.clientX, startY: e.clientY, offsetX: (node?.x || 0) - point.x, offsetY: (node?.y || 0) - point.y, moved: false, longPressed: false };
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pointers.size > 1 && drag) { drag.moved = true; drag.node = undefined; }
  svg.value?.setPointerCapture(e.pointerId);
  if (node && pointers.size === 1) longPress = setTimeout(() => {
    if (!drag || drag.moved || pointers.size !== 1) return;
    drag.longPressed = true; openMenu(node, e.clientX, e.clientY);
  }, 550);
}
function move(e: PointerEvent) {
  const previous = pointers.get(e.pointerId);
  if (!previous || !drag) return;
  if (drag.longPressed) return;
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pointers.size === 2) {
    cancelLongPress();
    const [a, b] = [...pointers.values()];
    const distance = Math.hypot(a!.x - b!.x, a!.y - b!.y);
    if (pinch) zoom(distance / pinch);
    pinch = distance;
    return;
  }
  const point = coordinate(e);
  const dx = e.clientX - previous.x, dy = e.clientY - previous.y;
  // Measure in screen pixels so a small hand movement is safe at every zoom.
  if (Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY) > 8 || drag.moved) drag.moved = true;
  if (!drag.moved) return;
  cancelLongPress();
  if (drag.node && drag.node.kind !== 'profile') {
    drag.node.x = point.x + drag.offsetX; drag.node.y = point.y + drag.offsetY;
    ticks = 90; animate();
  } else {
    const rect = svg.value!.getBoundingClientRect();
    const unit = Math.max(720 / rect.width, 550 / rect.height) / view.scale;
    view.x += dx * unit; view.y += dy * unit;
  }
}
function up(e: PointerEvent) {
  cancelLongPress();
  if (drag?.id === e.pointerId) {
    if (!drag.moved && !drag.longPressed && drag.node && e.type !== 'pointercancel') choose(drag.node);
    drag = undefined;
  }
  pointers.delete(e.pointerId); pinch = 0;
  if (svg.value?.hasPointerCapture(e.pointerId)) svg.value.releasePointerCapture(e.pointerId);
}
function wheel(e: WheelEvent) { e.preventDefault(); zoom(Math.exp(-e.deltaY * .0015)); }
function key(e: KeyboardEvent) {
  const step = 18 / view.scale;
  const actions: Record<string, () => void> = {
    ArrowLeft: () => view.x += step, ArrowRight: () => view.x -= step,
    ArrowUp: () => view.y += step, ArrowDown: () => view.y -= step,
    '+': () => zoom(1.15), '=': () => zoom(1.15), '-': () => zoom(1 / 1.15), '0': reset,
  };
  if (actions[e.key]) { e.preventDefault(); actions[e.key]!(); }
}
let media: MediaQueryList | undefined, observer: ResizeObserver | undefined;
function motionPreference() { reduced = !!media?.matches; if (reduced) cancelAnimationFrame(frame); }
onMounted(() => {
  observer = new ResizeObserver(entries => {
    const rect = entries[0]?.contentRect;
    if (rect?.width && rect.height) { size.width = rect.width; size.height = rect.height; }
  });
  if (svg.value) observer.observe(svg.value);
  media = window.matchMedia('(prefers-reduced-motion: reduce)');
  motionPreference(); media.addEventListener('change', motionPreference);
});
onBeforeUnmount(() => { cancelLongPress(); cancelAnimationFrame(frame); observer?.disconnect(); media?.removeEventListener('change', motionPreference); pointers.clear(); });
</script>

<template>
  <div class="network" @keydown.esc="menu = undefined">
    <svg ref="svg" class="network-canvas" :viewBox="viewBox" :style="{ '--label-unit': screenUnit }" tabindex="0" role="group" aria-label="旅行偏好關係圖；點選節點聚焦，長按或右鍵修改與刪除；拖曳移動，滾輪或雙指縮放；方向鍵平移，加減鍵縮放，0 置中" @pointerdown="down" @pointermove="move" @pointerup="up" @pointercancel="up" @wheel="wheel" @keydown.self="key" @dblclick.self="reset">
      <g class="network-links" aria-hidden="true"><line v-for="link in links" :key="`${link.source}-${link.target}`" :x1="link.a.x" :y1="link.a.y" :x2="link.b.x" :y2="link.b.y" :class="{ related: related(link.b), remembered: remembered(link.b) }"/></g>
      <g v-for="node in shown" :key="node.id" class="network-node" :class="{ [node.kind]: true, remembered: remembered(node), selected: node.id === selected, related: related(node) }" :transform="`translate(${node.x},${node.y})`" :data-node="node.id" tabindex="0" role="button" :aria-label="`${title(node)}；長按編輯`" :aria-pressed="node.id === selected" @mouseenter="hover = node.id" @mouseleave="hover = ''" @focus="hover = node.id" @blur="hover = ''" @keydown.enter.prevent="choose(node)" @keydown.space.prevent="choose(node)" @keydown.f2.prevent="openMenu(node)" @keydown.shift.f10.prevent="openMenu(node)" @contextmenu.prevent="openMenu(node, $event.clientX, $event.clientY)" @click="e => { if (e.detail === 0) choose(node); }">
        <circle class="node-hit" :r="(node.kind === 'profile' ? 26 : 19) * screenUnit"/>
        <circle class="node-ring" :r="(node.kind === 'profile' ? 16 : 10) * screenUnit"/>
        <circle class="node-dot" :r="(node.kind === 'profile' ? 10 : node.kind === 'keyword' ? 6 : 2.8) * screenUnit"/>
        <path v-if="node.kind === 'profile'" class="profile-symbol" :transform="`scale(${screenUnit})`" d="M-3 2 0-5 3 2 0 0Z"/>
        <text v-show="node.kind !== 'topic' || showTopicLabels || node.keywordId === active" :y="(node.kind === 'profile' ? 24 : node.kind === 'keyword' ? 20 : 16) * screenUnit" text-anchor="middle">{{ title(node) }}</text>
      </g>
    </svg>
    <div v-if="menu && menuNode" class="node-menu" :style="{ left: menu.x + 'px', top: menu.y + 'px' }" @pointerdown.stop @contextmenu.prevent>
      <form v-if="menu.editing" @submit.prevent="saveName">
        <label for="preference-node-name">修改名稱</label>
        <input id="preference-node-name" ref="editorInput" v-model="draft" maxlength="16" required autocomplete="off" aria-label="節點名稱">
        <div class="edit-actions"><button type="button" @click="menu = undefined">取消</button><button type="submit">儲存</button></div>
      </form>
      <div v-else role="menu" :aria-label="`編輯${title(menuNode)}`">
        <strong>{{ title(menuNode) }}</strong>
        <button role="menuitem" @click="editName"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="m4 12 8-8 4 4-8 8-5 1 1-5Zm6-6 4 4"/></svg>修改名稱</button>
        <button v-if="menuNode.kind === 'keyword' && !remembered(menuNode)" role="menuitem" @click="rememberNode"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 4v12M4 10h12"/></svg>加入偏好</button>
        <button v-if="menuNode.kind !== 'profile'" role="menuitem" class="delete-node" @click="removeNode"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 6h12M8 3h4M6 6l1 11h6l1-11M9 9v5m2-5v5"/></svg>刪除節點</button>
        <button v-else-if="hiddenIds.length" role="menuitem" @click="restoreNodes"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 8a6 6 0 1 1 0 4M4 3v5h5"/></svg>恢復已刪除節點</button>
      </div>
    </div>
  </div>
</template>
<style scoped>
.network{--graph-bg:#fff;position:relative;height:min(65dvh,600px);min-height:420px;background:radial-gradient(ellipse at 50% 50%,#e9f9ff66,transparent 70%);color:#315c70;font-size:12px;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none}.network-canvas{width:100%;height:100%;display:block;touch-action:none;cursor:grab;outline:none}.network-canvas:active{cursor:grabbing}.network-links line{stroke:#9bccdf;stroke-width:.85;vector-effect:non-scaling-stroke;opacity:.55;transition:opacity .25s,stroke .25s}.network-links line.remembered{stroke:#009fc5;opacity:.7}.network-links line.related{stroke:#f4b900;stroke-width:1.3;opacity:1}.network-node{cursor:pointer;outline:none}.node-hit{fill:transparent}.node-dot{fill:#b0c4cf;transition:fill .25s}.node-ring{fill:none;stroke:#ffc500;opacity:0;stroke-width:.9;transition:opacity .25s}.network-node text{fill:#6c8b9c;font-family:inherit;font-size:calc(11px * var(--label-unit));transition:fill .25s;paint-order:stroke;stroke:var(--graph-bg);stroke-width:calc(4px * var(--label-unit));stroke-linejoin:round}.network-node.keyword text{font-size:calc(12px * var(--label-unit));fill:#315c70}.network-node.remembered .node-dot{fill:#009fc5}.network-node.profile .node-dot{fill:#ffc500}.profile-symbol{fill:#007c9e}.network-node.profile text{fill:#147492;font-size:calc(12px * var(--label-unit))}.network-node.related .node-dot,.network-node.selected .node-dot{fill:#ffc500}.network-node.related text{fill:#087f9f}.network-node.selected .node-ring,.network-node:hover .node-ring,.network-node:focus-visible .node-ring{opacity:1}.network-node.selected text,.network-node:focus-visible text{fill:#146884}.network-canvas:focus-visible{outline:2px solid #009fc5;outline-offset:-2px}.node-menu{position:absolute;width:190px;background:#fff;border:1px solid #cce7f1;border-radius:14px;box-shadow:0 8px 28px #13577320;padding:6px;z-index:2;text-align:left}.node-menu strong{display:block;color:#7292a1;font-size:10px;font-weight:500;padding:9px 10px 7px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.node-menu button{width:100%;display:flex;align-items:center;gap:9px;border:0;border-radius:8px;background:transparent;padding:11px 10px;text-align:left;font:12px inherit;color:#167b9b;cursor:pointer}.node-menu button:hover{background:#edf9ff}.node-menu button:focus-visible{outline:2px solid #009fc5;outline-offset:-2px}.node-menu button.delete-node{color:#b84b3e}.node-menu button.delete-node:hover{background:#fff4ef}.node-menu svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:1.4}.node-menu form{padding:9px 8px}.node-menu label{display:block;margin-bottom:10px;color:#167b9b;font-size:11px}.node-menu input{width:100%;font:12px inherit;border:1px solid #aed8e8;border-radius:7px;padding:10px;color:#315c70;background:#f7fcff;outline-color:#009fc5;user-select:text;-webkit-user-select:text}.edit-actions{display:flex;gap:7px;margin-top:10px}.edit-actions button{justify-content:center;padding:9px}.edit-actions button[type=submit]{background:#ffc500;color:#274851}@media(max-width:600px){.network{height:min(65dvh,540px);min-height:380px}}@media(prefers-reduced-motion:reduce){.network *{transition:none!important}}
</style>

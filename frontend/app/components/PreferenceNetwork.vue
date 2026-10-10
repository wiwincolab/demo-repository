<script setup lang="ts">
import type { PlannerKeywordId } from '~/data/planner-preferences';
import { createPreferenceGraph, preferencePositions, returnPreferenceGraph, stepPreferenceGraph, type PreferenceNode } from '~/utils/preference-graph';
import type { PersonalPreference } from '~/utils/preference-memory';

const props = defineProps<{ remembered: PlannerKeywordId[]; selected: string; labels: Record<string, string>; hiddenIds: string[]; preferences: PersonalPreference[] }>();
const emit = defineEmits<{ select: [id: string]; remember: [id: PlannerKeywordId]; remove: [id: string]; rename: [id: string, title: string]; restore: [] }>();
const asset = useAsset();
const eyeMaskId = useId();
const mascotDragging = ref(false);
const mascotCelebrating = ref(false);
const mascotAngle = ref(0);
let mascotTimer: ReturnType<typeof setTimeout> | undefined;
function celebrateMascot() {
  clearTimeout(mascotTimer);
  mascotCelebrating.value = true;
  mascotTimer = setTimeout(() => { mascotCelebrating.value = false; }, 900);
}
let graph = createPreferenceGraph(props.preferences);
for (let i = 0; i < 240; i++) stepPreferenceGraph(graph.nodes, graph.links);
const nodes = ref(graph.nodes);
let home = preferencePositions(graph.nodes);
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
  return node?.categoryId || node?.id;
});
const shown = computed(() => nodes.value.filter(n => !props.hiddenIds.includes(n.id) && !props.hiddenIds.includes(n.categoryId || '')));
const links = computed(() => {
  const byId = new Map(shown.value.map(n => [n.id, n]));
  return graph.links.flatMap(link => {
    const a = byId.get(link.source), b = byId.get(link.target);
    return a && b ? [{ ...link, a, b }] : [];
  });
});
const bounds = computed(() => ({ x: -360 / view.scale - view.x, y: -275 / view.scale - view.y, width: 720 / view.scale, height: 550 / view.scale }));
const viewBox = computed(() => `${bounds.value.x} ${bounds.value.y} ${bounds.value.width} ${bounds.value.height}`);
function remembered(node: PreferenceNode) { return node.kind === 'profile' || !!node.personal || !!node.keywordId && props.remembered.includes(node.keywordId) || !!node.categoryId && props.preferences.some(preference => preference.categoryId === node.categoryId); }
function related(node: PreferenceNode) { return hover.value === 'profile' || node.id === active.value || node.categoryId === active.value || (active.value !== 'profile' && node.kind === 'profile'); }
function title(node: PreferenceNode) { return props.labels[node.id] || node.title; }
function displayTitle(node: PreferenceNode) { const label = title(node); return `${node.avoid ? '避開 · ' : ''}${node.personal && label.length > 10 ? label.slice(0, 10) + '…' : label}`; }
function labelVisible(node: PreferenceNode) {
  if (node.kind === 'profile') return false;
  if (node.kind !== 'topic') return true;
  if (!node.personal && props.preferences.some(preference => preference.categoryId === node.categoryId)) return false;
  return showTopicLabels.value || node.categoryId === active.value || node.id === props.selected;
}
function choose(node: PreferenceNode) { menu.value = undefined; emit('select', node.id); }
function openMenu(node: PreferenceNode, x?: number, y?: number) {
  emit('select', node.id);
  const rect = svg.value?.getBoundingClientRect();
  if (!rect) return;
  if (x === undefined || y === undefined) {
    const matrix = svg.value?.getScreenCTM();
    if (!matrix) return;
    const point = new DOMPoint(node.x, node.y).matrixTransform(matrix);
    x = point.x; y = point.y;
  }
  menu.value = { id: node.id, x: Math.max(12, Math.min(rect.width - 202, x - rect.left)), y: Math.max(12, Math.min(rect.height - 185, y - rect.top + 14)), editing: false };
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
function coordinate(x: number, y: number) {
  const matrix = svg.value?.getScreenCTM();
  return matrix ? new DOMPoint(x, y).matrixTransform(matrix.inverse()) : { x: 0, y: 0 };
}
const pointers = new Map<number, { x: number; y: number }>();
let drag: { id: number; node?: PreferenceNode; clickedId?: string; startX: number; startY: number; offsetX: number; offsetY: number; moved: boolean; longPressed: boolean } | undefined;
let longPress: ReturnType<typeof setTimeout> | undefined;
function cancelLongPress() { clearTimeout(longPress); longPress = undefined; }
let pinch = 0, frame = 0, previousFrame = 0, returning = false, reduced = false;
function stopAnimation() { cancelAnimationFrame(frame); frame = 0; previousFrame = 0; }
function animate(time: number) {
  frame = 0;
  const elapsed = previousFrame ? time - previousFrame : 16.7;
  previousFrame = time;
  if (!mascotDragging.value) mascotAngle.value *= Math.exp(-Math.min(64, elapsed) / 90);
  if (drag?.node && drag.moved && !drag.longPressed) {
    stepPreferenceGraph(nodes.value, graph.links, drag.node.id);
    if (!reduced) frame = requestAnimationFrame(animate);
  } else if (returning) {
    const remaining = returnPreferenceGraph(nodes.value, home, reduced ? 64 : elapsed);
    if (reduced) {
      for (const node of nodes.value) {
        const position = home.get(node.id);
        if (position) Object.assign(node, position, { vx: 0, vy: 0 });
      }
      returning = false;
    } else if (remaining > 0) frame = requestAnimationFrame(animate);
    else returning = false;
  }
}
function startAnimation() { if (!frame) { previousFrame = 0; frame = requestAnimationFrame(animate); } }
function returnHome() { returning = true; startAnimation(); }
function down(e: PointerEvent) {
  if (e.button !== 0) return;
  e.preventDefault();
  menu.value = undefined; cancelLongPress();
  const target = (e.target as Element).closest('[data-node]');
  const node = nodes.value.find(n => n.id === target?.getAttribute('data-node'));
  const point = coordinate(e.clientX, e.clientY);
  if (!pointers.size) {
    stopAnimation(); returning = false;
    clearTimeout(mascotTimer); mascotCelebrating.value = false;
    drag = { id: e.pointerId, node, clickedId: node?.id, startX: e.clientX, startY: e.clientY, offsetX: (node?.x || 0) - point.x, offsetY: (node?.y || 0) - point.y, moved: false, longPressed: false };
  }
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  svg.value?.setPointerCapture(e.pointerId);
  if (pointers.size === 2 && drag) {
    cancelLongPress();
    drag.moved = true; drag.node = undefined; drag.longPressed = false;
    mascotDragging.value = false;
    const [a, b] = [...pointers.values()];
    pinch = Math.hypot(a!.x - b!.x, a!.y - b!.y);
    returnHome();
  }
  // Mouse editing uses right-click/F2. Touch still has a long-press menu, and
  // moving after it opened immediately transitions into a drag.
  if (node && e.pointerType !== 'mouse' && pointers.size === 1) longPress = setTimeout(() => {
    if (!drag || drag.moved || pointers.size !== 1) return;
    drag.longPressed = true; openMenu(node, e.clientX, e.clientY);
  }, 550);
}
function move(e: PointerEvent) {
  const previous = pointers.get(e.pointerId);
  if (!previous || !drag) return;
  const moved = Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY) > 6;
  if (moved || drag.moved) {
    drag.moved = true; cancelLongPress();
    if (drag.longPressed) { drag.longPressed = false; menu.value = undefined; }
  }
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pointers.size === 2) {
    const [a, b] = [...pointers.values()];
    const distance = Math.hypot(a!.x - b!.x, a!.y - b!.y);
    if (pinch) zoom(distance / pinch);
    pinch = distance;
    return;
  }
  if (!drag.moved) return;
  if (drag.node) {
    const point = coordinate(e.clientX, e.clientY);
    drag.node.x = point.x + drag.offsetX; drag.node.y = point.y + drag.offsetY;
    if (drag.node.kind === 'profile') {
      mascotDragging.value = true;
      mascotAngle.value = Math.max(-16, Math.min(16, (e.clientX - drag.startX) * .16));
    }
    returning = false; startAnimation();
  } else {
    const a = coordinate(previous.x, previous.y), b = coordinate(e.clientX, e.clientY);
    view.x += b.x - a.x; view.y += b.y - a.y;
  }
}
function up(e: PointerEvent) {
  if (!pointers.has(e.pointerId)) return;
  cancelLongPress();
  if (drag?.id === e.pointerId && drag.node?.kind === 'profile' && drag.moved) {
    mascotDragging.value = false;
    if (e.type === 'pointerup') celebrateMascot();
  }
  if (drag?.id === e.pointerId && !drag.moved && !drag.longPressed && e.type === 'pointerup') {
    const node = drag.node || nodes.value.find(node => node.id === drag?.clickedId);
    if (node) choose(node);
  }
  pointers.delete(e.pointerId); pinch = 0;
  if (!pointers.size) { drag = undefined; mascotDragging.value = false; stopAnimation(); returnHome(); }
  else {
    const [id, point] = [...pointers.entries()][0]!;
    drag = { id, node: undefined, startX: point.x, startY: point.y, offsetX: 0, offsetY: 0, moved: true, longPressed: false };
  }
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
watch(() => props.preferences, () => {
  cancelLongPress(); stopAnimation(); pointers.clear(); drag = undefined;
  graph = createPreferenceGraph(props.preferences);
  for (let i = 0; i < 240; i++) stepPreferenceGraph(graph.nodes, graph.links);
  nodes.value = graph.nodes; home = preferencePositions(graph.nodes);
  mascotDragging.value = false; mascotAngle.value = 0;
  menu.value = undefined;
}, { deep: true });
let media: MediaQueryList | undefined, observer: ResizeObserver | undefined;
function motionPreference() { reduced = !!media?.matches; if (reduced && returning) { stopAnimation(); returnHome(); } }
onMounted(() => {
  observer = new ResizeObserver(entries => {
    const rect = entries[0]?.contentRect;
    if (rect?.width && rect.height) { size.width = rect.width; size.height = rect.height; }
  });
  if (svg.value) observer.observe(svg.value);
  media = window.matchMedia('(prefers-reduced-motion: reduce)');
  motionPreference(); media.addEventListener('change', motionPreference);
});
onBeforeUnmount(() => { cancelLongPress(); stopAnimation(); clearTimeout(mascotTimer); observer?.disconnect(); media?.removeEventListener('change', motionPreference); pointers.clear(); });
</script>
<template>
  <div class="network" @keydown.esc="menu = undefined">
    <svg ref="svg" class="network-canvas" :viewBox="viewBox" :style="{ '--label-unit': screenUnit }" tabindex="0" role="group" aria-label="記憶 map；拖曳空白處平移，拖動吉祥物或節點後放開會回原位；長按或右鍵編輯；滾輪或雙指縮放，0 置中" @pointerdown="down" @pointermove="move" @pointerup="up" @pointercancel="up" @lostpointercapture="up" @wheel="wheel" @keydown.self="key" @dblclick="event => { if (!(event.target as Element).closest('[data-node]')) reset(); }">
      <defs><mask :id="eyeMaskId" maskUnits="objectBoundingBox" maskContentUnits="objectBoundingBox" x="0" y="0" width="1" height="1"><ellipse cx=".37" cy=".37" rx=".10" ry=".11" fill="white"/><ellipse cx=".555" cy=".393" rx=".10" ry=".11" fill="white"/></mask></defs>
      <rect class="network-backdrop" :x="bounds.x" :y="bounds.y" :width="bounds.width" :height="bounds.height" fill="transparent" pointer-events="all" />
      <g class="network-links" aria-hidden="true"><line v-for="link in links" :key="`${link.source}-${link.target}`" :x1="link.a.x" :y1="link.a.y" :x2="link.b.x" :y2="link.b.y" :class="{ related: related(link.b), remembered: remembered(link.b) }"/></g>
      <g v-for="node in shown" :key="node.id" class="network-node" :class="{ [node.kind]: true, personal: node.personal, avoid: node.avoid, remembered: remembered(node), selected: node.id === selected, related: related(node) }" :transform="`translate(${node.x},${node.y})`" :data-node="node.id" tabindex="0" role="button" :aria-label="`${node.avoid ? '避開：' : ''}${title(node)}；長按編輯`" :aria-pressed="node.id === selected" @mouseenter="hover = node.id" @mouseleave="hover = ''" @focus="hover = node.id" @blur="hover = ''" @keydown.enter.prevent="choose(node)" @keydown.space.prevent="choose(node)" @keydown.f2.prevent="openMenu(node)" @keydown.shift.f10.prevent="openMenu(node)" @contextmenu.prevent="openMenu(node, $event.clientX, $event.clientY)" @click="e => { if (e.detail === 0) choose(node); }">
        <title>{{ node.avoid ? '避開：' : '' }}{{ title(node) }}</title>
        <circle class="node-hit" :r="(node.kind === 'profile' ? 26 : 19) * screenUnit"/>
        <circle class="node-ring" :r="(node.kind === 'profile' ? 29 : 10) * screenUnit"/>
        <template v-if="node.kind === 'profile'">
          <circle class="profile-halo" :class="{ 'is-held': mascotDragging }" :r="26 * screenUnit"/>
          <g class="profile-character" :class="{ 'is-held': mascotDragging, 'is-celebrating': mascotCelebrating }" :transform="`rotate(${mascotAngle},0,${18 * screenUnit})`">
            <g class="profile-pose">
              <image class="profile-mascot" :href="asset('assets/memory/motion/mascot-seated.png')" :x="-31 * screenUnit" :y="-34 * screenUnit" :width="62 * screenUnit" :height="62 * screenUnit" preserveAspectRatio="xMidYMid meet" />
              <image class="profile-mascot mascot-eyes" :mask="`url(#${eyeMaskId})`" :href="asset('assets/memory/motion/mascot-seated-blink.png')" :x="-31 * screenUnit" :y="-34 * screenUnit" :width="62 * screenUnit" :height="62 * screenUnit" preserveAspectRatio="xMidYMid meet" />
            </g>
          </g>
          <g v-if="mascotCelebrating" class="mascot-sparkles" :transform="`scale(${screenUnit})`" aria-hidden="true"><path d="m-31-28 2.5 6.5 6.5 2.5-6.5 2.5-2.5 6.5-2.5-6.5-6.5-2.5 6.5-2.5Z"/><path d="m32-32 2 5 5 2-5 2-2 5-2-5-5-2 5-2Z"/><circle cx="36" cy="14" r="2.5"/></g>
        </template>
        <circle v-else class="node-dot" :r="(node.kind === 'keyword' ? 6 : 2.8) * screenUnit"/>
        <text v-show="labelVisible(node)" :y="(node.kind === 'profile' ? 24 : node.kind === 'keyword' ? 20 : 16) * screenUnit" text-anchor="middle">{{ displayTitle(node) }}</text>
      </g>
    </svg>
    <div class="network-tools" role="group" aria-label="記憶 map 視角"><button type="button" aria-label="放大記憶 map" @click="zoom(1.2)">＋</button><button type="button" aria-label="縮小記憶 map" @click="zoom(1 / 1.2)">−</button><button type="button" aria-label="記憶 map 回到中央" @click="reset"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M7 3H3v4m10-4h4v4M3 13v4h4m6 0h4v-4M7 10h6m-3-3v6"/></svg></button></div>
    <slot />
    <div v-if="menu && menuNode" class="node-menu" :style="{ left: menu.x + 'px', top: menu.y + 'px' }" @pointerdown.stop @contextmenu.prevent>
      <form v-if="menu.editing" @submit.prevent="saveName">
        <label for="preference-node-name">修改名稱</label>
        <input id="preference-node-name" ref="editorInput" v-model="draft" maxlength="16" required autocomplete="off" aria-label="節點名稱">
        <div class="edit-actions"><button type="button" @click="menu = undefined">取消</button><button type="submit">儲存</button></div>
      </form>
      <div v-else role="menu" :aria-label="`編輯${title(menuNode)}`">
        <strong>{{ title(menuNode) }}</strong>
        <button role="menuitem" @click="editName"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="m4 12 8-8 4 4-8 8-5 1 1-5Zm6-6 4 4"/></svg>修改名稱</button>
        <button v-if="menuNode.kind === 'keyword' && menuNode.keywordId && !remembered(menuNode)" role="menuitem" @click="rememberNode"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 4v12M4 10h12"/></svg>加入偏好</button>
        <button v-if="menuNode.kind !== 'profile'" role="menuitem" class="delete-node" @click="removeNode"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 6h12M8 3h4M6 6l1 11h6l1-11M9 9v5m2-5v5"/></svg>刪除節點</button>
        <button v-else-if="hiddenIds.length" role="menuitem" @click="restoreNodes"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 8a6 6 0 1 1 0 4M4 3v5h5"/></svg>恢復已刪除節點</button>
      </div>
    </div>
  </div>
</template>
<style scoped>
.profile-character,.profile-pose{pointer-events:none}.profile-pose{transform-box:fill-box;transform-origin:50% 85%;animation:mascot-breathe 4.6s ease-in-out infinite}.profile-character.is-held .profile-pose{animation:mascot-held .7s ease-in-out infinite}.profile-character.is-celebrating .profile-pose{animation:mascot-release .85s ease-in-out}.mascot-eyes{opacity:0;animation:mascot-blink 8s steps(1,end) infinite}.profile-character.is-held .mascot-eyes{animation:none;opacity:0}.profile-character.is-celebrating .mascot-eyes{animation:mascot-happy-blink .85s steps(1,end)}.profile-halo.is-held{fill:#fff2b8;filter:drop-shadow(0 0 5px #efc24966)}.mascot-sparkles{pointer-events:none;fill:#efbe2d;animation:mascot-sparkle .85s ease-out both}@keyframes mascot-breathe{0%,100%{transform:scale(1)}50%{transform:scale(1.015,.985)}}@keyframes mascot-held{0%,100%{transform:translateY(-2px) scale(1.03,.99)}50%{transform:translateY(-4px) scale(1.02,1.025)}}@keyframes mascot-release{0%{transform:scale(1.1,.9) rotate(-4deg)}25%{transform:scale(.96,1.07) rotate(5deg)}50%{transform:scale(1.035,.97) rotate(-3deg)}75%{transform:scale(.99,1.015) rotate(1.5deg)}100%{transform:scale(1) rotate(0)}}@keyframes mascot-blink{0%,20%,22%,72%,74%,77%,79%,100%{opacity:0}20.1%,21.9%,72.1%,73.9%,77.1%,78.9%{opacity:1}}@keyframes mascot-happy-blink{0%,24%,28%,59%,64%,100%{opacity:0}25%,27%,60%,63%{opacity:1}}@keyframes mascot-sparkle{0%{opacity:0}18%,55%{opacity:1}100%{opacity:0}}@media(prefers-reduced-motion:reduce){.profile-pose,.mascot-eyes,.profile-character.is-held .profile-pose,.profile-character.is-celebrating .profile-pose,.profile-character.is-celebrating .mascot-eyes,.mascot-sparkles{animation:none}.mascot-eyes,.mascot-sparkles{opacity:0}}
.profile-halo{fill:#fff8df;stroke:#f4d475;stroke-width:1;vector-effect:non-scaling-stroke}.profile-mascot{pointer-events:none}.network-backdrop{cursor:grab}.network-backdrop:active{cursor:grabbing}.network-tools{position:absolute;right:14px;top:10px;display:flex;gap:4px;padding:4px;background:#ffffffdd;border:1px solid #dceef3;border-radius:18px;z-index:1}.network-tools button{display:grid;place-items:center;width:30px;height:30px;border:0;border-radius:50%;background:transparent;color:#54879a;font:inherit;font-size:19px;cursor:pointer}.network-tools button:hover{background:#edf8fb}.network-tools button:focus-visible{outline:2px solid #009fcc;outline-offset:1px}.network-tools svg{width:17px;height:17px;fill:none;stroke:currentColor;stroke-width:1.4;stroke-linecap:round;stroke-linejoin:round}
.network-node.personal .node-dot{stroke:#fff;stroke-width:1.2;vector-effect:non-scaling-stroke}.network-node.avoid .node-dot{fill:#d98757}.network-node.avoid text{fill:#996443}.network-node.avoid .node-ring{stroke:#d98757}
.network{--graph-bg:#fff;position:relative;height:min(65dvh,580px);min-height:440px;background:radial-gradient(ellipse at 50% 50%,#e9f9ff66,transparent 70%);color:#315c70;font-size:12px;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none}.network-canvas{width:100%;height:calc(100% - 85px);display:block;touch-action:none;cursor:grab;outline:none}.network-canvas:active{cursor:grabbing}.network-links line{stroke:#9bccdf;stroke-width:.85;vector-effect:non-scaling-stroke;opacity:.55;transition:opacity .25s,stroke .25s}.network-links line.remembered{stroke:#009fc5;opacity:.7}.network-links line.related{stroke:#f4b900;stroke-width:1.3;opacity:1}.network-node{cursor:pointer;outline:none}.node-hit{fill:transparent}.node-dot{fill:#b0c4cf;transition:fill .25s}.node-ring{fill:none;stroke:#ffc500;opacity:0;stroke-width:.9;transition:opacity .25s}.network-node text{fill:#6c8b9c;font-family:inherit;font-size:calc(11px * var(--label-unit));transition:fill .25s;paint-order:stroke;stroke:var(--graph-bg);stroke-width:calc(4px * var(--label-unit));stroke-linejoin:round}.network-node.keyword text{font-size:calc(12px * var(--label-unit));fill:#315c70}.network-node.remembered .node-dot{fill:#009fc5}.network-node.profile .node-dot{fill:#ffc500}.profile-symbol{fill:#007c9e}.network-node.profile text{fill:#147492;font-size:calc(12px * var(--label-unit))}.network-node.related .node-dot,.network-node.selected .node-dot{fill:#ffc500}.network-node.related text{fill:#087f9f}.network-node.selected .node-ring,.network-node:hover .node-ring,.network-node:focus-visible .node-ring{opacity:1}.network-node.selected text,.network-node:focus-visible text{fill:#146884}.network-canvas:focus-visible{outline:2px solid #009fc5;outline-offset:-2px}.node-menu{position:absolute;width:190px;background:#fff;border:1px solid #cce7f1;border-radius:14px;box-shadow:0 8px 28px #13577320;padding:6px;z-index:2;text-align:left}.node-menu strong{display:block;color:#7292a1;font-size:10px;font-weight:500;padding:9px 10px 7px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.node-menu button{width:100%;display:flex;align-items:center;gap:9px;border:0;border-radius:8px;background:transparent;padding:11px 10px;text-align:left;font:12px inherit;color:#167b9b;cursor:pointer}.node-menu button:hover{background:#edf9ff}.node-menu button:focus-visible{outline:2px solid #009fc5;outline-offset:-2px}.node-menu button.delete-node{color:#b84b3e}.node-menu button.delete-node:hover{background:#fff4ef}.node-menu svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:1.4}.node-menu form{padding:9px 8px}.node-menu label{display:block;margin-bottom:10px;color:#167b9b;font-size:11px}.node-menu input{width:100%;font:12px inherit;border:1px solid #aed8e8;border-radius:7px;padding:10px;color:#315c70;background:#f7fcff;outline-color:#009fc5;user-select:text;-webkit-user-select:text}.edit-actions{display:flex;gap:7px;margin-top:10px}.edit-actions button{justify-content:center;padding:9px}.edit-actions button[type=submit]{background:#ffc500;color:#274851}@media(max-width:600px){.network{height:min(56dvh,490px);min-height:410px}}@media(prefers-reduced-motion:reduce){.network *{transition:none!important}}
</style>

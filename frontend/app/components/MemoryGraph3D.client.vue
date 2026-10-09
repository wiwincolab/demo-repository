<script setup lang="ts">
import { memoryCategories, memoryCategory } from '~/data/memory-categories';
import { loadScript } from '~/utils/loadScript';
const props = defineProps<{ nodes: { id: string; title: string; tag: string }[]; edges: { source: string; target: string; key: string }[]; selected: string; visibleIds: string[]; subject?: string }>();
const emit = defineEmits<{ select: [id: string] }>();
const asset = useAsset();
const host = ref<HTMLElement>();
const error = ref(''), ready = ref(false), rotating = ref(false), flowing = ref(true);
const hovered = ref('');
const relation = computed(() => props.edges.filter(e => e.source === props.selected || e.target === props.selected).length);
const labels = ref<{ id: string; title: string; x: number; y: number; opacity: number; color: string; visible: boolean; ax: number; ay: number }[]>([]);
let T: any, renderer: any, scene: any, camera: any, group: any, stars: any;
let character: any, focusHalo: any;
const paths: { curve: any; tube: any; particle: any; edge: { source: string; target: string }; phase: number; strength: number }[] = [];
let reduced = false, lastTime = 0, elapsed = 0;
let observer: ResizeObserver | undefined, frame = 0, disposed = false;
let yaw = .15, pitch = .12, distance = 23, width = 1, height = 1;
const objects = new Map<string, any>();
const pointers = new Map<number, { x: number; y: number }>();
let previousPinch = 0;
let pressOrigin = { x: 0, y: 0 }, moved = false;
function color(tag: string) { return memoryCategory(tag).color; }
function free(object: any) { object.traverse((child: any) => { child.geometry?.dispose(); const materials = Array.isArray(child.material) ? child.material : [child.material]; materials.forEach((m: any) => m?.dispose()); }); }
function createCharacter() {
  const body = new T.Group();
  const shape = new T.Shape();
  shape.moveTo(-.4, .65); shape.quadraticCurveTo(-.4,.88,-.18,.75);
  shape.lineTo(.68,.13); shape.quadraticCurveTo(.88,0,.68,-.13);
  shape.lineTo(-.18,-.75); shape.quadraticCurveTo(-.4,-.88,-.4,-.65); shape.closePath();
  const geometry = new T.ExtrudeGeometry(shape, { depth: .22, bevelEnabled: true, bevelThickness: .09, bevelSize: .08, bevelSegments: 5, steps: 1, curveSegments: 20 });
  const back = new T.Mesh(geometry.clone(),new T.MeshStandardMaterial({color:'#00afd1',roughness:.32,metalness:.12})); back.position.set(-.22,0,-.18); body.add(back);
  const front = new T.Mesh(geometry,new T.MeshStandardMaterial({color:'#ffc500',roughness:.3,metalness:.1})); body.add(front);
  [-.43,.01].forEach(x => {
    const eye = new T.Mesh(new T.SphereGeometry(.22,24,20),new T.MeshStandardMaterial({color:'#ffffff',roughness:.3})); eye.scale.set(.85,1.2,.4); eye.position.set(x,.24,.37); body.add(eye);
    const pupil = new T.Mesh(new T.SphereGeometry(.068,20,16),new T.MeshBasicMaterial({color:'#231d21'})); pupil.position.set(x+.045,.28,.46); body.add(pupil);
  });
  body.rotation.y = -.18;
  return body;
}
function rebuild() {
  if (!T || !group) return;
  while (group.children.length) { const child = group.children[0]; group.remove(child); free(child); }
  objects.clear(); paths.length = 0;
  props.nodes.forEach(node => {
    const category = memoryCategory(node.tag);
    const siblings = props.nodes.filter(n => n.tag === node.tag);
    const index = siblings.findIndex(n => n.id === node.id);
    const angle = index / Math.max(1, siblings.length) * Math.PI * 2 + .4;
    const radius = siblings.length === 1 ? 0 : 1.12;
    const pos = new T.Vector3(category.center[0]! + Math.cos(angle) * radius, category.center[1]! + Math.sin(angle) * radius, category.center[2]! + Math.sin(index * 2) * .6);
    const mesh = new T.Mesh(new T.SphereGeometry(.23,32,24),new T.MeshStandardMaterial({color:color(node.tag),emissive:color(node.tag),emissiveIntensity:.3,metalness:.4,roughness:.2,transparent:true}));
    mesh.position.copy(pos); mesh.userData.id = node.id; group.add(mesh); objects.set(node.id,mesh);
    const shell = new T.Mesh(new T.SphereGeometry(.31,24,16),new T.MeshBasicMaterial({color:color(node.tag),wireframe:true,transparent:true,opacity:.1})); mesh.add(shell);
    if (node.id === props.nodes[0]?.id) {
      mesh.material.visible = false; shell.visible = false;
      character = createCharacter(); character.position.copy(pos); group.add(character);
    }
  });
  props.edges.forEach((edge,index) => {
    const a = objects.get(edge.source), b = objects.get(edge.target); if (!a || !b) return;
    const middle = a.position.clone().lerp(b.position,.5);
    const normal = new T.Vector3().subVectors(b.position,a.position).cross(new T.Vector3(0,0,1)).normalize();
    middle.addScaledVector(normal, .3 + index % 3 * .16); middle.z += .35 + index % 4 * .12;
    const curve = new T.QuadraticBezierCurve3(a.position.clone(),middle,b.position.clone());
    const geometry = new T.TubeGeometry(curve,48,.013,6,false);
    const colors = []; const startColor = new T.Color(a.material.color); const endColor = new T.Color(b.material.color);
    for (let i=0;i<geometry.attributes.position.count;i++) { const c = startColor.clone().lerp(endColor,Math.floor(i/7)/48); colors.push(c.r,c.g,c.b); }
    geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));
    const tube = new T.Mesh(geometry,new T.MeshBasicMaterial({vertexColors:true,transparent:true,opacity:.25,depthWrite:false})); group.add(tube);
    const particle = new T.Mesh(new T.SphereGeometry(.045,12,8),new T.MeshBasicMaterial({color:'#fff2c4',transparent:true})); group.add(particle);
    paths.push({curve,tube,particle,edge,phase:index*.137,strength:0});
  });
  focusHalo = new T.Mesh(new T.TorusGeometry(.47,.014,8,80),new T.MeshBasicMaterial({color:'#ffce55',transparent:true,opacity:.8})); group.add(focusHalo);
  render();
}
function render() {
  if (!renderer || disposed || objects.size !== props.nodes.length) return;
  group.rotation.set(pitch, yaw, 0); camera.position.z = distance;
  const focus = hovered.value || props.selected;
  objects.forEach((mesh,id) => {
    const target = id === focus ? 1.35 : 1;
    mesh.scale.lerp(new T.Vector3(target,target,target), reduced ? 1 : .12);
    mesh.material.opacity = props.visibleIds.includes(id) ? 1 : .12;
    mesh.material.emissiveIntensity = id === focus ? .8 : .22;
  });
  const selectedMesh = objects.get(focus);
  if (selectedMesh && focusHalo) { focusHalo.position.copy(selectedMesh.position); focusHalo.rotation.set(elapsed*.18,.4,elapsed*.08); focusHalo.scale.setScalar(focus === props.nodes[0]?.id ? 2 : 1); }
  if (character) { character.rotation.y = -.18 + Math.sin(elapsed*.5)*.12; character.position.y = (objects.get(props.nodes[0]!.id)?.position.y || 0) + Math.sin(elapsed*.8)*.045; }
  paths.forEach(path => {
    const connected = path.edge.source === focus || path.edge.target === focus;
    const shown = props.visibleIds.includes(path.edge.source) || props.visibleIds.includes(path.edge.target);
    const target = shown ? (connected ? .85 : .14) : .035;
    path.strength += (target - path.strength) * (reduced ? 1 : .1);
    path.tube.material.opacity = path.strength;
    path.particle.visible = flowing.value && !reduced && connected && shown;
    path.particle.position.copy(path.curve.getPoint((elapsed*.11+path.phase)%1));
    path.particle.material.opacity = path.strength;
  });
  scene.updateMatrixWorld(true); camera.updateMatrixWorld(true);
  const projected = props.nodes.map(node => {
    const mesh = objects.get(node.id), position = new T.Vector3(); mesh.getWorldPosition(position);
    const depth = position.z; position.project(camera);
    return { id: node.id, title: node.title, x: (position.x * .5 + .5) * width, y: (-position.y * .5 + .5) * height + (node.id === props.nodes[0]?.id ? 40 : 18), ax: (position.x * .5 + .5) * width, ay: (-position.y * .5 + .5) * height, opacity: props.visibleIds.includes(node.id) ? Math.max(.5, .8 + depth / 20) : .15, color: color(node.tag), visible: position.z < 1 && Math.abs(position.x) < 1 && Math.abs(position.y) < 1 };
  });
  // Space labels vertically when clustered nodes project close together.
  const placed: typeof projected = [];
  projected.sort((a, b) => a.y - b.y).forEach(label => {
    for (let pass = 0; pass < 12; pass++) {
      const clash = placed.find(other => other.visible && label.visible && Math.abs(other.x - label.x) < 110 && Math.abs(other.y - label.y) < 29);
      if (!clash) break;
      label.y = clash.y + 29;
    }
    label.y = Math.min(height - 65, Math.max(45, label.y)); label.x = Math.min(width - 65,Math.max(65,label.x));
    placed.push(label);
  });
  labels.value = projected;
  renderer.render(scene, camera);
}
function resize() { if (!host.value || !renderer) return; width = host.value.clientWidth; height = host.value.clientHeight; if (!width || !height) return; renderer.setSize(width, height); camera.aspect = width / Math.max(1, height); camera.updateProjectionMatrix(); distance = Math.max(distance, 13 / camera.aspect); render(); }
function zoom(delta: number) { distance = Math.max(10, Math.min(38, distance + delta)); render(); }
function reset() { yaw = .15; pitch = .12; distance = Math.max(20, 13 / camera.aspect); render(); }
function down(e: PointerEvent) { if ((e.target as Element).closest('button')) return; rotating.value = false; pressOrigin = { x: e.clientX, y: e.clientY }; moved = false; pointers.set(e.pointerId, { x: e.clientX, y: e.clientY }); host.value?.setPointerCapture(e.pointerId); previousPinch = 0; }
function move(e: PointerEvent) {
  const previous = pointers.get(e.pointerId); if (!previous) return;
  if (Math.hypot(e.clientX - pressOrigin.x, e.clientY - pressOrigin.y) > 5) moved = true;
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pointers.size === 2) { const [a, b] = [...pointers.values()]; const length = Math.hypot(a!.x - b!.x, a!.y - b!.y); if (previousPinch) zoom((previousPinch - length) * .035); previousPinch = length; }
  else { yaw += (e.clientX - previous.x) * .008; pitch = Math.max(-1.3, Math.min(1.3, pitch + (e.clientY - previous.y) * .008)); render(); }
}
function up(e: PointerEvent) {
  if (!moved && pointers.size === 1 && T && camera && host.value && e.type !== 'pointercancel') {
    const rect = host.value.getBoundingClientRect();
    const ray = new T.Raycaster();
    ray.setFromCamera(new T.Vector2((e.clientX - rect.left) / rect.width * 2 - 1, -(e.clientY - rect.top) / rect.height * 2 + 1), camera);
    const hit = ray.intersectObjects([...objects.values()]).find((item: any) => props.visibleIds.includes(item.object.userData.id));
    if (hit) emit('select', hit.object.userData.id);
  }
  pointers.delete(e.pointerId); previousPinch = 0;
}
function wheel(e: WheelEvent) { e.preventDefault(); zoom(e.deltaY * .012); }
function key(e: KeyboardEvent) { const actions: Record<string, () => void> = { ArrowLeft: () => yaw -= .15, ArrowRight: () => yaw += .15, ArrowUp: () => pitch = Math.max(-1.3, pitch - .15), ArrowDown: () => pitch = Math.min(1.3, pitch + .15), '+': () => zoom(-1), '-': () => zoom(1) }; if (actions[e.key]) { e.preventDefault(); actions[e.key]!(); render(); } }
function animate(time = 0) {
  if (disposed) return;
  const dt = Math.min(.05,(time-lastTime)/1000); lastTime = time;
  if (document.visibilityState === 'visible') {
    if (!reduced && flowing.value) elapsed += dt;
    if (rotating.value) yaw += dt*.13;
    render();
  }
  frame = requestAnimationFrame(animate);
}
watch(() => [props.nodes.map(n => [n.id,n.tag,n.title]), props.edges], rebuild, { deep: true });
onMounted(async () => {
  try {
    await loadScript(asset('vendor/three.min.js')); if (disposed || !host.value) return;
    T = (window as any).THREE; reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches; flowing.value = !reduced;
    renderer = new T.WebGLRenderer({ antialias: true, alpha: true }); renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    host.value.prepend(renderer.domElement); renderer.domElement.setAttribute('aria-hidden', 'true');
    scene = new T.Scene(); camera = new T.PerspectiveCamera(45, 1, .1, 100); group = new T.Group(); scene.add(group);
    scene.add(new T.AmbientLight('#c3e8ef', 2)); const light = new T.PointLight('#ffffff', 60); light.position.set(4, 6, 8); scene.add(light);
    const positions: number[] = []; for (let i = 0; i < 450; i++) { const a = i * 2.399963, r = 10 + (i % 17) * .6; positions.push(Math.cos(a) * r, Math.sin(i * 1.7) * 12, Math.sin(a) * r - 8); }
    stars = new T.Points(new T.BufferGeometry().setAttribute('position', new T.Float32BufferAttribute(positions, 3)), new T.PointsMaterial({ color: '#a4b8ed', size: .035, transparent: true, opacity: .45 })); scene.add(stars);
    observer = new ResizeObserver(resize); observer.observe(host.value); rebuild(); resize(); ready.value = true; animate();
  } catch { error.value = '無法啟動 3D 畫面，請使用支援 WebGL 的瀏覽器。仍可從左側閱讀與編輯回憶。'; }
});
onBeforeUnmount(() => { disposed = true; cancelAnimationFrame(frame); observer?.disconnect(); if (group) free(group); if (stars) free(stars); renderer?.dispose(); renderer?.domElement.remove(); });
</script>
<template>
  <div class="space-shell">
    <div ref="host" class="space" tabindex="0" aria-label="3D 關係圖；拖曳或方向鍵旋轉，滾輪或加減鍵縮放" @pointerdown="down" @pointermove="move" @pointerup="up" @pointercancel="up" @wheel="wheel" @keydown.self="key">
      <span class="space-badge">CHICTRIP · {{ subject === '偏好' ? '旅行偏好圖' : '回憶星圖' }}</span>
      <svg class="label-guides" :viewBox="`0 0 ${width} ${height}`" aria-hidden="true"><path v-for="label in labels" v-show="label.visible" :key="label.id" :d="`M ${label.ax} ${label.ay} L ${label.x} ${label.y}`" :stroke="label.color" :opacity="label.opacity * .25"/></svg>
      <button v-for="label in labels" v-show="label.visible" :key="label.id" class="node-label" :class="{ selected: label.id === selected }" :aria-label="`開啟${label.title}`" :aria-pressed="label.id === selected" :style="{ left: label.x + 'px', top: label.y + 'px', opacity: label.opacity, '--node-color': label.color }" @mouseenter="hovered = label.id" @mouseleave="hovered = ''" @focus="hovered = label.id" @blur="hovered = ''" @click="emit('select', label.id)">{{ label.title }}</button>
      <div class="connection-caption"><i/>{{ relation }} 條{{ subject === '偏好' ? '偏好關聯' : '回憶線索' }}<span>{{ subject === '偏好' ? '選用關鍵字，作為這次推薦的依據' : '光點沿著關係，串起旅途片段' }}</span></div>
      <div v-if="!ready" class="space-status" role="status">{{ error || (subject === '偏好' ? '正在載入偏好圖…' : '正在展開你的記憶宇宙…') }}</div>
    </div>
    <div class="space-controls"><span>拖曳旋轉 · 滾輪／雙指縮放</span><div><button aria-label="縮小" @click="zoom(1.5)">−</button><button aria-label="重設視角" @click="reset">置中</button><button aria-label="放大" @click="zoom(-1.5)">＋</button><button :aria-pressed="flowing" @click="flowing = !flowing">{{ flowing ? '暫停流光' : '播放流光' }}</button><button :aria-pressed="rotating" @click="rotating = !rotating">{{ rotating ? '暫停旋轉' : '自動旋轉' }}</button></div></div>
  </div>
</template>
<style scoped>
.label-guides{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;fill:none;stroke-width:.6}.connection-caption{position:absolute;bottom:20px;left:22px;pointer-events:none;color:#ead5a5;font-size:11px;letter-spacing:.5px}.connection-caption span{display:block;margin-top:6px;font-size:10px;color:#8197a4}.connection-caption i{display:inline-block;width:6px;height:6px;border-radius:50%;background:#f8c447;margin-right:8px;box-shadow:0 0 12px #f8c447}.space-controls{flex-wrap:wrap}.space-controls div{flex-wrap:wrap}
.space-shell{display:flex;flex-direction:column;flex:1;min-width:0}.space{position:relative;width:100%;height:600px;min-height:350px;overflow:hidden;touch-action:none;cursor:grab;background:radial-gradient(ellipse at 35% 42%,#15313b 0%,#131e2c 40%,#11151e 80%)}.space:active{cursor:grabbing}.space:deep(canvas){display:block;width:100%;height:100%}.space-badge{position:absolute;top:18px;left:20px;color:#867e9c;font:9px monospace;letter-spacing:2px;pointer-events:none}.node-label{position:absolute;transform:translate(-50%,0);color:#d5cbe7;background:#191925c9;border:1px solid #4b435d75;white-space:nowrap;border-radius:20px;padding:6px 10px;font-family:inherit;font-size:11px;cursor:pointer;max-width:125px;text-overflow:ellipsis;overflow:hidden}.node-label small{font-size:10px}.node-label{border-left:3px solid var(--node-color)}.node-label.selected{color:#fff;border-color:var(--node-color);box-shadow:0 0 20px #b99de533}.node-label:focus-visible,.space:focus-visible{outline:2px solid #c9b2fa;outline-offset:-2px}.space-status{position:absolute;inset:0;display:grid;place-content:center;padding:30px;text-align:center;color:#b9abc9;font-size:13px;line-height:1.8}.space-controls{display:flex;align-items:center;justify-content:space-between;padding:16px 18px;color:#9287a4;font-size:10px;gap:10px}.space-controls div{display:flex;gap:4px}.space-controls button{background:#25232e;border:1px solid #393441;color:#c3b9d1;padding:8px;cursor:pointer;font:10px inherit}@media(max-width:600px){.space{height:430px}.space-controls{flex-wrap:wrap}.node-label{font-size:10px}}
</style>

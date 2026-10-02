<script setup lang="ts">
import { loadScript } from '~/utils/loadScript';
const host = ref<HTMLElement>();
const night = ref(false), error = ref(''), ready = ref(false);
const asset = useAsset();
let renderer: any, scene: any, camera: any, model: any, ambient: any, windows: any;
let observer: ResizeObserver | undefined, disposed = false, startX = 0, startRotation = 0, dragging = false;
const render = () => { if (renderer && !disposed) renderer.render(scene, camera); };
function rotate(amount: number) { if (model) { model.rotation.y += amount; render(); } }
function light() {
  night.value = !night.value;
  if (!scene) return;
  scene.background.set(night.value ? '#172c46' : '#eeeae1');
  ambient.intensity = night.value ? .48 : 1.7;
  windows.emissiveIntensity = night.value ? 1.5 : .15;
  render();
}
function pointerDown(event: PointerEvent) { if (!model) return; dragging = true; startX = event.clientX; startRotation = model.rotation.y; host.value?.setPointerCapture(event.pointerId); }
function pointerMove(event: PointerEvent) { if (dragging && model) { model.rotation.y = startRotation + (event.clientX - startX) * .012; render(); } }
onMounted(async () => {
  try {
    await loadScript(asset('vendor/three.min.js'));
    if (disposed || !host.value) return;
    const T = (window as any).THREE;
    scene = new T.Scene(); scene.background = new T.Color('#eeeae1');
    camera = new T.PerspectiveCamera(34, 1, .1, 100); camera.position.set(6, 5.8, 8.7); camera.lookAt(0, .8, 0);
    renderer = new T.WebGLRenderer({ antialias: true }); renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.shadowMap.enabled = true;
    renderer.domElement.setAttribute('aria-label', '富士山與咖啡店的立體場景'); host.value.appendChild(renderer.domElement);
    model = new T.Group(); scene.add(model);
    ambient = new T.HemisphereLight('#ffffff', '#9b8c79', 1.7); scene.add(ambient);
    const sun = new T.DirectionalLight('#fff4df', 2.5); sun.position.set(-3, 8, 5); sun.castShadow = true; scene.add(sun);
    const material = (color: string) => new T.MeshStandardMaterial({ color, roughness: .88, flatShading: true });
    const mesh = (geometry: any, mat: any, x: number, y: number, z: number) => { const item = new T.Mesh(geometry, mat); item.position.set(x, y, z); item.castShadow = true; item.receiveShadow = true; model.add(item); return item; };
    mesh(new T.CylinderGeometry(3, 3, .28, 6), material('#ddd1b5'), 0, -.12, 0);
    mesh(new T.ConeGeometry(1.7, 2.8, 7), material('#7299be'), -.5, 1.43, -1);
    mesh(new T.ConeGeometry(.76, 1.15, 7), material('#f7f7ed'), -.5, 2.29, -1);
    mesh(new T.BoxGeometry(2.35, .95, 1.2), material('#46525a'), .1, .5, .65);
    mesh(new T.BoxGeometry(2.65, .15, 1.5), material('#25333e'), .1, 1.05, .65);
    windows = new T.MeshStandardMaterial({ color: '#e8bd69', emissive: '#ffc16a', emissiveIntensity: .15, roughness: .3 });
    for (let i = 0; i < 5; i++) mesh(new T.BoxGeometry(.36, .65, .03), windows, -.82 + i * .46, .55, 1.27);
    for (const [x, z, scale] of [[-2, .1, 1], [1.9, -.5, 1.25], [1.9, 1.2, .75]]) {
      mesh(new T.CylinderGeometry(.07, .09, .8, 6), material('#665341'), x!, .4, z!);
      for (let i = 0; i < 3; i++) mesh(new T.ConeGeometry((.45 - i * .08) * scale!, .7 * scale!, 6), material('#345849'), x!, .75 + i * .34, z!);
    }
    mesh(new T.BoxGeometry(1, .03, .4), material('#c7b58e'), .1, .04, 1.65);
    observer = new ResizeObserver(() => { if (!host.value || disposed) return; const { width, height } = host.value.getBoundingClientRect(); renderer.setSize(width, height); camera.aspect = width / Math.max(height, 1); camera.updateProjectionMatrix(); render(); });
    observer.observe(host.value); ready.value = true;
  } catch { error.value = '此裝置暫時無法顯示 3D，仍可欣賞作品圖片。'; }
});
onBeforeUnmount(() => {
  disposed = true; observer?.disconnect();
  scene?.traverse((object: any) => { object.geometry?.dispose(); if (object.material) { const list = Array.isArray(object.material) ? object.material : [object.material]; list.forEach((m: any) => m.dispose()); } });
  renderer?.dispose(); renderer?.domElement.remove();
});
</script>
<template>
  <div>
    <div ref="host" class="creation-three" @pointerdown="pointerDown" @pointermove="pointerMove" @pointerup="dragging = false" @pointercancel="dragging = false">
      <p v-if="error">{{ error }}</p><p v-else-if="!ready">正在打開你的立體風景…</p>
    </div>
    <div class="creation-scene-controls"><button :disabled="!ready" aria-label="向左旋轉模型" @click="rotate(-.4)">↶</button><button :disabled="!ready" @click="light">{{ night ? '回到白天' : '點亮咖啡店' }}</button><button :disabled="!ready" aria-label="向右旋轉模型" @click="rotate(.4)">↷</button></div>
    <p class="creation-muted">拖曳旋轉 · 手工建立的 3D 互動示範</p>
  </div>
</template>

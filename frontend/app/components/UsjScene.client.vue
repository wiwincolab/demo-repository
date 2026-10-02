<script setup lang="ts">
import { loadScript } from '~/utils/loadScript';
import { createUsjMiniature } from '~/utils/usjScene';

type Part = 'cafe' | 'block' | 'castle';
const props = withDefaults(defineProps<{ companion?: boolean; focus?: 'overview' | Part }>(), { companion: false, focus: 'overview' });
const emit = defineEmits<{ ready: []; select: [part: Part]; coin: [] }>();
const root = ref<HTMLElement>(), host = ref<HTMLElement>();
const ready = ref(false), error = ref(''), dragging = ref(false), coins = ref(0), active = ref<Part>();
const labels = ref<{ id: Part; text: string; x: number; y: number }[]>([]);
const asset = useAsset(), { gsap, animate, reduced } = useCreationMotion(root);
let T: any, scene: any, renderer: any, camera: any, world: any, pointer: any, ray: any, friend: any;
let observer: ResizeObserver | undefined, disposed = false, startX = 0, startY = 0, startRotation = 0, moved = false, coinBusy = false;
const lookAt = { x: 0, y: 1.75, z: 0 }, cameraState = { zoom: 1 };
const names = { cafe: '蘑菇餐廳', block: '問號磚塊', castle: '城堡' };

function render() {
  if (!renderer || disposed) return;
  camera.lookAt(lookAt.x, lookAt.y, lookAt.z); camera.zoom = cameraState.zoom; camera.updateProjectionMatrix();
  renderer.render(scene, camera);
  labels.value = (Object.keys(names) as Part[]).map(id => {
    const p = world.root.localToWorld(world.anchors[id].clone()).project(camera);
    return { id, text: names[id], x: (p.x + 1) * 50, y: (1 - p.y) * 50 };
  });
}
function focusTo(part: 'overview' | Part) {
  if (!ready.value) return;
  const targets: Record<'overview'|Part,[number,number,number,number]> = { overview: [0,1.75,0,1], cafe: [-1.2,1.55,.45,1.2], castle: [-.5,2.15,-.55,1.2], block: [1.1,1.4,.72,1.18] };
  const [x,y,z,zoom] = targets[part]; active.value = part === 'overview' ? undefined : part;
  animate(d => {
    gsap.to(lookAt,{x,y,z,duration:d(.52),ease:'power3.out',overwrite:true,onUpdate:render});
    gsap.to(cameraState,{zoom,duration:d(.52),ease:'power3.out',overwrite:true,onUpdate:render});
    gsap.to(world.glass,{emissiveIntensity:part==='cafe'?1.65:.22,duration:d(.45),onUpdate:render,overwrite:true});
    gsap.to(world.door.rotation,{y:part==='cafe'?-.8:0,duration:d(.48),ease:'power2.out',onUpdate:render,overwrite:true});
  });
}
function trigger(part: Part) {
  if (!ready.value) return;
  focusTo(part); emit('select',part);
  if(part !== 'block' || coinBusy) return;
  coinBusy = true; coins.value++; emit('coin'); world.coin.visible = true;
  animate(d => {
    const block = world.parts.block;
    gsap.timeline({onUpdate:render,onComplete:()=>{world.coin.visible=false;coinBusy=false;render();}})
      .to(block.position,{y:1.4,duration:d(.13),ease:'power2.out'},0)
      .to(block.position,{y:1.22,duration:d(.23),ease:'power2.inOut'},d(.13))
      .fromTo(world.coin.position,{y:.6},{y:1.62,duration:d(.35),ease:'power2.out'},0)
      .to(world.coin.position,{y:.75,duration:d(.3),ease:'power2.in'},d(.35))
      .fromTo(world.coin.rotation,{y:0},{y:Math.PI*2,duration:d(.65),ease:'none'},0);
  });
}
function resetView() { if(!ready.value)return; rotate(-world.root.rotation.y);focusTo('overview'); }
function rotate(amount: number) {
  if(!ready.value)return;
  animate(d=>gsap.to(world.root.rotation,{y:Math.max(-.65,Math.min(.65,world.root.rotation.y+amount)),duration:d(.4),ease:'power3.out',onUpdate:render,overwrite:true}));
}
function setRay(e: PointerEvent) {
  const r=host.value!.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(pointer,camera);
}
function down(e: PointerEvent) {
  if(!ready.value||e.button!==0)return;
  dragging.value=true;moved=false;startX=e.clientX;startY=e.clientY;startRotation=world.root.rotation.y;
  gsap.killTweensOf(world.root.rotation);host.value?.setPointerCapture(e.pointerId);
}
function move(e: PointerEvent) {
  if(!dragging.value)return;
  if(Math.hypot(e.clientX-startX,e.clientY-startY)>5)moved=true;
  world.root.rotation.y=Math.max(-.65,Math.min(.65,startRotation+(e.clientX-startX)*.005));render();
}
function up(e: PointerEvent, cancel=false) {
  if(!dragging.value)return;dragging.value=false;
  if(!moved&&!cancel){setRay(e);const hit=ray.intersectObjects(Object.values(world.parts),true)[0];let item=hit?.object;while(item&&!item.userData.part)item=item.parent;if(item?.userData.part)trigger(item.userData.part);}
  if(host.value?.hasPointerCapture(e.pointerId))host.value.releasePointerCapture(e.pointerId);
}
function syncFriend() {
  if(!friend||!world)return;
  friend.visible=props.companion;
  if(props.companion){
    const h=world.companionHome;
    animate(d=>gsap.fromTo(friend.position,{x:h.x+1.4,y:h.y,z:h.z},{x:h.x,y:h.y,z:h.z,duration:d(.65),ease:'power3.out',onUpdate:render}));
  }
  render();
}
function captureFrame(): string | undefined {
  if(!ready.value||!renderer||disposed)return;
  const previous=scene.background;
  scene.background=new T.Color('#e7eee7');render();
  const image=renderer.domElement.toDataURL('image/png');
  scene.background=previous;render();return image;
}
watch(()=>props.focus,v=>focusTo(v));watch(()=>props.companion,syncFriend);
defineExpose({ resetView, rotate, trigger, captureFrame });

onMounted(async()=>{
  try {
    await loadScript(asset('vendor/three.min.js'));if(disposed||!host.value)return;T=(window as any).THREE;
    scene=new T.Scene();camera=new T.OrthographicCamera(-8,8,6,-6,.1,100);camera.position.set(8.5,9,14);
    renderer=new T.WebGLRenderer({antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));
    renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.04;
    renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
    host.value.appendChild(renderer.domElement);renderer.domElement.setAttribute('aria-label','大阪環球影城立體收藏：左側蘑菇餐廳、後方城堡、右側山丘與問號磚塊');
    const ambient=new T.HemisphereLight('#f7f5e8','#80958b',1.4);scene.add(ambient);
    const sun=new T.DirectionalLight('#fff0d9',2.2);sun.position.set(-5,12,8);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
    sun.shadow.camera.left=-9;sun.shadow.camera.right=9;sun.shadow.camera.top=9;sun.shadow.camera.bottom=-9;sun.shadow.normalBias=.025;sun.shadow.bias=-.0003;sun.shadow.radius=4;scene.add(sun);
    const fill=new T.DirectionalLight('#ddf3ff',.8);fill.position.set(8,5,-4);scene.add(fill);
    world=createUsjMiniature(T);scene.add(world.root);
    const ground=new T.Mesh(new T.PlaneGeometry(70,70),new T.ShadowMaterial({opacity:.15}));ground.rotation.x=-Math.PI/2;ground.position.y=-.54;ground.receiveShadow=true;scene.add(ground);
    pointer=new T.Vector2();ray=new T.Raycaster();
    const texture=new T.TextureLoader().load(asset('assets/memory/motion/companion.png'),()=>{if(!disposed)render();});texture.colorSpace=T.SRGBColorSpace;
    friend=new T.Sprite(new T.SpriteMaterial({map:texture,transparent:true,depthWrite:false}));friend.scale.set(1.55,1.55,1);friend.position.copy(world.companionHome);friend.visible=false;world.root.add(friend);
    observer=new ResizeObserver(()=>{
      if(!host.value||disposed)return;const {width,height}=host.value.getBoundingClientRect();if(!width||!height)return;
      const aspect=width/height, halfHeight=Math.max(5.25,8.6/aspect);
      camera.left=-halfHeight*aspect;camera.right=halfHeight*aspect;camera.top=halfHeight;camera.bottom=-halfHeight;camera.updateProjectionMatrix();renderer.setSize(width,height);render();
    });observer.observe(host.value);
    ready.value=true;syncFriend();focusTo(props.focus);emit('ready');
    if(!reduced.value)animate(d=>gsap.from(world.root.position,{y:-.22,duration:d(.7),ease:'power3.out',onUpdate:render}));
    render();
  }catch{error.value='立體預覽暫時無法開啟，仍可查看原照片。';}
});
onBeforeUnmount(()=>{
  disposed=true;observer?.disconnect();
  const geometries=new Set<any>(),materials=new Set<any>(),textures=new Set<any>();
  scene?.traverse((o:any)=>{if(o.geometry)geometries.add(o.geometry);if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach((m:any)=>{materials.add(m);if(m.map)textures.add(m.map);});});
  geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());renderer?.dispose();renderer?.domElement.remove();
});
</script>

<template>
  <div ref="root" class="usj-scene" :class="{'is-dragging':dragging}">
    <div ref="host" class="usj-scene-canvas" @pointerdown="down" @pointermove="move" @pointerup="up($event)" @pointercancel="up($event,true)" />
    <div v-if="!ready" class="usj-scene-status" role="status"><span v-if="!error" class="usj-loading-cube" />{{ error || '正在打開這一小片風景…' }}</div>
    <div v-if="ready" class="usj-scene-hotspots" aria-label="探索場景中的細節">
      <button v-for="label in labels" :key="label.id" :style="{left:label.x+'%',top:label.y+'%'}" :class="{'is-active':active===label.id}" :aria-label="'探索'+label.text" :aria-pressed="active===label.id" @click="trigger(label.id)"><span /> <b>{{ label.text }}</b></button>
    </div>
    <p v-if="ready" class="usj-scene-hint"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M5 8a9 9 0 0114 0M5 8V3m0 5h5M19 16a9 9 0 01-14 0m14 0v5m0-5h-5"/></svg>拖曳轉動 · 點選小光點</p>
  </div>
</template>

<style scoped>
.usj-scene{position:relative;isolation:isolate;width:100%;height:100%;min-height:300px;overflow:hidden;background:radial-gradient(ellipse at 50% 35%,#f4f6e9 0%,#e7eee7 58%,#dbe8e1 100%);border-radius:inherit;}
.usj-scene-canvas{position:absolute;inset:0;touch-action:none;cursor:grab;}
.usj-scene.is-dragging .usj-scene-canvas{cursor:grabbing;}
.usj-scene-canvas :deep(canvas){display:block;width:100%;height:100%;outline:none;}
.usj-scene-status{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:16px;color:#62766e;font-size:14px;padding:30px;text-align:center;}
.usj-loading-cube{width:30px;height:30px;border:2px solid #9da997;border-radius:7px;transform:rotate(-12deg);box-shadow:5px 5px 0 #d1dac8;}
.usj-scene-hotspots{position:absolute;inset:0;pointer-events:none;}
.usj-scene-hotspots button{position:absolute;display:flex;align-items:center;justify-content:center;width:44px;height:44px;margin:-22px 0 0 -22px;border:0;background:none;pointer-events:auto;cursor:pointer;color:#304d43;}
.usj-scene-hotspots button>span{width:10px;height:10px;border:2px solid #fff8df;background:#e2b959;border-radius:100%;box-shadow:0 0 0 5px #ffffff47,0 2px 12px #243e3838;transition:box-shadow .2s,transform .2s;}
.usj-scene-hotspots button:hover>span,.usj-scene-hotspots button:focus-visible>span,.usj-scene-hotspots button.is-active>span{box-shadow:0 0 0 7px #fff8df70,0 2px 15px #243e3838;transform:scale(1.12);}
.usj-scene-hotspots button:focus-visible{outline:2px solid #668b77;outline-offset:2px;border-radius:50%;}
.usj-scene-hotspots b{position:absolute;bottom:42px;left:50%;transform:translate(-50%,4px);background:#fffdf3e8;backdrop-filter:blur(12px);border:1px solid #fffdf3;padding:7px 10px;border-radius:9px;font-size:12px;white-space:nowrap;opacity:0;transition:opacity .2s,transform .2s;pointer-events:none;font-weight:500;}
.usj-scene-hotspots button:hover b,.usj-scene-hotspots button:focus-visible b,.usj-scene-hotspots button.is-active b{opacity:1;transform:translate(-50%,0);}
.usj-scene-hint{position:absolute;left:20px;bottom:17px;display:flex;align-items:center;gap:7px;margin:0;color:#63796f;font-size:11px;letter-spacing:.03em;pointer-events:none;}
.usj-scene-hint svg{width:17px;height:17px;}
.usj-coin-count{position:absolute;right:18px;bottom:14px;border:1px solid #e5dac1;border-radius:20px;background:#fffcf0d9;padding:7px 12px;color:#826d3c;font-size:11px;pointer-events:none;}
.usj-coin-count>span{color:#e4b840;margin-right:4px;}
@media(max-width:560px){.usj-scene{min-height:285px;}.usj-scene-hint{font-size:10px;left:12px;bottom:13px;}.usj-coin-count{right:12px;bottom:10px;padding:6px 9px;}.usj-scene-hotspots b{font-size:11px;}}
@media(prefers-reduced-motion:reduce){.usj-scene-hotspots b,.usj-scene-hotspots button>span{transition:none;}}
</style>

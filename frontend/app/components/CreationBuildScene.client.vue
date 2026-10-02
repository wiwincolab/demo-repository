<script setup lang="ts">
import { loadScript } from '~/utils/loadScript';
const root=ref<HTMLElement>(), host=ref<HTMLElement>(), ready=ref(false), error=ref('');
const step=ref(0), night=ref(false), busy=ref(false), status=ref('先把富士山放回底座。');
const names=['富士山','咖啡店','杉樹','路燈','雲霧'];
const asset=useAsset(), {gsap,animate}=useCreationMotion(root);
let T:any,renderer:any,scene:any,camera:any,model:any,ambient:any,glass:any,lamp:any,ring:any,sun:any;
const pieces:any[]=[], homes:any[]=[];
let observer:ResizeObserver|undefined, disposed=false, dragging=false, rotating=false, startX=0, rotation=0, downY=0;
let pointer:any,ray:any,dragPlane:any,offset:any;
const render=()=>{if(renderer&&!disposed)renderer.render(scene,camera);};
function stage(){
  if(step.value>=pieces.length){ring.visible=false;status.value='風景拼好了。點亮窗燈，回到藍調時刻。';return;}
  const p=pieces[step.value],home=homes[step.value]; p.visible=true;p.position.copy(home).add(new T.Vector3(1.1,1.8,.5));
  ring.position.set(home.x,.06,home.z);ring.visible=true;
  status.value=`把${names[step.value]}拖到光圈，或點按放入。`;render();
}
function place(){
  if(!ready.value||busy.value||step.value>=5)return;
  busy.value=true;const p=pieces[step.value],home=homes[step.value];
  animate(d=>gsap.to(p.position,{x:home.x,y:home.y,z:home.z,duration:d(.55),ease:'back.out(1.35)',onUpdate:render,onComplete:()=>{step.value++;busy.value=false;stage();render();}}));
}
function reset(){if(!ready.value||busy.value)return;pieces.forEach(p=>{gsap.killTweensOf(p.position);p.visible=false;});step.value=0;stage();render();}
function assemble(){if(!ready.value||busy.value)return;busy.value=true;ring.visible=false;animate(d=>{
  const tl=gsap.timeline({onComplete:()=>{step.value=5;busy.value=false;stage();render();}});
  pieces.forEach((p,i)=>{p.visible=true;const h=homes[i];p.position.copy(h).add(new T.Vector3(0,2,0));tl.to(p.position,{x:h.x,y:h.y,z:h.z,duration:d(.5),ease:'back.out(1.2)',onUpdate:render},d(i*.1));});
});}
function light(){if(!ready.value)return;night.value=!night.value;animate(d=>{
  const color=new T.Color(night.value?'#152c47':'#eeeae1');
  gsap.to(scene.background,{r:color.r,g:color.g,b:color.b,duration:d(.7),onUpdate:render,overwrite:true});
  gsap.to(ambient,{intensity:night.value?.48:1.7,duration:d(.7),onUpdate:render,overwrite:true});
  gsap.to(sun,{intensity:night.value?.65:2.5,duration:d(.7),onUpdate:render,overwrite:true});
  gsap.to(glass,{emissiveIntensity:night.value?1.5:.12,duration:d(.6),onUpdate:render,overwrite:true});
  gsap.to(lamp,{intensity:night.value?2:0,duration:d(.7),onUpdate:render,overwrite:true});
});}
function rotate(amount:number){if(!ready.value)return;animate(d=>gsap.to(model.rotation,{y:model.rotation.y+amount,duration:d(.4),onUpdate:render,overwrite:true}));}
function setRay(e:PointerEvent){const r=host.value!.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(pointer,camera);}
function down(e:PointerEvent){
  if(!ready.value||busy.value||e.button!==0)return;
  setRay(e);host.value?.setPointerCapture(e.pointerId);startX=e.clientX;downY=e.clientY;rotation=model.rotation.y;
  const p=pieces[step.value];
  if(p&&ray.intersectObject(p,true).length){dragging=true;const world=p.getWorldPosition(new T.Vector3());dragPlane=new T.Plane().setFromNormalAndCoplanarPoint(camera.getWorldDirection(new T.Vector3()),world);const hit=new T.Vector3();ray.ray.intersectPlane(dragPlane,hit);offset=world.sub(hit);}
  else rotating=true;
}
function move(e:PointerEvent){
  if(dragging){setRay(e);const hit=new T.Vector3();if(ray.ray.intersectPlane(dragPlane,hit)){pieces[step.value].position.copy(model.worldToLocal(hit.add(offset)));render();}}
  else if(rotating){model.rotation.y=rotation+(e.clientX-startX)*.009;render();}
}
function up(e:PointerEvent,cancel=false){
  if(dragging){const p=pieces[step.value],home=homes[step.value];const target=model.localToWorld(home.clone()).project(camera);const r=host.value!.getBoundingClientRect();const x=r.left+(target.x+1)/2*r.width,y=r.top+(-target.y+1)/2*r.height;
    if(!cancel&&Math.hypot(e.clientX-x,e.clientY-y)<85)place();else{status.value='靠近底座上的光圈，再放手試試。';animate(d=>gsap.to(p.position,{x:home.x+1.1,y:home.y+1.8,z:home.z+.5,duration:d(.4),ease:'power3.out',onUpdate:render}));}}
  else if(rotating&&!cancel&&step.value===5&&Math.hypot(e.clientX-startX,e.clientY-downY)<6){setRay(e);if(ray.intersectObject(pieces[3],true).length||ray.intersectObject(pieces[1],true).length)light();}
  dragging=false;rotating=false;
}
onMounted(async()=>{try{
  await loadScript(asset('vendor/three.min.js'));if(disposed||!host.value)return;T=(window as any).THREE;
  scene=new T.Scene();scene.background=new T.Color('#eeeae1');camera=new T.PerspectiveCamera(37,1,.1,100);camera.position.set(7,6.5,10);camera.lookAt(0,1,0);
  renderer=new T.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;host.value.appendChild(renderer.domElement);
  renderer.domElement.setAttribute('aria-label','可以逐件拼裝的富士山立體場景');
  model=new T.Group();scene.add(model);ambient=new T.HemisphereLight('#ffffff','#9b8c79',1.7);scene.add(ambient);sun=new T.DirectionalLight('#fff4df',2.5);sun.position.set(-3,8,5);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);scene.add(sun);
  const mat=(color:string)=>new T.MeshStandardMaterial({color,roughness:.8,flatShading:true});
  const mesh=(parent:any,g:any,m:any,x=0,y=0,z=0)=>{const o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;};
  const part=(x:number,y:number,z:number)=>{const g=new T.Group();g.position.set(x,y,z);g.visible=false;model.add(g);pieces.push(g);homes.push(g.position.clone());return g;};
  mesh(model,new T.CylinderGeometry(3.1,3.1,.28,6),mat('#dfd3b9'),0,-.15,0);
  mesh(model,new T.CylinderGeometry(2.95,2.95,.025,6),mat('#aebcb0'),0,.005,0);
  const mountain=part(-.4,0,-1.15);mesh(mountain,new T.ConeGeometry(1.5,2.6,7),mat('#7399b8'),0,1.3);mesh(mountain,new T.ConeGeometry(.64,1.08,7),mat('#f6f5e9'),0,2.06);
  const cafe=part(.15,0,.75);mesh(cafe,new T.BoxGeometry(2.3,.9,1.2),mat('#49535a'),0,.47);mesh(cafe,new T.BoxGeometry(2.6,.13,1.5),mat('#263746'),0,.98);
  glass=new T.MeshStandardMaterial({color:'#e6bf7b',emissive:'#ffbc54',emissiveIntensity:.12,roughness:.25});
  for(let i=0;i<5;i++)mesh(cafe,new T.BoxGeometry(.35,.64,.03),glass,-.89+i*.445,.51,.62);
  mesh(cafe,new T.BoxGeometry(1,.03,.45),mat('#c2b698'),0,.04,.95);
  const trees=part(-1.95,0,.4);for(const [x,z,s] of [[0,0,1],[.35,-.85,.7]]){mesh(trees,new T.CylinderGeometry(.07,.09,.8,6),mat('#6e5544'),x,.4,z);for(let i=0;i<3;i++)mesh(trees,new T.ConeGeometry((.45-i*.08)*s!,.7*s!,7),mat('#355b4c'),x,.75+i*.34,z);}
  const post=part(1.9,0,.95);mesh(post,new T.CylinderGeometry(.045,.065,1.85,8),mat('#3b4850'),0,.925);mesh(post,new T.BoxGeometry(.5,.08,.12),mat('#3b4850'),-.22,1.82);mesh(post,new T.BoxGeometry(.25,.03,.13),glass,-.3,1.77);lamp=new T.PointLight('#ffca83',0,5);lamp.position.set(-.3,1.65,0);post.add(lamp);
  const clouds=part(.6,0,-1.35);for(let i=0;i<4;i++)mesh(clouds,new T.SphereGeometry(.33,12,8),mat('#d4e2e4'),i*.35,.62+(i%2)*.1,0);
  ring=mesh(model,new T.TorusGeometry(.65,.025,8,48),new T.MeshBasicMaterial({color:'#f7c657'}));ring.rotation.x=-Math.PI/2;
  pointer=new T.Vector2();ray=new T.Raycaster();
  observer=new ResizeObserver(()=>{if(!host.value||disposed)return;const{width,height}=host.value.getBoundingClientRect();renderer.setSize(width,height);camera.aspect=width/Math.max(1,height);camera.updateProjectionMatrix();render();});observer.observe(host.value);ready.value=true;stage();render();
}catch{error.value='這個裝置暫時無法開啟 3D，請返回欣賞作品。';}});
onBeforeUnmount(()=>{disposed=true;observer?.disconnect();scene?.traverse((o:any)=>{o.geometry?.dispose();if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach((m:any)=>m.dispose());});renderer?.dispose();renderer?.domElement.remove();});
</script>
<template><div ref="root" class="motion-experience">
  <div class="motion-intro"><span>BUILD YOUR WAY BACK</span><h3>一塊一塊，把那天拼回來。</h3></div>
  <div ref="host" class="creation-three motion-build-scene" @pointerdown="down" @pointermove="move" @pointerup="up($event)" @pointercancel="up($event,true)"><p v-if="error">{{ error }}</p><p v-else-if="!ready">正在打開你的立體風景…</p><span class="build-progress">{{ step }} / 5 已拼好</span></div>
  <div class="build-steps"><span v-for="(name,i) in names" :key="name" :class="{'is-done':i<step,'is-current':i===step}">{{ i<step?'✓':i+1 }} {{ name }}</span></div>
  <div class="motion-toolbar"><button :disabled="!ready||busy" aria-label="向左旋轉模型" @click="rotate(-.45)">↶</button><button v-if="step<5" class="is-primary" :disabled="!ready||busy" @click="place">放入{{ names[step] }}</button><button v-else class="is-primary" @click="light">{{ night?'回到白天':'點亮窗燈' }}</button><button :disabled="!ready||busy" aria-label="向右旋轉模型" @click="rotate(.45)">↷</button></div>
  <div class="motion-secondary-actions"><button :disabled="!ready||busy" @click="reset">重新拼裝</button><button v-if="step<5" :disabled="!ready||busy" @click="assemble">先看完整風景</button></div>
  <p class="motion-status" role="status">{{ status }}</p>
</div></template>

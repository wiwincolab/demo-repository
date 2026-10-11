import test from 'node:test';
import assert from 'node:assert/strict';
import {observePhotoLoading} from '../app/utils/photo-loading.ts';

test('photo loading handles cached images, lazy visibility, source races, errors and dynamic map markers',()=>{
  class ElementMock {
    tagName='DIV';dataset:Record<string,string>={};attrs=new Map<string,string>();children:ElementMock[]=[];
    getAttribute(key:string){return this.attrs.get(key) ?? null;}
    setAttribute(key:string,value:string){this.attrs.set(key,value);}
    removeAttribute(key:string){this.attrs.delete(key);}
    querySelectorAll(){return this.children.filter(c=>c.tagName==='IMG');}
  }
  class ImageMock extends ElementMock {override tagName='IMG';complete=false;naturalWidth=0;constructor(src:string){super();this.setAttribute('src',src);}}
  let changed:(records:unknown[])=>void=()=>{}, intersect:(entries:unknown[])=>void=()=>{};
  const observed=new Set<unknown>();let disconnected=0;
  class Mutations {constructor(fn:(records:unknown[])=>void){changed=fn;}observe(){}disconnect(){disconnected++;}}
  class Intersections {constructor(fn:(entries:unknown[])=>void){intersect=fn;}observe(img:unknown){observed.add(img);}unobserve(img:unknown){observed.delete(img);}disconnect(){observed.clear();disconnected++;}}
  const saved=Object.fromEntries(['Element','MutationObserver','IntersectionObserver'].map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)]));
  Object.assign(globalThis,{Element:ElementMock,MutationObserver:Mutations,IntersectionObserver:Intersections});
  try{
    const pending=new ImageMock('one.jpg'),cached=new ImageMock('cached.jpg'),failed=new ImageMock('failed.jpg'),blink=new ImageMock('blink.png');
    cached.complete=true;cached.naturalWidth=640;failed.complete=true;blink.dataset.photoLoading='off';
    const root=new ElementMock();root.children=[pending,cached,failed,blink];
    const listeners=new Map<string,(event:{target:ImageMock})=>void>();
    const doc={documentElement:root,querySelectorAll:()=>root.children,addEventListener:(type:string,fn:never)=>listeners.set(type,fn),removeEventListener:(type:string)=>listeners.delete(type)};
    const dispose=observePhotoLoading(doc as unknown as Document);
    assert.equal(pending.dataset.photoState,'loading');assert.equal(pending.getAttribute('aria-busy'),'true');
    assert.equal(pending.dataset.photoVisible,'false');assert.equal(cached.dataset.photoState,'loaded');assert.equal(cached.dataset.photoReveal,'false');
    assert.equal(failed.dataset.photoState,'error');assert.equal(blink.dataset.photoState,undefined);
    intersect([{target:pending,isIntersecting:true}]);assert.equal(pending.dataset.photoVisible,'true');
    pending.complete=true;pending.naturalWidth=640;listeners.get('load')!({target:pending});
    assert.equal(pending.dataset.photoState,'loaded');assert.equal(pending.dataset.photoReveal,'true');assert.equal(pending.getAttribute('aria-busy'),null);
    pending.setAttribute('src','two.jpg');pending.complete=false;pending.naturalWidth=0;
    changed([{type:'attributes',target:pending}]);listeners.get('load')!({target:pending});
    assert.equal(pending.dataset.photoState,'loading','an old load event cannot resolve a new pending source');
    pending.complete=true;listeners.get('error')!({target:pending});assert.equal(pending.dataset.photoState,'error');assert(!observed.has(pending));
    const marker=new ImageMock('map-marker.jpg');marker.setAttribute('aria-busy','false');
    changed([{type:'childList',addedNodes:[marker],removedNodes:[]}]);assert.equal(marker.dataset.photoState,'loading');
    marker.complete=true;marker.naturalWidth=96;listeners.get('load')!({target:marker});assert.equal(marker.getAttribute('aria-busy'),'false');
    const removedSource=new ImageMock('temporary.jpg');
    changed([{type:'childList',addedNodes:[removedSource],removedNodes:[]}]);
    assert.equal(removedSource.dataset.photoState,'loading');
    removedSource.removeAttribute('src');changed([{type:'attributes',target:removedSource}]);
    assert.equal(removedSource.dataset.photoState,undefined);assert.equal(removedSource.getAttribute('aria-busy'),null);assert(!observed.has(removedSource));
    dispose();assert.equal(disconnected,2);assert.equal(listeners.size,0);assert.equal(observed.size,0);
  }finally{
    for(const [key,descriptor] of Object.entries(saved))if(descriptor)Object.defineProperty(globalThis,key,descriptor);else Reflect.deleteProperty(globalThis,key);
  }
});

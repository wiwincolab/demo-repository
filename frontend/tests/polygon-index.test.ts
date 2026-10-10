import test from 'node:test';
import assert from 'node:assert/strict';
import { indexRing } from '../app/utils/polygon-index.ts';
import { pointInPolygon, type Point } from '../app/utils/map.ts';

test('indexed containment matches ray casting at vertices, edges and across latitude bands',()=>{
  const rings:Point[][]=[[[0,0],[4,0],[4,4],[2,1],[0,4]],[[0,0],[2,2],[0,4],[-2,2]],[],[[1,1],[2,1],[3,1]]];
  const detailed=Array.from({length:2000},(_,i)=>{const angle=i/2000*2*Math.PI;return [Math.cos(angle)*(2+Math.sin(angle*11)),Math.sin(angle)*(2+Math.sin(angle*11))];});
  rings.push(detailed);
  for(const ring of rings){const contains=indexRing(ring);for(let x=-4;x<=4;x+=.125)for(let y=-4;y<=4;y+=.125)assert.equal(contains([x,y]),pointInPolygon([x,y],ring));for(const p of ring)assert.equal(contains(p),pointInPolygon(p,ring));}
});

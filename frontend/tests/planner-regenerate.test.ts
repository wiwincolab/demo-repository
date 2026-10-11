import test from 'node:test';
import assert from 'node:assert/strict';
import {regeneratePlan} from '../app/utils/planner-regenerate.ts';
import {conversationPlan} from '../app/utils/planner-chat.ts';
import {planChanges} from '../app/utils/planner-comparison.ts';
import type {Stop} from '../app/types/trip.ts';
function place(id:number,name:string,x=139.7,y=35.7):Stop{return {id,name,short:name,day:0,at:[x,y],time:'13:00',stay:'停留 60 分鐘',note:'',range:[40,90],photo:{src:'photo.jpg',alt:name,source:'',credit:'',license:'',licenseUrl:''}};}
const a=place(1,'公園'),b=place(2,'美術館',139.71),c=place(3,'室內咖啡館',139.72),d=place(4,'歷史博物館',139.73),remote=place(5,'釜山咖啡館',129.07,35.17);
test('regeneration selects fresh nearby places and preserves late, indoor and retained-place constraints',()=>{
  const before=[b,c],snapshot=structuredClone(before);
  const result=regeneratePlan([a,b,c,d,remote],before,'晚一點出發，雨天改室內，保留美術館',2);
  assert(result.changed);assert(result.stops.some(s=>s.id===b.id));assert(result.stops.some(s=>s.id===d.id));
  assert.equal(result.stops[0]?.time,'13:00');assert(!result.stops.some(s=>s.id===a.id||s.id===remote.id));
  assert(planChanges(before,result.stops).length);assert.deepEqual(before,snapshot);
});
test('circle and pass restrictions retain their selected set while changing order when no alternative is available',()=>{
  const before=[{...a,time:'10:00'},{...b,time:'11:15'}];
  const result=regeneratePlan([a,b,c,remote],before,'',2,[],{selectedIds:[a.id,b.id]});
  assert(result.changed);assert(result.stops.every(s=>[a.id,b.id].includes(s.id)));
});
test('a blank day starts inside its destination and avoids other-day places when possible',()=>{
  const result=regeneratePlan([remote,a,b,c,d],[],'',2,[],{bounds:[139.6,35.6,139.8,35.8],center:[139.7,35.7],otherDayIds:[a.id]});
  assert(result.changed);assert.equal(result.stops.length,2);assert(!result.stops.some(s=>s.id===remote.id||s.id===a.id));
});
test('explicit removal survives regeneration and impossible changes are reported honestly',()=>{
  const result=regeneratePlan([a,b,c,d],[a,b],'不要公園，最多2站',3);
  assert(!result.stops.some(s=>s.id===a.id));assert.equal(result.stops.length,2);
  const single=regeneratePlan([{...a,time:'10:00'}],[{...a,time:'10:00'}],'',1,[],{selectedIds:[a.id]});
  assert.equal(single.changed,false);assert.match(single.message,/原行程已保留/);
});
test('a later conversation edit keeps previously adopted afternoon departure',()=>{
  const result=conversationPlan([a,b,c],[a,b],'加入室內咖啡館',[],'晚一點出發');
  assert.equal(result.stops[0]?.time,'13:00');assert(result.stops.some(s=>s.id===c.id));
});

test('rainy-day regeneration includes an indoor aquarium',()=>{
  const aquarium=place(30,'水族館');
  const result=regeneratePlan([a,aquarium],[],'下雨，改室內',3);
  assert.equal(result.stops.length,1);assert.equal(result.stops[0]?.id,aquarium.id);
});

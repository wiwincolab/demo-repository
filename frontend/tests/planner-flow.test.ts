import test from 'node:test';
import assert from 'node:assert/strict';
import type { Stop } from '../app/types/trip.ts';
import { conversationPlan, plannedDay, restorePlannedDays } from '../app/utils/planner-chat.ts';
import { pointsProducts, initialWallet, redeemPoints, cancelPointsOrder, readPointsWallet, redeemedPlanningContext, serviceRecommendations } from '../app/utils/points.ts';
const stop=(id:number,name:string,x=139.7):Stop=>({id,day:0,name,short:name,at:[x,35.7],time:'10:00',stay:'60 分鐘',note:'',range:[60,60],photo:{src:'photo.jpg',alt:name,credit:'test',source:'',license:'',licenseUrl:'',objectPosition:'center'}});
const a=stop(1,'老街'),b=stop(2,'公園'),museum=stop(3,'室內美術館'),coffee=stop(4,'咖啡店');
test('conversation adjusts the draft while keeping the source itinerary and map selection intact',()=>{
 const current=[b,a],selected=[1,2,3,4],before=structuredClone(current);
 const late=conversationPlan([a,b,museum,coffee],current,'晚一點出發');
 assert.equal(late.changed,true);assert.equal(late.stops[0]!.time,'13:00');assert.deepEqual(late.stops.map(s=>s.id),[2,1]);
 assert.deepEqual(current,before);assert.deepEqual(selected,[1,2,3,4]);
 const slow=conversationPlan([a,b,museum,coffee],current,'步調悠閒，少一站');assert.equal(slow.stops.length,1);
 const add=conversationPlan([a,b,museum,coffee],current,'想喝咖啡');assert.ok(add.stops.some(s=>s.id===coffee.id));
});
test('indoor replacements are local, unique, and unsupported requests preserve the draft',()=>{
 const rain=conversationPlan([a,b,museum,coffee,stop(9,'遠方博物館',140.7)],[a,b],'下雨，改室內');
 assert.ok(rain.changed);assert.ok(rain.stops.every(s=>[3,4].includes(s.id)));assert.equal(new Set(rain.stops.map(s=>s.id)).size,2);
 assert.equal(conversationPlan([a],[a],'移除老街').changed,false);
 assert.equal(conversationPlan([a],[a],'我想搭太空船').stops[0]!.id,1);
});
test('saving replaces only the chosen day and rejects broken stored geometry',()=>{
 const base=[{area:'第一天',english:'ONE',stops:[a]},{area:'第二天',english:'TWO',stops:[b]}];
 const saved=plannedDay(base,1,[museum]);assert.equal(saved[0],base[0]);assert.equal(saved[1]!.stops[0]!.id,3);assert.equal(saved[1]!.stops[0]!.day,1);assert.equal(base[1]!.stops[0]!.id,2);
 assert.equal(plannedDay(base,1,[{...museum,at:[NaN,35]}]),base);
 assert.equal(plannedDay(base,8,[museum]),base);
 const restored=restorePlannedDays(base,{savedDays:{0:{day:0,stops:[coffee]},1:{day:1,stops:[museum]},99:{day:99,stops:[a]}},saved:{day:1,stops:[museum]}});
 assert.deepEqual(restored.map(d=>d.stops[0]!.id),[4,3]);assert.equal(base[0]!.stops[0]!.id,1);
 assert.equal(restorePlannedDays(base,null),base);
 assert.equal(restorePlannedDays(base,{saved:{stops:[{...a,at:[NaN,0]}]}}),base);
});
test('redeemed services are scoped to the trip and region; cancelling returns demo points',()=>{
 const taxi=pointsProducts.find(p=>p.id==='taxi')!,esim=pointsProducts.find(p=>p.id==='hotai-esim')!;
 const one=redeemPoints(initialWallet(),taxi,'full','tokyo',undefined,'taxi');
 const two=redeemPoints(one,esim,'full','tokyo',undefined,'esim');
 const context=redeemedPlanningContext(two.orders,'tokyo','japan',[a]);
 assert.equal(context.find(s=>s.product.id==='taxi')!.usable,false);assert.equal(context.find(s=>s.product.id==='hotai-esim')!.usable,true);
 assert.deepEqual(redeemedPlanningContext(two.orders,'busan','korea',[a]),[]);
 const cancelled=cancelPointsOrder(two,'taxi');assert.equal(cancelled.balance,initialWallet().balance-esim.price);assert.deepEqual(readPointsWallet(cancelled),cancelled);assert.equal(cancelPointsOrder(cancelled,'taxi'),cancelled);
 assert.ok(serviceRecommendations('japan',a,b).every(s=>s.kind!=='transport'));
});

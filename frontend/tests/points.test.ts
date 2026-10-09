import {test} from 'node:test';
import assert from 'node:assert/strict';
import {initialWallet,pointsProducts,pointsQuote,redeemPoints,readPointsWallet,replacementReason,applyPointsOrders} from '../app/utils/points.ts';
import type {Stop} from '../app/types/trip.ts';
const spa=pointsProducts.find(p=>p.id==='spa')!,taxi=pointsProducts[0]!;
const target={id:1,day:0,name:'北投公園',short:'北投',at:[121.505,25.136],time:'14:00',stay:'150 分鐘',note:'',range:[120,150],photo:{src:'old',alt:'',source:'',credit:'',license:'',licenseUrl:'',objectPosition:'center'}} satisfies Stop;
test('full and partial quotes enforce balance, idempotency and valid persistence',()=>{
 assert.deepEqual(pointsQuote(spa,'partial'),{points:800,cash:800});
 assert.throws(()=>redeemPoints(initialWallet(),spa,'full','tokyo',undefined,'a'),/不足/);
 const next=redeemPoints(initialWallet(),spa,'partial','tokyo',undefined,'a');assert.equal(next.balance,400);assert.equal(next.orders[0]!.cash,800);assert.deepEqual(readPointsWallet(next),next);
 assert.equal(redeemPoints(next,spa,'partial','tokyo',undefined,'a'),next);
 assert.throws(()=>readPointsWallet({...next,balance:1200}),/不一致/);
 assert.throws(()=>readPointsWallet({version:1,balance:1200,orders:[{}]}));
});
test('replacement rejects overseas, distant places and short timeslots',()=>{
 assert.match(replacementReason(spa,'japan',target),/海外/);
 assert.match(replacementReason(spa,'taiwan',{...target,at:[120.9,23.8]}),/附近/);
 assert.match(replacementReason(spa,'taiwan',target,{...target,time:'15:00'}),/不足/);
 assert.equal(replacementReason(spa,'taiwan',target,{...target,time:'16:30'}),'');
 assert.match(replacementReason(taxi,'taiwan',target),/不替換/);
});
test('orders replace only the selected trip and stop; transport does not replace',()=>{
 const base=[{area:'北投',english:'BEITOU',stops:[target,{...target,id:2,name:'其他站'}]}];
 const w=redeemPoints(initialWallet(),spa,'partial','demo',target,'a');
 const result=applyPointsOrders(base,w.orders,'demo');assert.equal(result[0]!.stops[0]!.name,spa.name);assert.equal(result[0]!.stops[1]!.name,'其他站');assert.equal(base[0]!.stops[0]!.name,'北投公園');assert.equal(applyPointsOrders(base,w.orders,'other')[0]!.stops[0]!.name,'北投公園');
 assert.throws(()=>redeemPoints(w,taxi,'full','demo',target,'b'),/重複/);
 const transport=redeemPoints(initialWallet(),taxi,'full','demo',undefined,'c');assert.equal(applyPointsOrders(base,transport.orders,'demo')[0]!.stops[0]!.name,'北投公園');
});

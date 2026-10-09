import type { Stop, TripDay } from '../types/trip.ts';
export interface PointsProduct { id:string; brand:string; name:string; kind:'transport'|'activity'; price:number; partial:number; image:string; source:string; credit:string; location:string; at:number[]; minutes:number }
export const pointsProducts:PointsProduct[] = [
 {id:'taxi',brand:'yoxi',name:'城市移動折抵券',kind:'transport',price:100,partial:50,image:'https://img.carstuff.com.tw/images/stories/2021/Jason/11/19/202111191123-1.png',source:'https://www.carstuff.com.tw/car-news/item/35299-yoxi.html',credit:'CarStuff 人車事',location:'台灣城市交通',at:[],minutes:0},
 {id:'rent',brand:'iRent',name:'共享車出遊折抵券',kind:'transport',price:200,partial:100,image:'https://img.carstuff.com.tw/images/stories/2021/Jason/07/19/202107191021-2.jpeg',source:'https://www.carstuff.com.tw/car-news/item/34552-irent-99.html',credit:'CarStuff 人車事',location:'台灣共享車',at:[],minutes:0},
 {id:'museum',brand:'去趣旅遊商城',name:'北投室內展覽體驗',kind:'activity',price:480,partial:240,image:'https://ht-cdn.panyou.com/uploadhk/2025/ht/1223/202512231051-3107239053.jpg',source:'https://www.hopetrip.com/news/detail-14353.html',credit:'Hopetrip',location:'台北・北投',at:[121.5134,25.1389],minutes:120},
 {id:'spa',brand:'去趣旅遊商城',name:'北投雙人溫泉體驗',kind:'activity',price:1600,partial:800,image:'https://cdn.liontravel.com/CTO/ETKT/PROD/G200052T5.jpg',source:'https://activity.liontravel.com/detail/G200052T?Foreign=0',credit:'雄獅旅遊',location:'台北・北投',at:[121.5131,25.1363],minutes:120}
];
export type Payment='full'|'partial';
export interface PointsOrder { id:string; productId:string; payment:Payment; tripId:string; points:number; cash:number; targetId:number|null; day:number|null; createdAt:string }
export interface PointsWallet { version:1; balance:number; orders:PointsOrder[] }
export const initialWallet=():PointsWallet=>({version:1,balance:1200,orders:[]});
export const pointsQuote=(p:PointsProduct,mode:Payment)=>({points:mode==='full'?p.price:p.partial,cash:mode==='full'?0:p.price-p.partial});
export function readPointsWallet(raw:unknown):PointsWallet {
 const s=raw as PointsWallet;
 if(!s||s.version!==1||!Array.isArray(s.orders)||s.orders.length>500)throw new Error('點數紀錄無法讀取，請保留原紀錄後重試。');
 let spent=0;const ids=new Set<string>();
 for(const o of s.orders){const p=pointsProducts.find(p=>p.id===o.productId);if(!p||!['full','partial'].includes(o.payment)||typeof o.id!=='string'||ids.has(o.id)||typeof o.tripId!=='string'||typeof o.createdAt!=='string'||!Number.isFinite(Date.parse(o.createdAt))||!(o.targetId===null||Number.isInteger(o.targetId))||!(o.day===null||(Number.isInteger(o.day)&&o.day>=0))||(o.targetId===null)!==(o.day===null))throw new Error('點數紀錄格式不正確。');const q=pointsQuote(p,o.payment);if(q.points!==o.points||q.cash!==o.cash||p.kind==='transport'&&o.targetId!==null)throw new Error('點數明細不一致。');spent+=o.points;ids.add(o.id);}
 if(s.balance!==1200-spent||s.balance<0)throw new Error('點數餘額不一致。');return s;
}
export function replacementReason(p:PointsProduct,country:string,stop?:Stop,next?:Stop){
 if(p.kind!=='activity')return '交通服務另存為旅後使用，不替換景點。';
 if(country!=='taiwan')return '此商品僅適用台北北投，不能替換海外景點。';
 if(!stop||stop.at.length<2)return '請先選擇要替換的景點。';
 const km=Math.hypot((stop.at[0]!-p.at[0]!)*101,(stop.at[1]!-p.at[1]!)*111);
 if(!Number.isFinite(km)||km>8)return '所選景點不在北投附近，請另存為旅後使用。';
 const minute=(time:string)=>/^\d{2}:\d{2}$/.test(time)?Number(time.slice(0,2))*60+Number(time.slice(3)):NaN;
 const available=next?minute(next.time)-minute(stop.time):stop.range[1];
 if(!Number.isFinite(available)||(available ?? 0)<p.minutes+30)return '目前時段不足，請先預留 120 分鐘體驗與 30 分鐘交通。';
 return '';
}
export function redeemPoints(wallet:PointsWallet,p:PointsProduct,mode:Payment,tripId:string,target:Stop|undefined,id:string):PointsWallet {
 const q=pointsQuote(p,mode);if(wallet.orders.some(o=>o.id===id))return wallet;
 if(wallet.balance<q.points)throw new Error('點數不足，請選擇其他方案。');
 if(target&&wallet.orders.some(o=>o.tripId===tripId&&o.targetId===target.id&&o.day===target.day))throw new Error('這一站已有點數安排，請勿重複兌換。');
 return {version:1,balance:wallet.balance-q.points,orders:[...wallet.orders,{id,productId:p.id,payment:mode,tripId,points:q.points,cash:q.cash,targetId:target?.id??null,day:target?.day??null,createdAt:new Date().toISOString()}]};
}
export function applyPointsOrders(days:TripDay[],orders:PointsOrder[],tripId:string):TripDay[]{return days.map(d=>({...d,stops:d.stops.map(s=>{const o=orders.find(o=>o.tripId===tripId&&o.targetId===s.id&&o.day===s.day),p=pointsProducts.find(p=>p.id===o?.productId);return p&&p.kind==='activity'?{...s,name:p.name,short:p.name,at:[...p.at],stay:'體驗 120 分鐘',note:'和泰點數示範安排；未實際預訂，日期與庫存待確認。',transit:'交通需重新確認',range:[120,120],photo:{...s.photo,src:p.image,alt:p.name+'情境照片',source:p.source,credit:p.credit,license:'情境參考照片',licenseUrl:p.source}}:s;})}));}

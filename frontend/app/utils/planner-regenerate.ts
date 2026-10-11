import type {Stop} from '../types/trip.ts';
import {plannerKeywords, validPlannerKeywords} from '../data/planner-preferences.ts';
import {recommendPlaces, refineSelection} from './planner.ts';
import {planChanges} from './planner-comparison.ts';

export interface RegenerationScope {center?: number[]; bounds?: number[]; selectedIds?: number[]; requiredIds?: number[]; otherDayIds?: number[]}
const distance=(a:number[],b:number[])=>Math.hypot((a[0]!-b[0]!)*90,(a[1]!-b[1]!)*111);
export function regeneratePlan(pool:Stop[], before:Stop[], text:string, limit:number, keywords:string[]=[], scope:RegenerationScope={}) {
  const normalized=/晚.*出發|晚.*開始/.test(text)?text+'，下午出發':text;
  const phrases=text.split(/[，。；、\n]/);
  const excluded=plannerKeywords.filter(k=>phrases.some(p=>/不要|不想|不去|不喜歡|避開|不考慮/.test(p)&&k.input.test(p)));
  const interests=plannerKeywords.filter(k=>!excluded.includes(k)&&(k.input.test(text)||validPlannerKeywords(keywords).includes(k.id)));
  const existing=new Set(before.map(s=>s.id)), otherDays=new Set(scope.otherDayIds || []);
  const selected=scope.selectedIds?new Set(scope.selectedIds):null;
  let candidates=[...new Map(pool.filter(p=>p.at?.length===2&&p.at.every(Number.isFinite)).map(p=>[p.id,p])).values()];
  if(selected)candidates=candidates.filter(p=>selected.has(p.id)||(scope.requiredIds || []).includes(p.id));
  else if(scope.bounds?.length===4)candidates=candidates.filter(p=>p.at[0]!>=scope.bounds![0]!&&p.at[0]!<=scope.bounds![2]!&&p.at[1]!>=scope.bounds![1]!&&p.at[1]!<=scope.bounds![3]!);
  const allowed=new Set(refineSelection(candidates,candidates.map(p=>p.id),text).ids);
  candidates=candidates.filter(p=>allowed.has(p.id)&&!excluded.some(k=>k.place.test(p.name))&&(!/下雨|雨天|室內/.test(text)||/博物館|美術館|水族館|咖啡|晴空塔|商場|室內/.test(p.name+p.note)));
  let center=before[0]?.at || scope.center || candidates[0]?.at;
  if(!center||!candidates.length)return {stops:[],notes:[],changed:false,message:'目前沒有符合條件的景點，請調整偏好或重新載入目的地。'};
  if(!before.length&&!selected){
    // Administrative areas can be large. Start near a photographed attraction,
    // then keep the day's candidates nearby instead of crossing the whole region.
    const nearest=[...candidates].sort((a,b)=>Number(!!b.photo.src)-Number(!!a.photo.src)||distance(a.at,center!)-distance(b.at,center!))[0];
    if(nearest)center=nearest.at;
  }
  if(!selected)candidates=candidates.filter(p=>existing.has(p.id)||distance(p.at,center!)<=12);
  const mandatory=new Set([...(scope.requiredIds || []),...candidates.filter(p=>phrases.some(clause=>/保留|一定|必去|加入|想去|要去/.test(clause)&&!/不要|不去|移除|刪除|取消/.test(clause)&&clause.includes(p.name))).map(p=>p.id)]);
  const score=(p:Stop)=>interests.filter(k=>k.place.test(p.name)).length*8+Number(!existing.has(p.id))*5+Number(!!p.photo.src)*2+Number(p.id>=0)*3-Number(otherDays.has(p.id))*3-distance(p.at,center!)/3;
  candidates.sort((a,b)=>Number(mandatory.has(b.id))-Number(mandatory.has(a.id))||score(b)-score(a)||a.id-b.id);
  const count=text.match(/(?:最多|只排|安排|排)\s*([1-8一二兩三四五六七八])\s*(?:個|站)/);
  const specified=count?(Number(count[1])||({一:1,二:2,兩:2,三:3,四:4,五:5,六:6,七:7,八:8}[count[1] as '一'])):limit;
  const max=Math.max(1,Math.min(8,specified));
  const schedule=(ordered:Stop[])=>recommendPlaces(ordered,ordered.map(p=>p.id),normalized,max,0,keywords,true,{preserveOrder:true});
  let result=schedule(candidates);
  if(before.length&&result.stops.length>1&&!planChanges(before,result.stops).length)result=schedule([...result.stops].reverse());
  const changes=planChanges(before,result.stops);
  const changed=!!result.stops.length&&!!changes.length;
  return {...result,changed,notes:[...result.notes,selected?'依目前選取的景點重排。':'優先找附近的新景點，並保留你的文字條件。'],message:changed?'已重新安排，先看看新增、移除及時間順序的差異。採用後回到行程主頁。':'符合條件的景點與時間只有這份安排；原行程已保留，可以放寬偏好或擴大範圍。'};
}

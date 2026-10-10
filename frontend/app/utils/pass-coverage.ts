import index from '../../public/pass-coverage/index.json' with { type: 'json' };
import type { Point } from './map.ts';
import { indexRing } from './polygon-index.ts';

export type PassAccess = 'unlimited' | 'round-trip' | 'one-way' | 'through-service' | 'exit-only' | 'scheduled-tour';
export const passAccessLabels: Record<PassAccess,string> = { unlimited:'自由搭乘區段', 'round-trip':'限次往返路徑', 'one-way':'指定單程路徑', 'through-service':'限直通列車', 'exit-only':'只可下車區段', 'scheduled-tour':'指定團班停靠點' };
export interface PassCoverageMetadata { id:string; mode:string; note:string; officialUrl:string; checkedAt:string; file:string|null; networkWays:number; venues:number; stops?:number; missingComponents?:string[]; components?:{name:string;access:PassAccess;source:string}[]; availability?:'current'|'expired'; variants?:{id:string;label:string;file:string|null}[]; variantId?:string; variantLabel?:string }
export interface PassCoverageFeature { type:'Feature'; properties:{role:string;name?:string;osmId?:number;osmIds?:number[];routeId?:number;access?:PassAccess;source?:string;section?:string;transport?:string}; geometry:{type:string;coordinates:any} }
export interface PassCoverage { type:'FeatureCollection'; metadata:PassCoverageMetadata; features:PassCoverageFeature[] }
export const passCoverageIndex = index as Record<string,PassCoverageMetadata>;
export function coverageStatus(metadata?:PassCoverageMetadata) {
  if (metadata?.availability === 'expired') return '歷史票券・已到期';
  return ({network:'路網已繪製',partial:'部分路線／停靠點已繪製',venues:'合作景點已定位','official-only':'路線待核對','stored-value':'儲值卡・無免費範圍'} as Record<string,string>)[metadata?.mode || ''] || '路線待核對';
}
export function coverageAccess(coverage?:PassCoverage|null):PassAccess[] {
  return [...new Set((coverage?.features || []).filter(f=>f.properties.role==='network' || f.properties.role==='stop').map(f=>f.properties.access || 'unlimited'))];
}
export function displayCoverageGap(gap:string) {
  if (gap.startsWith('缺少路線：{')) return '指定路線的路徑尚待補齊，請查看官方範圍。';
  return gap.replace('OSM 指定區間不連通：','區段路徑尚待補齊：').replace('沒有匹配的 OSM 路線','指定區段的路徑尚待補齊').replace('缺少端點車站：','車站區段尚待補齊：').replace('端點不在指定路線上：','車站區段尚待核對：').replace('缺少路線：','路線尚待補齊：');
}
export const taiwanBundleOptions = {
  city:['tw-taipei-transport','tw-taoyuan-airport-return','tw-taichung-metro','tw-kaohsiung-metro'],
  shuttle:['tw-yilan-pass','tw-yilan-funtour','tw-taichung-go','tw-qingjing-shuttle','tw-sun-moon-lake-shuttle','tw-sun-moon-lake-funtour','tw-alishan-shuttle','tw-alishan-main-out','tw-alishan-main-return','tw-alishan-branch-day','tw-kaohsiung-mengo','tw-kenting-shuttle'],
};
export function isTaiwanBundle(id:string) { return id === 'taiwan-hsr' || id === 'taiwan-tra'; }
export function mergeBundleCoverage(base:PassCoverage,city?:PassCoverage|null,shuttle?:PassCoverage|null):PassCoverage {
  const selections=[base,city,shuttle].filter((value):value is PassCoverage=>!!value);
  const features=selections.flatMap(c=>c.features);
  const missing=selections.flatMap(c=>c.metadata.missingComponents || []).filter(g=>!g.includes('任選一'));
  if(!city)missing.push('請選擇已兌換的都會交通（任選一）');
  if(!shuttle)missing.push('請選擇已兌換的景區接駁（任選一）');
  return {type:'FeatureCollection',features,metadata:{...base.metadata,mode:'partial',networkWays:selections.reduce((n,c)=>n+c.metadata.networkWays,0),venues:features.filter(f=>f.properties.role==='venue').length,stops:features.filter(f=>f.properties.role==='stop').length,missingComponents:[...new Set(missing)],note:'顯示共通鐵路與你選擇的都會交通、景區接駁；各項兌換次數與有效日期依官方條件。',components:selections.flatMap(c=>c.metadata.components || [])}};
}
export function coveragePolygons(coverage?: PassCoverage | null): Point[][][] {
  if (!coverage) return [];
  return indexedCoverage(coverage).polygons;
}
export function withinPassCoverage(point:Point,coverage?:PassCoverage|null) {
  return !!coverage && indexedCoverage(coverage).contains(point);
}
export function coverageExtent(coverage?:PassCoverage|null): Point[][] {
  return coveragePolygons(coverage).map(rings=>rings[0]!);
}
const coverageIndexes = new WeakMap<PassCoverage,{polygons:Point[][][];contains:(point:Point)=>boolean}>();
function indexedCoverage(coverage: PassCoverage) {
  let entry=coverageIndexes.get(coverage);
  if (!entry) {
    const polygons:Point[][][]=coverage.features.filter(f=>f.properties.role==='planning-contour').flatMap(f=>f.geometry.type==='Polygon' ? [f.geometry.coordinates] : f.geometry.type==='MultiPolygon' ? f.geometry.coordinates : []);
    const rings=polygons.map(p=>p.map(indexRing));
    entry={polygons,contains:point=>rings.some(p=>p[0]?.(point) && !p.slice(1).some(hole=>hole(point)))};
    coverageIndexes.set(coverage,entry);
  }
  return entry;
}

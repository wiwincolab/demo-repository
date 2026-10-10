import type { Poi } from '../types/poi.ts';
import Supercluster from 'supercluster';

export function filterPois(pois: Poi[], text: string, category: string, photosOnly: boolean) {
  const query=text.trim().normalize('NFKC').toLocaleLowerCase();
  return pois.filter(p=>(!category || p.category===category) && (!photosOnly || !!p.photo) && (!query || [p.name,p.localName,p.description,p.address,...Object.values(p.names)].filter(Boolean).join(' ').normalize('NFKC').toLocaleLowerCase().includes(query)));
}
export function poiFeatures(pois: Poi[]) {
  return {type:'FeatureCollection' as const,features:pois.map(p=>({type:'Feature' as const,geometry:{type:'Point' as const,coordinates:p.at},properties:{id:p.id,name:p.name,photo:!!p.photo}}))};
}
export function poiClusterIndex(pois: Poi[], radius=45) {
  return new Supercluster<{id:string;name:string;photo:boolean},{photoCount:number}>({radius,maxZoom:17,map:p=>({photoCount:Number(p.photo)}),reduce:(total,p)=>{total.photoCount+=p.photoCount;}}).load(poiFeatures(pois).features);
}

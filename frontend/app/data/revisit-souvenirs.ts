import reserve from './revisit-assets.json' with { type: 'json' };
import type { RevisitSouvenir } from './revisit.ts';
/** Exact original-photo matching; unavailable styles are absent, never replaced with another place. */
export function reserveSouvenirs(source: string): RevisitSouvenir[] {
  const row=reserve.find(row=>row.source===source);
  if(!row)return [];
  return row.styles.map((style,i)=>{
    const kind=style.kind as RevisitSouvenir['kind'];
    const [x,y]=row.points[i] || [50,50];
    return {id:`reserve-${row.id}-${kind}`,kind,title:row.title,image:style.image,x:x!,y:y!,demo:true,
      ...(kind==='sticker' && row.id!=='kansai-nara-source' ? {kit:{sheet:style.image,width:style.width || 1536,height:style.height || 1024,title:row.title,
        motifs:row.boxes.map((box,j)=>({name:row.names[j] || '旅行細節',box:box.map((value,k)=>Math.round(value*(k%2===0?(style.width || 1536):(style.height || 1024)))).join(' ')}))}} : {}),
    };
  });
}

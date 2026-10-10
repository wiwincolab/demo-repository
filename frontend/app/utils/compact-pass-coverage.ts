import type { PassCoverage, PassCoverageFeature } from './pass-coverage.ts';
import type { Point } from './map.ts';

function displayLine(points: Point[]) {
  // Display-only precision. Planning contours are preserved byte for byte.
  return points.map(p=>p.map(value=>Math.round(value*100000)/100000)).filter((p,i,all)=>!i || p[0]!==all[i-1]![0] || p[1]!==all[i-1]![1]);
}
export function compactPassCoverage(coverage: PassCoverage): PassCoverage {
  const features:PassCoverageFeature[]=[],groups=new Map<string,PassCoverageFeature>();
  for(const feature of coverage.features) {
    if(feature.properties.role!=='network' || feature.geometry.type!=='LineString'){features.push(feature);continue;}
    const {access='unlimited',transport}=feature.properties;
    const key=access+':'+(transport || 'rail');
    let group=groups.get(key);
    if(!group){group={type:'Feature',properties:{role:'network',access,transport,osmIds:[]},geometry:{type:'MultiLineString',coordinates:[]}};groups.set(key,group);}
    const line=displayLine(feature.geometry.coordinates);
    if(line.length>=2)group.geometry.coordinates.push(line);
    if(Number.isInteger(feature.properties.osmId))group.properties.osmIds!.push(feature.properties.osmId!);
  }
  for(const group of groups.values()){group.properties.osmIds=[...new Set(group.properties.osmIds)];features.push(group);}
  return {...coverage,features};
}

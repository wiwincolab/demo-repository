import type { Point } from './map.ts';

// Exact ray casting, indexed by latitude. Only edges crossing the point's
// latitude need testing; coordinates, holes and disjoint polygons stay intact.
export function indexRing(ring: Point[]) {
  let west = Infinity, south = Infinity, east = -Infinity, north = -Infinity;
  for (const [x, y] of ring) { west = Math.min(west,x!); south = Math.min(south,y!); east = Math.max(east,x!); north = Math.max(north,y!); }
  const count = Math.min(1024, Math.max(1, Math.ceil(Math.sqrt(ring.length))));
  const height = north - south;
  const band = (y: number) => Math.max(0,Math.min(count-1,Math.floor((y-south)/height*count)));
  const edges = Array.from({length:count}, () => [] as [Point,Point][]);
  if (height > 0) for (let i=0,j=ring.length-1;i<ring.length;j=i++) {
    const a=ring[i]!,b=ring[j]!;
    if (a[1] === b[1]) continue;
    const start=band(Math.min(a[1]!,b[1]!)),end=band(Math.max(a[1]!,b[1]!));
    for(let k=start;k<=end;k++)edges[k]!.push([a,b]);
  }
  return (point: Point) => {
    const [x,y]=point as [number,number];
    if (!height || x<west || x>east || y<south || y>north) return false;
    let inside=false;
    for(const [a,b] of edges[band(y)]!) {
      if ((a[1]!>y)!==(b[1]!>y) && x<(b[0]!-a[0]!)*(y-a[1]!)/(b[1]!-a[1]!)+a[0]!)inside=!inside;
    }
    return inside;
  };
}

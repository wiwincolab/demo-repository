import type { RevisitStop } from '../data/revisit.ts';
import aerial from '../data/revisit-aerial.json' with { type:'json' };
import regional from '../data/revisit-regional.json' with { type:'json' };
import { revisitLeg } from '../data/revisit.ts';
import { stickerKit } from '../data/creation-motifs.ts';
import { createRevisitRun } from './revisit-run.ts';

export type RevisitPreparation = { done: number; total: number; failed: number; active: boolean };
const revision = '?v=20261004b';
export const revisitRegionUrl = (url: string) => url + revision;
/** Prepare only this itinerary, not the entire image library or the entire world. */
export function revisitPreloadUrls(stops: RevisitStop[], asset: (path: string) => string) {
  const urls = new Set<string>();
  const tile = (coords: number[], zoom: number, radius: number, template: string) => {
    const scale = 2 ** zoom, latitude = coords[1]! * Math.PI / 180;
    const x = Math.floor((coords[0]! + 180) / 360 * scale);
    const y = Math.floor((1 - Math.asinh(Math.tan(latitude)) / Math.PI) / 2 * scale);
    for (let dx = -radius; dx <= radius; dx++) for (let dy = -radius; dy <= radius; dy++) {
      const ty = y + dy;
      if (ty < 0 || ty >= scale) continue;
      urls.add(template.replace('{z}', String(zoom)).replace('{x}', String((x + dx + scale) % scale)).replace('{y}', String(ty)));
    }
  };
  stops.forEach((stop, index) => {
    urls.add(asset(stop.source));
    stop.souvenirs.forEach(item => {
      urls.add(asset(item.image));
      if(item.kind==='sticker')urls.add(asset((item.kit || stickerKit({photoId:stop.id,image:item.image.replace('assets/memory/',''),location:stop.location,preset:true})).sheet));
    });
    aerial.find(sheet => sheet.id === stop.id)?.tiles.forEach(url => urls.add(asset(url)));
    regional.find(sheet => sheet.id === stop.id)?.tiles.forEach(url => urls.add(revisitRegionUrl(asset(url))));
    if(!aerial.some(sheet=>sheet.id===stop.id))for(let zoom=9;zoom<=14;zoom++)tile(stop.coords,zoom,1,'https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless_3857/default/g/{z}/{y}/{x}.jpg');
    // Destination elevation and a continuous low-resolution travel corridor.
    for (let zoom = 9; zoom <= 12; zoom++) tile(stop.coords, zoom, 1, 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png');
    const leg = revisitLeg(stop, stops[index - 1]);
    for (let step = 0; step <= 8; step++) {
      const t = step / 8;
      const point = leg ? [leg.from[0] + (leg.to[0] - leg.from[0]) * t, leg.from[1] + (leg.to[1] - leg.from[1]) * t + (leg.vehicle === 'plane' ? Math.sin(t * Math.PI) * 1.3 : 0)] : stop.coords;
      for (let zoom = 5; zoom <= 8; zoom++) tile(point, zoom, 1, 'https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless_3857/default/g/{z}/{y}/{x}.jpg');
      for(let zoom=leg?.vehicle==='plane'?4:8;zoom<=(leg?.vehicle==='plane'?6:12);zoom++)tile(point,zoom,1,'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png');
    }
  });
  return [...urls];
}

/** Bounded downloads, fully consumed bodies, shared browser cache; no decoded image pile in RAM. */
export async function preloadRevisitAssets(urls: string[], run: ReturnType<typeof createRevisitRun>, progress: (value: RevisitPreparation) => void, fetcher: typeof fetch = fetch, concurrency = 6) {
  const queue = [...new Set(urls)], controller = new AbortController();
  const release = run.own(() => controller.abort());
  let cursor = 0, done = 0, failed = 0;
  const report = () => progress({ done, total: queue.length, failed, active: run.active && done < queue.length });
  report();
  await Promise.all(Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
    while (run.active && cursor < queue.length) {
      const url = queue[cursor++]!;
      const request = new AbortController(), abort = () => request.abort();
      controller.signal.addEventListener('abort', abort, { once: true });
      const deadline = setTimeout(abort, 12000);
      try {
        const response = await fetcher(url, { cache: 'force-cache', signal: request.signal });
        if (!response.ok) throw new Error(String(response.status));
        await response.arrayBuffer();
      } catch { if (run.active) failed++; }
      finally { clearTimeout(deadline); controller.signal.removeEventListener('abort', abort); }
      if (!run.active) break;
      done++; report();
    }
  }));
  release();
  return run.active && failed === 0;
}

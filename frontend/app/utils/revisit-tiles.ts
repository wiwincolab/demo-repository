import { createRevisitRun } from './revisit-run.ts';

type TileMap = {
  isSourceLoaded(id: string): boolean;
  on(event: string, listener: () => void): unknown;
  off(event: string, listener: () => void): unknown;
};
/** Wait only for the destination's imagery, with a bounded, cancellable deadline. */
export function waitForRevisitTiles(map: TileMap, sources: string[], run: ReturnType<typeof createRevisitRun>, timeout = 1400): Promise<boolean> {
  if (!run.active) return Promise.resolve(false);
  return new Promise(resolve => {
    let done = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let release = () => {};
    const finish = (ready: boolean) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      map.off('sourcedata', check); map.off('idle', check);
      release(); resolve(ready);
    };
    const check = () => {
      if (sources.every(id => map.isSourceLoaded(id))) finish(true);
    };
    release = run.own(() => finish(false));
    map.on('sourcedata', check); map.on('idle', check);
    timer = setTimeout(() => finish(false), timeout);
    check();
  });
}

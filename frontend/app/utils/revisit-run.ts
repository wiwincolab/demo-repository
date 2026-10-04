/** One owner for camera, vehicle and arrival callbacks. A superseded leg cannot arrive. */
export function createRevisitRun() {
  let active = true;
  const cleanups = new Set<() => void>();
  return {
    get active() { return active; },
    own(cleanup: () => void) { if (active) cleanups.add(cleanup); else cleanup(); return () => cleanups.delete(cleanup); },
    cancel() { if (!active) return; active = false; cleanups.forEach(cleanup => cleanup()); cleanups.clear(); },
    wait(milliseconds: number): Promise<boolean> {
      if (!active) return Promise.resolve(false);
      return new Promise(resolve => {
        const stop = () => { clearTimeout(timer); resolve(false); };
        const timer = setTimeout(() => { cleanups.delete(stop); resolve(active); }, milliseconds);
        cleanups.add(stop);
      });
    },
  };
}

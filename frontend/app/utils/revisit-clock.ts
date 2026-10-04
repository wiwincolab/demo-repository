/** Elapsed time advances only while the photo is visible and no interaction is holding it. */
export function advanceRevisitClock(remaining: number, elapsed: number, running: boolean): number {
  return running ? Math.max(0, remaining - Math.max(0, elapsed)) : remaining;
}

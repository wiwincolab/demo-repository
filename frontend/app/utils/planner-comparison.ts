import type { Stop } from '../types/trip.ts';

export type PlanChange = { id: number; name: string; kind: 'added' | 'removed' | 'adjusted'; details: string[] };

export function planChanges(before: Stop[], after: Stop[]): PlanChange[] {
  const previous = new Map(before.map((stop, index) => [stop.id, { stop, index }]));
  const nextIds = new Set(after.map(stop => stop.id));
  const changes: PlanChange[] = [];
  after.forEach((stop, index) => {
    const old = previous.get(stop.id);
    if (!old) {
      changes.push({ id: stop.id, name: stop.name, kind: 'added', details: [`加入第 ${index + 1} 站 · ${stop.time}`] });
      return;
    }
    const details: string[] = [];
    if (old.stop.time !== stop.time) details.push(`時間 ${old.stop.time} → ${stop.time}`);
    if (old.index !== index) details.push(`順序 第 ${old.index + 1} 站 → 第 ${index + 1} 站`);
    if (old.stop.stay !== stop.stay) details.push(`停留 ${old.stop.stay} → ${stop.stay}`);
    if (details.length) changes.push({ id: stop.id, name: stop.name, kind: 'adjusted', details });
  });
  before.forEach(stop => {
    if (!nextIds.has(stop.id)) changes.push({ id: stop.id, name: stop.name, kind: 'removed', details: ['從這一天移除'] });
  });
  return changes;
}

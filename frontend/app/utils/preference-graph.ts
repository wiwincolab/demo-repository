import type { PlannerKeywordId } from '../data/planner-preferences.ts';
import { memoryCategories, isPlannerCategory, validPersonalPreferences, type MemoryCategoryId, type PersonalPreference } from './preference-memory.ts';

export interface PreferenceNode {
  id: string;
  title: string;
  kind: 'profile' | 'keyword' | 'topic';
  keywordId?: PlannerKeywordId;
  categoryId?: MemoryCategoryId;
  personal?: boolean;
  avoid?: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
}
export interface PreferenceLink { source: string; target: string }
export const preferenceGraphStorageKey = 'chictrip-preference-graph-v1';
export interface PreferenceGraphEdits { labels: Record<string, string>; hiddenIds: string[]; preferences: PersonalPreference[] }
// These branches describe each preference; they are not inferred travel history.
const topics: Record<MemoryCategoryId, string[]> = {
  food: ['咖啡店', '甜點', '小吃'],
  nature: ['河岸', '公園', '湖景'],
  culture: ['老街', '寺廟', '展覽'],
  play: ['主題樂園', '手作', '體驗活動'],
  shopping: ['商場', '商店街', '市場'],
  style: ['步調', '交通', '住宿'],
  other: [],
};
export function createPreferenceGraph(preferences: PersonalPreference[] = []) {
  const nodes: PreferenceNode[] = [{ id: 'profile', title: '我的吉祥物', kind: 'profile', x: 0, y: 0, vx: 0, vy: 0 }];
  const links: PreferenceLink[] = [];
  memoryCategories.forEach((keyword, index) => {
    const angle = -Math.PI / 2 + index * Math.PI * 2 / memoryCategories.length;
    const keywordId = isPlannerCategory(keyword.id) ? keyword.id : undefined;
    const x = Math.cos(angle) * 140, y = Math.sin(angle) * 115;
    nodes.push({ id: keyword.id, title: keyword.title, kind: 'keyword', keywordId, categoryId: keyword.id, x, y, vx: 0, vy: 0 });
    links.push({ source: 'profile', target: keyword.id });
    topics[keyword.id].forEach((title, i) => {
      const a = angle + (i - 1) * .62;
      const id = `${keyword.id}-${i}`;
      nodes.push({ id, title, kind: 'topic', keywordId, categoryId: keyword.id, x: x + Math.cos(a) * 76, y: y + Math.sin(a) * 66, vx: 0, vy: 0 });
      links.push({ source: keyword.id, target: id });
    });
    preferences.filter(preference => preference.categoryId === keyword.id).forEach((preference, i) => {
      const a = angle + (i % 5 - 2) * .38, radius = 105 + Math.floor(i / 5) * 28;
      nodes.push({ id: preference.id, title: preference.label, kind: 'topic', keywordId, categoryId: keyword.id, personal: true, avoid: preference.polarity === 'avoid', x: x + Math.cos(a) * radius, y: y + Math.sin(a) * radius * .86, vx: 0, vy: 0 });
      links.push({ source: keyword.id, target: preference.id });
    });
  });
  return { nodes, links };
}

export function validPreferenceGraphEdits(value: unknown): PreferenceGraphEdits {
  const result: PreferenceGraphEdits = { labels: {}, hiddenIds: [], preferences: [] };
  if (!value || typeof value !== 'object') return result;
  const source = value as Partial<PreferenceGraphEdits>;
  result.preferences = validPersonalPreferences(source.preferences);
  const ids = new Set(createPreferenceGraph(result.preferences).nodes.map(n => n.id));
  if (source.labels && typeof source.labels === 'object') {
    for (const [id, title] of Object.entries(source.labels)) {
      if (ids.has(id) && typeof title === 'string' && title.trim()) result.labels[id] = title.trim().slice(0, 16);
    }
  }
  if (Array.isArray(source.hiddenIds)) result.hiddenIds = [...new Set(source.hiddenIds.filter(id => ids.has(id) && id !== 'profile'))];
  return result;
}

// A small deterministic force layout: springs along real links, repulsion between
// nodes and a weak pull toward each branch. No decorative/random relationships.
export function stepPreferenceGraph(nodes: PreferenceNode[], links: PreferenceLink[], pinned?: string) {
  const byId = new Map(nodes.map(node => [node.id, node]));
  nodes.forEach((a, i) => {
    nodes.slice(i + 1).forEach(b => {
      let dx = a.x - b.x, dy = a.y - b.y;
      if (Math.abs(dx) + Math.abs(dy) < .01) { dx = .1; dy = .1; }
      const length = Math.max(10, Math.hypot(dx, dy));
      const force = Math.min(2, 360 / (length * length));
      a.vx += dx / length * force; a.vy += dy / length * force;
      b.vx -= dx / length * force; b.vy -= dy / length * force;
    });
  });
  links.forEach(link => {
    const a = byId.get(link.source), b = byId.get(link.target);
    if (!a || !b) return;
    const dx = b.x - a.x, dy = b.y - a.y, length = Math.max(1, Math.hypot(dx, dy));
    const ideal = b.kind === 'keyword' ? 136 : 76;
    const force = (length - ideal) * .008;
    a.vx += dx / length * force; a.vy += dy / length * force;
    b.vx -= dx / length * force; b.vy -= dy / length * force;
  });
  let energy = 0;
  nodes.forEach(node => {
    if (node.id === pinned || node.kind === 'profile') { node.vx = 0; node.vy = 0; return; }
    const branch = memoryCategories.findIndex(k => k.id === node.categoryId);
    const angle = -Math.PI / 2 + branch * Math.PI * 2 / memoryCategories.length;
    const radius = node.kind === 'keyword' ? 135 : node.personal ? 248 : 212;
    node.vx += (Math.cos(angle) * radius - node.x) * .0018;
    node.vy += (Math.sin(angle) * radius * .83 - node.y) * .0018;
    node.vx *= .82; node.vy *= .82;
    node.x += node.vx; node.y += node.vy;
    energy += Math.abs(node.vx) + Math.abs(node.vy);
  });
  return energy;
}

export type PreferencePositions = Map<string, { x: number; y: number }>;
export function preferencePositions(nodes: PreferenceNode[]): PreferencePositions {
  return new Map(nodes.map(node => [node.id, { x: node.x, y: node.y }]));
}

// Restore the settled arrangement after release, independent of how long the
// pointer was held. A time-based easing also works on slower display refreshes.
export function returnPreferenceGraph(nodes: PreferenceNode[], positions: PreferencePositions, elapsedMs: number) {
  const fraction = 1 - Math.exp(-Math.min(64, Math.max(0, elapsedMs)) / 125);
  let distance = 0;
  for (const node of nodes) {
    const home = positions.get(node.id);
    if (!home) continue;
    node.x += (home.x - node.x) * fraction;
    node.y += (home.y - node.y) * fraction;
    node.vx = 0; node.vy = 0;
    const remaining = Math.hypot(home.x - node.x, home.y - node.y);
    if (remaining < .05) { node.x = home.x; node.y = home.y; }
    else distance = Math.max(distance, remaining);
  }
  return distance;
}

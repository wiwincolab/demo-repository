import { plannerKeywords, type PlannerKeywordId } from '../data/planner-preferences.ts';

export interface PreferenceNode {
  id: string;
  title: string;
  kind: 'profile' | 'keyword' | 'topic';
  keywordId?: PlannerKeywordId;
  x: number;
  y: number;
  vx: number;
  vy: number;
}
export interface PreferenceLink { source: string; target: string }
export const preferenceGraphStorageKey = 'chictrip-preference-graph-v1';
export interface PreferenceGraphEdits { labels: Record<string, string>; hiddenIds: string[] }
// These branches describe each preference; they are not inferred travel history.
const topics: Record<PlannerKeywordId, string[]> = {
  food: ['咖啡店', '甜點', '小吃'],
  nature: ['河岸', '公園', '湖景'],
  culture: ['老街', '寺廟', '展覽'],
  play: ['主題樂園', '手作', '體驗活動'],
  shopping: ['商場', '商店街', '市場'],
};
export function createPreferenceGraph() {
  const nodes: PreferenceNode[] = [{ id: 'profile', title: '我的旅行', kind: 'profile', x: 0, y: 0, vx: 0, vy: 0 }];
  const links: PreferenceLink[] = [];
  plannerKeywords.forEach((keyword, index) => {
    const angle = -Math.PI / 2 + index * Math.PI * 2 / plannerKeywords.length;
    const x = Math.cos(angle) * 140, y = Math.sin(angle) * 115;
    nodes.push({ id: keyword.id, title: keyword.title, kind: 'keyword', keywordId: keyword.id, x, y, vx: 0, vy: 0 });
    links.push({ source: 'profile', target: keyword.id });
    topics[keyword.id].forEach((title, i) => {
      const a = angle + (i - 1) * .62;
      const id = `${keyword.id}-${i}`;
      nodes.push({ id, title, kind: 'topic', keywordId: keyword.id, x: x + Math.cos(a) * 76, y: y + Math.sin(a) * 66, vx: 0, vy: 0 });
      links.push({ source: keyword.id, target: id });
    });
  });
  return { nodes, links };
}

export function validPreferenceGraphEdits(value: unknown): PreferenceGraphEdits {
  const result: PreferenceGraphEdits = { labels: {}, hiddenIds: [] };
  if (!value || typeof value !== 'object') return result;
  const source = value as Partial<PreferenceGraphEdits>;
  const ids = new Set(createPreferenceGraph().nodes.map(n => n.id));
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
    const branch = plannerKeywords.findIndex(k => k.id === node.keywordId);
    const angle = -Math.PI / 2 + branch * Math.PI * 2 / plannerKeywords.length;
    const radius = node.kind === 'keyword' ? 135 : 212;
    node.vx += (Math.cos(angle) * radius - node.x) * .0018;
    node.vy += (Math.sin(angle) * radius * .83 - node.y) * .0018;
    node.vx *= .82; node.vy *= .82;
    node.x += node.vx; node.y += node.vy;
    energy += Math.abs(node.vx) + Math.abs(node.vy);
  });
  return energy;
}

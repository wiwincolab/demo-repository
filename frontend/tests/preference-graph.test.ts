import test from 'node:test';
import assert from 'node:assert/strict';
import { createPreferenceGraph, stepPreferenceGraph, validPreferenceGraphEdits } from '../app/utils/preference-graph.ts';
import { plannerKeywords } from '../app/data/planner-preferences.ts';

test('preference branches belong to real keywords, including unremembered options', () => {
  const { nodes, links } = createPreferenceGraph();
  assert.equal(new Set(nodes.map(n => n.id)).size, nodes.length);
  assert.deepEqual(nodes.filter(n => n.kind === 'keyword').map(n => n.id), plannerKeywords.map(k => k.id));
  const byId = new Map(nodes.map(n => [n.id, n]));
  for (const link of links) {
    const a = byId.get(link.source)!, b = byId.get(link.target)!;
    assert.ok(a && b);
    if (b.kind === 'topic') assert.equal(b.keywordId, a.id);
    else assert.equal(a.id, 'profile');
  }
});

test('layout settles with finite coordinates, spaced nodes and a fixed profile', () => {
  const a = createPreferenceGraph(), b = createPreferenceGraph();
  for (let i = 0; i < 300; i++) {
    stepPreferenceGraph(a.nodes, a.links);
    stepPreferenceGraph(b.nodes, b.links);
  }
  assert.deepEqual(a.nodes, b.nodes);
  assert.equal(a.nodes[0]!.x, 0);
  assert.equal(a.nodes[0]!.y, 0);
  a.nodes.forEach((node, i) => {
    assert.ok(Number.isFinite(node.x) && Number.isFinite(node.y));
    assert.ok(Math.abs(node.x) < 280 && Math.abs(node.y) < 250);
    a.nodes.slice(i + 1).forEach(other => assert.ok(Math.hypot(node.x - other.x, node.y - other.y) > 40));
  });
});

test('dragged nodes remain pinned while connected nodes adjust', () => {
  const graph = createPreferenceGraph();
  const node = graph.nodes.find(n => n.id === 'food')!;
  node.x = 70; node.y = -80;
  const before = graph.nodes.find(n => n.id === 'food-0')!.x;
  for (let i = 0; i < 30; i++) stepPreferenceGraph(graph.nodes, graph.links, 'food');
  assert.equal(node.x, 70);
  assert.equal(node.y, -80);
  assert.notEqual(graph.nodes.find(n => n.id === 'food-0')!.x, before);
});

test('saved edits reject unknown nodes, blank labels and deletion of the profile', () => {
  assert.deepEqual(validPreferenceGraphEdits(null), { labels: {}, hiddenIds: [] });
  assert.deepEqual(validPreferenceGraphEdits({
    labels: { food: '  咖啡散步  ', 'food-0': ' ', nature: 12, unknown: '不存在' },
    hiddenIds: ['food', 'food', 'food-1', 'profile', 'unknown', 12],
  }), { labels: { food: '咖啡散步' }, hiddenIds: ['food', 'food-1'] });
});

test('recovering nodes preserves edited names and accepts only short display labels', () => {
  const saved = validPreferenceGraphEdits({ labels: { culture: '12345678901234567890' }, hiddenIds: ['culture'] });
  assert.equal(saved.labels.culture, '1234567890123456');
  assert.deepEqual(validPreferenceGraphEdits({ ...saved, hiddenIds: [] }), { labels: saved.labels, hiddenIds: [] });
});

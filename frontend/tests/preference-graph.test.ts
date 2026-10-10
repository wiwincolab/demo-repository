import test from 'node:test';
import assert from 'node:assert/strict';
import { createPreferenceGraph, preferencePositions, returnPreferenceGraph, stepPreferenceGraph, validPreferenceGraphEdits } from '../app/utils/preference-graph.ts';
import { memoryCategories } from '../app/utils/preference-memory.ts';

test('preference branches belong to real keywords, including unremembered options', () => {
  const { nodes, links } = createPreferenceGraph();
  assert.equal(new Set(nodes.map(n => n.id)).size, nodes.length);
  assert.deepEqual(nodes.filter(n => n.kind === 'keyword').map(n => n.id), memoryCategories.map(k => k.id));
  const byId = new Map(nodes.map(n => [n.id, n]));
  for (const link of links) {
    const a = byId.get(link.source)!, b = byId.get(link.target)!;
    assert.ok(a && b);
    if (b.kind === 'topic') assert.equal(b.categoryId, a.id);
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

test('a long-held node returns to the exact arrangement after release, at different frame rates', () => {
  for (const frameMs of [16.7, 33.3]) {
    const graph = createPreferenceGraph();
    for (let i = 0; i < 240; i++) stepPreferenceGraph(graph.nodes, graph.links);
    const home = preferencePositions(graph.nodes);
    const node = graph.nodes.find(node => node.id === 'food')!;
    node.x += 110; node.y -= 60;
    for (let i = 0; i < 180; i++) stepPreferenceGraph(graph.nodes, graph.links, node.id);
    const displaced = Math.hypot(node.x - home.get(node.id)!.x, node.y - home.get(node.id)!.y);
    const first = returnPreferenceGraph(graph.nodes, home, frameMs);
    assert.ok(first > 0 && first < displaced);
    for (let i = 0; i < 100; i++) returnPreferenceGraph(graph.nodes, home, frameMs);
    assert.deepEqual(preferencePositions(graph.nodes), home);
  }
});

test('dragging the mascot moves its connections, then restores the center and every branch', () => {
  const graph = createPreferenceGraph();
  for (let i = 0; i < 240; i++) stepPreferenceGraph(graph.nodes, graph.links);
  const home = preferencePositions(graph.nodes);
  const mascot = graph.nodes.find(node => node.id === 'profile')!;
  mascot.x = 100; mascot.y = -45;
  for (let i = 0; i < 180; i++) stepPreferenceGraph(graph.nodes, graph.links, mascot.id);
  assert.equal(mascot.x, 100);
  assert.notEqual(graph.nodes.find(node => node.id === 'food')!.x, home.get('food')!.x);
  for (let i = 0; i < 100; i++) returnPreferenceGraph(graph.nodes, home, 16.7);
  assert.equal(mascot.x, 0); assert.equal(mascot.y, 0);
  assert.deepEqual(preferencePositions(graph.nodes), home);
});

test('saved edits reject unknown nodes, blank labels and deletion of the profile', () => {
  assert.deepEqual(validPreferenceGraphEdits(null), { labels: {}, hiddenIds: [], preferences: [] });
  assert.deepEqual(validPreferenceGraphEdits({
    labels: { food: '  咖啡散步  ', 'food-0': ' ', nature: 12, unknown: '不存在' },
    hiddenIds: ['food', 'food', 'food-1', 'profile', 'unknown', 12],
  }), { labels: { food: '咖啡散步' }, hiddenIds: ['food', 'food-1'], preferences: [] });
});

test('recovering nodes preserves edited names and accepts only short display labels', () => {
  const saved = validPreferenceGraphEdits({ labels: { culture: '12345678901234567890' }, hiddenIds: ['culture'] });
  assert.equal(saved.labels.culture, '1234567890123456');
  assert.deepEqual(validPreferenceGraphEdits({ ...saved, hiddenIds: [] }), { labels: saved.labels, hiddenIds: [], preferences: [] });
});

test('personal memories attach to their chosen branch and survive edit validation', () => {
  const preferences = [
    { id: 'personal-coffee', label: '抹茶', categoryId: 'food' as const, polarity: 'like' as const, evidence: '我喜歡抹茶' },
    { id: 'personal-crowds', label: '人多的地方', categoryId: 'style' as const, polarity: 'avoid' as const, evidence: '不喜歡人多的地方' },
  ];
  const graph = createPreferenceGraph(preferences);
  assert.equal(graph.nodes.find(node => node.id === 'personal-crowds')?.avoid, true);
  assert.ok(graph.links.some(link => link.source === 'style' && link.target === 'personal-crowds'));
  assert.ok(graph.links.some(link => link.source === 'food' && link.target === 'personal-coffee'));
  const saved = validPreferenceGraphEdits({ preferences, labels: { 'personal-coffee': '每日抹茶' }, hiddenIds: ['personal-crowds'] });
  assert.deepEqual(saved.preferences, preferences);
  assert.equal(saved.labels['personal-coffee'], '每日抹茶');
  assert.deepEqual(saved.hiddenIds, ['personal-crowds']);
  const removed = validPreferenceGraphEdits({ ...saved, preferences: [] });
  assert.deepEqual(removed.labels, {});
  assert.deepEqual(removed.hiddenIds, []);
});

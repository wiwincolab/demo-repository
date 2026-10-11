import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const root = new URL('../public/demos/travel-town/', import.meta.url);
const html = readFileSync(new URL('index.html', root), 'utf8');
const hash = (bytes: string | Buffer) => createHash('sha256').update(bytes).digest('hex').slice(0, 12);

test('town runtime URLs change when an editor, animation, sky or stylesheet changes', () => {
  for (const file of ['chictrip.css', 'sky-core.js', 'town-astronomy.js', 'town-editor.js', 'walker-paths.js', 'town-walkers.js']) {
    const bytes = readFileSync(new URL(file, root));
    const dot = file.lastIndexOf('.');
    const runtime = `runtime/${file.slice(0, dot)}.${hash(bytes)}${file.slice(dot)}`;
    assert.ok(html.includes(`"./${runtime}"`), `run node scripts/version-town-assets.mjs after changing ${file}`);
    assert.deepEqual(readFileSync(new URL(runtime, root)), bytes);
  }
});

test('the iframe URL changes with its standalone HTML so old cached loaders are replaced', () => {
  const page = readFileSync(new URL('../app/pages/town.vue', import.meta.url), 'utf8');
  assert.ok(page.includes(`demos/travel-town/index.html?v=${hash(html)}`));
});

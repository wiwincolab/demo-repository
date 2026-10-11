// Give mutable town assets content-specific URLs so browser/CDN caches cannot
// keep an earlier editor or stylesheet after a deployment.
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { basename, extname } from 'node:path';

const town = new URL('../public/demos/travel-town/', import.meta.url);
const runtime = new URL('runtime/', town);
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex').slice(0, 12);
const files = ['chictrip.css', 'sky-core.js', 'town-astronomy.js', 'town-editor.js', 'walker-paths.js', 'town-walkers.js'];
await mkdir(runtime, { recursive: true });
let html = await readFile(new URL('index.html', town), 'utf8');
for (const file of files) {
  const bytes = await readFile(new URL(file, town));
  const extension = extname(file), stem = basename(file, extension);
  const versioned = `${stem}.${hash(bytes)}${extension}`;
  const match = new RegExp(`(href|src)="\\./(?:runtime/)?${stem.replaceAll('.', '\\.')}(?:\\.[a-f0-9]{12})?\\${extension}(?:\\?[^\"]*)?"`, 'g');
  if ([...html.matchAll(match)].length !== 1) throw new Error(`Expected one reference to ${file}`);
  html = html.replace(match, `$1="./runtime/${versioned}"`);
  await writeFile(new URL(versioned, runtime), bytes);
}
await writeFile(new URL('index.html', town), html);
const page = new URL('../app/pages/town.vue', import.meta.url);
let vue = await readFile(page, 'utf8');
const frame = /demos\/travel-town\/index\.html(?:\?v=[a-f0-9]{12})?/g;
if ([...vue.matchAll(frame)].length !== 1) throw new Error('Expected one town iframe URL');
vue = vue.replace(frame, `demos/travel-town/index.html?v=${hash(html)}`);
await writeFile(page, vue);
console.log('Town runtime URLs updated from asset contents.');

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { parse, NodeTypes } from '@vue/compiler-dom';
import { esimProducts } from '../../app/data/esim-store.ts';

const text = node => node.type === NodeTypes.TEXT ? node.content : (node.children || []).map(text).join('');
function walk(node, visit) {
  visit(node);
  for (const child of node.children || []) walk(child, visit);
}
const products = {};
for (const product of esimProducts) {
  const html = await readFile(`/tmp/chictrip-esim-public-${product.id}.html`, 'utf8');
  const groups = {};
  let startingPrice;
  let name;
  let image;
  // Public HTML can omit closing tags that Vue templates normally require.
  const ast = parse(html, { whitespace: 'preserve', onError: error => { if (error.code !== 24 && error.code !== 23) throw error; } });
  walk(ast, node => {
    if (node.type !== NodeTypes.ELEMENT) return;
    if (node.tag === 'h1') name = text(node).trim();
    if (!image && node.tag === 'img') {
      const src = node.props.find(prop => prop.name === 'src')?.value?.content;
      if (src?.includes('/ecommerce/')) image = src;
    }
    if (node.tag === 'div') {
      const label = node.children.find(child => child.type === NodeTypes.ELEMENT && child.tag === 'p');
      const buttons = node.children.filter(child => child.type === NodeTypes.ELEMENT && child.tag === 'button');
      if (label && buttons.length) groups[text(label).trim()] = buttons.map(button => text(button).trim());
    }
    if (startingPrice === undefined && node.tag === 'data' && node.props.some(prop => prop.name === 'itemprop' && prop.value?.content === 'lowPrice')) {
      startingPrice = Number(node.props.find(prop => prop.name === 'value')?.value?.content);
    }
  });
  const volumes = groups['規格'];
  const carriers = groups['電信商'];
  const days = groups['使用天數']?.map(value => Number.parseInt(value, 10)).sort((a, b) => a - b);
  if (name !== product.name || !image?.includes(`/ecommerce/${product.id}/`)) {
    throw new Error(`Public page content does not match product: ${product.source}`);
  }
  if (!volumes?.length || !carriers?.length || !days?.length || days.some(day => !Number.isFinite(day))) {
    throw new Error(`Missing public product specifications: ${product.source}`);
  }
  if (startingPrice !== product.price) throw new Error(`Starting price changed: ${product.name}: ${startingPrice}`);
  products[`${product.destinationCode}/${product.kind}`] = { volumes, carriers, days };
}
const output = fileURLToPath(new URL('../../app/data/esim-store-specs.json', import.meta.url));
await writeFile(output, JSON.stringify({ checkedAt: '2026-10-10', products }, null, 2) + '\n');
console.log(`Verified ${Object.keys(products).length} public product pages and starting prices.`);

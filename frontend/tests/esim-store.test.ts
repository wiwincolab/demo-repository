import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { esimProducts, esimDestinations, esimProductSpecs } from '../app/data/esim-store.ts';
import images from '../public/assets/esim/sources.json' with { type: 'json' };

test('all 61 official products have their own local image, source and full specifications', () => {
  assert.equal(esimProducts.length, 61);
  assert.equal(new Set(esimProducts.map(p => p.id)).size, 61);
  assert.equal(esimDestinations.length, 32);
  assert.equal(Object.keys(esimProductSpecs).length, 61);
  for (const product of esimProducts) {
    const source = new URL(product.source);
    assert.equal(source.hostname, 'www.chictrip.com.tw');
    assert.equal(source.pathname, `/esim/${product.destinationCode}/${product.kind}`);
    assert.ok(product.price > 0 && product.price < product.originalPrice);
    const specification = esimProductSpecs[`${product.destinationCode}/${product.kind}`]!;
    assert.ok(specification.volumes.length && specification.carriers.length && specification.days.length);
    assert.ok(specification.days.every(day => Number.isInteger(day) && day > 0));
    assert.deepEqual(specification.days, [...new Set(specification.days)].sort((a, b) => a - b));
    const provenance = images.images.find(image => image.id === product.id);
    assert.ok(provenance?.source.includes(`/ecommerce/${product.id}/`));
    const bytes = readFileSync(new URL(`../public/${product.image}`, import.meta.url));
    assert.ok(bytes.length > 1000);
    assert.equal(bytes.subarray(0, 3).toString('hex'), 'ffd8ff');
  }
});

test('country-specific and total-data products retain their official option differences', () => {
  assert.deepEqual([...esimProductSpecs['japan/unlimited']!.volumes].sort(), ['標準吃到飽', '鈦金吃到飽', '高速吃到飽'].sort());
  assert.ok(esimProductSpecs['korea/unlimited']!.days.includes(90));
  assert.ok(esimProductSpecs['vietnam/daily-data']!.volumes.includes('7GB'));
  assert.deepEqual(esimProductSpecs['japan-korea/daily-data']!.days, [1, 2, 3, 4, 5]);
  assert.deepEqual(esimProductSpecs['maldives/fixed-data']!.volumes, ['20GB', '30GB']);
  assert.equal(esimProducts.find(p => p.destinationCode === 'maldives')!.price, 1783);
});

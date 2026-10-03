import test from 'node:test';
import assert from 'node:assert/strict';
import { esimPlan, esimQuote, rewardPreview } from '../app/utils/esim.ts';

test('trip duration changes total allowance and recommended need together', () => {
  const short = esimPlan('normal', 2), long = esimPlan('normal', 5);
  assert.equal(short.totalGB, 4);
  assert.equal(long.totalGB, 10);
  assert.equal(short.range, '2–4');
  assert.equal(long.range, '5–8');
  for (const mode of ['light', 'normal', 'heavy'] as const) {
    const plan = esimPlan(mode, 5);
    assert.ok(plan.totalGB >= plan.high);
    assert.ok(plan.low <= plan.high);
  }
});

test('checkout counts the new buyer once; existing purchases never double count', () => {
  assert.equal(esimQuote(299, 2).total, 299);
  assert.equal(esimQuote(299, 3).total, 279);
  assert.equal(esimQuote(299, 3, true).total, 299);
  assert.equal(esimQuote(299, 4, true).total, 279);
  assert.equal(esimQuote(199, 3).total, 179);
});

test('settlement balances allowance and caps points independent of package size', () => {
  for (const capacity of [2,4,5,10,25]) {
    const result = rewardPreview(capacity);
    assert.equal(Math.round((result.usedGB + result.remainingGB) * 10) / 10, capacity);
    assert.ok(result.points <= 30);
    assert.equal(result.points, Math.min(30, Math.floor(result.remainingGB * 10)));
  }
});

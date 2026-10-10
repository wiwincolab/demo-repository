import { test } from 'node:test';
import assert from 'node:assert/strict';
import { passBenefitPlaces, benefitsForPass, benefitLocationFrame } from '../app/data/pass-benefits.ts';
import { findTravelPass } from '../app/data/travel-passes.ts';
import { pointInPolygon } from '../app/utils/map.ts';

test('合作設施必須有確認座標與官方來源，不能用範圍推定優惠', () => {
  assert.equal(new Set(passBenefitPlaces.map(p => p.id)).size, passBenefitPlaces.length);
  for (const p of passBenefitPlaces) {
    assert.ok(p.name && p.note && p.checkedAt);
    assert.ok(p.at.length === 2 && p.at.every(Number.isFinite));
    assert.ok(p.at[0]! > 119 && p.at[0]! < 147 && p.at[1]! > 21 && p.at[1]! < 46);
    assert.match(p.source, /^https:\/\//);
    assert.match(p.positionSource, /^https:\/\//);
    assert.ok(['included', 'discount', 'choice'].includes(p.benefit));
    p.passIds.forEach(id => assert.ok(findTravelPass(id), `${p.name}: ${id}`));
  }
  assert.deepEqual(benefitsForPass(), []);
  assert.deepEqual(benefitsForPass('tokyo-subway'), []);
  assert.deepEqual(benefitsForPass('tmoney-travel'), []);
});
test('同一景點於不同票券方案的優惠不可混用', () => {
  const busan = benefitsForPass('visit-busan').find(p => p.name === '慶州世界');
  const ktour = benefitsForPass('k-tour-1').find(p => p.name === '慶州世界');
  assert.equal(busan?.benefit, 'discount');
  assert.equal(ktour?.benefit, 'choice');
  assert.deepEqual(busan?.at, ktour?.at);
  assert.ok(benefitsForPass('k-tour-1').every(p => p.benefit === 'choice'));
  assert.ok(!benefitsForPass('k-tour-1').some(p => p.name.includes('金海機場店') || p.name.includes('統營')));
});
test('入場時段、分組和暫停開放保留在景點詳情', () => {
  assert.match(benefitsForPass('osaka-amazing').find(p => p.id === 'osaka-free-1')!.note, /15:00/);
  assert.equal(benefitsForPass('osaka-amazing').find(p => p.id === 'osaka-free-4')!.status, 'temporarily-closed');
  assert.match(benefitsForPass('discover-seoul').find(p => p.id === 'seoul-52')!.note, /三選一/);
  assert.ok(benefitsForPass('taipei-unlimited').some(p => p.name.includes('101')));
  assert.ok(!benefitsForPass('osaka-amazing').some(p => p.name.includes('OSAKA WHEEL')));
});
test('合作設施定位框不能變成整座城市的免費範圍', () => {
  const at = [121.5648,25.0335], frame = benefitLocationFrame(at);
  assert.ok(pointInPolygon(at, frame));
  assert.ok(!pointInPolygon([121.58,25.03], frame));
});

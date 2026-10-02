import test from 'node:test';
import assert from 'node:assert/strict';
import { groupPrice, unusedChips, isMemberList } from '../app/utils/commerce.ts';
test('joining the trip alone never unlocks a purchase discount', () => {
    const members = Array.from({ length: 8 }, (_, i) => ({ name: 'Member ' + i, paid: false, price: 299 }));
    assert.deepEqual(groupPrice(members), { count: 0, base: 0, saving: 0, total: 0 });
});
test('discount threshold uses paid members, including mixed plan prices', () => {
    const members = [199, 299, 499, 299].map((price, i) => ({ name: String(i), paid: true, price }));
    assert.equal(groupPrice(members.slice(0, 3)).saving, 0);
    assert.deepEqual(groupPrice(members), { count: 4, base: 1296, saving: 80, total: 1216 });
    assert.equal(groupPrice([...members, { name: 'Invited', paid: false, price: 299 }]).total, 1216);
});
test('unused data feedback respects lower bound and reward cap', () => {
    assert.equal(unusedChips(-1), 0);
    assert.equal(unusedChips(2), 20);
    assert.equal(unusedChips(3), 30);
    assert.equal(unusedChips(10), 30);
});
test('restored storage cannot forge purchase prices or oversized groups', () => {
    assert.equal(isMemberList([{ name: '小安', paid: false, price: 299 }]), true);
    for (const invalid of [null, [], [{ name: 'Test', paid: true, price: -1 }], [{ name: 'Test', paid: 'yes', price: 299 }], Array(9).fill({ name: 'Test', paid: false, price: 299 })])
        assert.equal(isMemberList(invalid), false);
});

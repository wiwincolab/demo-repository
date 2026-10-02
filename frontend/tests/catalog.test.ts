import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { memoryCatalog } from '../app/data/memory-catalog.ts';
const spec = JSON.parse(readFileSync(new URL('../app/data/memory-formats.json', import.meta.url), 'utf8'));
test('all six preview styles have a generation contract and local image', () => {
    assert.equal(memoryCatalog.length, 6);
    assert.equal(new Set(memoryCatalog.map(s => s.id)).size, 6);
    for (const style of memoryCatalog) {
        const format = spec.formats.find((f: {
            id: string;
        }) => f.id === style.formatId);
        assert.ok(format, style.id + ' must point to a valid generation format');
        assert.ok(format.promptTemplate.length > 100);
        assert.ok(existsSync(new URL('../public/assets/memory/' + style.image, import.meta.url)));
    }
});

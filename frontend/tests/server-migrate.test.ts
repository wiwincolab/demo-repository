import test from 'node:test';
import assert from 'node:assert/strict';
import { pendingMigrations } from '../server/utils/migrate.ts';
import { migrations } from '../server/utils/migrations.ts';

test('only migrations not yet applied run, in name order', () => {
    assert.deepEqual(pendingMigrations(['001_init'], ['002_shares', '001_init', '003_bingo']), ['002_shares', '003_bingo']);
    assert.deepEqual(pendingMigrations(['001_init'], ['001_init']), []);
});

test('migration names are unique and ordered', () => {
    const names = migrations.map(m => m.name);
    assert.equal(new Set(names).size, names.length);
    assert.deepEqual([...names].sort(), names);
    for (const name of names) assert.match(name, /^\d{3}_[a-z0-9_]+$/);
});

test('the first migration creates the three base tables', () => {
    const sql = migrations[0]!.sql;
    for (const table of ['devices', 'photos', 'creations']) assert.match(sql, new RegExp(`create table ${table} \\(`));
});

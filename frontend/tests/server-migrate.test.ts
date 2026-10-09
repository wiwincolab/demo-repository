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

test('dropping creations first deletes the generated images it points to, and leaves photos alone', async () => {
    const { mkdtemp, mkdir, writeFile, access } = await import('node:fs/promises');
    const { tmpdir } = await import('node:os');
    const { join } = await import('node:path');
    const root = await mkdtemp(join(tmpdir(), 'chictrip-media-'));
    await mkdir(join(root, '2026/10'), { recursive: true });
    await writeFile(join(root, '2026/10/generated.png'), 'x');
    await writeFile(join(root, '2026/10/photo.jpg'), 'x');
    const drop = migrations.find(m => m.name === '006_drop_creations')!;
    assert.equal(drop.sql.trim(), 'drop table creations;');
    const previous = process.env.MEDIA_DIR;
    process.env.MEDIA_DIR = root;
    try {
        // 假的交易：只回 creations 裡有 media_path 的那一筆；第二筆指向已經不在的檔案，不能讓 migration 失敗
        const tx = (async () => [{ media_path: '2026/10/generated.png' }, { media_path: '2026/09/missing.png' }]) as never;
        await drop.before!(tx);
    } finally {
        if (previous === undefined) delete process.env.MEDIA_DIR; else process.env.MEDIA_DIR = previous;
    }
    await assert.rejects(access(join(root, '2026/10/generated.png')));
    await access(join(root, '2026/10/photo.jpg'));
});

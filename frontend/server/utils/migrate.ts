import type { Sql } from 'postgres';
import { migrations } from './migrations.ts';

export function pendingMigrations(applied: string[], names: string[]): string[] {
    const done = new Set(applied);
    return [...names].sort().filter(name => !done.has(name));
}

// api 與 worker 同時啟動會同時跑到這裡：advisory lock 讓後到的等前一個做完，再看到已套用的紀錄
export async function migrate(sql: Sql) {
    await sql.begin(async tx => {
        await tx`select pg_advisory_xact_lock(726154)`;
        await tx`create table if not exists schema_migrations (name text primary key, applied_at timestamptz not null default now())`;
        const applied = (await tx<{ name: string }[]>`select name from schema_migrations`).map(row => row.name);
        for (const name of pendingMigrations(applied, migrations.map(m => m.name))) {
            const migration = migrations.find(m => m.name === name)!;
            await migration.before?.(tx);
            await tx.unsafe(migration.sql);
            await tx`insert into schema_migrations (name) values (${name})`;
        }
    });
}

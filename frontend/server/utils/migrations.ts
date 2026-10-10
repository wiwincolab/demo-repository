import { rm } from 'node:fs/promises';
import { join } from 'node:path';
import type { TransactionSql } from 'postgres';
import { readConfig } from './config.ts';

// 資料表的每一次改版，依名稱順序套用、套過的不再跑（server/utils/migrate.ts）。
// 只能往後加新的一筆，不能改已經上線的：評審留下的照片與作品不能因為改版被清掉，所以不學 MEDDEMO 指紋不同就重灌。
// SQL 寫成字串跟著伺服器一起打包，部署時不必另外複製 .sql 檔。
// before：同一個交易裡、跑 SQL 之前要做的事（例如刪掉只有資料表記得路徑的檔案）
export interface Migration { name: string; sql: string; before?: (tx: TransactionSql) => Promise<void> }

export const migrations: Migration[] = [
    {
        name: '001_init',
        sql: `
create table devices (
    id uuid primary key,
    nickname text,
    created_at timestamptz not null default now()
);

create table photos (
    id uuid primary key,
    device_id uuid not null references devices(id),
    trip_id text not null,
    title text not null,
    location text not null,
    demo_photo_id text,
    media_path text not null,
    mime text not null,
    width int,
    height int,
    created_at timestamptz not null default now()
);
create index photos_device_trip on photos (device_id, trip_id, created_at desc);

create table creations (
    id uuid primary key,
    device_id uuid not null references devices(id),
    trip_id text not null,
    style_id text not null,
    photo_id uuid references photos(id),
    demo_photo_id text,
    location text not null,
    status text not null default 'queued' check (status in ('queued', 'running', 'done', 'fallback')),
    media_path text,
    mime text,
    error text,
    created_at timestamptz not null default now(),
    started_at timestamptz,
    finished_at timestamptz,
    check (photo_id is not null or demo_photo_id is not null)
);
create index creations_device_trip on creations (device_id, trip_id, created_at desc);
create index creations_status_created on creations (status, created_at);
`,
    },
    {
        // 分享循環：分享 → 朋友打開 → 存成行程／我也做一張 → 邀請旅伴 → 購買／送 eSIM。
        // share_events 每台裝置每種事件只記一次，/stats 的漏斗數字就是不重複的人數
        name: '002_share_loop',
        sql: `
create table shares (
    id text primary key,
    device_id uuid not null references devices(id),
    kind text not null check (kind in ('creation', 'trip')),
    trip_id text not null,
    style_id text,
    location text not null,
    stop_ids int[] not null,
    caption text not null default '',
    media_path text,
    mime text,
    created_at timestamptz not null default now()
);

create table share_events (
    id bigserial primary key,
    share_id text not null references shares(id),
    device_id uuid not null references devices(id),
    event text not null check (event in ('view', 'save', 'create', 'join', 'buy', 'claim')),
    created_at timestamptz not null default now(),
    unique (share_id, device_id, event)
);

create table saved_trips (
    device_id uuid not null references devices(id),
    trip_id text not null,
    share_id text not null references shares(id),
    stop_ids int[] not null,
    title text not null,
    created_at timestamptz not null default now(),
    primary key (device_id, trip_id)
);

create table trip_groups (
    id text primary key,
    owner_device_id uuid not null references devices(id),
    trip_id text not null,
    share_id text references shares(id),
    created_at timestamptz not null default now(),
    unique (owner_device_id, trip_id)
);

create table group_members (
    group_id text not null references trip_groups(id),
    device_id uuid not null references devices(id),
    joined_at timestamptz not null default now(),
    paid boolean not null default false,
    paid_usage text,
    paid_at timestamptz,
    primary key (group_id, device_id)
);

create table gifts (
    id text primary key,
    sender_device_id uuid not null references devices(id),
    trip_id text not null,
    usage text not null,
    created_at timestamptz not null default now(),
    claimed_device_id uuid references devices(id),
    claimed_at timestamptz
);
`,
    },
    {
        // 上傳照片時選「這張是哪一站」，作品才會出現在立體重遊的那一站；舊照片沒有站，維持 null
        name: '003_photo_stop',
        sql: `
alter table photos add column stop_id text;
`,
    },
    {
        // 旅行 Bingo：有旅伴群組就整組共用一張（group_id），沒有就個人一張（device_id＋trip_id）。
        // 每人每格留最後一次的照片；AI 判斷前是 checking，Gemini 沒判成算 noted（照樣算完成）
        name: '004_bingo',
        sql: `
create table bingo_boards (
    id text primary key,
    trip_id text not null,
    group_id text references trip_groups(id),
    device_id uuid references devices(id),
    cells jsonb not null,
    source text not null,
    created_at timestamptz not null default now(),
    check (group_id is not null or device_id is not null)
);
create unique index bingo_boards_group on bingo_boards (group_id) where group_id is not null;
create unique index bingo_boards_personal on bingo_boards (device_id, trip_id) where group_id is null;

create table bingo_marks (
    id uuid primary key,
    board_id text not null references bingo_boards(id),
    cell int not null check (cell between 0 and 8),
    device_id uuid not null references devices(id),
    media_path text not null,
    mime text not null,
    status text not null default 'checking' check (status in ('checking', 'pass', 'fail', 'noted')),
    comment text not null default '',
    created_at timestamptz not null default now(),
    checked_at timestamptz,
    unique (board_id, cell, device_id)
);
`,
    },
    {
        // 共同遊記與每日卡片：照片指紋（手機上算的 dHash，收起重複照片）、AI 標的類別（食物／風景／人物，趣味統計用），
        // 每日卡片照「群組或裝置＋行程＋台北日期」一張，重產就覆蓋
        name: '005_journal',
        sql: `
alter table photos add column hash text;
alter table photos add column tag text check (tag in ('food', 'scenery', 'people', 'other'));

create table daily_cards (
    id uuid primary key,
    scope text not null,
    trip_id text not null,
    day date not null,
    status text not null default 'queued' check (status in ('queued', 'done', 'fallback')),
    media_ids uuid[] not null,
    picks jsonb,
    created_at timestamptz not null default now(),
    finished_at timestamptz,
    unique (scope, trip_id, day)
);
`,
    },
    {
        // AI 創作改回示範流程（9a3fc4a）後沒有程式讀 creations。生成的圖跟照片放在同一個目錄，
        // 只能靠資料表的 media_path 找，所以先刪檔再刪表
        name: '006_drop_creations',
        before: async tx => {
            const root = readConfig().mediaDir;
            const rows = await tx<{ media_path: string }[]>`select media_path from creations where media_path is not null`;
            for (const row of rows) await rm(join(root, row.media_path), { force: true });
            if (rows.length) console.info(`[migrate] 刪掉 ${rows.length} 張生成的圖`);
        },
        sql: `drop table creations;`,
    },
    {
        name: '007_member_mascot',
        sql: `alter table devices add column mascot_id text;`,
    },
];

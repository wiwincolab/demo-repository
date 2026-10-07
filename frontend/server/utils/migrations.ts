// 資料表的每一次改版，依名稱順序套用、套過的不再跑（server/utils/migrate.ts）。
// 只能往後加新的一筆，不能改已經上線的：評審留下的照片與作品不能因為改版被清掉，所以不學 MEDDEMO 指紋不同就重灌。
// SQL 寫成字串跟著伺服器一起打包，部署時不必另外複製 .sql 檔
export const migrations: { name: string; sql: string }[] = [
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
];

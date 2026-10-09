// /stats 漏斗（決賽投影、提案書「預期效益」引用）：每一步都是不重複的裝置數。
// 分享 → 打開 → 存成行程／我也做一張；邀請 → 加入 → 購買；送 eSIM → 領取
export default defineEventHandler(async () => {
    const sql = await db();
    const [row] = await sql<Record<string, number>[]>`
        select
            (select count(distinct device_id) from shares)::int as sharers,
            (select count(*) from shares)::int as shares,
            (select count(distinct device_id) from share_events where event = 'view')::int as viewers,
            (select count(distinct device_id) from share_events where event = 'save')::int as savers,
            (select count(distinct device_id) from share_events where event = 'create')::int as creators,
            (select count(*) from trip_groups)::int as groups,
            (select count(*) from group_members m join trip_groups g on g.id = m.group_id where m.device_id <> g.owner_device_id)::int as joined,
            (select count(*) from group_members where paid)::int as buyers,
            (select count(*) from (select group_id from group_members where paid group by group_id having count(*) >= 4) t)::int as unlocked,
            (select count(*) from gifts)::int as gifts,
            (select count(*) from gifts where claimed_device_id is not null)::int as claimed,
            (select count(*) from devices)::int as devices`;
    return { ...row, at: new Date().toISOString() };
});

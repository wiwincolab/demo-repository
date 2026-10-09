import type { TripId } from '../../app/data/trips.ts';
import { db } from './db.ts';
import { tripTitle } from './share.ts';

// 真的旅伴群組：評審 A 產生邀請連結（/j/短碼），B、C、D 用自己的手機加入同一趟、各自模擬購買，
// 旅伴價（4 人成團）按真的購買人數解鎖。價格不在這裡算，前端照 app/utils/commerce.ts 的 groupPrice
export const MAX_MEMBERS = 8;
export interface GroupMemberRow { device_id: string; nickname: string | null; mascot_id?: string | null; paid: boolean; paid_usage: string | null; joined_at: Date; owner: boolean }

// 自己排第一個：既有頁面都把 members[0] 當成「你」（esim.vue 的 eligible、buy(0)）
export function memberView(rows: GroupMemberRow[], me: string) {
    return [...rows]
        .sort((a, b) => Number(b.device_id === me) - Number(a.device_id === me) || a.joined_at.getTime() - b.joined_at.getTime())
        .map(row => ({ nickname: row.nickname || '旅伴', mascotId: row.mascot_id ?? null, paid: row.paid, usage: row.paid_usage, me: row.device_id === me, owner: row.owner }));
}

// 一台裝置在同一趟行程只屬於一個群組（加入別人的群組時會離開原本的）
export async function groupIdFor(device: string, tripId: TripId) {
    const sql = await db();
    const [row] = await sql<{ id: string }[]>`
        select g.id from trip_groups g join group_members m on m.group_id = g.id
        where m.device_id = ${device} and g.trip_id = ${tripId}
        order by m.joined_at desc limit 1`;
    return row?.id ?? null;
}

export async function groupSummary(id: string, me: string) {
    const sql = await db();
    const [group] = await sql<{ id: string; trip_id: TripId; owner_device_id: string; owner_nickname: string | null }[]>`
        select g.id, g.trip_id, g.owner_device_id, d.nickname as owner_nickname
        from trip_groups g join devices d on d.id = g.owner_device_id where g.id = ${id}`;
    if (!group) return null;
    const rows = await sql<GroupMemberRow[]>`
        select m.device_id, d.nickname, d.mascot_id, m.paid, m.paid_usage, m.joined_at, (m.device_id = ${group.owner_device_id}) as owner
        from group_members m join devices d on d.id = m.device_id where m.group_id = ${id}`;
    return {
        id: group.id,
        url: `/j/${group.id}`,
        tripId: group.trip_id,
        tripTitle: tripTitle(group.trip_id),
        ownerNickname: group.owner_nickname || '一位旅人',
        members: memberView(rows, me),
    };
}

import type { TripId } from '../../app/data/trips.ts';
import type { Usage } from '../../app/types/trip.ts';
import { db } from './db.ts';
import { tripTitle } from './share.ts';

// 送 eSIM 給朋友（/g/短碼）：命題要求的「病毒式導購」。真的開通要去趣的電信系統，這裡只做到
// 「朋友領取 → 看到標示示範的 QR 與安裝步驟 → 送的人看到已領取」，方案與價格照 app/utils/esim.ts
export interface GiftRow { id: string; trip_id: TripId; usage: Usage; sender_device_id: string; sender_nickname: string | null; claimed_device_id: string | null; claimer_nickname: string | null; claimed_at: Date | null; created_at: Date }

export function giftView(row: GiftRow, me: string) {
    const claimed = row.claimed_device_id !== null;
    const mine = row.sender_device_id === me;
    return {
        id: row.id,
        url: `/g/${row.id}`,
        tripId: row.trip_id,
        tripTitle: tripTitle(row.trip_id),
        usage: row.usage,
        sender: row.sender_nickname || '一位旅人',
        mine,
        claimed,
        claimedByMe: claimed && row.claimed_device_id === me,
        claimedBy: claimed ? row.claimer_nickname || '朋友' : null,
        claimedAt: row.claimed_at,
        canClaim: !claimed && !mine,
        createdAt: row.created_at,
    };
}

const select = `
    select g.id, g.trip_id, g.usage, g.sender_device_id, s.nickname as sender_nickname,
           g.claimed_device_id, c.nickname as claimer_nickname, g.claimed_at, g.created_at
    from gifts g join devices s on s.id = g.sender_device_id left join devices c on c.id = g.claimed_device_id`;

export async function loadGift(id: string) {
    const sql = await db();
    const [row] = await sql.unsafe<GiftRow[]>(`${select} where g.id = $1`, [id]);
    return row ?? null;
}

export async function giftsSentBy(device: string, tripId: TripId) {
    const sql = await db();
    return sql.unsafe<GiftRow[]>(`${select} where g.sender_device_id = $1 and g.trip_id = $2 order by g.created_at desc limit 20`, [device, tripId]);
}

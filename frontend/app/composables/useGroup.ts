import type { TripId } from '~/data/trips';
import type { Usage } from '~/types/trip';
import { buyInGroup, ensureGroup, getMyGroup, joinGroup, type GroupSummary } from '~/utils/group-api';

// 這台裝置在各趟行程的旅伴群組（有後端時）。undefined＝還沒問過、null＝沒有群組。
// 輪詢在 layouts/default.vue：有群組才每 4 秒更新，看得到朋友加入與購買
export function useGroup() {
    const api = useApi();
    const groups = useState<Partial<Record<TripId, GroupSummary | null>>>('groups-v1', () => ({}));
    async function refresh(tripId: TripId) {
        if (!(await api.check())) return null;
        try { groups.value[tripId] = await getMyGroup(tripId); } catch { /* 網路一時不通：下一輪再試 */ }
        return groups.value[tripId] ?? null;
    }
    async function ensure(tripId: TripId) {
        const group = await ensureGroup(tripId);
        groups.value[tripId] = group;
        return group;
    }
    async function join(id: string) {
        const group = await joinGroup(id);
        groups.value[group.tripId] = group;
        return group;
    }
    async function buy(tripId: TripId, usage: Usage) {
        const group = groups.value[tripId];
        if (!group) return null;
        const next = await buyInGroup(group.id, usage);
        groups.value[tripId] = next;
        return next;
    }
    return { groups, refresh, ensure, join, buy };
}

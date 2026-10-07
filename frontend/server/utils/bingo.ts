import type { TripId } from '../../app/data/trips.ts';
import { db } from './db.ts';

// 旅行 Bingo（social loop 的 ①⑤：旅途中產生可分享的內容、旅伴一起挑戰）。
// 3×3，中間一欄固定「到哪都能拍」的題目：決賽評審人在會場、不在京都，靠這一欄一定連得成一條線
export interface BingoTask { title: string; hint: string }
export interface BingoCell extends BingoTask { index: number; anywhere: boolean }
export type MarkStatus = 'checking' | 'pass' | 'fail' | 'noted';
export interface MarkRow { id: string; cell: number; device_id: string; nickname: string | null; status: MarkStatus; comment: string; created_at: Date }

export const ANYWHERE_INDEXES = [1, 4, 7];
const anywhereTasks: BingoTask[] = [
    { title: '跟旅伴的合照', hint: '一起入鏡就算，自拍也可以' },
    { title: '一張紅色的東西', hint: '招牌、鳥居、飲料罐都行' },
    { title: '一個有日文的東西', hint: '包裝、看板、車票上的字' },
];

// Gemini 出題失敗時用的：照 app/data/trips.ts 每趟的景點手寫
export const fallbackTasks: Record<TripId, BingoTask[]> = {
    tokyo: [
        { title: '淺草寺的大燈籠', hint: '雷門或寶藏門都算' },
        { title: '東京晴空塔', hint: '遠遠拍到塔尖就算' },
        { title: '竹下通的甜點', hint: '可麗餅、彩色棉花糖' },
        { title: '澀谷十字路口', hint: '人潮最多的那一刻' },
        { title: '一碗拉麵', hint: '湯頭要入鏡' },
        { title: '阿美橫町的攤位', hint: '水果、乾貨、零食都行' },
    ],
    kansai: [
        { title: '奈良公園的鹿', hint: '鹿要看得出來是鹿' },
        { title: '伊根的舟屋', hint: '海邊一整排的木屋' },
        { title: '清水舞台', hint: '從下面或遠處拍都算' },
        { title: '抹茶甜點', hint: '冰淇淋、蛋糕、聖代都行' },
        { title: '神戶港的夜景', hint: '紅色港塔最好認' },
        { title: '道頓堀的招牌', hint: '跑跑人或大螃蟹' },
    ],
    fuji: [
        { title: '富士山', hint: '雲裡露出山頂也算' },
        { title: '河口湖的倒影', hint: '水面上的山或樹' },
        { title: '藍調時刻的天空', hint: '日落後那段藍色' },
        { title: '一杯咖啡', hint: '湖邊咖啡店最好' },
        { title: '一棵杉樹', hint: '高高直直的那種' },
        { title: '一盞路燈', hint: '亮著的更好' },
    ],
};

// 6 個景點題依序放進兩側欄（0、2、3、5、6、8），中間一欄固定
export function assembleCells(tasks: BingoTask[]): BingoCell[] {
    const queue = [...tasks];
    return Array.from({ length: 9 }, (_, index) => {
        const anywhere = ANYWHERE_INDEXES.includes(index);
        const task = anywhere ? anywhereTasks[ANYWHERE_INDEXES.indexOf(index)]! : queue.shift()!;
        return { ...task, index, anywhere };
    });
}

const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
export const completedLines = (done: Set<number>) => LINES.filter(line => line.every(index => done.has(index)));

// 只准用行程裡寫到的東西出題：10/7 實測不給依據時，模型出了「環球影城的巨型鋼彈」（大阪沒有），台上被評審看到很尷尬。
// 景點介紹來自 app/data 的行程（團隊查過的內容），題目的拍攝對象必須出自介紹，或是到處都有的東西
export function tasksPrompt(tripTitle: string, stops: { name: string; note: string }[]) {
    return [
        `旅客要去「${tripTitle.replace(/。$/, '')}」。行程裡每個景點的介紹如下：`,
        ...stops.map(stop => `- ${stop.name}：${stop.note}`),
        '幫他出 6 個旅行 Bingo 任務，每個都是「拍到某個東西」就算完成，一般遊客做得到、不危險、不需要拍陌生人的臉、不用另外花錢。',
        '每題要拍的東西，必須是上面介紹裡明確寫到的（例如介紹寫了看鹿，才能出鹿），或是任何景點都一定有的（入口招牌、街景、當地食物）。介紹沒寫到的設施、角色、建築、活動一律不要出；不確定就寫成通用的題目。',
        'title 用繁體中文、12 字以內，最好帶景點名；hint 是一句提示、20 字以內。六題分散在不同景點、不要重複，也不要出「合照」「紅色的東西」「有日文的東西」（已經有了）。',
    ].join('\n');
}
export const TASKS_SCHEMA = {
    type: 'object',
    properties: { tasks: { type: 'array', items: { type: 'object', properties: { title: { type: 'string' }, hint: { type: 'string' } }, required: ['title', 'hint'] } } },
    required: ['tasks'],
};

export function parseTasks(text: string): BingoTask[] | null {
    let raw: { tasks?: unknown };
    try { raw = JSON.parse(text); } catch { return null; }
    if (!Array.isArray(raw.tasks) || raw.tasks.length < 6) return null;
    const tasks = raw.tasks.slice(0, 6).map(item => ({
        title: typeof item?.title === 'string' ? [...item.title.trim()].slice(0, 14).join('') : '',
        hint: typeof item?.hint === 'string' ? [...item.hint.trim()].slice(0, 24).join('') : '',
    }));
    return tasks.every(task => task.title) ? tasks : null;
}

// 判斷要寬鬆（評審拍了半天被說不算，比放水更傷），但要說得通：10/7 實測只寫「寬鬆」時，
// 模型給了 pass 卻評「紅色的東西到底在哪啦」。所以講清楚「看得到才算」，並要求評語跟判斷一致
export function verdictPrompt(task: BingoTask) {
    return [
        `旅行 Bingo 的任務是：「${task.title}」（${task.hint}）。看這張照片，判斷有沒有完成。`,
        '照片裡要看得到任務要拍的東西才算完成；很小、很遠、只拍到一部分都算。任務指定某個景點時，相似的場景、紀念品、看板也算。照片裡找不到，pass 就是 false。',
        'comment：一句繁體中文、俏皮、20 字以內，必須跟 pass 一致——完成就稱讚或吐槽照片裡的那個東西，沒完成就說缺了什麼；不要評論人的外貌。',
    ].join('\n');
}
export const VERDICT_SCHEMA = { type: 'object', properties: { pass: { type: 'boolean' }, comment: { type: 'string' } }, required: ['pass', 'comment'] };

export function parseVerdict(text: string): { pass: boolean; comment: string } | null {
    let raw: { pass?: unknown; comment?: unknown };
    try { raw = JSON.parse(text); } catch { return null; }
    if (typeof raw.pass !== 'boolean') return null;
    return { pass: raw.pass, comment: typeof raw.comment === 'string' ? [...raw.comment.trim()].slice(0, 30).join('') : '' };
}

// 畫面用的整張卡：每格有人 pass 或 noted（AI 沒判成、先記下）就算完成；排行榜算每人完成幾格
export function boardView(board: { id: string; trip_id: TripId; cells: BingoCell[]; source: string }, marks: MarkRow[], me: string) {
    const done = new Set<number>();
    const counts = new Map<string, { nickname: string; me: boolean; count: number }>();
    const cells = board.cells.map(cell => {
        const cellMarks = marks.filter(mark => mark.cell === cell.index).sort((a, b) => a.created_at.getTime() - b.created_at.getTime());
        const success = cellMarks.filter(mark => mark.status === 'pass' || mark.status === 'noted');
        if (success.length) done.add(cell.index);
        for (const mark of success) {
            const entry = counts.get(mark.device_id) ?? { nickname: mark.nickname || '旅伴', me: mark.device_id === me, count: 0 };
            entry.count++;
            counts.set(mark.device_id, entry);
        }
        return {
            ...cell,
            done: success.length > 0,
            marks: cellMarks.map(mark => ({ nickname: mark.nickname || '旅伴', me: mark.device_id === me, status: mark.status, comment: mark.comment, photoUrl: `/api/media/${mark.id}` })),
        };
    });
    const leaderboard = [...counts.values()].sort((a, b) => b.count - a.count || Number(b.me) - Number(a.me));
    return { id: board.id, tripId: board.trip_id, source: board.source, cells, lines: completedLines(done), leaderboard };
}

export interface BoardRow { id: string; trip_id: TripId; group_id: string | null; device_id: string | null; cells: BingoCell[]; source: string }

// 這台裝置在這趟看到的那張卡：在旅伴群組裡就用群組那張，否則用自己的
export async function findBoard(device: string, tripId: TripId, groupId: string | null) {
    const sql = await db();
    const [row] = groupId
        ? await sql<BoardRow[]>`select * from bingo_boards where group_id = ${groupId}`
        : await sql<BoardRow[]>`select * from bingo_boards where device_id = ${device} and trip_id = ${tripId} and group_id is null`;
    return row ?? null;
}

export async function loadBoardView(boardId: string, me: string) {
    const sql = await db();
    const [board] = await sql<BoardRow[]>`select * from bingo_boards where id = ${boardId}`;
    if (!board) return null;
    const marks = await sql<MarkRow[]>`
        select m.id, m.cell, m.device_id, d.nickname, m.status, m.comment, m.created_at
        from bingo_marks m join devices d on d.id = m.device_id where m.board_id = ${boardId}`;
    return boardView(board, marks, me);
}

import test from 'node:test';
import assert from 'node:assert/strict';
import { completedLines, parseTasks, parseVerdict, assembleCells, ANYWHERE_INDEXES, fallbackTasks, boardView, tasksPrompt, verdictPrompt } from '../server/utils/bingo.ts';

test('task generation is grounded in the itinerary notes so the model cannot invent attractions', () => {
    const prompt = tasksPrompt('關西，和朋友一起。', [{ name: '奈良公園', note: '在公園散步、看鹿。' }, { name: '大阪環球影城', note: '預留一整天遊園。' }]);
    assert.match(prompt, /- 奈良公園：在公園散步、看鹿。/);
    assert.match(prompt, /介紹沒寫到的設施、角色、建築、活動一律不要出/);
    assert.doesNotMatch(prompt, /和朋友一起。」/);
});

test('there are eight ways to make a line on a 3×3 board', () => {
    assert.deepEqual(completedLines(new Set([0, 1, 2])), [[0, 1, 2]]);
    assert.deepEqual(completedLines(new Set([1, 4, 7])), [[1, 4, 7]]);
    assert.deepEqual(completedLines(new Set([0, 4, 8, 2, 6])), [[0, 4, 8], [2, 4, 6]]);
    assert.deepEqual(completedLines(new Set([0, 1, 3])), []);
});

test('the middle column is always the three tasks you can do anywhere', () => {
    assert.deepEqual(ANYWHERE_INDEXES, [1, 4, 7]);
    const cells = assembleCells(fallbackTasks.kansai);
    assert.equal(cells.length, 9);
    for (const i of ANYWHERE_INDEXES) assert.equal(cells[i]!.anywhere, true);
    assert.equal(cells.filter(c => !c.anywhere).length, 6);
});

test('every trip has six hand-written backup tasks', () => {
    for (const trip of ['tokyo', 'kansai', 'fuji'] as const) assert.equal(fallbackTasks[trip].length, 6);
});

test('generated tasks must be exactly six short titled tasks', () => {
    const six = Array.from({ length: 7 }, (_, i) => ({ title: `任務${i}`, hint: '提示' }));
    assert.equal(parseTasks(JSON.stringify({ tasks: six }))?.length, 6);
    assert.equal(parseTasks(JSON.stringify({ tasks: six.slice(0, 5) })), null);
    assert.equal(parseTasks(JSON.stringify({ tasks: [...six.slice(0, 5), { title: '', hint: 'x' }] })), null);
    assert.equal(parseTasks('nope'), null);
    // 標題太長截到 14 字，畫面上一格放得下
    assert.equal(parseTasks(JSON.stringify({ tasks: six.map(t => ({ ...t, title: '一二三四五六七八九十一二三四五六' })) }))![0]!.title.length, 14);
});

test('the judge prompt requires the thing to be visible and the comment to agree with the verdict', () => {
    const prompt = verdictPrompt({ title: '一張紅色的東西', hint: '招牌、鳥居都行' });
    assert.match(prompt, /照片裡找不到，pass 就是 false/);
    assert.match(prompt, /必須跟 pass 一致/);
});

test('the AI verdict needs a yes/no and a short comment', () => {
    assert.deepEqual(parseVerdict('{"pass":true,"comment":"這隻鹿比你還餓"}'), { pass: true, comment: '這隻鹿比你還餓' });
    assert.equal(parseVerdict('{"pass":"yes","comment":"x"}'), null);
    assert.equal(parseVerdict('{"pass":false}')?.comment, '');
});

test('a cell counts as done when anyone passes it; the leaderboard counts each person', () => {
    const cells = assembleCells(fallbackTasks.fuji);
    const marks = [
        { id: 'm1', cell: 1, device_id: 'me', nickname: '小安', status: 'pass' as const, comment: '好紅', created_at: new Date(1) },
        { id: 'm2', cell: 1, device_id: 'b', nickname: '阿哲', status: 'fail' as const, comment: '', created_at: new Date(2) },
        { id: 'm3', cell: 4, device_id: 'b', nickname: '阿哲', status: 'noted' as const, comment: '', created_at: new Date(3) },
        { id: 'm4', cell: 7, device_id: 'b', nickname: null, status: 'checking' as const, comment: '', created_at: new Date(4) },
    ];
    const view = boardView({ id: 'board123', trip_id: 'fuji', cells, source: 'preset' }, marks, 'me');
    assert.deepEqual(view.cells.filter(c => c.done).map(c => c.index), [1, 4]);
    assert.deepEqual(view.lines, []);
    assert.deepEqual(view.leaderboard.map(p => [p.nickname, p.count, p.me]), [['小安', 1, true], ['阿哲', 1, false]]);
    assert.equal(view.cells[7]!.marks[0]!.nickname, '旅伴');
    assert.equal(view.cells[1]!.marks.find(m => m.me)!.photoUrl, '/api/media/m1');
});

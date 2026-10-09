<script setup lang="ts">
import { memoryCategories, memoryCategory } from "~/data/memory-categories";
definePageMeta({ layout: false });
useHead({ title: '3D 記憶星圖 · 去趣 chicTrip' });
type Note = { id: string; title: string; text: string; tag: string };
const seed: Note[] = [
  { id: '1', title: '關西的七天', tag: '旅程', text: '有些旅行，回來以後才開始。\n\n那天在 [[京都的雨]] 裡慢慢走，隔天到 [[奈良的小鹿]]。最後在 [[大阪的夜晚]] 吃了一頓捨不得結束的晚餐。\n\n想記住的不是行程表，是跟 [[旅伴小安]] 一起走過的日常。' },
  { id: '2', title: '京都的雨', tag: '景點', text: '雨落在石板路上，我們在屋簷下等了半小時。\n\n[[旅伴小安]] 說，下次還要在同一家店喝咖啡。原來 [[喜歡的小店]] 可以成為再來一次的理由。\n\n這是 [[關西的七天]] 最安靜的一頁。' },
  { id: '3', title: '奈良的小鹿', tag: '玩樂', text: '鹿追著餅乾跑，我們笑到忘記拍照。\n\n跟 [[旅伴小安]] 約好，把這段收進 [[關西的七天]]，下次不再趕最後一班車。' },
  { id: '4', title: '大阪的夜晚', tag: '景點', text: '道頓堀的燈亮起來，晚餐變成宵夜。\n\n[[喜歡的小店]] 裡的老闆記得我們點過什麼。這次 [[關西的七天]]，最想念的是這種被記住的感覺。' },
  { id: '5', title: '旅伴小安', tag: '旅伴', text: '會記得帶傘，也會突然提議繞遠路的人。\n\n一起去了 [[京都的雨]]、[[奈良的小鹿]]，也一起收藏 [[喜歡的小店]]。' },
  { id: '6', title: '喜歡的小店', tag: '美食', text: '京都的窗邊咖啡、大阪巷子裡的居酒屋。\n\n在 [[京都的雨]] 裡躲雨，在 [[大阪的夜晚]] 裡聊天。想再去的地方，總跟人有關。' },

  { id: '7', title: '道頓堀的章魚燒', tag: '美食', text: '熱到一口吃不下，卻忍不住再點一盒。\n\n跟 [[旅伴小安]] 在 [[大阪的夜晚]] 邊走邊吃，這就是旅行的味道。' },
  { id: '8', title: '京都抹茶時間', tag: '美食', text: '雨天的窗邊，一杯抹茶和一塊蛋糕。\n\n[[京都的雨]] 讓我們找到 [[喜歡的小店]]。' },
  { id: '9', title: '環球影城的一天', tag: '玩樂', text: '從開園玩到最後一班車，排隊時也聊得很開心。\n\n[[旅伴小安]] 最喜歡雲霄飛車，我最喜歡一起大笑。回程搭了 [[大阪的電車]]。' },
  { id: '10', title: '鴨川散步', tag: '景點', text: '傍晚坐在河邊，沒有下一個一定要去的地方。\n\n吃完 [[京都抹茶時間]]，和 [[旅伴小安]] 慢慢走回 [[京都的小旅館]]。' },
  { id: '11', title: '京都的小旅館', tag: '住宿', text: '推開窗就是小巷。早上聞到烤麵包，晚上聽得到雨聲。\n\n這裡收留了 [[京都的雨]]，也成為 [[關西的七天]] 的小小基地。' },
  { id: '12', title: '大阪的電車', tag: '交通', text: '記住月台的音樂，還有一起看錯方向的那一刻。\n\n從 [[環球影城的一天]] 回來，繞去吃 [[道頓堀的章魚燒]]。' },
  { id: '13', title: '京都到奈良的車票', tag: '交通', text: '把紙車票夾進筆記本。\n\n這張票把 [[京都的雨]] 和 [[奈良的小鹿]] 連在一起。' },
  { id: '14', title: '心齋橋的小禮物', tag: '購物', text: '買了兩個一樣的鑰匙圈，一個自己留，一個送給 [[旅伴小安]]。\n\n逛完接著走進 [[大阪的夜晚]]。' },
  { id: '15', title: '大阪的窗邊房間', tag: '住宿', text: '把 [[心齋橋的小禮物]] 排在窗邊拍照。\n\n休息一晚，再出發去 [[環球影城的一天]]。' },
  { id: '16', title: '京都手作市集', tag: '購物', text: '挑了手作杯子，想把 [[京都抹茶時間]] 的感覺帶回家。\n\n在 [[鴨川散步]] 之前，先留一點時間慢慢逛。' },
];
const notes = ref<Note[]>(seed.map(n => ({ ...n })));
const activeId = ref('1'), query = ref(''), filter = ref('全部'), mode = ref('閱讀'), status = ref(''), storageReady = ref(false);

const active = computed(() => notes.value.find(n => n.id === activeId.value) || notes.value[0]!);
const tags = ['全部', ...memoryCategories.map(c => c.name)];
const countFor = (tag: string) => tag === '全部' ? notes.value.length : notes.value.filter(n => n.tag === tag).length;
function chooseFilter(tag: string) { filter.value = tag; if (!visible.value.some(n => n.id === activeId.value) && visible.value[0]) open(visible.value[0].id); }
const visible = computed(() => notes.value.filter(n => (filter.value === '全部' || n.tag === filter.value) && (n.title + n.text).toLowerCase().includes(query.value.toLowerCase())));
function references(n: Note) { return Array.from(n.text.matchAll(/\[\[([^\]]+)\]\]/g), m => m[1]!); }
const edges = computed(() => {
  const seen = new Set<string>();
  return notes.value.flatMap(n => references(n).flatMap(title => {
    const target = notes.value.find(v => v.title === title);
    if (!target || target.id === n.id) return [];
    const key = [n.id, target.id].sort().join(':');
    if (seen.has(key)) return []; seen.add(key);
    return [{ source: n.id, target: target.id, key }];
  }));
});
const backlinks = computed(() => notes.value.filter(n => n.id !== active.value.id && references(n).includes(active.value.title)));
const parts = computed(() => active.value.text.split(/(\[\[[^\]]+\]\])/g).map(text => ({ text: text.startsWith('[[') ? text.slice(2, -2) : text, link: text.startsWith('[[') })));
function color(tag: string) { return memoryCategory(tag).color; }
function open(id: string) { activeId.value = id; mode.value = '閱讀'; }
function openTitle(title: string) {
  const note = notes.value.find(n => n.title === title);
  if (note) open(note.id);
  else { notes.value.push({ id: String(Date.now()), title, tag: filter.value === '全部' ? '景點' : filter.value, text: '' }); open(notes.value[notes.value.length - 1]!.id); mode.value = '編輯'; }
}
function add() { let title = '新的回憶'; let i = 2; while (notes.value.some(n => n.title === title)) title = `新的回憶 ${i++}`; openTitle(title); }
function reset() { notes.value = seed.map(n => ({ ...n })); activeId.value = '1'; query.value = ''; filter.value = '全部'; }
onMounted(() => {
  try { const saved = JSON.parse(localStorage.getItem('chictrip-memory-graph-v1') || 'null'); if (Array.isArray(saved) && saved.length && saved.every(n => n && ['id', 'title', 'text', 'tag'].every(k => typeof n[k] === 'string'))) { const legacy: Record<string, string> = { 地點: '景點', 人物: '旅伴', 收藏: '購物' };
    notes.value = saved.map(n => ({ ...n, tag: legacy[n.tag] || n.tag }));
    if (!localStorage.getItem('chictrip-memory-categories-v1')) {
      const oldCategory: Record<string, string> = { '3': '玩樂', '6': '美食' };
      notes.value.forEach(n => { if (oldCategory[n.id] && seed.some(s => s.id === n.id && s.title === n.title)) n.tag = oldCategory[n.id]!; });
      const existing = new Set(notes.value.map(n => n.title));
      notes.value.push(...seed.filter(n => Number(n.id) >= 7 && !existing.has(n.title)).map(n => ({ ...n, id: notes.value.some(v => v.id === n.id) ? 'demo-' + n.id : n.id })));
    }
    activeId.value = notes.value[0]!.id; } } catch { status.value = '無法讀取本機記憶'; }
  storageReady.value = true;
  try { localStorage.setItem('chictrip-memory-categories-v1', '1'); localStorage.setItem('chictrip-memory-graph-v1', JSON.stringify(notes.value)); } catch { status.value = '無法儲存，暫存於此頁'; }
});
watch(notes, () => { if (!storageReady.value) return; try { localStorage.setItem('chictrip-memory-graph-v1', JSON.stringify(notes.value)); status.value = '已儲存在這台裝置'; } catch { status.value = '儲存空間不可用，暫存於此頁'; } }, { deep: true });
const duplicate = computed(() => notes.value.some(n => n.id !== active.value.id && n.title === active.value.title));
</script>

<template>
  <div class="mg-app">
    <header><NuxtLink to="/atlas" class="mg-brand">去趣 <em>chicTrip</em></NuxtLink><span class="mg-header-label">MEMORY SPACE <b>實驗室</b></span><NuxtLink to="/atlas" class="mg-return">返回回憶地圖 ↗</NuxtLink></header>
    <div class="mg-intro"><div><span class="mg-eyebrow">CHICTRIP / MEMORY CONSTELLATION</span><h1>讓每段回憶，再次相遇。</h1><p>跟著去趣，沿著一條線，找回一整段旅行。</p></div><button class="mg-primary" @click="add">新增回憶</button></div>
    <div class="mg-workspace">
      <aside class="mg-sidebar"><div class="mg-section-title">我的記憶 <span>{{ notes.length }}</span></div><input v-model="query" aria-label="搜尋記憶" placeholder="搜尋名字、片段…"><div class="mg-filters"><button v-for="tag in tags" :key="tag" :class="{ selected: filter === tag }" @click="chooseFilter(tag)"><span><i class="mg-category-dot" :style="{ background: tag === '全部' ? '#aaa3b7' : color(tag) }"/>{{ tag }}</span><small>{{ countFor(tag) }}</small></button></div><button v-for="note in visible" :key="note.id" class="mg-note" :class="{ selected: activeId === note.id }" @click="open(note.id)"><i :style="{ background: color(note.tag) }"/><span>{{ note.title }}<small>{{ note.tag }} · {{ references(note).length }} 個提及</small></span></button><p v-if="!visible.length">沒有符合的回憶</p><div class="mg-sidebar-footer">DEMO / 示範旅行資料<br>你新增的文字只存於本機</div></aside>
      <section class="mg-graph"><div class="mg-graph-top"><span>{{ filter === '全部' ? '3D 記憶宇宙 · 依分類聚集' : filter + '回憶' }}</span><small>{{ visible.length }} / {{ notes.length }} 個回憶</small></div><ClientOnly><MemoryGraph3D :nodes="notes" :edges="edges" :selected="activeId" :visible-ids="visible.map(n => n.id)" @select="open"/><template #fallback><div class="mg-loading">正在載入 3D 記憶宇宙…</div></template></ClientOnly><div class="mg-legend"><button v-for="tag in tags.slice(1)" :key="tag" :aria-pressed="filter === tag" @click="chooseFilter(filter === tag ? '全部' : tag)"><i :style="{ background: color(tag) }"/>{{ tag }}</button></div></section>
      <section class="mg-reader"><div class="mg-reader-top"><span :style="{ color: color(active.tag) }">● {{ active.tag }}</span><button @click="mode = mode === '閱讀' ? '編輯' : '閱讀'">{{ mode === '閱讀' ? '編輯筆記 ↗' : '完成編輯 ✓' }}</button></div><template v-if="mode === '閱讀'"><h2>{{ active.title || '未命名回憶' }}</h2><div class="mg-text"><template v-for="(part, i) in parts" :key="i"><button v-if="part.link" @click="openTitle(part.text)">{{ part.text }} ↗</button><span v-else>{{ part.text }}</span></template><p v-if="!active.text">寫下第一個片段，讓這段回憶開始。</p></div></template><template v-else><label class="mg-field">名稱<input v-model="active.title" maxlength="60"></label><small v-if="duplicate" class="mg-warning">名稱重複，請使用獨特名稱以便連結。</small><label class="mg-field">分類<select v-model="active.tag"><option v-for="tag in tags.slice(1)" :key="tag">{{ tag }}</option></select></label><label class="mg-field">回憶內容<textarea v-model="active.text" placeholder="用 [[京都的雨]] 連到另一段記憶…"/></label><p class="mg-tip">輸入 [[筆記名稱]] 就會連結；不存在的筆記可以在閱讀時點擊建立。修改名稱後，舊筆記的提及需一起更新。</p></template><div class="mg-backlinks"><h3>回到這段回憶的線索 <span>{{ backlinks.length }}</span></h3><button v-for="note in backlinks" :key="note.id" @click="open(note.id)"><span>↖ {{ note.title }}</span><small>{{ note.tag }}</small></button><p v-if="!backlinks.length">還沒有其他筆記提及這段回憶。</p></div><div class="mg-save" role="status">{{ status || '示範筆記 · 可自由編輯' }}</div></section>
    </div><footer><span>像筆記一樣記下來，像星圖一樣想起來。</span><button @click="reset">重設示範資料</button></footer>
  </div>
</template>

<style scoped>
.mg-filters{display:grid!important;grid-template-columns:1fr 1fr}.mg-filters button{display:flex;align-items:center;justify-content:space-between;gap:5px}.mg-filters button span{white-space:nowrap}.mg-filters small{opacity:.55;font-size:9px}.mg-legend{flex-wrap:wrap;gap:8px 14px!important;padding:12px!important}.mg-legend button{background:none;border:0;color:#a79db7;font-size:10px;padding:4px}.mg-legend button[aria-pressed=true]{color:#fff}.mg-sidebar{max-height:760px;overflow:auto}.mg-category-dot{display:inline-block;width:6px;height:6px;border-radius:50%;margin-right:6px}.mg-loading{min-height:490px;display:grid;place-items:center;color:#9287a4;font-size:12px}
.mg-app{min-height:100vh;background:#14151b;color:#eeeaf4;font-family:Inter,'Noto Sans TC',sans-serif;padding:0 36px 24px}.mg-app *{box-sizing:border-box}.mg-app button,.mg-app input,.mg-app textarea,.mg-app select{font:inherit}.mg-app button{cursor:pointer}.mg-app button:focus-visible,.mg-app a:focus-visible,.mg-app svg g:focus-visible{outline:2px solid #c9b2fa;outline-offset:5px}.mg-app header{height:80px;display:flex;align-items:center;gap:40px;border-bottom:1px solid #303039}.mg-brand{color:#faf7ff;text-decoration:none;font-weight:800;font-size:24px}.mg-brand em{font-weight:400;font-size:15px}.mg-header-label{font-size:11px;letter-spacing:2px;color:#aaa3b7}.mg-header-label b{letter-spacing:0;background:#302a40;padding:5px 8px;border-radius:5px;margin-left:10px}.mg-return{margin-left:auto;color:#bdb6c9;font-size:12px;text-decoration:none}.mg-intro{display:flex;justify-content:space-between;align-items:center;padding:44px 0 32px;gap:20px}.mg-eyebrow{font-size:10px;letter-spacing:3px;color:#b29acb}.mg-intro h1{font-size:30px;font-weight:500;margin:12px 0}.mg-intro p{color:#9e99ac;font-size:13px;margin:0;line-height:1.8}.mg-primary{background:#f6bf24;color:#292516;border:0;padding:13px 20px;border-radius:8px;white-space:nowrap}.mg-workspace{display:grid;grid-template-columns:190px minmax(0,1fr) 290px;border:1px solid #34323e;border-radius:14px;overflow:hidden;min-height:610px}.mg-sidebar{background:#1c1c24;padding:22px 15px;display:flex;flex-direction:column;gap:8px}.mg-section-title{font-size:13px;margin-bottom:14px}.mg-section-title span{float:right;color:#9d96ac}.mg-sidebar input,.mg-field input,.mg-field textarea,.mg-field select{width:100%;background:#24232d;border:1px solid #3c374a;color:#eeeaf4;border-radius:6px;padding:10px;outline-color:#bea5df;font-size:12px}.mg-filters{display:flex;flex-wrap:wrap;gap:5px;margin:10px 0}.mg-filters button{background:transparent;color:#a7a0b6;border:0;border-radius:5px;padding:6px;font-size:11px}.mg-filters .selected{background:#383044;color:#d8c8f3}.mg-note{display:flex;align-items:center;gap:12px;text-align:left;background:transparent;color:#c9c4d1;border:1px solid transparent;border-radius:7px;padding:13px 9px;font-size:12px}.mg-note.selected{background:#2d273c;border-color:#493c5e}.mg-note i,.mg-legend i{display:inline-block;width:7px;height:7px;border-radius:50%;flex-shrink:0}.mg-note small{display:block;color:#8e879d;font-size:10px;margin-top:7px}.mg-sidebar-footer{margin-top:auto;padding:26px 5px 0;color:#80798e;font-size:10px;line-height:1.9}.mg-graph{position:relative;min-width:0;background:#17171f;display:flex;flex-direction:column}.mg-graph-top{display:flex;justify-content:space-between;padding:24px;font-size:12px;color:#b3aabe}.mg-graph-top small{color:#81798f}.mg-graph svg{width:100%;flex:1;min-height:350px;touch-action:none}.mg-graph svg g[data-node]{cursor:pointer}.mg-graph text{font-size:14px}.mg-graph-bottom{display:flex;justify-content:space-between;align-items:center;padding:16px 20px;font-size:10px;color:#9990a6;gap:10px}.mg-graph-bottom button{background:#25232e;border:1px solid #393441;color:#c3b9d1;padding:8px 10px}.mg-legend{display:flex;justify-content:center;gap:18px;padding:0 0 22px;font-size:10px;color:#a79db7}.mg-legend i{margin-right:6px}.mg-reader{background:#201f28;border-left:1px solid #34323e;padding:24px;display:flex;flex-direction:column;min-width:0}.mg-reader-top{display:flex;align-items:center;justify-content:space-between;font-size:11px;gap:10px}.mg-reader-top button{color:#b3a7c5;background:none;border:0;font-size:10px}.mg-reader h2{font-size:25px;font-weight:500;line-height:1.5;margin:30px 0 22px;overflow-wrap:anywhere}.mg-text{white-space:pre-wrap;font-size:13px;line-height:2.1;color:#bdb6ca;overflow-wrap:anywhere}.mg-text button{background:#3b304f;color:#d3bdf1;border:0;border-radius:4px;font-size:12px;padding:1px 5px}.mg-backlinks{margin-top:auto;padding-top:38px}.mg-backlinks h3{font-size:11px;font-weight:400;color:#9489a6;border-top:1px solid #39333f;padding-top:20px}.mg-backlinks h3 span{float:right}.mg-backlinks>button{display:flex;justify-content:space-between;width:100%;background:none;border:0;color:#c9bed9;padding:12px 0;text-align:left;font-size:12px}.mg-backlinks small,.mg-backlinks p{color:#8b809b;font-size:10px}.mg-save{color:#8c819d;font-size:10px;margin-top:22px}.mg-field{font-size:11px;color:#afa2c0;display:block;margin-top:18px}.mg-field input,.mg-field select,.mg-field textarea{margin-top:8px}.mg-field textarea{height:230px;resize:vertical;line-height:1.9}.mg-tip{font-size:10px;line-height:1.8;color:#a396b4}.mg-warning{color:#efb783;margin-top:8px}.mg-app footer{display:flex;justify-content:space-between;padding-top:22px;color:#857b93;font-size:10px}.mg-app footer button{color:#9a8cae;background:none;border:0;font-size:10px}@media(min-width:1500px){.mg-app{padding-left:max(36px,calc((100vw - 1450px)/2));padding-right:max(36px,calc((100vw - 1450px)/2))}}@media(max-width:1050px){.mg-workspace{grid-template-columns:175px minmax(0,1fr)}.mg-reader{grid-column:1/-1;border-left:0;border-top:1px solid #34323e}.mg-graph svg{max-height:530px}.mg-backlinks{margin-top:20px}}@media(max-width:600px){.mg-app{padding:0 16px 24px}.mg-app header{height:65px;gap:15px}.mg-header-label{display:none}.mg-intro{padding:30px 0;align-items:flex-start;flex-direction:column}.mg-intro h1{font-size:24px}.mg-workspace{display:flex;flex-direction:column}.mg-sidebar{padding:18px}.mg-note{padding:10px}.mg-sidebar-footer{display:none}.mg-graph{border-top:1px solid #34323e}.mg-graph svg{min-height:300px}.mg-reader{padding:24px}.mg-app footer{gap:15px;line-height:1.8}}
</style>

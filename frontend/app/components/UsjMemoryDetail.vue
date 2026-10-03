<script setup lang="ts">
import '~/assets/css/creation.css';
import '~/assets/css/usj-memory.css';
defineProps<{ embedded?: boolean }>();
const asset = useAsset();
const { state, setNote, acceptFriend, placeFriend } = useJourneyCollection();
const { notify } = useDemo();
type Part = 'overview' | 'cafe' | 'block' | 'castle';
const scene = ref<{ resetView: () => void; rotate: (n: number) => void; trigger: (part: Part) => void }>();
const original = ref(false), selected = ref<Part>('overview');
const noteOpen = ref(false), exchangeOpen = ref(false), infoOpen = ref(false), friendSource = ref(false);
const draftNote = ref(''), draftReply = ref('');
const coins = ref(0);
const exchangeDate = computed(() => { const date=new Date(state.value.exchangedAt); return Number.isNaN(date.getTime())?'本機收藏紀錄':date.toLocaleString('zh-TW',{timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}); });
const places: Record<Part, { title: string; text: string }> = {
  overview: { title: '這一天，縮小收藏。', text: '轉一轉，找找照片裡的蘑菇餐廳與城堡。' },
  cafe: { title: '蘑菇餐廳', text: '照片裡最醒目的紅色屋頂。那天在這裡做了什麼？' },
  block: { title: '問號方塊', text: '再碰一下，看看會冒出什麼。' },
  castle: { title: '城堡前的階梯', text: '從這裡回頭看，整個園區都是拍照的角度。' },
};
function choose(part: Part) { original.value = false; selected.value = part; nextTick(() => scene.value?.trigger(part)); }
function openNote() { draftNote.value = state.value.note; noteOpen.value = true; }
function saveNote() { setNote(draftNote.value); noteOpen.value = false; notify('這句回憶已留下'); }
function receive() { acceptFriend(draftReply.value); notify('已交換收藏副本，你的場景仍會保留'); }
function join() { placeFriend(true); original.value = false; exchangeOpen.value = false; notify('James 的旅伴加入了這一站'); }
</script>

<template>
  <div class="usj-detail" :class="{ 'is-embedded': embedded }">
    <div class="usj-detail-toolbar">
      <div class="usj-switch" aria-label="作品與原照片"><button :aria-pressed="!original" @click="original=false">立體場景</button><button :aria-pressed="original" @click="original=true">原照片</button></div>
      <button class="usj-text-button" aria-label="作品來源與製作資訊" @click="infoOpen=true">作品資訊 <span aria-hidden="true">↗</span></button>
    </div>
    <div class="usj-viewport">
      <div v-show="!original" class="usj-model-wrap" :class="{ 'has-companion': state.friendPlaced }"><ClientOnly><UsjScene ref="scene" :companion="state.friendPlaced" @select="selected=$event" @coin="coins++"/><template #fallback><img class="usj-original-image" :src="asset('assets/memory/journey/usj-source.png')" alt="環球影城原照片" /></template></ClientOnly></div>
      <Transition name="usj-photo"><img v-if="original" class="usj-original-image" :src="asset('assets/memory/journey/usj-source.png')" alt="你的原照片：左側蘑菇餐廳、中央階梯、後方城堡與右側山丘" /></Transition>
      <span class="usj-viewport-label">{{ original ? '原本的這一刻' : 'OSAKA · APR 04' }}</span>
      <div v-if="!original" class="usj-camera-controls"><button aria-label="向左轉動場景" @click="scene?.rotate(-0.22)">↶</button><button aria-label="場景回到原視角" @click="selected='overview';scene?.resetView()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M4 9V4h5m11 11v5h-5M4 4l5 5m11 11-5-5M15 4h5v5M4 15v5h5m6-11 5-5M4 20l5-5"/></svg></button><button aria-label="向右轉動場景" @click="scene?.rotate(0.22)">↷</button></div>
      <span v-if="state.friendPlaced && !original" class="usj-present"><i>J</i> James 的旅伴在這裡</span>
    </div>
    <nav v-if="!original" class="usj-landmark-picker" aria-label="探索照片裡的地方"><button v-for="part in (['cafe','block','castle'] as const)" :key="part" :aria-pressed="selected===part" @click="choose(part)">{{ places[part].title }}<span v-if="part==='block'" aria-hidden="true">✦</span></button></nav>
    <div class="usj-detail-caption"><div><h3>{{ original ? '同一張照片，另一種收藏方式。' : places[selected].title }}</h3><p>{{ original ? '原照片與場景保存在一起，隨時都能回來對照。' : places[selected].text }}</p></div><span v-if="coins>0 && selected==='block' && !original" class="usj-coin-count" aria-live="polite">✦ {{ coins }}</span></div>
    <button class="usj-note-line" @click="openNote"><MemoryMotionIcon name="pen"/><span>{{ state.note || '留一句那天的回憶' }}</span><small>{{ state.note ? '編輯' : '選填' }}</small></button>
    <button v-if="state.usjSaved" class="usj-friend-entry" @click="exchangeOpen=true"><span class="usj-friend-avatar">J<i v-if="!state.friendAccepted" /></span><span><b>{{ state.friendAccepted ? '來自 James 的旅伴' : 'James 也留下了這一天' }}</b><small>{{ state.friendPlaced ? '已加入場景 · 查看交換紀錄' : state.friendAccepted ? '已交換 · 可以邀請旅伴加入這個場景' : '同行朋友想用景點旅伴，交換你的場景收藏' }}</small></span><span aria-hidden="true">↗</span></button>

    <CreationDialog v-model="noteOpen" title="留一句那天的回憶"><label class="usj-input-label" for="usj-note">環球影城 · 04.06</label><textarea id="usj-note" v-model="draftNote" class="usj-textarea" maxlength="240" placeholder="例如：從蘑菇餐廳出來，又站在這裡拍了一張。"/><p class="usj-subtle">只留在自己的旅行收藏裡。{{ draftNote.length }} / 240</p><template #footer><button class="creation-primary" @click="saveNote">保存這句話</button></template></CreationDialog>
    <CreationDialog v-model="exchangeOpen" :title="state.friendAccepted ? '你們交換的這一天' : '來自同行朋友的交換'">
      <div class="usj-same-trip"><span class="usj-friend-avatar">J</span><div><b>James<span>同行朋友</span></b><p>關西旅行 · 環球影城 · 2026.04.06</p></div></div>
      <div class="usj-exchange-pair"><div><img :src="asset('assets/memory/journey/usj-scene-preview.png')" alt="你的環球影城場景積木"/><b>你的場景積木</b><small>Scott 的照片</small></div><span aria-hidden="true">⇄</span><div><button @click="friendSource=!friendSource" :aria-label="friendSource ? '查看James的旅伴作品' : '查看James的示範原照片'"><img :src="asset(friendSource ? 'assets/memory/references/usj-nintendo-source.png' : 'assets/memory/usj-companion-test.png')" :alt="friendSource ? 'James的示範原照片' : 'James的紅帽吊帶褲景點旅伴'"/><span>{{ friendSource ? '看旅伴' : '看原照' }} ↗</span></button><b>James 的景點旅伴</b><small>另一張照片 · 同一個地方</small></div></div>
      <blockquote class="usj-friend-message">「同一天拍的照片，我把它做成了穿吊帶褲的旅伴。讓他去你的場景逛逛？」<small>James 留給你的話</small></blockquote>
      <template v-if="!state.friendAccepted"><label class="usj-input-label" for="usj-reply">回一句話 <small>選填</small></label><textarea id="usj-reply" v-model="draftReply" class="usj-textarea" maxlength="240" placeholder="下次換你帶路！"/><p class="usj-subtle">交換的是收藏副本，雙方都會保留原本的作品。</p></template>
      <template v-else><blockquote v-if="state.friendReply" class="usj-friend-message is-reply">「{{ state.friendReply }}」<small>你的回覆</small></blockquote><div class="usj-exchange-status"><MemoryMotionIcon name="check"/>已收藏 · James → 你<span>環球影城</span></div><p class="usj-subtle">這位旅伴與你的場景會一起保存在同一站。</p></template>
      <p v-if="state.friendAccepted" class="usj-subtle">交換時間 · {{ exchangeDate }}</p>
      <small class="usj-demo-note">同行身分與交換為示範情境；紀錄只存於這個瀏覽器，不會發送訊息。</small>
      <template #footer><button v-if="!state.friendAccepted" class="creation-primary" @click="receive">交換收藏副本 <span aria-hidden="true">⇄</span></button><button v-else-if="!state.friendPlaced" class="creation-primary" @click="join">讓旅伴加入場景 <span aria-hidden="true">＋</span></button><template v-else><button class="creation-secondary" @click="placeFriend(false);exchangeOpen=false">先收回收藏</button><button class="creation-primary" @click="exchangeOpen=false">回到場景</button></template></template>
    </CreationDialog>
    <CreationDialog v-model="infoOpen" title="這件作品的來源"><div class="usj-source-info"><img :src="asset('assets/memory/journey/usj-source.png')" alt="使用者提供的本次環球影城照片"/><h3>環球影城 · 場景積木</h3><p>來自這張照片的蘑菇餐廳、階梯、城堡與山丘。原照片完整保留，可隨時切換查看。</p><dl><dt>旅程歸屬</dt><dd>關西旅行 → 大阪環球影城</dd><dt>收藏狀態</dt><dd>{{ state.usjSaved ? '已加入 Memory Atlas' : '尚未加入 Memory Atlas' }}</dd><dt>同行作品</dt><dd>{{ state.friendAccepted ? 'James 的景點旅伴 · 來自另一張照片' : '尚未交換' }}</dd></dl><p class="usj-subtle">這是預先製作的互動模型，示範照片轉場景的體驗，並非即時 AI 或實景 3D 重建。日期、同行角色與交換是示範資料。</p></div></CreationDialog>
  </div>
</template>

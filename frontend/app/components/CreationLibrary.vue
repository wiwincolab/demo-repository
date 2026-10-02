<script setup lang="ts">
import { creationFriends, type CreationWork, type CreationExchange } from '~/data/creation';
const open = defineModel<boolean>({ default: false });
const props = defineProps<{ startTab: 'collection' | 'history' }>();
const emit = defineEmits<{ select: [work: CreationWork] }>();
const { works, exchanges, resolve, friends } = useCreation();
const { activeId, activeTrip } = useTripContext();
const { savedStops: kansaiStops, state: journey, collectionCount: kansaiCount } = useJourneyCollection();
const showJourney = computed(()=>activeId.value==='kansai');
const savedStops = computed(()=>showJourney.value ? kansaiStops.value : []);
const journeyCount = computed(()=>showJourney.value ? kansaiCount.value : 0);
const hasFriend = computed(()=>showJourney.value && journey.value.friendAccepted);
const asset = useAsset();
const tab = ref('collection'), reply = ref('');
const selected = ref<CreationExchange | null>(null);
const friend = (id: string) => friends.value.find(f=>f.id===id) || {...(creationFriends.find(f => f.id === id) || creationFriends[2]!),companion:false};
const status = { pending: '等待接受', accepted: '已完成', cancelled: '已撤回', declined: '已婉拒' };
const date = (value: string) => { const parsed=new Date(value); return Number.isNaN(parsed.getTime())?'本機交換紀錄':new Intl.DateTimeFormat('zh-TW', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Taipei' }).format(parsed); };
watch(open, value => { if (value) { tab.value = props.startTab; selected.value = null; reply.value = ''; } });
function pick(work: CreationWork) { emit('select', work); open.value = false; }
function openStop(id:string){open.value=false;navigateTo('/atlas?journey=kansai&stop='+id);}
</script>
<template>
  <CreationDialog v-model="open" :title="selected ? '交換紀錄' : (activeTrip?.title || '這趟旅行') + ' · 收藏'">
    <template v-if="!selected">
      <div class="creation-segment"><button :aria-pressed="tab === 'collection'" @click="tab = 'collection'">我的收藏 · {{ works.length + journeyCount }}</button><button :aria-pressed="tab === 'history'" @click="tab = 'history'">交換紀錄 · {{ exchanges.length + Number(hasFriend) }}</button></div>
      <div v-if="tab === 'collection'" class="creation-library-grid">
        <p v-if="!works.length && !journeyCount" class="creation-empty">這趟旅行還沒有作品。選一張照片，開始留下回憶。</p>
        <button v-for="stop in savedStops" :key="'journey-'+stop.id" @click="openStop(stop.id)"><img :src="asset(stop.image)" :alt="stop.name+'・'+stop.formatLabel" loading="lazy"/><b>{{ stop.formatLabel }}</b><small>{{ stop.name }}</small><span class="creation-origin">關西旅行 · 在地圖上查看 ↗</span></button>
        <button v-if="hasFriend" @click="openStop('usj')"><img :src="asset('assets/memory/usj-companion-test.png')" alt="James的景點旅伴"/><b>景點限定旅伴</b><small>大阪環球影城</small><span class="creation-origin">↔ 同行 · James 交換給你</span></button>
        <button v-for="work in works" :key="work.id" @click="pick(work)"><img :src="asset('assets/memory/' + work.image)" :alt="work.title" loading="lazy"><b>{{ work.title }}</b><small>{{ work.location }}</small><span v-if="work.receivedFrom" class="creation-origin">{{ friend(work.receivedFrom).companion ? '↔ 同行' : '⇄' }} {{ friend(work.receivedFrom).name }} 交換給你</span><span v-else class="creation-origin">你的作品</span></button>
      </div>
      <div v-else class="creation-history">
        <p class="creation-muted">每次交換，都留下一個人和一段話。</p>
        <button v-if="hasFriend" @click="openStop('usj')"><span class="creation-avatar" style="background:#e7efde">J</span><span><b>James <i>同行</i></b><small>環球影城 · {{ journey.exchangedAt ? date(journey.exchangedAt) : '本機交換紀錄' }}</small><small>場景積木 ⇄ 景點限定旅伴</small></span><em class="accepted">在地圖上查看 ›</em></button>
        <button v-for="exchange in exchanges" :key="exchange.id" @click="selected = exchange; reply = ''">
          <span class="creation-avatar" :style="{ background: friend(exchange.friendId).color }">{{ friend(exchange.friendId).initial }}</span>
          <span><b>{{ friend(exchange.friendId).name }} <i v-if="friend(exchange.friendId).companion">同行</i></b><small>{{ exchange.direction === 'received' ? '邀請你交換' : '你發起的交換' }} · {{ date(exchange.createdAt) }}</small><small>{{ exchange.outgoing.title }} ⇄ {{ exchange.incoming.title }}</small></span><em :class="exchange.status">{{ status[exchange.status] }} ›</em>
        </button>
        <p v-if="!exchanges.length && !hasFriend" class="creation-empty">還沒有交換紀錄，從喜歡的作品開始吧。</p>
      </div>
    </template>
    <template v-else>
      <button class="creation-text-button" @click="selected = null">← 所有交換</button>
      <div v-if="friend(selected.friendId).companion" class="creation-companion"><span>↔</span><div><b>與 {{ friend(selected.friendId).name }} 的同行紀念</b><small>{{ friend(selected.friendId).trip }}</small></div></div>
      <CreationUnwrap v-if="selected.status === 'accepted'" :key="selected.id" :image="asset('assets/memory/' + selected.incoming.image)" :friend="friend(selected.friendId).name" :companion="friend(selected.friendId).companion" :message="selected.direction === 'received' ? selected.note : selected.reply" />
      <div v-else class="creation-trade-pair"><figure><img :src="asset('assets/memory/' + selected.outgoing.image)" :alt="selected.outgoing.title"><figcaption><small>你的收藏副本</small><b>{{ selected.outgoing.title }}</b></figcaption></figure><span>⇄</span><figure><img :src="asset('assets/memory/' + selected.incoming.image)" :alt="selected.incoming.title"><figcaption><small>{{ friend(selected.friendId).name }} 的收藏副本</small><b>{{ selected.incoming.title }}</b></figcaption></figure></div>
      <blockquote v-if="selected.note" class="creation-message">「{{ selected.note }}」<small>{{ selected.direction === 'received' ? friend(selected.friendId).name : '你' }} 的留言</small></blockquote>
      <blockquote v-if="selected.reply" class="creation-message">「{{ selected.reply }}」<small>{{ selected.direction === 'received' ? '你' : friend(selected.friendId).name }} 的回覆</small></blockquote>
      <dl class="creation-details"><div><dt>狀態</dt><dd>{{ status[selected.status] }}</dd></div><div><dt>原創作者</dt><dd>{{ selected.incoming.creator }}</dd></div><div><dt>作品地點</dt><dd>{{ selected.incoming.location }}</dd></div><div><dt>邀請時間</dt><dd>{{ date(selected.createdAt) }}</dd></div><div v-if="selected.resolvedAt"><dt>處理時間</dt><dd>{{ date(selected.resolvedAt) }}</dd></div></dl>
      <template v-if="selected.status === 'pending' && selected.direction === 'received'"><label class="creation-label" for="exchange-reply">回一句話 <span>選填</span></label><textarea id="exchange-reply" v-model="reply" rows="2" maxlength="160" class="creation-input" placeholder="一起旅行的回憶，收到了。" /></template>
      <p class="creation-muted">本機示範紀錄 · 不會傳送通知給真實朋友。</p>
    </template>
    <template v-if="selected?.status === 'pending'" #footer>
      <template v-if="selected.direction === 'received'"><button class="creation-secondary" @click="resolve(selected.id, 'declined', reply)">婉拒</button><button class="creation-primary" @click="resolve(selected.id, 'accepted', reply)">接受交換</button></template>
      <template v-else><button class="creation-secondary" @click="resolve(selected.id, 'cancelled')">撤回邀請</button><button class="creation-primary" @click="resolve(selected.id, 'accepted', '收到，謝謝你的旅行作品！')">模擬朋友接受</button></template>
    </template>
  </CreationDialog>
</template>

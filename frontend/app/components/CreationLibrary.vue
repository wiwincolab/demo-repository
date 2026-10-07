<script setup lang="ts">
import { creationFriends, type CreationWork, type CreationExchange } from '~/data/creation';
const open = defineModel<boolean>({ default: false });
const props = defineProps<{ startTab: 'collection' | 'history' }>();
const emit = defineEmits<{ select: [work: CreationWork]; exchange: [work: CreationWork]; generate: [photoId: string]; browse: [] }>();
const { collected, exchanges, resolve, friends, photos: sourcePhotos } = useCreation();
const { activeId, activeTrip } = useTripContext();
const { state: journey } = useJourneyCollection();
const showJourney = computed(()=>activeId.value==='kansai');
const hasFriend = computed(()=>showJourney.value && journey.value.friendAccepted);
// 只有自己做的與交換來的；範例在創作頁的風格預覽與收集冊的圖鑑裡看
const displayedWorks = collected;
const asset = useCreationAsset();
const tab = ref('collection'), reply = ref('');
const selected = ref<CreationExchange | null>(null);
const selectedWork = ref<CreationWork | null>(null);
const friend = (id: string) => friends.value.find(f=>f.id===id) || {...(creationFriends.find(f => f.id === id) || creationFriends[2]!),companion:false};
const status = { pending: '等待接受', accepted: '已完成', cancelled: '已撤回', declined: '已婉拒' };
const date = (value: string) => { const parsed=new Date(value); return Number.isNaN(parsed.getTime())?'交換紀錄':new Intl.DateTimeFormat('zh-TW', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Taipei' }).format(parsed); };
watch(open, value => { if (value) { tab.value = props.startTab; selected.value = null; selectedWork.value = null; reply.value = ''; } });
function pick(work: CreationWork) { selectedWork.value = work; }
function viewWork() { if (!selectedWork.value) return; emit('select', selectedWork.value); open.value = false; }
function exchangeWork() { if (!selectedWork.value) return; emit('exchange', selectedWork.value); open.value = false; }
function generate(photoId: string) { emit('generate', photoId); open.value = false; }
function browse() { emit('browse'); open.value = false; }
function openStop(id:string){open.value=false;navigateTo('/atlas?journey=kansai&stop='+id);}
</script>
<template>
  <CreationDialog v-model="open" :title="selected ? '交換紀錄' : selectedWork ? 'AI 作品' : (activeTrip?.title || '這趟旅行') + ' · 本次作品'">
    <template v-if="!selected && !selectedWork">
      <div class="creation-segment"><button :aria-pressed="tab === 'collection'" @click="tab = 'collection'">本次作品 · {{ displayedWorks.length }}</button><button :aria-pressed="tab === 'history'" @click="tab = 'history'">交換紀錄 · {{ exchanges.length + Number(hasFriend) }}</button></div>
      <div v-if="tab === 'collection'" class="creation-library-sections">
        <section class="creation-source-library" aria-labelledby="source-library-title">
          <div class="creation-library-title"><span><small>ORIGINAL PHOTOS</small><h3 id="source-library-title">原風景照片</h3></span><em>{{ sourcePhotos.length }} 張</em></div>
          <div class="creation-source-track">
            <article v-for="photo in sourcePhotos" :key="photo.id"><span :class="{ 'creation-cropped-source': photo.sourceCrop }"><img :src="asset('assets/memory/' + photo.source)" :alt="photo.title" /></span><div><b>{{ photo.title }}</b><small>{{ photo.location }}</small><button @click="generate(photo.id)">去生成 <i>✦</i></button></div></article>
          </div>
        </section>
        <button class="creation-library-bridge" @click="browse"><span>＋</span> 去生成新的 AI 作品</button>
        <section class="creation-ai-library" aria-labelledby="ai-library-title">
          <div class="creation-library-title"><span><small>AI CREATIONS</small><h3 id="ai-library-title">AI 旅行收藏</h3></span><em>點作品可交換</em></div>
          <div class="creation-library-grid">
            <button v-for="work in displayedWorks" :key="work.id" @click="pick(work)"><CreationArtwork :work="work" :alt="work.title" compact /><b>{{ work.title }}</b><small>{{ work.location }}</small><span v-if="work.receivedFrom" class="creation-origin">{{ friend(work.receivedFrom).companion ? '↔ 同行' : '⇄' }} {{ friend(work.receivedFrom).name }} 交換給你</span><span v-else class="creation-origin">{{ work.creator === 'AI 示範' ? '範例收藏' : '你的 AI 作品' }}</span></button>
          </div>
          <p v-if="!displayedWorks.length" class="creation-empty">還沒有 AI 作品。從上方選一張原照開始。</p>
        </section>
      </div>
      <div v-else class="creation-history">
        <p class="creation-muted">每次交換，都留下一個人和一段話。</p>
        <button v-if="hasFriend" @click="openStop('usj')"><span class="creation-avatar" style="background:#e7efde">J</span><span><b>James <i>同行</i></b><small>環球影城 · {{ journey.exchangedAt ? date(journey.exchangedAt) : '交換紀錄' }}</small><small>場景積木 ⇄ 景點限定旅伴</small></span><em class="accepted">在地圖上查看 ›</em></button>
        <button v-for="exchange in exchanges" :key="exchange.id" @click="selected = exchange; reply = ''">
          <span class="creation-avatar" :style="{ background: friend(exchange.friendId).color }">{{ friend(exchange.friendId).initial }}</span>
          <span><b>{{ friend(exchange.friendId).name }} <i v-if="friend(exchange.friendId).companion">同行</i></b><small>{{ exchange.direction === 'received' ? '邀請你交換' : '你發起的交換' }} · {{ date(exchange.createdAt) }}</small><small>{{ exchange.outgoing.title }} ⇄ {{ exchange.incoming.title }}</small></span><em :class="exchange.status">{{ status[exchange.status] }} ›</em>
        </button>
        <p v-if="!exchanges.length && !hasFriend" class="creation-empty">還沒有交換紀錄，從喜歡的作品開始吧。</p>
      </div>
    </template>
    <template v-else-if="selected">
      <button class="creation-text-button" @click="selected = null">← 所有交換</button>
      <div v-if="friend(selected.friendId).companion" class="creation-companion"><span>↔</span><div><b>與 {{ friend(selected.friendId).name }} 的同行紀念</b><small>{{ friend(selected.friendId).trip }}</small></div></div>
      <CreationUnwrap v-if="selected.status === 'accepted'" :key="selected.id" :image="asset('assets/memory/' + selected.incoming.image)" :friend="friend(selected.friendId).name" :companion="friend(selected.friendId).companion" :message="selected.direction === 'received' ? selected.note : selected.reply" />
      <div v-else class="creation-trade-pair"><figure><CreationArtwork :work="selected.outgoing" :alt="selected.outgoing.title" compact /><figcaption><small>你的收藏副本</small><b>{{ selected.outgoing.title }}</b></figcaption></figure><span>⇄</span><figure><CreationArtwork :work="selected.incoming" :alt="selected.incoming.title" compact /><figcaption><small>{{ friend(selected.friendId).name }} 的收藏副本</small><b>{{ selected.incoming.title }}</b></figcaption></figure></div>
      <blockquote v-if="selected.note" class="creation-message">「{{ selected.note }}」<small>{{ selected.direction === 'received' ? friend(selected.friendId).name : '你' }} 的留言</small></blockquote>
      <blockquote v-if="selected.reply" class="creation-message">「{{ selected.reply }}」<small>{{ selected.direction === 'received' ? '你' : friend(selected.friendId).name }} 的回覆</small></blockquote>
      <dl class="creation-details"><div><dt>狀態</dt><dd>{{ status[selected.status] }}</dd></div><div><dt>原創作者</dt><dd>{{ selected.incoming.creator }}</dd></div><div><dt>作品地點</dt><dd>{{ selected.incoming.location }}</dd></div><div><dt>邀請時間</dt><dd>{{ date(selected.createdAt) }}</dd></div><div v-if="selected.resolvedAt"><dt>處理時間</dt><dd>{{ date(selected.resolvedAt) }}</dd></div></dl>
      <template v-if="selected.status === 'pending' && selected.direction === 'received'"><label class="creation-label" for="exchange-reply">回一句話 <span>選填</span></label><textarea id="exchange-reply" v-model="reply" rows="2" maxlength="160" class="creation-input" placeholder="一起旅行的回憶，收到了。" /></template>
      <p class="creation-muted">交換的是收藏副本，原作品與來源資訊都會保留。</p>
    </template>
    <template v-else-if="selectedWork">
      <button class="creation-text-button" @click="selectedWork = null">← 回到本次作品</button>
      <div class="creation-library-focus"><CreationArtwork :work="selectedWork" :alt="selectedWork.title" /><div><span class="creation-eyebrow">{{ selectedWork.creator === 'AI 示範' ? '範例收藏' : '你的 AI 作品' }}</span><h3>{{ selectedWork.title }}</h3><p>{{ selectedWork.location }}</p><small>交換的是收藏副本，原作品與來源資訊都會保留。</small></div></div>
    </template>
    <template v-if="selectedWork || selected?.status === 'pending'" #footer>
      <template v-if="selectedWork"><button class="creation-secondary" @click="viewWork">查看作品</button><button class="creation-primary creation-exchange-primary" @click="exchangeWork"><span aria-hidden="true">⇄</span> 交換這件作品</button></template>
      <template v-else-if="selected?.direction === 'received'"><button class="creation-secondary" @click="resolve(selected.id, 'declined', reply)">婉拒</button><button class="creation-primary" @click="resolve(selected.id, 'accepted', reply)">接受交換</button></template>
      <template v-else><button class="creation-secondary" @click="resolve(selected!.id, 'cancelled')">撤回邀請</button><button class="creation-primary" @click="resolve(selected!.id, 'accepted', '收到，謝謝你的旅行作品！')">查看朋友回覆</button></template>
    </template>
  </CreationDialog>
</template>

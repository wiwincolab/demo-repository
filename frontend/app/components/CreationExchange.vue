<script setup lang="ts">
import { exchangeOffers, type CreationWork, type CreationExchange } from '~/data/creation';
const open = defineModel<boolean>({ default: false });
const props = defineProps<{ work: CreationWork }>();
const asset = useAsset();
const { request, resolve, friends } = useCreation();
const { activeId } = useTripContext();
const friendId = ref('yu'), offerId = ref('pin'), note = ref('');
const stage = ref<'choose' | 'review' | 'sent'>('choose');
const receipt = ref<CreationExchange | null>(null);
const friend = computed(() => friends.value.find(f => f.id === friendId.value) || friends.value[0]!);
const offers = computed(() => exchangeOffers(activeId.value, friend.value.name));
const offer = computed(() => offers.value.find(work=>work.id===offerId.value) || offers.value[0]!);
watch(open, value => { if (value) { stage.value = 'choose'; note.value = ''; receipt.value = null; friendId.value=friends.value[0]!.id;offerId.value=''; } });
function send() { if(!offer.value)return;receipt.value = request(friend.value.id, props.work, offer.value, note.value); if(receipt.value)stage.value = 'sent'; }
</script>
<template>
  <CreationDialog v-model="open" :title="stage === 'choose' ? '與朋友交換' : stage === 'review' ? '確認這次交換' : '交換邀請'">
    <template v-if="stage === 'choose'">
      <p class="creation-lead">你的風景，換一個朋友的視角。</p>
      <p class="creation-muted">使用示範收藏體驗交換，不會傳送給真人。</p>
      <label class="creation-label">想跟誰交換？</label>
      <div class="creation-friends">
        <button v-for="person in friends" :key="person.id" :aria-pressed="friendId === person.id" @click="friendId = person.id">
          <span class="creation-avatar" :style="{ background: person.color }">{{ person.initial }}</span><b>{{ person.name }}</b><small>{{ person.companion ? '同行朋友' : '旅行好友' }}</small>
        </button>
      </div>
      <div v-if="friend.companion" class="creation-companion"><span>↔</span><div><b>一起旅行的人，有共同的記憶</b><small>{{ friend.trip }} · {{ friend.date }}</small></div></div>
      <p v-else class="creation-muted">不同的旅程，也能交換彼此喜歡的風景。</p>
      <label class="creation-label">挑一件 {{ friend.name }} 的作品</label>
      <div class="creation-offers">
        <button v-for="item in offers" :key="item.id" :aria-pressed="offer?.id === item.id" @click="offerId = item.id">
          <img :src="asset('assets/memory/' + item.image)" :alt="item.title" loading="lazy"><span>{{ item.title }}</span><small>{{ item.location }}</small>
        </button>
      </div>
      <label class="creation-label" for="exchange-note">留句話給 {{ friend.name }} <span>選填</span></label>
      <textarea id="exchange-note" v-model="note" class="creation-input" rows="3" maxlength="160" placeholder="還記得那天一起排隊的時候嗎？" />
      <div class="creation-count">{{ note.length }} / 160</div>
    </template>
    <template v-else>
      <div v-if="stage === 'sent'" class="creation-receipt-head" :class="{ 'is-complete': receipt?.status === 'accepted' }">
        <span>{{ receipt?.status === 'accepted' ? '✓' : '↗' }}</span>
        <h3>{{ receipt?.status === 'accepted' ? '交換完成，一起的回憶多了一件。' : '邀請已準備好，等待朋友接受。' }}</h3>
        <p>{{ receipt?.status === 'accepted' ? '作品已收進「我的收藏」，來源與留言也會一起保留。' : '邀請已準備好，看看朋友會和你交換哪一份回憶。' }}</p>
      </div>
      <CreationUnwrap v-if="receipt?.status === 'accepted'" :image="asset('assets/memory/' + offer.image)" :friend="friend.name" :companion="friend.companion" :message="receipt.reply" />
      <div v-else class="creation-trade-pair"><figure><CreationArtwork :work="work" :alt="work.title" compact /><figcaption><small>你送出的收藏副本</small><b>{{ work.title }}</b></figcaption></figure><span>⇄</span><figure><CreationArtwork :work="offer" :alt="offer.title" compact /><figcaption><small>來自 {{ friend.name }}</small><b>{{ offer.title }}</b></figcaption></figure></div>
      <div v-if="friend.companion" class="creation-companion"><span>↔</span><div><b>同行限定紀念標記</b><small>{{ friend.trip }} · {{ friend.name }} 與你</small></div></div>
      <blockquote v-if="note" class="creation-message">「{{ note }}」<small>你留給 {{ friend.name }} 的話</small></blockquote>
      <p class="creation-muted">交換的是收藏副本，雙方保留原作。每件收到的作品都會記錄原創作者、交換對象、時間與留言。</p>
    </template>
    <template #footer>
      <template v-if="stage === 'choose'"><button class="creation-primary" :disabled="!offer" @click="stage = 'review'">預覽交換內容 <span>→</span></button></template>
      <template v-else-if="stage === 'review'"><button class="creation-secondary" @click="stage = 'choose'">返回</button><button class="creation-primary" @click="send">送出交換邀請</button></template>
      <template v-else-if="receipt?.status === 'pending'"><button class="creation-secondary" @click="open = false">稍後查看</button><button class="creation-primary" @click="resolve(receipt.id, 'accepted', '收到啦！把我們一起走過的地方收好。')">查看 {{ friend.name }} 的回覆</button></template>
      <button v-else class="creation-primary" @click="open = false">完成</button>
    </template>
  </CreationDialog>
</template>

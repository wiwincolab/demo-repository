<script setup lang="ts">
const open = defineModel<boolean>({ default: false });
const props = defineProps<{
    image: string;
    location: string;
    styleId: string;
    photoId?: string;
}>();
const dialog = ref<HTMLDialogElement>();
const text = ref(''), attachment = ref(true), link = ref(false), published = ref(false);
const feedback = ref('');
const audience = ref('任何人');
const prompts = ['你會選哪種風格？', '你也去過這裡嗎？', '想跟誰一起去？'];
function addPrompt(prompt: string) {
    text.value = (text.value.trimEnd() + '\n\n' + prompt).slice(0, 500);
}
const { notify } = useDemo();
const { activeId } = useTripContext();
const drafts = useState<Record<string, { text: string; styleId: string; location: string; attachment: boolean; link: boolean; audience: string }>>('creation-demo-thread-drafts', () => ({}));
const draftKey = computed(()=>`${activeId.value || 'unassigned'}:${props.photoId || props.location}:${props.styleId}`);
const base = useRuntimeConfig().app.baseURL;
let opener: HTMLElement | null = null;
const shareURL = computed(() => {
    if (!import.meta.client)
        return '';
    const url = new URL(base + 'memory', window.location.origin);
    url.searchParams.set('style', props.styleId);
    if(activeId.value)url.searchParams.set('trip',activeId.value);
    if(props.photoId)url.searchParams.set('photo',props.photoId);
    return url.href;
});
watch(open, async (value) => {
    await nextTick();
    if (value) {
        opener = document.activeElement as HTMLElement;
        text.value = '把 ' + props.location.split(' · ')[0] + ' 捨不得忘記的一刻，留成一張回憶。\n\n同一個地方，不同的旅行作品。你會選哪一種？\n#旅行回憶 #去趣';
        attachment.value = true;
        link.value = false;
        published.value = false;
        feedback.value = '';
        audience.value = '任何人';
        try {
            const draft = drafts.value[draftKey.value];
            if (draft?.styleId === props.styleId && draft?.location === props.location && typeof draft.text === 'string') {
                text.value = draft.text.slice(0, 500);
                attachment.value = draft.attachment !== false;
                link.value = draft.link === true;
                if (['任何人', '你追蹤的人', '僅限提及的帳號'].includes(draft.audience)) audience.value = draft.audience;
            }
        }
        catch { }
        if (!dialog.value?.open)
            dialog.value?.showModal();
    }
    else {
        dialog.value?.close();
        opener?.focus();
    }
});
function save() { drafts.value[draftKey.value] = { text: text.value, styleId: props.styleId, location: props.location, attachment: attachment.value, link: link.value, audience: audience.value }; open.value = false; notify('串文草稿已儲存'); }
function publish() { if (!text.value.trim() && !attachment.value) {
    feedback.value = '請加入文字或回憶圖片。';
    return;
} ; published.value = true; }
async function copy() { try {
    await navigator.clipboard.writeText(text.value + (link.value ? '\n' + shareURL.value : ''));
    feedback.value = '已複製串文，可自行貼到 Threads。';
}
catch {
    feedback.value = '瀏覽器未允許複製，請選取文字自行複製。';
} }
onBeforeUnmount(() => dialog.value?.close());
</script>
<template>
  <dialog ref="dialog" class="threads-composer" aria-labelledby="composer-title" @cancel.prevent="open = false" @close="open = false">
    <header class="composer-header">
      <button @click="open = false">取消</button>
      <h2 id="composer-title">新串文</h2>
      <button @click="save">存草稿</button>
    </header>
    <div class="composer-notice">Threads 發文預覽 · 尚未發佈</div>
    <template v-if="!published">
      <div class="thread-body">
        <div class="thread-avatar" aria-hidden="true">你</div>
        <div class="thread-content">
          <div class="thread-author">an.travels <span>小安</span></div>
          <label class="sr-only" for="thread-text">串文內容</label>
          <textarea id="thread-text" v-model="text" maxlength="500" placeholder="這趟旅行，有什麼想說的？" />
          <div v-if="attachment" class="thread-attachment">
            <img :src="image" alt="將分享的回憶作品">
            <button aria-label="移除貼文圖片" @click="attachment = false">×</button>
          </div>
          <button v-else class="restore-art" @click="attachment = true">＋ 加回回憶作品</button>
          <span class="thread-count">{{ text.length }} / 500</span>
          <details class="thread-topic-picker"><summary>加一句，讓朋友想接話</summary><button v-for="prompt in prompts" :key="prompt" @click="addPrompt(prompt)">{{ prompt }}</button></details>
        </div>
      </div>
      <div class="thread-options">
        <label>
          <span>
            <b>附上這個地點的靈感</b>
            <small>朋友可以欣賞公開示範作品</small>
          </span>
          <input v-model="link" type="checkbox">
        </label>
        <div v-if="link" id="thread-link-card">
          <span>chicTrip · {{ location }}</span>
          <small>公開示範作品，不含你的照片或行程</small>
        </div>
      </div>
      <p class="page-note" role="status">{{ feedback }}</p>
      <footer class="composer-footer">
        <label class="thread-audience">誰可以回覆<select v-model="audience" aria-label="誰可以回覆"><option>任何人</option><option>你追蹤的人</option><option>僅限提及的帳號</option></select></label>
        <button @click="publish">預覽貼文</button>
      </footer>
    </template>
    <template v-else>
      <div class="thread-success">
        <span>✓</span>
        <h3>你的串文，看起來會像這樣。</h3>
        <p>預覽完成，尚未發送到 Threads。</p>
      </div>
      <article class="published-post">
        <div class="thread-author"><span class="thread-avatar">安</span>an.travels <small>剛剛</small></div>
        <p>{{ text }}</p>
        <img v-if="attachment" :src="image" alt="串文中的回憶作品">
        <a v-if="link" :href="shareURL" target="_blank" rel="noopener">{{ location }} · 看看回憶風格 ↗</a>
        <div class="post-reactions" aria-hidden="true">♡　♧　⇄　↗</div>
        <small class="thread-audience-result">{{ audience }}可以回覆 · 尚未實際發佈</small>
      </article>
      <div class="published-actions">
        <button @click="published = false">返回編輯</button>
        <button @click="copy">複製串文</button>
        <a v-if="attachment" :href="image" download>下載圖片 ↓</a>
      </div>
      <p class="page-note" role="status">{{ feedback }}</p>
    </template>
  </dialog>
</template>


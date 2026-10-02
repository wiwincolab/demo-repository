<script setup lang="ts">
import data from '~/data/content.json';
const doc = ref('canvas'), ta = ref(0), storyTa = ref('all'), flow = ref(0);
const canvas = computed(() => data.canvases[ta.value]!);
const stories = computed(() => data.stories.stories.filter(s => storyTa.value === 'all' || s.audience === storyTa.value));
const groups = [{ title: '任務', key: 'jobs' }, { title: '痛點', key: 'pains' }, { title: '期待收穫', key: 'gains' }] as const;
const services = [{ title: '產品與服務', key: 'services' }, { title: '如何減輕痛點', key: 'relievers' }, { title: '如何創造收穫', key: 'creators' }] as const;
const steps = [{ title: '建立行程', detail: '有出遊意圖，開始準備' }, { title: '邀旅伴共編', detail: '朋友一起加入規劃' }, { title: '個別選購 eSIM', detail: '購買人數決定福利' }, { title: '解鎖回憶創作', detail: '使用者自行決定是否分享' }, { title: '朋友找到靈感', detail: '進入自己的行程，再量測啟用' }];
</script>
<template>
  <section class="screen active" aria-labelledby="proposal-title">
    <div class="page-heading">
      <span class="eyebrow">給組員的討論版</span>
      <h1 id="proposal-title">從使用者，到商業價值。</h1>
      <p>分開看 TA、故事與效益，每次聚焦一件事。</p>
    </div>
    <div class="proposal-tabs">
      <button v-for="tab in [{ value: 'canvas', name: '價值主張' }, { value: 'stories', name: 'User Story' }, { value: 'business', name: '商業模式' }]" :key="tab.value" :aria-pressed="doc === tab.value" @click="doc = tab.value">{{ tab.name }}</button>
    </div>
    <template v-if="doc === 'canvas'">
      <div class="audience-select">
        <label for="canvas-ta">選一個使用情境</label>
        <select id="canvas-ta" v-model.number="ta">
          <option v-for="(c, i) in data.canvases" :key="i" :value="i">{{ c.number }} {{ c.ta }}{{ i === 3 ? ' · 分享者' : i === 4 ? ' · 觀看者' : '' }}</option>
        </select>
      </div>
      <div class="panel">
        <span class="tag">需求與價值均為待驗證假設</span>
        <p class="promise">{{ canvas.promise }}</p>
        <p class="muted">{{ canvas.scenario }}</p>
      </div>
      <div class="panel">
        <h2>使用者想完成什麼？</h2>
        <div v-for="g in groups" :key="g.key" class="canvas-group">
          <h3>{{ g.title }}</h3>
          <ol>
            <li v-for="text in canvas[g.key]" :key="text">{{ text }}</li>
          </ol>
        </div>
      </div>
      <div class="panel">
        <h2>我們提供的價值</h2>
        <div v-for="g in services" :key="g.key" class="canvas-group">
          <h3>{{ g.title }}</h3>
          <ol>
            <li v-for="text in canvas[g.key]" :key="text">{{ text }}</li>
          </ol>
        </div>
      </div>
      <details class="panel">
        <summary>如何驗證？與 eSIM 有什麼關係？</summary>
        <p>{{ canvas.fit }}</p>
        <p>{{ canvas.test }}</p>
        <p>{{ canvas.business }}</p>
        <p v-for="text in canvas.assumptions" :key="text" class="small-note">{{ text }}</p>
      </details>
      <p class="page-note">框架參考 <a href="https://www.strategyzer.com/library/the-value-proposition-canvas" target="_blank" rel="noopener">Strategyzer Value Proposition Canvas ↗</a></p>
    </template>
    <template v-else-if="doc === 'stories'">
      <div class="audience-select">
        <label for="story-ta">依 TA 篩選 · {{ stories.length }} 則故事</label>
        <select id="story-ta" v-model="storyTa">
          <option value="all">全部 TA</option>
          <option v-for="a in data.stories.audiences" :key="a.id" :value="a.id">{{ a.title }}</option>
        </select>
      </div>
      <p class="page-note">As a / I want / So that；驗收以 Given / When / Then 撰寫。這是規格草案。</p>
      <details v-for="s in stories" :key="s.id" class="story-card">
        <summary>
          <span><small>{{ s.id }} · {{ s.priority }}</small>{{ s.title }}</span>
        </summary>
        <div class="story-sentence"><b>身為</b> {{ s.role }}，<br><b>我想要</b> {{ s.want }}，<br><b>以便</b> {{ s.benefit }}。</div>
        <p class="metric">{{ s.context }}</p>
        <section v-for="scenario in s.scenarios" :key="scenario.id" class="acceptance">
          <h3>{{ scenario.id }} · {{ scenario.title }} <span class="mock">{{ scenario.kind }}</span></h3>
          <dl>
            <dt>Given · 前提</dt>
            <dd>{{ scenario.given }}</dd>
            <dt>When · 操作</dt>
            <dd>{{ scenario.when }}</dd>
            <dt>Then · 預期結果</dt>
            <dd>{{ scenario.then }}</dd>
          </dl>
        </section>
        <section class="acceptance">
          <h3>例外處理</h3>
          <p class="metric">{{ s.exception }}</p>
          <h3>邊界條件</h3>
          <p class="metric">{{ s.boundary }}</p>
        </section>
        <p class="metric">量測：{{ s.metric }}</p>
        <div class="canvas-group">
          <h3>業務規則</h3>
          <ol>
            <li v-for="rule in s.rules" :key="rule">{{ rule }}</li>
          </ol>
        </div>
      </details>
    </template>
    <template v-else>
      <div class="panel">
        <div class="row">
          <h2>每趟旅行的貢獻毛利</h2>
          <span class="mock">Mock Data</span>
        </div>
        <p class="muted">少一點單張毛利，換取整團訂單的機會。</p>
        <div v-for="bar in [{ label: '一般購買', n: 80, scale: 33.3 }, { label: '4 人組隊', n: 240, scale: 100 }]" :key="bar.label" class="bar-row">
          <div class="bar-label">
            <span>{{ bar.label }}</span>
            <b>{{ 'NT$' + bar.n }}</b>
          </div>
          <div class="bar-track" :style="{ width: bar.scale + '%' }">
            <div class="bar-fill" />
          </div>
        </div>
        <table class="stats-table">
          <thead>
            <tr>
              <th>比較項目</th>
              <th>一般</th>
              <th>組隊</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>eSIM 訂單</td>
              <td>1 張</td>
              <td>4 張</td>
            </tr>
            <tr>
              <td>單張貢獻毛利</td>
              <td>NT$80</td>
              <td>NT$60</td>
            </tr>
            <tr>
              <td>新增使用者</td>
              <td>0 人</td>
              <td>3 人</td>
            </tr>
          </tbody>
        </table>
        <p class="small-note">簡化試算先扣每張 NT$20 折扣；額外流量、點數兌換與生圖成本尚未計入，不能當成淨利預測。</p>
      </div>
      <div class="panel">
        <h2>轉換從一份行程開始</h2>
        <div v-for="(step, i) in steps" :key="step.title" class="flow-node" :class="{ current: i <= flow }">
          <span>{{ i + 1 }}</span>
          <div>
            <strong>{{ step.title }}</strong>
            <p>{{ step.detail }}</p>
          </div>
        </div>
        <button class="secondary" @click="flow = (flow + 1) % 5">{{ flow === 4 ? '重新播放' : '下一步' }}</button>
      </div>
      <div class="panel">
        <h2>雙方都得到什麼？</h2>
        <div class="canvas-group">
          <h3>消費者</h3>
          <p>看得懂實付差額；朋友自由共編，購買後獲得上網優惠與回憶創作。</p>
        </div>
        <div class="canvas-group">
          <h3>去趣</h3>
          <p>提高行程到 eSIM 的購買機會，透過旅伴與分享接觸新用戶。</p>
        </div>
        <p class="small-note">需量測增量訂單、獎勵成本及回訪，不能只比較 1 張與 4 張。</p>
      </div>
    </template>
  </section>
</template>


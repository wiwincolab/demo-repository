# chicTrip Nuxt 前端

以團隊 repo 的東京手機版 Demo 為基礎重建，保留原本品牌、行程資料和圖片；新程式全部放在 `frontend/`。不依賴後端，AI、付款及社群發文均為可操作的模擬。

## 啟動

需要 Node.js 24 LTS 與 npm。

```sh
npm ci
npm run dev
```

開啟 http://127.0.0.1:8780/trips 。先選旅程，再進入行程、eSIM 或 AI 創作。Nuxt 4.4.8、Vue 與相關版本已固定在 lockfile，避免安裝時版本漂移。

## 分頁

| 路徑 | 功能 |
| --- | --- |
| `/trips` | 我的行程：東京、關西、富士山，選擇後保留目前旅程 |
| `/trip` | 所選旅程的每日清單／地圖、景點詳情、邀請旅伴、局部替換比較及復原 |
| `/planner` | 地圖圈選或點選景點、偏好輸入、規則式草案預覽與本機儲存 |
| `/esim` | 使用習慣、流量推薦、示範購買、多人優惠與剩餘流量點數試算 |
| `/memory` | 所選旅程的照片 → 相符作品形式 → 本次作品、交換及 Threads 模擬 |
| `/proposal` | 原版價值主張、客群與 User Story 說明 |
| `/atlas` | 跨旅程收藏、單次／期間沉浸回顧；城市漫遊保留立體地圖與交通模型 |

根目錄會導向 `/trips`，亦可接收 `/#trip`、`/#esim`、`/#memory` 等舊式入口。未選旅程時先顯示選擇入口；`?trip=kansai` 可指定旅程。`/memory/usj` 固定屬於關西。Atlas 的 `?journey=fuji` 只改瀏覽範圍，不改目前旅程。

## 以行程為單位（2026-10-03）

- `app/data/trips.ts` 定義旅程及路線；`useTripContext.ts` 管理目前旅程。layout 必須保留 NuxtPage 掛載，否則首次未選旅程時導航會凍結。
- 行程微調、旅伴、購買及用量保存在 `chictrip-demo-by-trip-v2` sessionStorage，依 tripId 分開；圈選草案也使用分旅程的 key。
- `creation.ts` 的 CreationPhoto 將照片與旅程、可預覽的形式綁定。切換形式不更換照片。東京尚未出發，照片／收藏顯示空態；上傳只預覽原檔，不冒用範例生成。
- 收藏、交換保存在 `chictrip-ai-creation-v2` localStorage，含 tripId/photoId。舊 v1 可辨識資料依原圖歸回原旅程，保留舊儲存，不依當前選擇硬塞。交換作品另存 sourceTripId，保留來源；Threads 草稿也分旅程。
- Atlas 依期間入口：`/atlas?scope=period`；單關西入口：`/atlas?journey=kansai&stop=usj`。只有已完成旅程進入今年／上半年回顧，不把交換來的異地收藏當作本人足跡。
- `data/recap.ts` 將作品按地點聚合；`MemoryRecap.vue` 提供每段 8 秒照片播放、小幅鏡頭／指標視差、按需打開收藏、對應同行留言與結尾回顧。1.4 秒後出現探索提示；打開收藏即暫停，使用者按繼續才前進。減少動態預設暫停。
- 照片動態沒有深度重建；USJ 仍是預製 Three.js 場景。AI、朋友交換及 Threads 仍是本機模擬。

本輪驗證產物在外層 `outputs/trip-first-2026-10-02/`，包含資料測試、完整交換／切旅程、eSIM 隔離與桌面／320／390px 回顧檢查。設計參考與互動節奏見同目錄 `recap-design.md`。

## 維護方式

- `app/pages/`：每個分頁自己的狀態與操作流程。
- `app/components/`：共用視窗、景點卡片、組隊面板、地圖、分享編輯器。
- `app/composables/useDemo.ts`：跨分頁的旅伴、購買、行程微調狀態；以 Nuxt `useState` 管理，不另外引入大型狀態框架。
- `app/utils/commerce.ts`：流量方案、優惠和點數規則，可獨立測試。
- `app/utils/map.ts`：離線地圖投影及圈選判斷。
- `app/data/content.json`：原版東京行程、客群及提案內容。
- `app/data/memory-catalog.ts`：預覽名稱、比例、說明與圖片對應。
- `app/data/memory-formats.json`：六種生成形式的統一規格與提示詞。
- `app/data/generation-history/`：已保存的生成提示詞與參照紀錄。
- `public/assets/`、`public/atlas-assets/`：既有圖片與資料；`references/` 保存吉祥物和測試參照照片。
- `public/vendor/`：既有 MapLibre 與 Three.js，僅在回憶地圖載入。
- `app/assets/css/base.css`、`memory.css`：原版視覺樣式；`nuxt.css`：Nuxt 元件及新增流程樣式。

目前 `/memory` 已改為 AI Image Creation，六種形式為：貼紙卡、專業攝影、旅行票根、琺瑯徽章、場景積木、景點限定旅伴。歷史攝影詩頁／明信片的 prompt 與素材仍保留。新的格式契約為 `app/data/creation-format-contract.json`，執行時資料為 `app/data/creation.ts`；詳見 [功能盤點與 Demo 流程](AI-IMAGE-CREATION.md)。京都與環球影城作品各自標明地點，不假設皆由富士山照片生成。

收藏與交換由 `useCreation.ts` 保存於 localStorage；預設是交換收藏副本、保留原作。所有交換與 Threads 發文只在本機模擬。副功能由 `CreationDialog` 按需開啟，手機主畫面不展開全部流程。3D 場景沿用本機 vendored Three.js，並不從圖像自動重建模型。

## 模擬範圍

圈選會實際判斷選取的景點，但排程依預設規則產生，並未呼叫 LLM。局部微調示範雨天室內替換，先比較再確認，亦可復原。草案保存在此瀏覽器，與原本東京五日示範分開。

邀請共編與購買人數分開計算，只有已模擬購買的人會計入優惠。方案及回饋比例是展示設定，未串接金流或電信服務。使用者照片只在本機預覽，創作顯示預先生成的作品；Threads 視窗不會實際發文。

回憶地圖底圖使用 OpenFreeMap，需要網路與 WebGL；東京行程地圖使用既有離線資料。交通路徑為示意，並非導航。建築亮起依底圖可取得的建築輪廓呈現，不代表精確的地標模型。照片來源及授權標示沿用原版資產。

## 檢查與靜態輸出

`/memory/` 的六種互動收藏從作品上的按鈕開啟，手機使用底部視窗。新增 GSAP 動畫與獨立透明素材，具體操作、素材提示詞及原型限制見 [AI Image Creation 功能盤點](AI-IMAGE-CREATION.md)。互動排列／蓋章／拼装狀態不跨視窗保存；收藏與交換來源仍保存於本機。

```sh
npm test
npm run typecheck
npm run build
```

`build` 已設定為 Nuxt 預先渲染，產物在 `.output/public/`。目前測試覆蓋六格式與資產對應、多人優惠、點數、還原資料檢核、圈選及投影；另以手機尺寸對照原版，檢查改程、組隊、分享、排程儲存和回憶地圖流程。

GitHub Pages 若部署在 `https://<account>.github.io/demo-repository/`，建置時需設定路徑：

```powershell
$env:NUXT_APP_BASE_URL = '/demo-repository/'
npm run build
```

將 `.output/public/` 作為 Pages 的發布目錄。Nuxt 版本目前未接入團隊主站的部署流程；提交原始碼不會將既有主站替換成 Nuxt。參考 [Nuxt 靜態部署說明](https://nuxt.com/docs/4.x/getting-started/prerendering)。

## 來源核對

已核對 GitHub 團隊版 `d27ee9c27d63ae21b68b15eedb591b49cf6807e0` 的手機版入口、行程資料和主要樣式，與本機 `lagacy/mobile-trip/` 的對應內容一致。因此以既有素材重建 Vue 元件，並保留六種已討論的生圖形式；未導入後來的朋友旅程劇情。

2026-10-03 已透過終端 Git 同步遠端 `d27ee9c`，保留團隊將舊 Demo 升為主站的變更。Nuxt 新增項目集中在 `frontend/`，不改其他目錄或部署設定。

## 環球影城創作與旅程收藏

最新操作入口：`/memory/usj/`。作品可保存到 `/atlas?journey=kansai&stop=usj`；按地點組織不同形式收藏，含同行交換、留言與旅伴入場。此為本輪重新批准的有界示範情境，非先前撤回的完整朋友 Demo。具體操作、檔案分工與本機模擬界線見 [AI Image Creation 功能盤點](AI-IMAGE-CREATION.md#環球影城--關西旅程收藏2026-10-02)。原城市地圖可從「城市回顧」分頁或 `/atlas?view=cities` 開啟。

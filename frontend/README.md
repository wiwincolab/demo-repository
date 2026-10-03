# chicTrip Nuxt 前端

以團隊 repo 的東京手機版 Demo 為基礎重建，保留原本品牌、行程資料和圖片；新程式全部放在 `frontend/`。不依賴後端，AI、付款及社群發文均為可操作的模擬。

## 啟動

正式 Demo：https://wiwincolab.github.io/demo-repository/ 。`main` 推送由 `.github/workflows/nuxt-pages.yml` 自動檢查、建置並部署此 Nuxt 專案；部署成功後可用 `/demo-repository/build-info.json` 核對 commit。根目錄舊 HTML 保留但不包含在新站產物。

需要 Node.js 24 LTS 與 npm。

```sh
npm ci
npm run dev
```

開啟 http://127.0.0.1:8780/trips 。先選旅程，再進入行程、eSIM 或 AI 創作。Nuxt 4.4.8、Vue 與相關版本已固定在 lockfile，避免安裝時版本漂移。

## 分頁

提案頁已自 Demo 移除，底部導覽保留行程、eSIM、AI 創作、回憶地圖四項。原頁面歸檔至工作區 `work/atlas-clear-glass-2026-10-03/proposal.vue.archived`。

建築 Highlight：`AtlasPlaza.vue` 的 `landmarkContours` 依 `painted-v1/park.png` 的 1086×1448 座標描繪四區外形。SVG 非縮放筆畫保持手機可見粗細，常亮底線搭配 8 秒流動亮段；建築區也能點擊，關閉詳情後焦點回對應名稱牌。這是 2D 光效，尚未拆圖製作 2.5D。

Atlas 入口視覺：`atlas-painted-park.css` 管理清澈 Liquid Glass 視覺（1.5px 模糊、低透明填色），不是物理折射。四張小縮圖不加黃色高光，僅背景建築保留輪廓光；GSAP 安排入口與定位圖標出場。流光參考：https://codepen.io/Mahe76/pen/PoyWvXX 。

| 路徑 | 功能 |
| --- | --- |
| `/trips` | 我的行程：東京、關西、富士山，選擇後保留目前旅程 |
| `/trip` | 所選旅程的每日清單／地圖、景點詳情、邀請旅伴、局部替換比較及復原 |
| `/planner` | 地圖圈選或點選景點、偏好輸入、規則式草案預覽與本機儲存 |
| `/esim` | 使用習慣、流量推薦、示範購買、多人優惠與剩餘流量點數試算 |
| `/memory` | 所選旅程的照片 → 相符作品形式 → 本次作品、交換及 Threads 模擬 |
| `/atlas` | 跨旅程收藏、單次／期間沉浸回顧；城市漫遊保留立體地圖與交通模型 |

根目錄會導向 `/trips`，亦可接收 `/#trip`、`/#esim`、`/#memory` 等舊式入口。未選旅程時先顯示選擇入口；`?trip=kansai` 可指定旅程。`/memory/usj` 固定屬於關西。Atlas 的 `?journey=fuji` 只改瀏覽範圍，不改目前旅程。

## 以行程為單位（2026-10-03）

### eSIM 官方價格與流量顧問（2026-10-03）

**追加互動與福利視覺：** `EsimPlanCarousel.vue` 以三段式級別和卡片拖曳切換方案，支援觸控、滑鼠、左右按鈕及方向鍵；已購方案鎖定，滑到邊界回彈，取消手勢不改方案，非當前卡片 inert。切換只改選購方案，不改 AI 需求。`EsimBenefits.vue` 使用既有照片／票根加貼紙 SVG 拼貼，以及流量卡→點數 SVG；點開既有詳情，無新增 AI 生圖或新的電信福利。

`/esim?trip=tokyo` 主頁保留 AI 流量顧問、目的地方案卡、同行福利與兩個加值入口。固定底部選購；方案比較、每日估算、組隊、回饋、結帳與安裝透過面板展開，不把功能全鋪在主頁。

- **價格依去趣官網選定規格查核**：Docomo (IIJ) 日本 5 天，每日 1GB／每日 2GB／標準吃到飽為 NT$123／208／395（2026-10-03）。2 天旅程明示搭配已查核的 3 天方案。每日重置，不跨日累積；吃到飽每日 10GB 高速，超額降速。來源、原價與全部 3／5 天價格見 [ESIM-PRICING.md](ESIM-PRICING.md)，資料集中 `app/data/esim-catalog.ts`。
- **AI 顧問**：三題逐步回答，可點選答案或輸入文字，能返回修改。整理動畫後產出輕度／中度／重度建議、理由、官方方案與價格，採用後更新主頁。以本機規則模擬，不呼叫 LLM；無法判讀時提示補充或使用選項。程式在 `EsimAdvisor.vue`／`utils/esim-advisor.ts`。
- 「比較方案」與需求估算分開；手選不會改變上網習慣，已購方案鎖定。每日各站估算僅包含導航／查詢；總需求另含社群與移動空檔，不是逐站數字相加。
- **組隊是競賽提案**：加入同行不算購買；2 人加 500MB、3 人加 30 點、4 人每人省 $20。主頁採旅伴席位與下一個福利，結帳將官網參考價及提案折扣分列。
- 確认方案 → 裝置確認 → 不扣款示範訂單 → 安裝說明；狀態按行程保存在 sessionStorage。舊價格快照遷移成查核後價格，未串接付款或電信。
- **旅後點數是獨立假設情境**：每日重置產品不能直接套剩餘總量。點數面板以假設 10GB 總量型產品剩 2.6GB 換 26 點示範，明示不是本張 eSIM 的餘額。已完成行程購買後可示範領取，阻止重複領取；沒有真實發點。
- AI 創作是加值提案，入口連到相同行程 `/memory`，既有六種風格不變。

本輪檢查圖在工作區 `outputs/esim-advisor-2026-10-03/`；原版備份 `work/esim-advisor-2026-10-03/`。本機規則、官方價格與天數匹配納入單元測試。

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

## 2026-10-03 關西五日路線修正

行程資料集中於 `app/data/kansai.ts`，依 [喜鴻海京都五日](https://www.besttour.com.tw/itinerary/OSA05BR270104ES) 改編：神戶 → 天橋立／伊根 → 京都／奈良／大阪 → USJ → 關西空港。保留 Demo 的 2026/4/3–4/7 日期，原網頁團期為 2027/1/4–1/8；時間及交通為估算，不是已訂行程。住宿依序神戶、京都、環球影城周邊兩晚。第五天以中午航班情境直接安排機場。

照片放在 `public/assets/photos/kansai/`，`credits.json` 記錄原始網址與來源。北野、伊根採官方觀光照片，其餘主要沿用喜鴻景點實景；USJ 使用使用者提供的實景，不採下載的宣傳合成圖。參考素材保留，未使用不代表可自由商用。圖片來源可從景點詳情開啟。

旅程收藏同步為七站並校正日期，USJ 是 4/6；京都改為清水寺實景。舊野宮神社生成作品保留為 referenceOnly，不再出現在這趟旅行的照片選單或錯綁到清水寺。六種創作形式未變。

既有立體城市漫遊仍在 `/atlas?view=cities`，其跨國路線是獨立歷史示範，不等同此關西五日行程。

## Memory Atlas 回憶樂園入口（2026-10-03）

**目前生效：高品質插畫園區＋獨立互動入口。** 已接入使用者確認的 `public/assets/atlas-plaza/painted-v1/park.png`，來源與 prompt 同目錄保存。先前 SVG 園區元件、v3 主圖及布景素材均保留；新樣式集中 `app/assets/css/atlas-painted-park.css`，覆寫共用廣場／dialog 樣式。手機預設完整總覽，四入口同屏；「近看園區」切換成可左右滑動的細節視野，「全園總覽」復原。桌面維持完整可讀園區。

每個入口是獨立 button：定案 v3 縮影、名稱、箭頭、定位點皆指向相同入口。縮影外框用 5 秒 CSS 黃金色呼吸並錯開四區節奏，GSAP 每次只提示一個定位點；hover／focus 加強暖光、抬升名稱牌和箭頭，按下有回饋。點擊後平移到該區再開 dialog，返回恢復視野與焦點；原城市／收藏路由、積木／換裝「即將開放」範圍不變。支援暫停、reduced-motion、觸控、鍵盤與拖曳防誤觸。背景仍是完整 2D 插畫，獨立入口與光影在 DOM 疊層，沒有 WebGL 或已拆出可旋轉建築的假定。

本輪型別、靜態建置通過；320／390px 手機總覽無水平溢出，四入口／近看往返／暫停已驗證。以下段落保留先前探索過程，與此段衝突時以此段及最新使用者要求為準。

**最新：遊戲大廳方向。** 使用者否決導覽圖形式，入口已改為「回憶廣場」2.5D 大廳。四張確認的 v3 插畫保留，`AtlasLobbyStage.vue` 繪製有厚度的地坪、設施台座與中央圓壇；去趣旅伴位於中央。選擇入口後 GSAP 在約 0.55 秒內移動角色並推近場景，再開啟入口彈窗，返回時鏡頭與角色回到中央；連點有防護，減少動態時直接抵達。這是 SVG／CSS 分層場景，不是真實自由移動的 3D 世界。舊地圖元件保留，不再引用。以下 v3 素材及功能範圍仍有效。

**追加：左右探索的園區。** 依使用者提供的 USJ 園區參考，現在改為中央湖畔、環園步道、四區庭院與植栽邊界，取代四個展示台。桌面場景寬 1280px、手機 720px（窄手機 650px），僅場景左右滑動，頁首與底部導覽固定於原版面。支援原生觸控橫滑、滑鼠拖曳、左右按鈕與方向鍵；拖曳超過 6px 不觸發入口。初始視野在中央，進入設施只平移視野，關閉恢復原位置。四張圖不得放大：一般手機由 142px 縮至 136px、窄手機 120→116px，桌面上限 216→190px；移除 hover 與鏡頭放大。這項決策取代上一段的「推近場景」。

`/atlas` 預設開啟回憶樂園。四個獨立插畫入口由前端步道串接，手機左右滑動探索；使用者已確認 v3 細線旅行插畫，保留去趣藍白介面與少量暖黃色，不使用整張島嶼背景代替入口。

- 立體地圖穿梭 → 說明彈窗 → `/atlas?view=cities`。
- 旅行收集冊 → 說明彈窗 → `/atlas?view=journey`，沿用旅程／期間收藏。
- 場景積木世界、去趣旅伴換裝 → 入口預覽；造鎮與衣櫥尚未實作，等待下一階段需求。
- 舊 `journey`／`scope` 深連結仍直接進入旅程收藏，不改目前選定旅行。

元件 `app/components/AtlasPlaza.vue`、樣式 `app/assets/css/atlas-plaza.css`、入口資料 `app/data/atlas-plaza.ts`。GSAP 管理進場、入口懸停、步道提示與彈窗，離頁清理；提供暫停及系統 reduced-motion。原生 dialog 支援關閉／Escape 與焦點返回。

四張透明 PNG 與完整生成 prompt 位於 `public/assets/atlas-plaza/v3/`；`generation.json` 記錄內建 image_gen 來源。v1、v2 素材保留作歷史參考，不被目前介面引用。廣場只做入口，未假裝造鎮或換裝已完成。

舊地形版本：`AtlasParkMap.vue` 保留作參考，目前使用 `AtlasLobbyStage.vue`，不再引用舊元件。

### 廣場環境裝飾（2026-10-03）

**地形追加：** 園區草坡與岸線連續，四區依高度排列：山水小鎮 70、出發港 40、換裝露台 28、收藏花園 12（330px 園景座標的垂直單位）。數值集中在 `app/data/atlas-plaza.ts` 的 `atlasPlazaElevations`，`AtlasTerrace.vue` 生成石砌立面與石階；園景、主圖及入口同步抬升，手機按園景尺寸等比例縮減。`AtlasLobbyStage.vue` 負責廣域坡地、等高輪廓、湖岸及溪流。這是 2.5D 視覺地形，未新增真實 3D 地形或自由漫遊。保留原本拖曳／入口互動；型別、建置及 320／390px、桌面顯示已核對。

**最新布景方向：一座園區包含四個主題區。** `precincts-v1/` 提供四張獨立的透明園景，主入口 v3 是另疊的圖層，維持原本尺寸。出發港以時鐘／地球儀呈現旅行，小鎮以溪流／苗圃呈現建造，收藏區用閱讀棚架／書櫃，換裝区用棚架／布旗／旅行箱。配色和細線插畫統一，避免四個互不相連的展示卡。

地面 `AtlasLobbyStage.vue` 改用 `terrain-v1/` 草地和淺色石板材質，細線石砌底座、連續路網及中央湖岸保持同一園區。`stone-flower-border.png` 用於路旁銜接。原始參照存為 `terrain-v1/reference-garden.png`；兩資料夾都保存完整 prompt 與生成來源。地面仍由 SVG 描述可維護的輪廓，與獨立 PNG 分層，不是整張不可分割的園區背景，也未加入真實 3D 漫遊功能。

已檢查 320／390px 和桌面；主入口尺寸為 116／136／190px，裝飾不接收點擊，僅世界容器左右滑動。型別與靜態建置通過；截圖見工作區 `outputs/atlas-plaza-2026-10-03/themed-park-*.png`。

`AtlasLobbyDecor.vue` 在可平移世界中獨立放置五張透明插畫：湖畔小橋、銀杏座椅、咖啡小亭、花圃路牌、入口花架。底部錨點對齊湖岸、環園步道及入口；兩側小景避開四張功能圖與標籤。裝飾不接收點擊、沒有可操作的假入口，亦不進入輔助閱讀順序。GSAP 統一處理淡入與湖面細微變化，支援暫停、系統減少動態和離頁清理。

素材在 `public/assets/atlas-plaza/decor-v1/`；`generation.json` 保存每張完整 prompt、v3/town.png 風格參照、內建 image_gen 原始產物路徑。既有四張 v3 不替換、不放大。裝飾是預製 2D 插畫，並非可操控的 3D 設施。
# 場景積木世界（2026-10-03）

回憶廣場 → 場景積木世界 →「進入小鎮」，或直接開啟 `/town/`。
整合使用者提供的東北亞九景 3D Demo：拖曳旋轉、双指／滾輪縮放、九景地圖聚焦、全景復位、日夜光線切換。手機採全畫面與收合式九景選單，返回鈕回到廣場。

這次是現成 3D 展示的整合，尚未加入自由造鎮或與個人收藏連動。`app/pages/town.vue` 負責 App 外框；`public/demos/travel-town/chictrip.css` 負責內頁適配。來源、限制及 Blender 原檔見 [references/travel-town/README.md](references/travel-town/README.md)。

## 吉祥物圖鑑（2026-10-03）

`/wardrobe/` 或「回憶廣場 → 去趣旅伴換裝」可選擇 App 的吉祥物外貌。六款：既有環球影城樂園探險家，以及新生成的富士山看山派、奈良散步家、淺草祭典客、伊根海邊客、神戶港水手。皆為毛氈公仔系列，服裝與道具呼應現有行程景點，非實景照片。

點縮圖只預覽；按「選為我的吉祥物」才套用。`useMascot.ts` 以 Nuxt useState 即時同步頂部頭像，localStorage 的 `chictrip-mascot-v1` 保留選擇；屬於全 App 個人外貌，不因切換行程改變。既有創作作品不會被此設定覆寫。沒有帳號同步或付費解鎖，Demo 六款均可選。

一般頁面原本「競賽概念原型」位置改為 `MascotBadge`，點擊可進圖鑑；全畫面小鎮也有相同入口。手機三欄圖鑑、桌面左右預覽／選擇；支援鍵盤焦點與減少動態。

資料：`app/data/mascots.ts`；UI：`app/pages/wardrobe.vue`。五張新圖及完整提示詞：`public/assets/mascots/`（`generation.json`），使用內建 image_gen，以既有 `assets/memory/usj-companion-test.png` 作身份與風格參照，保留原始產物來源。公開路徑透過 useAsset 適配 GitHub Pages。

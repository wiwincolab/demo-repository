# 東北亞九景：使用者提供的 3D Demo

整合日期：2026-10-03。

- 原始 HTML：`C:/Users/scott/Downloads/Northeast_Asia_Travel_Town_3x3.html`
- 原始 SHA-256：`33EE30EB42752FD15C69F04C67C2DC1C15B8C507D44D003A6F1D9EA8FD5C205F`
- Blender 原檔複本：本目錄 `Northeast_Asia_Travel_Town_3x3.blend`，SHA-256 `C1671201476D77CEFEF209CEA0B02B262A319CA1C4588F4ECEB2E60B05E71F19`。不在 public，因此不會加入網站下載內容。
- 網頁執行版：`public/demos/travel-town/index.html`。保留原有 Three.js、fflate 授權、九個內嵌壓縮模型及操作程式；僅於 head 加入 `chictrip.css`，調整 App 內部介面。

`app/pages/town.vue` 使用獨立 iframe，避免原單檔全域樣式、Three.js 版本與 Nuxt 衝突。只有进入頁面才下載約 12 MB 的完整 Demo；離開會卸載 iframe，原程式提供 pagehide 資源清理。iframe 不允許存取 App 同源資料，只允許腳本及使用者點選官方景點連結。

目前包含：日本六景＋韓國三景、旋轉縮放、九格選擇／景點說明、全景復位、白天／黃昏／夜晚及連續光線滑桿、鍵盤操作、WebGL 載入與重試狀態。

目前不包含：自由建造／拆分建築、AI 即時生成模型、把個人旅程收藏匯入九格、多人共編、儲存視角。這些不以假按鈕呈現。

更新模型時可替換執行 HTML，再加回 head 內的 `./chictrip.css` 連結。不要直接修改壓縮的 Three.js 引擎；要原生重構時需先取得可維護的原始場景程式或重新匯出 GLB。


## 九宮格編輯（2026-10-09）

`public/demos/travel-town/town-editor.js` 提供整個街區拖移交換、地面吸附提示、點選兩格交換、上一步、原始排列。編輯時關閉鏡頭控制，完成後恢復。支援 Pointer Events、拖出範圍回原位、Escape／失焦／取消觸控時還原。固定格位、不旋轉街區；這不是自由造鎮或建築拆解。

原始內嵌 GLB 與 Three.js 引擎保留，執行 HTML 僅載入獨立 editor 並在場景啟動末端提供必要的建構子、場景控制器與 invalidate。更新原始 HTML 時需要重新接上這兩個掛鉤。移動後更新街區位置、景點聚焦範圍、光源與陰影。

單獨開啟頁面使用 localStorage `chictrip:town-layout:v1`；App 內仍維持不含 allow-same-origin 的 sandbox，以 `town.vue` 的來源視窗檢查和完整 0–8 排列驗證處理保存訊息。保存失敗會提示僅在本次保留。上一步紀錄只保留本次操作，最多 30 步。

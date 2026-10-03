# 東北亞九景：使用者提供的 3D Demo

整合日期：2026-10-03。

- 原始 HTML：`C:/Users/scott/Downloads/Northeast_Asia_Travel_Town_3x3.html`
- 原始 SHA-256：`33EE30EB42752FD15C69F04C67C2DC1C15B8C507D44D003A6F1D9EA8FD5C205F`
- Blender 原檔複本：本目錄 `Northeast_Asia_Travel_Town_3x3.blend`，SHA-256 `C1671201476D77CEFEF209CEA0B02B262A319CA1C4588F4ECEB2E60B05E71F19`。不在 public，因此不會加入網站下載內容。
- 網頁執行版：`public/demos/travel-town/index.html`。保留原有 Three.js、fflate 授權、九個內嵌壓縮模型及操作程式；僅於 head 加入 `chictrip.css`，調整 App 內部介面。

`app/pages/town.vue` 使用獨立 iframe，避免原單檔全域樣式、Three.js 版本與 Nuxt 衝突。只有进入頁面才下載約 12 MB 的完整 Demo；離開會卸載 iframe，原程式提供 pagehide 資源清理。iframe 不允許存取 App 同源資料，只允許腳本及使用者點選官方景點連結。

目前包含：日本六景＋韓國三景、旋轉縮放、九格選擇／景點說明、全景復位、白天／黃昏／夜晚及連續光線滑桿、鍵盤操作、WebGL 載入與重試狀態。

目前不包含：自由建造／重新排列、AI 即時生成模型、把個人旅程收藏匯入九格、多人共編、儲存視角。這些不以假按鈕呈現。

更新模型時可替換執行 HTML，再加回 head 內的 `./chictrip.css` 連結。不要直接修改壓縮的 Three.js 引擎；要原生重構時需先取得可維護的原始場景程式或重新匯出 GLB。

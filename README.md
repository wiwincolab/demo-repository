# chicTrip 旅行 Demo

主站使用 `frontend/` 的 Nuxt 版本，包含行程、旅伴 eSIM、AI 創作與回憶廣場。

線上入口：https://wiwincolab.github.io/demo-repository/

| 路徑 | 內容 |
|---|---|
| `/`、`/trips/` | 我的行程 |
| `/esim/?trip=tokyo` | 東京旅程 eSIM |
| `/memory/?trip=kansai` | 關西 AI 回憶創作 |
| `/atlas/` | Memory Atlas 回憶廣場 |

本機開發：在 `frontend/` 執行 `npm ci`、`npm run dev`，開啟 `http://localhost:8780/`。

推送 `main` 後，`.github/workflows/nuxt-pages.yml` 執行型別檢查、測試與 Nuxt 預渲染，再將 `frontend/.output/public` 部署至 GitHub Pages。部署子路徑取自 Pages 設定；`build-info.json` 可核對線上 commit。

詳細操作見 [frontend/README.md](frontend/README.md)。根目錄的舊 HTML、`lagacy/`、`chictrip-v4/` 仍保留作歷史參照，已不作為主站部署內容；舊版說明見 `SITE-README.md`。

# chicTrip eSIM 提案展示

此目錄收錄 Scott 既有 GitHub Pages demo，依團隊約定命名為 **`lagacy`**。它是獨立的舊版展示快照，與 repository 根目錄的團隊提案分開維護。

## 入口

線上入口：[lagacy demo](https://wiwincolab.github.io/demo-repository/lagacy/)。桌機顯示完整提案，800px 以下會自動轉到手機版。

| 頁面 | 相對路徑 |
|---|---|
| 桌機：組隊省、eSIM、商業模式 | [index.html?desktop=1](index.html?desktop=1) |
| 手機產品 Demo | [mobile-trip/index.html](mobile-trip/index.html) |
| 圈選＋自然語言排程 | [circle-trip-planner/index.html](circle-trip-planner/index.html) |
| 立體回憶地圖 | [memory-atlas/index.html](memory-atlas/index.html) |
| 沉浸回憶實驗 | [memory-lab/index.html](memory-lab/index.html) |
| User Story 工作台 | [user-stories.html](user-stories.html) |
| User Story 簡報 | [user-story-slides.html](user-story-slides.html) |
| 價值主張畫布 | [value-proposition-canvas.html](value-proposition-canvas.html) |

## 本機預覽與維護範圍

在此目錄執行 `python -m http.server 8000`，開啟 `http://localhost:8000/`，不需要 npm install 或打包。一般頁面也可直接開啟 HTML；回憶地圖建議以 HTTP 開啟，其詳細地圖需要網路與 WebGL。

所有頁面、樣式、腳本、圖片、vendor 與授權資料均放在 `lagacy/`。保留現有團隊首頁、package.json 與 GitHub Actions；發布沿用既有 Pages workflow。維護此快照時只修改本目錄，不將檔案搬到 repo 根目錄。

本次匯入僅包含原發布 repo 的追蹤檔案，不含原工作區的聊天、研究報告、私照、工具設定、skills、快取或 `.git`。外部地圖服務、素材出處與官方網站連結仍保留。

## 版本來源

- 匯入日：2026-09-12
- 原 repo：[scott0127/chictrip-ai-demo](https://github.com/scott0127/chictrip-ai-demo)
- 目前已發布版本：[3f70575848c8583dc7a0c1b29f2ced29c5e6b2e0](https://github.com/scott0127/chictrip-ai-demo/commit/3f70575848c8583dc7a0c1b29f2ced29c5e6b2e0)
- 保留原目錄結構與功能；僅調整手機回憶的分享連結，指向團隊 `lagacy/mobile-trip/`，並補充匯入說明。
- 原站繼續保留；本次未修改原發布 repo。

## 原型說明

本網站為競賽提案原型，所有方案、福利、流量與成效數字均為模擬或待驗證假設，非官方承諾。

入口：index.html（互動 Demo）
- user-stories.html：User Story 工作台
- user-story-slides.html：User Story 簡報
- value-proposition-canvas.html：價值主張畫布

本目錄不另設發布流程，沿用團隊 repository 現有的 GitHub Pages 部署。

地圖與景點照片授權見 assets/MAP-LICENSE.md 及 assets/PHOTO-LICENSE.md。
此發布包不包含使用者上傳的私人照片、聊天紀錄、專案設定或原始討論文件。
## 手機版（2026-09-08）

- mobile-trip/index.html：手機產品與提案入口，保留原本 4 頁，另加「回憶地圖」第 5 個底部標籤。
- circle-trip-planner/index.html?mobile=1：今日圈選＋自然語言排程的手機版。
- 根目錄 index.html 在 800px 以下會自動進入手機版；?desktop=1 可保留原展示。
- 手機版包含 8 則 User Story 與 5 張情境畫布，為直式閱讀版；既有原始簡報檔仍保留。
- 所有互動、價格、福利均為示範。購買不會付款、照片不會上傳，AI 圖像為版型預覽。
## 立體回憶地圖（2026-09-09）

- memory-atlas/index.html：MapLibre 日本／韓國／香港總回憶。12 段旅程、18 枚地標與興趣貼紙。
- 手機版「回憶」頁可直接進入。詳細圖資需要網路；交通、人物、演出情境及回憶均為模擬。
- 地圖及素材來源見 memory-atlas/README.md。

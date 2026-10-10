# 日韓台交通色彩與票券路網（2026-10-10）

109 張目錄商品中，105 張有實際路線、合作景點或指定停靠點幾何：26 張 `network`、77 張 `partial`、2 張 `venues`。另外 4 張是儲值卡，沒有免費地域範圍。105 張包含 1 張已過期的東武台東・墨田歷史券，介面停用，現行有幾何的商品為 104 張。`public/pass-coverage/report.json`／`report.csv` 逐券列出來源、狀態與缺口，`catalog.json` 保存商品目錄。

## 來源與幾何

`public/transit/*.json` 保留 OSM 軌道位置。`fetch-colours.py RAW_DIR` 依序抓取公開 route 關聯；`prepare.py RAW_DIR` 以軌道／route 的 `colour` 標籤補代表色，未標色的同名區段沿用已確認的同線色彩。沒有可靠色彩來源時顯示灰色及待查核。交通色彩不代表票券適用性。

`fetch-private-rails.py RAW_DIR` 抓日本私鐵；`fetch-pass-networks.py RAW_DIR` 抓日韓台旅客鐵道、纜車、指定巴士／渡輪關聯及車站，依序抓取並保留快取。渡輪兼容 way／relation；鐵路的實體路線 relation 補齊站場的名稱／業者。`pass_rules.py` 依官方商品的營運商、路線、指定終點與搭乘限制選取；預設來源是目錄 `coverageUrl`，營運商另有適用表時由規則 `officialSource` 指定。舊的 `areas` 矩形不再用於票券圖層或自動選點。

`network_geometry.py` 以車站端點沿來源軌道求路徑，只輸出來源 way 的實際座標。為處理並行軌道及車站喉部，圖的端點與同站月台投影可在 45 公尺內連接，但這些連接不輸出為路線。僅保留明列 `passenger_lines` 的旅客列車會車側線，排除車庫與貨運側線。端點距指定軌道超過 600 公尺或來源不連通時，整段保留缺口，不畫直線補洞。保留日文原始名稱、營運商、JR 公司簡稱、正式本線名稱與顯示名稱的對照。

成田線我孫子支線的已核對接點另外允許 12 公尺內端點投影，處理支線端點靠近主線中段但未共用節點的情況；此設定只用在該指定區間，同樣不輸出連接直線。

`coverage.py PASSES_JSON RAW_DIR` 使用 Shapely 2.1.2、pyproj 3.7.2 在公尺投影下產生輪廓，沿實際路網緩衝 700 公尺，合作設施／停靠點用 120 公尺定位圈。保留分離區域與孔洞，不取凸包或矩形。輸出路線簡化容差 8 公尺；輪廓簡化 12 公尺。**輪廓是沿線遊玩規劃輔助，不是官方免費搭乘地域或門票邊界。**

`network` 表示本快照已對照指定路網且沒有已知幾何缺口；搭乘車種、限次、附加費、日期和資格仍依官網。`partial` 只強調取得的路線，逐券列出尚未畫出的巴士、方案接入段等；阿里山本線重建多林隧道未在來源中完整對應，只標兩端站。清境、指定 FunTOUR 團班等缺道路時，只標已核對停靠點。

## 介面與效能

自由搭乘路段用黃色底線，限次往返／單程用橘色虛線，限定直通用紫色，僅可下車用粉色。可靠完整路網選用後，其他路線淡化，適用地鐵保留原色。`partial` 不將尚未匯入的交通誤標為券外。

Taiwan PASS 只合併共通鐵路、所選 1 種都會交通及 1 種景區接駁，不把全部可兌換選項當作同時可用。子項目保留來源與缺口；未選時提示先選已兌換項目。

會津券提供會津田島、蘆之牧溫泉、喜多方三種版本；`index.json` 的 `variants` 指向各自的 GeoJSON，新增兩份替代版本檔，不增加目錄商品數。切換版本獨立載入，出發站一次往返接入段仍標缺口，沒有加入日光券的巴士。京都高雄／京北與若江線只加入 JR 巴士官方適用表中的票券，排除停駛的園福線、金澤市營 Flat Bus。宮島只選 JR 渡輪，富士靜岡券加入駿豆線及駿河灣渡輪，伊勢熊野券加入伊勢鐵道與和歌山電鐵；宜蘭券補齊指定台鐵區段與平溪／深澳支線。

國家交通圖層依視窗載入；票券檔選用時才載入，頁面快取上限 5 張，GPU 繪製路線和輪廓。照片延後載入，開圖不即時呼叫 Overpass。全國／廣域券資料較大，正式環境可啟用 gzip 的獨立 map-data Pod；設定預設停用，見前端 README。

## 重現與驗證

```sh
# RAW_DIR 保留快取；公開 API 更新應單一序列執行。
python scripts/transit/fetch-pass-networks.py /tmp/chictrip-transit
# PASSES_JSON 為 app/data/travel-passes.ts 的 travelPasses JSON 陣列。
python scripts/transit/coverage.py /tmp/chictrip-transit/passes.json /tmp/chictrip-transit
# 小幅修正可只重建指定券，其他目錄項目保留：
COVERAGE_IDS=jr-east-tokunai_pass python scripts/transit/coverage.py /tmp/chictrip-transit/passes.json /tmp/chictrip-transit
python scripts/transit/export.py
python -m unittest discover -s scripts/transit -p test_geometry.py
npm test
npm run typecheck
```

`export.py` 核對預設與替代版本檔的幾何有效、座標範圍、來源及完成狀態，再輸出報表。測試包含東京迪士尼／成田排除、京阪京都券不含大阪、近鐵 1 日券終點、JR 關西迷你不含姬路／和歌山、札幌登別不含洞爺／旭川、阿里山不混入高鐵接駁、Taiwan PASS 任選項目隔離、會津三版本終點、JR 渡輪與巴士業者排除及過期券停用。

OSM 衍生路線與輪廓保留 © OpenStreetMap contributors（ODbL 1.0）。來源 URL、查核日期與 `planningOnly` 保留在各檔 metadata。資料快照不能保證即時營運、現場售票、停駛代行或所有方案變動。

### Mobile ticket payloads

`npm run dev`, `build`, and `generate` prepare `public/pass-coverage/compact/` using `compact-pass-coverage.mjs`. These derived files are ignored by Git. Network paths are grouped by access type and transport, rounded to five decimal places for display, and retain the original eligible OSM way IDs. Planning contours (including holes and disconnected destinations) keep their original coordinates. The full source files remain available for provenance and route tests. The planner loads the compact file with a fallback to the original, caches three tickets, cancels superseded requests, and loads at most three nearby POI regions per viewport (one when zoomed out to a country).

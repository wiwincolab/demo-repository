# 日本 47 都道府縣吉祥物

完成日期：2026-10-09。每個都道府縣至少一張；原有 6 張，本次新增 41 張，共 47 張，缺 0 張。41 張新圖均為 1254 × 1254 PNG，已接入換裝圖鑑；所有 generation.json 記錄的 status 均為 generated。

驗證：47 個都道府縣無重複或缺漏、41 張 PNG 檔案與圖鑑引用一致，npm run typecheck 通過。換裝頁數量改為自動顯示，圖鑑縮圖使用 lazy loading。尚未部署到線上網站。

原有：東京（淺草）、大阪（樂園）、京都（伊根）、兵庫（神戶）、奈良（奈良公園）、山梨（河口湖）。富士山河口湖圖僅計為山梨；靜岡另製茶園主題。

使用內建 image_gen。參考圖：../nara.png 與 ../../memory/references/chictrip-mascot.png。完整提示詞、檔案名稱及生成來源保存在 generation.json。風格：羊毛氈手作公仔、微縮場景、柔光與淺景深；保留黃色向右三角身體、藍色左側與兩隻大白眼睛。

行政區範圍參考：https://www.japan.travel/en/destinations/ 。下列服裝與場景是為本系列設計的地方意象，不是各縣官方吉祥物或傳統服裝考證。

| 都道府縣 | 設計主題 | 預定檔案 |
| --- | --- | --- |
| 北海道 | 薰衣草・乳製品 | hokkaido.png |
| 青森 | 蘋果・睡魔祭 | aomori.png |
| 岩手 | 南部鐵器・平泉 | iwate.png |
| 宮城 | 七夕祭・松島 | miyagi.png |
| 秋田 | 秋田犬・雪屋 | akita.png |
| 山形 | 櫻桃・銀山溫泉 | yamagata.png |
| 福島 | 赤牛玩偶・大內宿 | fukushima.png |
| 茨城 | 粉蝶花・海濱公園 | ibaraki.png |
| 栃木 | 草莓・日光 | tochigi.png |
| 群馬 | 草津溫泉 | gunma.png |
| 埼玉 | 川越老街・地瓜 | saitama.png |
| 千葉 | 花生・銚子海岸 | chiba.png |
| 神奈川 | 鎌倉・繡球花 | kanagawa.png |
| 新潟 | 稻米・佐渡盆舟 | niigata.png |
| 富山 | 立山黑部雪牆 | toyama.png |
| 石川 | 金箔・兼六園 | ishikawa.png |
| 福井 | 恐龍・東尋坊 | fukui.png |
| 長野 | 蘋果・松本城 | nagano.png |
| 岐阜 | 白川鄉合掌屋 | gifu.png |
| 靜岡 | 茶園・富士山 | shizuoka.png |
| 愛知 | 金鯱・名古屋城 | aichi.png |
| 三重 | 珍珠・伊勢海灣 | mie.png |
| 滋賀 | 琵琶湖・彥根城 | shiga.png |
| 和歌山 | 蜜柑・那智瀑布 | wakayama.png |
| 鳥取 | 梨子・鳥取砂丘 | tottori.png |
| 島根 | 注連繩・出雲大社 | shimane.png |
| 岡山 | 桃子・倉敷 | okayama.png |
| 廣島 | 楓葉饅頭・宮島 | hiroshima.png |
| 山口 | 錦帶橋 | yamaguchi.png |
| 德島 | 阿波舞・鳴門漩渦 | tokushima.png |
| 香川 | 烏龍麵・栗林公園 | kagawa.png |
| 愛媛 | 蜜柑・道後溫泉 | ehime.png |
| 高知 | 鳴子・高知城 | kochi.png |
| 福岡 | 拉麵・屋台 | fukuoka.png |
| 佐賀 | 有田燒・熱氣球 | saga.png |
| 長崎 | 長崎蛋糕・港灣 | nagasaki.png |
| 熊本 | 番茄・熊本城・阿蘇 | kumamoto.png |
| 大分 | 別府溫泉 | oita.png |
| 宮崎 | 芒果・青島海岸 | miyazaki.png |
| 鹿兒島 | 紫薯・櫻島 | kagoshima.png |
| 沖繩 | 三線・琉球海岸 | okinawa.png |

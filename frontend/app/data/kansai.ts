import type { Stop, TripDay } from '../types/trip';

export const kansaiReference = {
  url: 'https://www.besttour.com.tw/itinerary/OSA05BR270104ES',
  name: '喜鴻假期｜環遊海京都五日',
  note: '依京阪神奈五日路線改編；保留 2026.04.03–04.07 示範日期。原團期為 2027.01.04–01.08，以下時刻與車程為規劃估算，非訂位紀錄。',
};
export const kansaiPhoto = (file: string, place: string): Stop['photo'] => ({
  src: `assets/photos/kansai/${file === 'kitano' || file === 'ine' ? file + '-official' : file}.jpg`, alt: `${place}實景`,
  source: file === 'kitano' ? 'https://www.feel-kobe.jp/model_course/kitano_ijinkan/' : file === 'ine' ? 'https://www.kyototourism.org/zh-hant/sightseeing/830/' : kansaiReference.url,
  credit: file === 'kitano' ? 'Feel KOBE 神戶官方觀光網站' : file === 'ine' ? 'Another Kyoto 官方旅遊網站' : '喜鴻假期／原攝影著作權人',
  license: '提案參考照片', licenseUrl: '', objectPosition: '50% 50%',
});
function stop(id: number, day: number, name: string, at: [number, number], time: string, stay: string, note: string, file: string, transit: string, range = [40,90]): Stop {
  return {id,day,name,short:name,at,time,stay,note,transit,range,photo:kansaiPhoto(file,name)};
}
export const kansaiDays: TripDay[] = [
  {area:'抵達關西・神戶港的第一晚',english:'KOBE / ARRIVAL',lodging:'神戶市區',transport:'機場入境後搭專車往神戶；本日不再繞回大阪。',stops:[
    stop(0,0,'關西國際機場',[135.244,34.435],'11:55','入境與領行李約 90 分鐘','桃園出發，抵達後先領行李、完成入境，再集合往神戶。','kix','桃園 → 關西空港 · 航程約 2 小時 35 分'),
    stop(1,0,'北野異人館街',[135.1898,34.7012],'15:00','停留 75 分鐘','沿北野坂與洋館街區散步；以街區外觀參觀為主，不把每間洋館都排進去。','kitano','關西空港 → 神戶北野 · 專車約 90 分鐘，另留緩衝'),
    stop(2,0,'神戶 Harborland MOSAIC',[135.185,34.6795],'17:00','停留 90 分鐘','在港邊逛街、吃晚餐。想看夜景，就沿海邊步道等到燈亮。','mosaic','北野 → Harborland · 市區車程約 20–30 分鐘'),
    stop(3,0,'神戶港夜景',[135.1865,34.6801],'19:00','自由散步 30 分鐘','從 MOSAIC 海側看港塔與海洋博物館；累了也可以提早回飯店。','kobe-night','MOSAIC 海側步道 · 步行約 5 分鐘'),
  ]},
  {area:'海之京都・天橋立與伊根',english:'AMANOHASHIDATE / INE',lodging:'京都市區',transport:'07:30 從神戶出發，專車約 3 小時至天橋立；伊根結束後約 2.5–3 小時到京都。',stops:[
    stop(4,1,'天橋立・傘松公園',[135.196,35.582],'11:00','停留 90 分鐘','搭登山電車上山，從北側展望台看天橋立；下山後在府中一帶午餐。','amanohashidate','神戶 → 天橋立府中 · 專車約 3 小時，再搭登山電車'),
    stop(5,1,'伊根灣遊船',[135.2864,35.6686],'14:00','乘船約 25 分鐘；含候船約 45 分鐘','從海面看沿岸舟屋；先到日出碼頭候船，遇停航再改陸上散步。','ine-cruise','天橋立府中 → 伊根灣日出碼頭 · 專車約 35–45 分鐘'),
    stop(6,1,'伊根舟屋',[135.2884,35.6748],'15:00','停留 45 分鐘','在漁村街道與海邊看舟屋，不進入私人住宅。拍完照便啟程往京都。','ine','日出碼頭 → 伊根村落 · 專車約 5–10 分鐘'),
  ]},
  {area:'京都東山・奈良・大阪夜色',english:'KYOTO / NARA / OSAKA',lodging:'環球影城周邊（連住第 1 晚）',transport:'上午京都、下午奈良、傍晚大阪。途中預留午餐與原行程購物停留；夜訪道頓堀可自由選擇。',stops:[
    stop(7,2,'清水寺',[135.785,34.9949],'09:00','停留 75 分鐘','從清水舞台看京都街景，再沿寺內步道散步；不另排未確認開放的設施。','kiyomizu','京都飯店 → 東山 · 專車約 30 分鐘，再步行上坡'),
    stop(8,2,'二年坂・三年坂',[135.7808,34.9967],'10:30','停留 60 分鐘','順著石板坡道逛小店、買點心，午餐後出發前往奈良。','sannenzaka','清水寺 → 三年坂 · 步行約 10 分鐘'),
    stop(9,2,'奈良公園',[135.843,34.685],'14:00','停留 75 分鐘','在公園散步、看鹿。餵食只用鹿仙貝，和野生鹿保持距離。','nara','京都東山 → 奈良 · 專車約 75–90 分鐘'),
    stop(10,2,'道頓堀・心齋橋',[135.5013,34.6687],'19:00','自由活動約 90 分鐘','沿戎橋到心齋橋逛街、自己選晚餐；今晚住環球影城周邊，不再安排另一個遠處商圈。','dotonbori','奈良 → 大阪 · 專車約 60 分鐘；中間預留購物與入住時間'),
  ]},
  {area:'大阪環球影城・留一整天玩',english:'UNIVERSAL STUDIOS JAPAN',lodging:'環球影城周邊（連住第 2 晚）',transport:'依飯店位置步行或搭一小段 JR 前往；晚上回同一間飯店。',stops:[
    {...stop(11,3,'大阪環球影城',[135.4325,34.6679],'09:00','全日約 9 小時','預留一整天遊園，午晚餐在園內自理。超級任天堂世界依當日入場規定與整理券安排，不保證固定時段入場。','usj','飯店 → 園區 · 步行或短程 JR，依住宿位置確認',[300,650]),photo:{src:'assets/memory/journey/usj-source.png',alt:'日本環球影城超級任天堂世界實景',source:'',credit:'使用者提供',license:'原圖保留署名',licenseUrl:'',objectPosition:'50% 50%'}},
  ]},
  {area:'收好行李・從關西空港返台',english:'KANSAI AIRPORT / HOME',transport:'08:30 退房出發，車程約 60–90 分鐘；以中午起飛情境預留約 3 小時辦理登機，不另排市區購物。',stops:[
    stop(12,4,'關西國際機場・返程',[135.244,34.435],'09:55','登機前預留約 3 小時','先報到、托運與安檢，有餘裕再逛機場商店。示範以 12:55 起飛安排，實際以航班通知為準。','kix','環球影城周邊 → 關西空港 · 專車約 60–90 分鐘'),
  ]},
];
export const kansaiRainAlternative = stop(1,0,'北野異人館・館內參觀',[135.1898,34.7012],'15:00','停留 75 分鐘','雨天縮短戶外散策，改參觀萌黃之館室內；另購門票，開館狀況以當日公告為準，保留後續港邊晚餐。','kitano','關西空港 → 神戶北野 · 專車約 90 分鐘，另留緩衝');

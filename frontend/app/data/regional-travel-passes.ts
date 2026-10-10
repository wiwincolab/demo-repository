import type { TravelPass } from './travel-passes.ts';

// Official products checked on 2026-10-10. Polygons are planning approximations,
// not a promise that all transport or attractions in an area are included.
export const regionalTravelPasses: TravelPass[] = [
  {
    "id": "japan-rail",
    "name": "日本全國 JR 周遊券",
    "english": "JAPAN RAIL PASS",
    "region": "日本全國 JR 路線",
    "regionKeys": [
      "全國",
      "北海道",
      "東北",
      "關東",
      "中部／北陸",
      "關西",
      "中國／山陰",
      "四國",
      "九州"
    ],
    "country": "JP",
    "kind": "rail",
    "trips": [],
    "source": "https://japanrailpass.net/en/about_jrp/route/",
    "coverageUrl": "https://japanrailpass.net/en/about_jrp/route/",
    "imageSource": "https://japanrailpass.net/assets/img/about/jr-map.png",
    "imageKind": "map",
    "credit": "JR 集團官方網站",
    "coverage": "JR 集團指定鐵路、地方巴士與宮島渡輪；普通車／綠色車廂與天數依持有方案。",
    "exclusions": "NOZOMI／MIZUHO 須另買指定加購票；私鐵、地鐵、部分觀光列車與高速巴士不包含。沖繩沒有 JR 路線。",
    "areas": [
      [
        [
          139.7,
          41.35
        ],
        [
          141.25,
          41.4
        ],
        [
          145.85,
          43.2
        ],
        [
          145.35,
          44.2
        ],
        [
          141.9,
          45.6
        ],
        [
          140.7,
          44.2
        ],
        [
          139.65,
          42.3
        ]
      ],
      [
        [
          137.8,
          34.85
        ],
        [
          142.2,
          34.85
        ],
        [
          142.2,
          41.6
        ],
        [
          137.8,
          41.6
        ]
      ],
      [
        [
          130.85,
          33.9
        ],
        [
          139.5,
          33.9
        ],
        [
          139.5,
          37.6
        ],
        [
          130.85,
          37.6
        ]
      ],
      [
        [
          132.2,
          32.7
        ],
        [
          134.8,
          32.7
        ],
        [
          134.8,
          34.5
        ],
        [
          132.2,
          34.5
        ]
      ],
      [
        [
          129.45,
          33.3
        ],
        [
          130.7,
          33.95
        ],
        [
          131.8,
          33.65
        ],
        [
          132.05,
          32.5
        ],
        [
          131.2,
          30.95
        ],
        [
          130.2,
          31.0
        ],
        [
          129.3,
          32.5
        ]
      ]
    ],
    "checkedAt": "2026-10-10",
    "image": "assets/passes/japan-rail.png"
  },
  {
    "id": "jr-west-kansaimini",
    "name": "JR 關西迷你周遊券",
    "english": "Kansai Mini Pass",
    "region": "大阪・京都・神戶・奈良",
    "regionKeys": [
      "關西"
    ],
    "country": "JP",
    "kind": "rail",
    "trips": [],
    "source": "https://www.westjr.co.jp/travel-information/en/tickets-passes/jrwest-rail-pass/kansaimini/",
    "coverageUrl": "https://www.westjr.co.jp/travel-information/en/tickets-passes/jrwest-rail-pass/kansaimini/",
    "imageSource": "https://www.westjr.co.jp/travel-information/en/assets/img/tickets-passes/jrwest-rail-pass/img_pass_02.webp",
    "imageKind": "map",
    "credit": "JR 西日本官方網站",
    "coverage": "大阪、京都、神戶與奈良周邊指定 JR 普通／快速列車。",
    "exclusions": "圖上為沿線規劃區域示意；其他業者、區域內景點門票及加價服務不會因此自動包含，請看官方路線與使用條件。",
    "areas": [
      [
        [
          135.1,
          34.45
        ],
        [
          135.9,
          34.45
        ],
        [
          135.9,
          35.15
        ],
        [
          135.1,
          35.15
        ]
      ]
    ],
    "checkedAt": "2026-10-10",
    "image": "assets/passes/jr-west-kansaimini.webp"
  },
  {
    "id": "jr-west-kansai_wide",
    "name": "JR 關西廣域周遊券",
    "english": "Kansai WIDE Area Pass",
    "region": "關西・岡山・高松・鳥取",
    "regionKeys": [
      "關西",
      "中國／山陰",
      "四國"
    ],
    "country": "JP",
    "kind": "rail",
    "trips": [],
    "source": "https://www.westjr.co.jp/travel-information/en/tickets-passes/jrwest-rail-pass/kansai_wide/",
    "coverageUrl": "https://www.westjr.co.jp/travel-information/en/tickets-passes/jrwest-rail-pass/kansai_wide/",
    "imageSource": "https://www.westjr.co.jp/travel-information/en/assets/img/tickets-passes/jrwest-rail-pass/img_pass_03.webp",
    "imageKind": "map",
    "credit": "JR 西日本官方網站",
    "coverage": "關西至岡山、高松、城崎溫泉、天橋立、鳥取、白濱的指定路線；山陽新幹線新大阪至岡山。",
    "exclusions": "圖上為沿線規劃區域示意；其他業者、區域內景點門票及加價服務不會因此自動包含，請看官方路線與使用條件。",
    "areas": [
      [
        [
          133.45,
          33.55
        ],
        [
          136.25,
          33.55
        ],
        [
          136.25,
          35.7
        ],
        [
          133.45,
          35.7
        ]
      ]
    ],
    "checkedAt": "2026-10-10",
    "image": "assets/passes/jr-west-kansai_wide.webp"
  },
  {
    "id": "jr-west-kansai_hiroshima",
    "name": "JR 關西・廣島周遊券",
    "english": "Kansai-Hiroshima Area Pass",
    "region": "關西・岡山・廣島",
    "regionKeys": [
      "關西",
      "中國／山陰",
      "四國"
    ],
    "country": "JP",
    "kind": "rail",
    "trips": [],
    "source": "https://www.westjr.co.jp/travel-information/en/tickets-passes/jrwest-rail-pass/kansai_hiroshima/",
    "coverageUrl": "https://www.westjr.co.jp/travel-information/en/tickets-passes/jrwest-rail-pass/kansai_hiroshima/",
    "imageSource": "https://www.westjr.co.jp/travel-information/en/assets/img/tickets-passes/jrwest-rail-pass/img_pass_04.webp",
    "imageKind": "map",
    "credit": "JR 西日本官方網站",
    "coverage": "關西、岡山、廣島的指定 JR 路線與宮島渡輪；山陽新幹線新大阪至廣島。",
    "exclusions": "圖上為沿線規劃區域示意；其他業者、區域內景點門票及加價服務不會因此自動包含，請看官方路線與使用條件。",
    "areas": [
      [
        [
          132.1,
          33.55
        ],
        [
          136.25,
          33.55
        ],
        [
          136.25,
          35.7
        ],
        [
          132.1,
          35.7
        ]
      ]
    ],
    "checkedAt": "2026-10-10",
    "image": "assets/passes/jr-west-kansai_hiroshima.webp"
  },
  {
    "id": "jr-west-kansai_sanin",
    "name": "JR 關西・山陰周遊券",
    "english": "Kansai-San'in Area Pass",
    "region": "關西・鳥取・島根",
    "regionKeys": [
      "關西",
      "中國／山陰"
    ],
    "country": "JP",
    "kind": "rail",
    "trips": [],
    "source": "https://www.westjr.co.jp/travel-information/en/tickets-passes/jrwest-rail-pass/kansai_sanin/",
    "coverageUrl": "https://www.westjr.co.jp/travel-information/en/tickets-passes/jrwest-rail-pass/kansai_sanin/",
    "imageSource": "https://www.westjr.co.jp/travel-information/en/assets/img/tickets-passes/jrwest-rail-pass/img_pass_05.webp",
    "imageKind": "map",
    "credit": "JR 西日本官方網站",
    "coverage": "關西與鳥取、松江等山陰地區的指定 JR 路線。",
    "exclusions": "圖上為沿線規劃區域示意；其他業者、區域內景點門票及加價服務不會因此自動包含，請看官方路線與使用條件。",
    "areas": [
      [
        [
          131.85,
          33.6
        ],
        [
          136.25,
          33.6
        ],
        [
          136.25,
          35.7
        ],
        [
          131.85,
          35.7
        ]
      ]
    ],
    "checkedAt": "2026-10-10",
    "image": "assets/passes/jr-west-kansai_sanin.webp"
  },
  {
    "id": "jr-west-kansai_hokuriku",
    "name": "JR 關西・北陸周遊券",
    "english": "Kansai-Hokuriku Area Pass",
    "region": "關西・岡山・北陸",
    "regionKeys": [
      "關西",
      "中國／山陰",
      "中部／北陸"
    ],
    "country": "JP",
    "kind": "rail",
    "trips": [],
    "source": "https://www.westjr.co.jp/travel-information/en/tickets-passes/jrwest-rail-pass/kansai_hokuriku/",
    "coverageUrl": "https://www.westjr.co.jp/travel-information/en/tickets-passes/jrwest-rail-pass/kansai_hokuriku/",
    "imageSource": "https://www.westjr.co.jp/travel-information/en/assets/img/tickets-passes/jrwest-rail-pass/img_pass_06.webp",
    "imageKind": "map",
    "credit": "JR 西日本官方網站",
    "coverage": "關西、岡山、鳥取至敦賀、福井、金澤、富山一帶的指定 JR 路線。",
    "exclusions": "圖上為沿線規劃區域示意；其他業者、區域內景點門票及加價服務不會因此自動包含，請看官方路線與使用條件。",
    "areas": [
      [
        [
          133.4,
          33.55
        ],
        [
          137.7,
          33.55
        ],
        [
          137.7,
          37.15
        ],
        [
          133.4,
          37.15
        ]
      ]
    ],
    "checkedAt": "2026-10-10",
    "image": "assets/passes/jr-west-kansai_hokuriku.webp"
  },
  {
    "id": "jr-west-tottorimatsue",
    "name": "JR 鳥取・松江周遊券",
    "english": "Tottori-Matsue Pass",
    "region": "鳥取・松江・出雲",
    "regionKeys": [
      "中國／山陰"
    ],
    "country": "JP",
    "kind": "rail",
    "trips": [],
    "source": "https://www.westjr.co.jp/travel-information/en/tickets-passes/jrwest-rail-pass/tottorimatsue/",
    "coverageUrl": "https://www.westjr.co.jp/travel-information/en/tickets-passes/jrwest-rail-pass/tottorimatsue/",
    "imageSource": "https://www.westjr.co.jp/travel-information/en/assets/img/tickets-passes/jrwest-rail-pass/img_pass_07.webp",
    "imageKind": "map",
    "credit": "JR 西日本官方網站",
    "coverage": "鳥取、松江與出雲等指定 JR 山陰地區列車。",
    "exclusions": "圖上為沿線規劃區域示意；其他業者、區域內景點門票及加價服務不會因此自動包含，請看官方路線與使用條件。",
    "areas": [
      [
        [
          132.5,
          35.0
        ],
        [
          134.65,
          35.0
        ],
        [
          134.65,
          35.7
        ],
        [
          132.5,
          35.7
        ]
      ]
    ],
    "checkedAt": "2026-10-10",
    "image": "assets/passes/jr-west-tottorimatsue.webp"
  },
  {
    "id": "jr-west-sanyo_sanin",
    "name": "JR 山陽・山陰周遊券",
    "english": "Sanyo-San'in Area Pass",
    "region": "關西・中國地方・博多",
    "regionKeys": [
      "關西",
      "中國／山陰",
      "九州"
    ],
    "country": "JP",
    "kind": "rail",
    "trips": [],
    "source": "https://www.westjr.co.jp/travel-information/en/tickets-passes/jrwest-rail-pass/sanyo_sanin/",
    "coverageUrl": "https://www.westjr.co.jp/travel-information/en/tickets-passes/jrwest-rail-pass/sanyo_sanin/",
    "imageSource": "https://www.westjr.co.jp/travel-information/en/assets/img/tickets-passes/jrwest-rail-pass/img_pass_08.webp",
    "imageKind": "map",
    "credit": "JR 西日本官方網站",
    "coverage": "關西、山陽、山陰與博多的指定 JR 路線；山陽新幹線新大阪至博多。",
    "exclusions": "圖上為沿線規劃區域示意；其他業者、區域內景點門票及加價服務不會因此自動包含，請看官方路線與使用條件。",
    "areas": [
      [
        [
          130.2,
          33.3
        ],
        [
          136.25,
          33.3
        ],
        [
          136.25,
          35.7
        ],
        [
          130.2,
          35.7
        ]
      ]
    ],
    "checkedAt": "2026-10-10",
    "image": "assets/passes/jr-west-sanyo_sanin.webp"
  },
  {
    "id": "jr-west-hiroshima_yamaguchi",
    "name": "JR 廣島・山口周遊券",
    "english": "Hiroshima-Yamaguchi Area Pass",
    "region": "廣島・山口・博多",
    "regionKeys": [
      "中國／山陰",
      "九州"
    ],
    "country": "JP",
    "kind": "rail",
    "trips": [],
    "source": "https://www.westjr.co.jp/travel-information/en/tickets-passes/jrwest-rail-pass/hiroshima_yamaguchi/",
    "coverageUrl": "https://www.westjr.co.jp/travel-information/en/tickets-passes/jrwest-rail-pass/hiroshima_yamaguchi/",
    "imageSource": "https://www.westjr.co.jp/travel-information/en/assets/img/tickets-passes/jrwest-rail-pass/img_pass_09.webp",
    "imageKind": "map",
    "credit": "JR 西日本官方網站",
    "coverage": "廣島、山口、博多一帶的指定 JR 路線與宮島渡輪。",
    "exclusions": "圖上為沿線規劃區域示意；其他業者、區域內景點門票及加價服務不會因此自動包含，請看官方路線與使用條件。",
    "areas": [
      [
        [
          130.2,
          33.3
        ],
        [
          133.3,
          33.3
        ],
        [
          133.3,
          34.85
        ],
        [
          130.2,
          34.85
        ]
      ]
    ],
    "checkedAt": "2026-10-10",
    "image": "assets/passes/jr-west-hiroshima_yamaguchi.webp"
  },
  {
    "id": "jr-west-okayama_hiroshima_yamaguchi",
    "name": "JR 岡山・廣島・山口周遊券",
    "english": "Okayama-Hiroshima-Yamaguchi Area Pass",
    "region": "岡山・廣島・山口・博多",
    "regionKeys": [
      "中國／山陰",
      "九州"
    ],
    "country": "JP",
    "kind": "rail",
    "trips": [],
    "source": "https://www.westjr.co.jp/travel-information/en/tickets-passes/jrwest-rail-pass/okayama_hiroshima_yamaguchi/",
    "coverageUrl": "https://www.westjr.co.jp/travel-information/en/tickets-passes/jrwest-rail-pass/okayama_hiroshima_yamaguchi/",
    "imageSource": "https://www.westjr.co.jp/travel-information/en/assets/img/tickets-passes/jrwest-rail-pass/img_pass_10.webp",
    "imageKind": "map",
    "credit": "JR 西日本官方網站",
    "coverage": "岡山、廣島、山口與博多的指定 JR 路線及宮島渡輪。",
    "exclusions": "圖上為沿線規劃區域示意；其他業者、區域內景點門票及加價服務不會因此自動包含，請看官方路線與使用條件。",
    "areas": [
      [
        [
          130.2,
          33.3
        ],
        [
          134.3,
          33.3
        ],
        [
          134.3,
          35.0
        ],
        [
          130.2,
          35.0
        ]
      ]
    ],
    "checkedAt": "2026-10-10",
    "image": "assets/passes/jr-west-okayama_hiroshima_yamaguchi.webp"
  },
  {
    "id": "jr-west-hokuriku",
    "name": "JR 北陸地區周遊券",
    "english": "Hokuriku Area Pass",
    "region": "福井・金澤・富山",
    "regionKeys": [
      "中部／北陸"
    ],
    "country": "JP",
    "kind": "rail",
    "trips": [],
    "source": "https://www.westjr.co.jp/travel-information/en/tickets-passes/jrwest-rail-pass/hokuriku/",
    "coverageUrl": "https://www.westjr.co.jp/travel-information/en/tickets-passes/jrwest-rail-pass/hokuriku/",
    "imageSource": "https://www.westjr.co.jp/travel-information/en/assets/img/tickets-passes/jrwest-rail-pass/img_pass_11.webp",
    "imageKind": "map",
    "credit": "JR 西日本官方網站",
    "coverage": "福井、石川與富山指定 JR 路線，北陸新幹線敦賀至黑部宇奈月溫泉指定席別。",
    "exclusions": "圖上為沿線規劃區域示意；其他業者、區域內景點門票及加價服務不會因此自動包含，請看官方路線與使用條件。",
    "areas": [
      [
        [
          135.9,
          35.45
        ],
        [
          137.7,
          35.45
        ],
        [
          137.7,
          37.15
        ],
        [
          135.9,
          37.15
        ]
      ]
    ],
    "checkedAt": "2026-10-10",
    "image": "assets/passes/jr-west-hokuriku.webp"
  },
  {
    "id": "jr-west-all",
    "name": "JR 西日本全地區周遊券",
    "english": "JR-WEST All Area Pass",
    "region": "北陸・關西・中國地方・博多",
    "regionKeys": [
      "中部／北陸",
      "關西",
      "中國／山陰",
      "九州"
    ],
    "country": "JP",
    "kind": "rail",
    "trips": [],
    "source": "https://www.westjr.co.jp/travel-information/en/tickets-passes/jrwest-rail-pass/all/",
    "coverageUrl": "https://www.westjr.co.jp/travel-information/en/tickets-passes/jrwest-rail-pass/all/",
    "imageSource": "https://www.westjr.co.jp/travel-information/en/assets/img/tickets-passes/jrwest-rail-pass/img_pass_12.webp",
    "imageKind": "map",
    "credit": "JR 西日本官方網站",
    "coverage": "JR 西日本指定北陸、關西、山陽、山陰路線，並延伸至博多；含指定新幹線與宮島渡輪。",
    "exclusions": "圖上為沿線規劃區域示意；其他業者、區域內景點門票及加價服務不會因此自動包含，請看官方路線與使用條件。",
    "areas": [
      [
        [
          130.2,
          33.3
        ],
        [
          137.7,
          33.3
        ],
        [
          137.7,
          37.15
        ],
        [
          130.2,
          37.15
        ]
      ]
    ],
    "checkedAt": "2026-10-10",
    "image": "assets/passes/jr-west-all.webp"
  },
  {
    "id": "jr-setouchi",
    "name": "JR 瀨戶內地區周遊券",
    "english": "Setouchi Area Pass",
    "region": "關西・瀨戶內海・博多",
    "regionKeys": [
      "關西",
      "中國／山陰",
      "四國",
      "九州"
    ],
    "country": "JP",
    "kind": "rail",
    "trips": [],
    "source": "https://www.westjr.co.jp/travel-information/en/tickets-passes/other/setouchi/",
    "coverageUrl": "https://www.westjr.co.jp/travel-information/en/tickets-passes/other/setouchi/",
    "imageSource": "https://www.westjr.co.jp/travel-information/assets/img/tickets-passes/other/img_setouchi_map.webp",
    "imageKind": "map",
    "credit": "JR 西日本／共同營運商官方網站",
    "coverage": "指定 JR 山陽沿線、四國部分路線及瀨戶內指定船舶／巴士；不是所有航線都適用。",
    "exclusions": "圖上為沿線規劃區域示意；其他業者、區域內景點門票及加價服務不會因此自動包含，請看官方路線與使用條件。",
    "areas": [
      [
        [
          130.2,
          33.3
        ],
        [
          135.9,
          33.3
        ],
        [
          135.9,
          35.15
        ],
        [
          130.2,
          35.15
        ]
      ]
    ],
    "checkedAt": "2026-10-10",
    "image": "assets/passes/jr-setouchi.webp"
  },
  {
    "id": "jr-ssnk",
    "name": "JR 山陽・山陰・北九州周遊券",
    "english": "Sanyo-San'in Northern Kyushu Pass",
    "region": "關西・中國地方・北九州",
    "regionKeys": [
      "關西",
      "中國／山陰",
      "九州"
    ],
    "country": "JP",
    "kind": "rail",
    "trips": [],
    "source": "https://www.westjr.co.jp/travel-information/en/tickets-passes/other/ssnk/",
    "coverageUrl": "https://www.westjr.co.jp/travel-information/en/tickets-passes/other/ssnk/",
    "imageSource": "https://www.westjr.co.jp/travel-information/assets/img/tickets-passes/other/img_ssnk_map.webp",
    "imageKind": "map",
    "credit": "JR 西日本／共同營運商官方網站",
    "coverage": "指定關西、山陽、山陰與北九州 JR 路線；不含九州南部。",
    "exclusions": "圖上為沿線規劃區域示意；其他業者、區域內景點門票及加價服務不會因此自動包含，請看官方路線與使用條件。",
    "areas": [
      [
        [
          129.45,
          32.0
        ],
        [
          136.25,
          32.0
        ],
        [
          136.25,
          35.7
        ],
        [
          129.45,
          35.7
        ]
      ]
    ],
    "checkedAt": "2026-10-10",
    "image": "assets/passes/jr-ssnk.webp"
  },
  {
    "id": "jr-hokuriku-arch-pass",
    "name": "JR 北陸拱型鐵路周遊券",
    "english": "Hokuriku Arch Pass",
    "region": "東京・長野・北陸・關西",
    "regionKeys": [
      "關東",
      "中部／北陸",
      "關西"
    ],
    "country": "JP",
    "kind": "rail",
    "trips": [],
    "source": "https://www.westjr.co.jp/travel-information/en/tickets-passes/other/hokuriku-arch-pass/",
    "coverageUrl": "https://www.westjr.co.jp/travel-information/en/tickets-passes/other/hokuriku-arch-pass/",
    "imageSource": "https://www.westjr.co.jp/travel-information/assets/img/tickets-passes/other/img_hokuriku-arch-pass_map.webp",
    "imageKind": "map",
    "credit": "JR 西日本／共同營運商官方網站",
    "coverage": "東京經長野、金澤與北陸到京都／大阪的指定路線；不含東海道新幹線東京至新大阪直達路線。",
    "exclusions": "圖上為沿線規劃區域示意；其他業者、區域內景點門票及加價服務不會因此自動包含，請看官方路線與使用條件。",
    "areas": [
      [
        [
          139.1,
          35.4
        ],
        [
          140.45,
          35.4
        ],
        [
          140.45,
          36.0
        ],
        [
          139.1,
          36.0
        ]
      ],
      [
        [
          135.1,
          34.45
        ],
        [
          136.0,
          34.45
        ],
        [
          137.75,
          36.55
        ],
        [
          139.2,
          36.3
        ],
        [
          139.8,
          35.55
        ],
        [
          140.0,
          36.35
        ],
        [
          138.8,
          36.95
        ],
        [
          136.55,
          37.1
        ],
        [
          135.4,
          35.75
        ]
      ]
    ],
    "checkedAt": "2026-10-10",
    "image": "assets/passes/jr-hokuriku-arch-pass.webp"
  },
  {
    "id": "jr-central-takayama_hokuriku",
    "name": "JR 高山・北陸地區周遊券",
    "english": "Takayama-Hokuriku Area Tourist Pass",
    "region": "中部・北陸",
    "regionKeys": [
      "中部／北陸",
      "關西"
    ],
    "country": "JP",
    "kind": "rail",
    "trips": [],
    "source": "https://touristpass.jp/en/takayama_hokuriku/",
    "coverageUrl": "https://touristpass.jp/en/takayama_hokuriku/",
    "imageSource": "https://touristpass.jp/assets/img/takayama_hokuriku/routemap_en.jpg",
    "imageKind": "map",
    "credit": "JR 東海／JR 西日本 Tourist Pass 官方網站",
    "coverage": "大阪／名古屋、高山、白川鄉、金澤與富山的指定 JR／巴士路線。",
    "exclusions": "圖上為沿線規劃區域示意；其他業者、區域內景點門票及加價服務不會因此自動包含，請看官方路線與使用條件。",
    "areas": [
      [
        [
          135.1,
          34.45
        ],
        [
          137.9,
          34.45
        ],
        [
          137.9,
          37.0
        ],
        [
          135.1,
          37.0
        ]
      ]
    ],
    "checkedAt": "2026-10-10",
    "image": "assets/passes/jr-central-takayama_hokuriku.jpg"
  },
  {
    "id": "jr-central-alpine",
    "name": "JR 立山黑部・高山・松本周遊券",
    "english": "Alpine-Takayama-Matsumoto Area Tourist Pass",
    "region": "中部・北陸",
    "regionKeys": [
      "中部／北陸",
      "關東"
    ],
    "country": "JP",
    "kind": "rail",
    "trips": [],
    "source": "https://touristpass.jp/en/alpine/",
    "coverageUrl": "https://touristpass.jp/en/alpine/",
    "imageSource": "https://touristpass.jp/assets/img/alpine/routemap_en.jpg",
    "imageKind": "map",
    "credit": "JR 東海／JR 西日本 Tourist Pass 官方網站",
    "coverage": "名古屋、高山、富山、立山黑部阿爾卑斯路線、大町與松本的指定路線；季節營運。",
    "exclusions": "圖上為沿線規劃區域示意；其他業者、區域內景點門票及加價服務不會因此自動包含，請看官方路線與使用條件。",
    "areas": [
      [
        [
          136.7,
          35.0
        ],
        [
          138.3,
          35.0
        ],
        [
          138.3,
          36.95
        ],
        [
          136.7,
          36.95
        ]
      ]
    ],
    "checkedAt": "2026-10-10",
    "image": "assets/passes/jr-central-alpine.jpg"
  },
  {
    "id": "jr-central-ise_kumano",
    "name": "JR 伊勢・熊野・和歌山周遊券",
    "english": "Ise-Kumano-Wakayama Area Tourist Pass",
    "region": "靜岡・紀伊半島",
    "regionKeys": [
      "中部／北陸",
      "關西"
    ],
    "country": "JP",
    "kind": "rail",
    "trips": [],
    "source": "https://touristpass.jp/en/ise_kumano/",
    "coverageUrl": "https://touristpass.jp/en/ise_kumano/",
    "imageSource": "https://touristpass.jp/assets/img/ise_kumano/routemap_en.jpg",
    "imageKind": "map",
    "credit": "JR 東海／JR 西日本 Tourist Pass 官方網站",
    "coverage": "大阪／名古屋至伊勢、熊野、新宮、白濱與和歌山的指定 JR／巴士路線。",
    "exclusions": "圖上為沿線規劃區域示意；其他業者、區域內景點門票及加價服務不會因此自動包含，請看官方路線與使用條件。",
    "areas": [
      [
        [
          135.0,
          33.4
        ],
        [
          137.2,
          33.4
        ],
        [
          137.2,
          35.2
        ],
        [
          135.0,
          35.2
        ]
      ]
    ],
    "checkedAt": "2026-10-10",
    "image": "assets/passes/jr-central-ise_kumano.jpg"
  },
  {
    "id": "jr-central-fuji_shizuoka",
    "name": "JR 富士山・靜岡地區周遊券 Mini",
    "english": "Mt. Fuji-Shizuoka Area Tourist Pass Mini",
    "region": "靜岡・紀伊半島",
    "regionKeys": [
      "中部／北陸",
      "關東"
    ],
    "country": "JP",
    "kind": "rail",
    "trips": [],
    "source": "https://touristpass.jp/en/fuji_shizuoka/",
    "coverageUrl": "https://touristpass.jp/en/fuji_shizuoka/",
    "imageSource": "https://touristpass.jp/assets/img/fuji_shizuoka/routemap_en.jpg",
    "imageKind": "map",
    "credit": "JR 東海／JR 西日本 Tourist Pass 官方網站",
    "coverage": "靜岡、濱松、三島、熱海、沼津、清水與富士山周邊指定 JR、巴士、渡輪及私鐵。",
    "exclusions": "圖上為沿線規劃區域示意；其他業者、區域內景點門票及加價服務不會因此自動包含，請看官方路線與使用條件。",
    "areas": [
      [
        [
          137.55,
          34.5
        ],
        [
          139.25,
          34.5
        ],
        [
          139.25,
          35.55
        ],
        [
          137.55,
          35.55
        ]
      ]
    ],
    "checkedAt": "2026-10-10",
    "image": "assets/passes/jr-central-fuji_shizuoka.jpg"
  },
  {
    "id": "jr-hokkaido-noboribetsu",
    "name": "JR 札幌・登別地區周遊券",
    "english": "Sapporo-Noboribetsu Area Pass",
    "region": "札幌・小樽・新千歲・登別",
    "regionKeys": [
      "北海道"
    ],
    "country": "JP",
    "kind": "rail",
    "trips": [],
    "source": "https://www.jrhokkaido.co.jp/global/english/ticket/railpass/index.html#noboribetsu",
    "coverageUrl": "https://www.jrhokkaido.co.jp/global/english/ticket/railpass/index.html#noboribetsu",
    "imageSource": "https://www.jrhokkaido.co.jp/global/images/ticket/railpass/e-rail_noboribetsu.jpg",
    "imageKind": "map",
    "credit": "JR 北海道官方網站",
    "coverage": "小樽、札幌、新千歲機場至登別的指定 JR 路線；不含洞爺。",
    "exclusions": "地圖為沿線規劃示意；札幌地鐵／路面電車、其他私鐵、景點門票與範圍外路線不包含。",
    "areas": [
      [
        [
          140.7,
          42.35
        ],
        [
          142.3,
          42.35
        ],
        [
          142.3,
          43.4
        ],
        [
          140.7,
          43.4
        ]
      ]
    ],
    "checkedAt": "2026-10-10",
    "image": "assets/passes/jr-hokkaido-noboribetsu.jpg"
  },
  {
    "id": "jr-hokkaido-furano",
    "name": "JR 札幌・富良野地區周遊券",
    "english": "Sapporo-Furano Area Pass",
    "region": "札幌・小樽・旭川・富良野",
    "regionKeys": [
      "北海道"
    ],
    "country": "JP",
    "kind": "rail",
    "trips": [],
    "source": "https://www.jrhokkaido.co.jp/global/english/ticket/railpass/index.html#furano",
    "coverageUrl": "https://www.jrhokkaido.co.jp/global/english/ticket/railpass/index.html#furano",
    "imageSource": "https://www.jrhokkaido.co.jp/global/images/ticket/railpass/e-rail_furano.jpg",
    "imageKind": "map",
    "credit": "JR 北海道官方網站",
    "coverage": "小樽、札幌、新千歲機場、旭川、富良野與美瑛的指定 JR 路線。",
    "exclusions": "地圖為沿線規劃示意；札幌地鐵／路面電車、其他私鐵、景點門票與範圍外路線不包含。",
    "areas": [
      [
        [
          140.7,
          42.7
        ],
        [
          142.65,
          42.7
        ],
        [
          142.65,
          43.95
        ],
        [
          140.7,
          43.95
        ]
      ]
    ],
    "checkedAt": "2026-10-10",
    "image": "assets/passes/jr-hokkaido-furano.jpg"
  },
  {
    "id": "jr-hokkaido-hrp",
    "name": "JR 北海道鐵路周遊券",
    "english": "Hokkaido Rail Pass",
    "region": "北海道",
    "regionKeys": [
      "北海道"
    ],
    "country": "JP",
    "kind": "rail",
    "trips": [],
    "source": "https://www.jrhokkaido.co.jp/global/english/ticket/railpass/index.html#hrp",
    "coverageUrl": "https://www.jrhokkaido.co.jp/global/english/ticket/railpass/index.html#hrp",
    "imageSource": "https://www.jrhokkaido.co.jp/global/images/ticket/railpass/e-rail_hrp.jpg",
    "imageKind": "map",
    "credit": "JR 北海道官方網站",
    "coverage": "北海道指定 JR 路線及部分 JR 北海道巴士；不含北海道新幹線。",
    "exclusions": "地圖為沿線規劃示意；札幌地鐵／路面電車、其他私鐵、景點門票與範圍外路線不包含。",
    "areas": [
      [
        [
          139.7,
          41.35
        ],
        [
          141.25,
          41.4
        ],
        [
          145.85,
          43.2
        ],
        [
          145.35,
          44.2
        ],
        [
          141.9,
          45.6
        ],
        [
          140.7,
          44.2
        ],
        [
          139.65,
          42.3
        ]
      ]
    ],
    "checkedAt": "2026-10-10",
    "image": "assets/passes/jr-hokkaido-hrp.jpg"
  },
  {
    "id": "jr-kyushu-all",
    "name": "JR 全九州鐵路周遊券",
    "english": "JR KYUSHU RAIL PASS — All Kyushu",
    "region": "全九州",
    "regionKeys": [
      "九州"
    ],
    "country": "JP",
    "kind": "rail",
    "trips": [],
    "source": "https://www.jrkyushu.co.jp/english/railpass/railpass.html#anchor-all",
    "coverageUrl": "https://www.jrkyushu.co.jp/english/railpass/railpass.html#anchor-all",
    "imageSource": "https://www.jrkyushu.co.jp/lang/assets/img/railpass/common/img_all-kyushu.png",
    "imageKind": "map",
    "credit": "JR 九州官方網站",
    "coverage": "九州全域指定 JR 列車、九州新幹線與西九州新幹線。",
    "exclusions": "不含山陽新幹線小倉至博多；私鐵、地鐵、巴士與需加價的特殊列車另依規則。",
    "areas": [
      [
        [
          129.45,
          33.3
        ],
        [
          130.7,
          33.95
        ],
        [
          131.8,
          33.65
        ],
        [
          132.05,
          32.5
        ],
        [
          131.2,
          30.95
        ],
        [
          130.2,
          31.0
        ],
        [
          129.3,
          32.5
        ]
      ]
    ],
    "checkedAt": "2026-10-10",
    "image": "assets/passes/jr-kyushu-all.png"
  },
  {
    "id": "jr-kyushu-northern",
    "name": "JR 北九州鐵路周遊券",
    "english": "JR KYUSHU RAIL PASS — Northern Kyushu",
    "region": "福岡・佐賀・長崎・熊本・大分",
    "regionKeys": [
      "九州"
    ],
    "country": "JP",
    "kind": "rail",
    "trips": [],
    "source": "https://www.jrkyushu.co.jp/english/railpass/railpass.html#anchor-northern",
    "coverageUrl": "https://www.jrkyushu.co.jp/english/railpass/railpass.html#anchor-northern",
    "imageSource": "https://www.jrkyushu.co.jp/lang/assets/img/railpass/common/img_northern-kyushu.png",
    "imageKind": "map",
    "credit": "JR 九州官方網站",
    "coverage": "福岡、佐賀、長崎、熊本與大分以北指定 JR 列車；九州新幹線博多至熊本。",
    "exclusions": "不含山陽新幹線小倉至博多；私鐵、地鐵、巴士與需加價的特殊列車另依規則。",
    "areas": [
      [
        [
          129.35,
          32.2
        ],
        [
          131.85,
          32.2
        ],
        [
          131.85,
          33.95
        ],
        [
          129.35,
          33.95
        ]
      ]
    ],
    "checkedAt": "2026-10-10",
    "image": "assets/passes/jr-kyushu-northern.png"
  },
  {
    "id": "jr-kyushu-southern",
    "name": "JR 南九州鐵路周遊券",
    "english": "JR KYUSHU RAIL PASS — Southern Kyushu",
    "region": "熊本・宮崎・鹿兒島",
    "regionKeys": [
      "九州"
    ],
    "country": "JP",
    "kind": "rail",
    "trips": [],
    "source": "https://www.jrkyushu.co.jp/english/railpass/railpass.html#anchor-southern",
    "coverageUrl": "https://www.jrkyushu.co.jp/english/railpass/railpass.html#anchor-southern",
    "imageSource": "https://www.jrkyushu.co.jp/lang/assets/img/railpass/common/img_southern-kyushu.png",
    "imageKind": "map",
    "credit": "JR 九州官方網站",
    "coverage": "熊本、大分及以南宮崎、鹿兒島指定 JR 列車；九州新幹線熊本至鹿兒島中央。",
    "exclusions": "不含山陽新幹線小倉至博多；私鐵、地鐵、巴士與需加價的特殊列車另依規則。",
    "areas": [
      [
        [
          130.1,
          30.9
        ],
        [
          131.95,
          30.9
        ],
        [
          131.95,
          33.35
        ],
        [
          130.1,
          33.35
        ]
      ]
    ],
    "checkedAt": "2026-10-10",
    "image": "assets/passes/jr-kyushu-southern.png"
  },
  {
    "id": "jr-shikoku",
    "name": "四國鐵路周遊券",
    "english": "ALL SHIKOKU Rail Pass",
    "region": "四國",
    "regionKeys": [
      "四國"
    ],
    "country": "JP",
    "kind": "rail",
    "trips": [],
    "source": "https://shikoku-railwaytrip.com/pass-information/",
    "coverageUrl": "https://shikoku-railwaytrip.com/pass-information/",
    "imageSource": "https://shikoku-railwaytrip.com/images/pass-information/all/validity_map.jpg?v=2",
    "imageKind": "map",
    "credit": "JR 四國／SHIKOKU Railway Trip 官方網站",
    "coverage": "四國指定 JR、土佐黑潮、阿佐海岸、琴電及土佐電路線；可用方案依 2026/10 新制。",
    "exclusions": "2026/10/1 起不含小豆島渡輪／橄欖巴士，4／5 日版與香川迷你券停售。伊予鐵、Sunrise Seto 及指定範圍外交通不包含。",
    "areas": [
      [
        [
          132.2,
          32.7
        ],
        [
          134.8,
          32.7
        ],
        [
          134.8,
          34.5
        ],
        [
          132.2,
          34.5
        ]
      ]
    ],
    "checkedAt": "2026-10-10",
    "image": "assets/passes/jr-shikoku.jpg"
  },
  {
    "id": "jr-east-eastpass",
    "name": "JR 東日本鐵路周遊券（新版）",
    "english": "JR EAST PASS",
    "region": "東北・關東・長野・新潟",
    "regionKeys": [
      "東北",
      "關東",
      "中部／北陸"
    ],
    "country": "JP",
    "kind": "rail",
    "trips": [],
    "source": "https://www.jreast.co.jp/en/multi/pass/eastpass.html",
    "coverageUrl": "https://www.jreast.co.jp/en/multi/pass/eastpass.html",
    "imageSource": "https://japanrailpass.net/assets/img/about/jr-east.png",
    "imageKind": "operator",
    "credit": "JR 集團官方營運商圖（JR 東日本）；適用範圍另見官方券種路線",
    "coverage": "東北、關東、長野與新潟指定 JR 及合作路線；2026 年新版整合原兩種區域券。",
    "exclusions": "不含東海道新幹線、伊豆急與富士急行。 地圖為規劃示意，請以官方路線圖為準。",
    "areas": [
      [
        [
          137.8,
          34.85
        ],
        [
          142.2,
          34.85
        ],
        [
          142.2,
          41.6
        ],
        [
          137.8,
          41.6
        ]
      ]
    ],
    "checkedAt": "2026-10-10",
    "image": "assets/passes/jr-east-eastpass.png"
  },
  {
    "id": "jr-east-tokyowidepass",
    "name": "JR 東京廣域周遊券",
    "english": "JR TOKYO Wide Pass",
    "region": "關東・富士山・伊豆",
    "regionKeys": [
      "關東",
      "中部／北陸"
    ],
    "country": "JP",
    "kind": "rail",
    "trips": [],
    "source": "https://www.jreast.co.jp/en/multi/pass/tokyowidepass.html",
    "coverageUrl": "https://www.jreast.co.jp/en/multi/pass/tokyowidepass.html",
    "imageSource": "https://japanrailpass.net/assets/img/about/jr-east.png",
    "imageKind": "operator",
    "credit": "JR 集團官方營運商圖（JR 東日本）；適用範圍另見官方券種路線",
    "coverage": "東京周邊指定 JR 路線，包含指定富士急行、伊豆急、臨海線與東武直通路段。",
    "exclusions": "不含東海道新幹線；部分富士急行列車需加價。 地圖為規劃示意，請以官方路線圖為準。",
    "areas": [
      [
        [
          138.3,
          34.65
        ],
        [
          140.8,
          34.65
        ],
        [
          140.8,
          37.2
        ],
        [
          138.3,
          37.2
        ]
      ]
    ],
    "checkedAt": "2026-10-10",
    "image": "assets/passes/jr-east-tokyowidepass.png"
  },
  {
    "id": "jr-east-easthokkaido",
    "name": "JR 東日本・南北海道周遊券",
    "english": "JR East-South Hokkaido Rail Pass",
    "region": "關東・東北・南北海道",
    "regionKeys": [
      "北海道",
      "東北",
      "關東"
    ],
    "country": "JP",
    "kind": "rail",
    "trips": [],
    "source": "https://www.jreast.co.jp/en/multi/pass/easthokkaido.html",
    "coverageUrl": "https://www.jreast.co.jp/en/multi/pass/easthokkaido.html",
    "imageSource": "https://japanrailpass.net/assets/img/about/jr-east.png",
    "imageKind": "operator",
    "credit": "JR 集團官方營運商圖（JR 東日本）；適用範圍另見官方券種路線",
    "coverage": "東京經東北至函館、札幌、小樽的指定 JR 路線與北海道新幹線。",
    "exclusions": "不含道南漁火鐵道、東海道新幹線、旭川／富良野及區域外路線。 地圖為規劃示意，請以官方路線圖為準。",
    "areas": [
      [
        [
          138.85,
          35.1
        ],
        [
          142.3,
          35.1
        ],
        [
          142.3,
          41.6
        ],
        [
          138.85,
          41.6
        ]
      ],
      [
        [
          139.65,
          41.35
        ],
        [
          142.0,
          41.35
        ],
        [
          142.0,
          43.4
        ],
        [
          139.65,
          43.4
        ]
      ]
    ],
    "checkedAt": "2026-10-10",
    "image": "assets/passes/jr-east-easthokkaido.png"
  },
  {
    "id": "jr-east-tohokuhokkaido",
    "name": "JR 東北・南北海道周遊券",
    "english": "JR Tohoku-South Hokkaido Rail Pass",
    "region": "東北・南北海道",
    "regionKeys": [
      "北海道",
      "東北"
    ],
    "country": "JP",
    "kind": "rail",
    "trips": [],
    "source": "https://www.jreast.co.jp/en/multi/pass/tohokuhokkaido.html",
    "coverageUrl": "https://www.jreast.co.jp/en/multi/pass/tohokuhokkaido.html",
    "imageSource": "https://japanrailpass.net/assets/img/about/jr-east.png",
    "imageKind": "operator",
    "credit": "JR 集團官方營運商圖（JR 東日本）；適用範圍另見官方券種路線",
    "coverage": "東北至函館、札幌、小樽的指定 JR 路線與北海道新幹線。",
    "exclusions": "不含東京／關東地區、道南漁火鐵道與區域外路線。 地圖為規劃示意，請以官方路線圖為準。",
    "areas": [
      [
        [
          139.3,
          36.9
        ],
        [
          142.2,
          36.9
        ],
        [
          142.2,
          41.6
        ],
        [
          139.3,
          41.6
        ]
      ],
      [
        [
          139.65,
          41.35
        ],
        [
          142.0,
          41.35
        ],
        [
          142.0,
          43.4
        ],
        [
          139.65,
          43.4
        ]
      ]
    ],
    "checkedAt": "2026-10-10",
    "image": "assets/passes/jr-east-tohokuhokkaido.png"
  },
  {
    "id": "jr-east-tokyo_free",
    "name": "東京一日自由乘車券",
    "english": "Tokyo 1-Day Ticket",
    "region": "東京 23 區",
    "regionKeys": [
      "關東"
    ],
    "country": "JP",
    "kind": "rail",
    "trips": [],
    "source": "https://www.jreast.co.jp/en/multi/pass/tokyo_free.html",
    "coverageUrl": "https://www.jreast.co.jp/en/multi/pass/tokyo_free.html",
    "imageSource": "https://japanrailpass.net/assets/img/about/jr-east.png",
    "imageKind": "operator",
    "credit": "JR 集團官方營運商圖（JR 東日本）；適用範圍另見官方券種路線",
    "coverage": "東京 23 區指定 JR 普通／快速列車、Metro、都營地下鐵、公車、荒川線與日暮里舍人線。",
    "exclusions": "特急、新幹線、指定不適用公車與區域外路線不包含。 地圖為規劃示意，請以官方路線圖為準。",
    "areas": [
      [
        [
          139.58,
          35.55
        ],
        [
          139.88,
          35.55
        ],
        [
          139.88,
          35.84
        ],
        [
          139.58,
          35.84
        ]
      ]
    ],
    "checkedAt": "2026-10-10",
    "image": "assets/passes/jr-east-tokyo_free.png"
  },
  {
    "id": "jr-east-tokunai_pass",
    "name": "JR 東京市區周遊券",
    "english": "Tokyo Metropolitan District Pass",
    "region": "東京 23 區",
    "regionKeys": [
      "關東"
    ],
    "country": "JP",
    "kind": "rail",
    "trips": [],
    "source": "https://www.jreast.co.jp/en/multi/pass/tokunai_pass.html",
    "coverageUrl": "https://www.jreast.co.jp/en/multi/pass/tokunai_pass.html",
    "imageSource": "https://japanrailpass.net/assets/img/about/jr-east.png",
    "imageKind": "operator",
    "credit": "JR 集團官方營運商圖（JR 東日本）；適用範圍另見官方券種路線",
    "coverage": "東京 23 區內 JR 普通／快速列車普通車非指定席。",
    "exclusions": "不含地鐵、私鐵、特急與新幹線。 地圖為規劃示意，請以官方路線圖為準。",
    "areas": [
      [
        [
          139.58,
          35.55
        ],
        [
          139.88,
          35.55
        ],
        [
          139.88,
          35.84
        ],
        [
          139.58,
          35.84
        ]
      ]
    ],
    "checkedAt": "2026-10-10",
    "image": "assets/passes/jr-east-tokunai_pass.png"
  },
  {
    "id": "jr-east-nonbiri_pass",
    "name": "悠閒假日 Suica 周遊券",
    "english": "NONBIRI Holiday Suica Pass",
    "region": "東京近郊",
    "regionKeys": [
      "關東"
    ],
    "country": "JP",
    "kind": "rail",
    "trips": [],
    "source": "https://www.jreast.co.jp/en/multi/pass/nonbiri_pass.html",
    "coverageUrl": "https://www.jreast.co.jp/en/multi/pass/nonbiri_pass.html",
    "imageSource": "https://japanrailpass.net/assets/img/about/jr-east.png",
    "imageKind": "operator",
    "credit": "JR 集團官方營運商圖（JR 東日本）；適用範圍另見官方券種路線",
    "coverage": "指定東京近郊 JR 普通／快速列車、臨海線與東京單軌；限指定假日，需以 IC 卡使用。",
    "exclusions": "特急／綠色車廂需另外付費，新幹線與區域外路線不包含。 地圖為規劃示意，請以官方路線圖為準。",
    "areas": [
      [
        [
          138.8,
          34.9
        ],
        [
          140.5,
          34.9
        ],
        [
          140.5,
          36.5
        ],
        [
          138.8,
          36.5
        ]
      ]
    ],
    "checkedAt": "2026-10-10",
    "image": "assets/passes/jr-east-nonbiri_pass.png"
  },
  {
    "id": "sendai-area",
    "name": "仙台地區周遊券",
    "english": "SENDAI AREA PASS",
    "region": "仙台・松島・山寺",
    "regionKeys": [
      "東北"
    ],
    "country": "JP",
    "kind": "rail",
    "trips": [],
    "source": "https://sendaitravelpass.jp/en/",
    "coverageUrl": "https://sendaitravelpass.jp/en/",
    "imageSource": "https://sendaitravelpass.jp/images/sendaiareapass_1day.png",
    "imageKind": "promotion",
    "credit": "仙台丸通周遊券營運委員會官方網站",
    "coverage": "仙台、松島、山寺、白石的指定 JR 路線，仙台機場線、地鐵、公車及部分秋保路線。",
    "exclusions": "圖上為沿線規劃區域示意；其他業者、區域內景點門票及加價服務不會因此自動包含，請看官方路線與使用條件。",
    "areas": [
      [
        [
          140.35,
          37.9
        ],
        [
          141.3,
          37.9
        ],
        [
          141.3,
          38.65
        ],
        [
          140.35,
          38.65
        ]
      ]
    ],
    "checkedAt": "2026-10-10",
    "image": "assets/passes/sendai-area.png"
  },
  {
    "id": "sendai-marugoto",
    "name": "仙台丸通周遊券",
    "english": "SENDAI MARUGOTO PASS",
    "region": "仙台・松島・山寺",
    "regionKeys": [
      "東北"
    ],
    "country": "JP",
    "kind": "rail",
    "trips": [],
    "source": "https://sendaitravelpass.jp/en/",
    "coverageUrl": "https://sendaitravelpass.jp/en/",
    "imageSource": "https://sendaitravelpass.jp/images/m-logo.png",
    "imageKind": "promotion",
    "credit": "仙台丸通周遊券營運委員會官方網站",
    "coverage": "仙台、松島、山寺、白石的指定 JR 路線，仙台機場線、地鐵、公車及部分秋保路線。",
    "exclusions": "圖上為沿線規劃區域示意；其他業者、區域內景點門票及加價服務不會因此自動包含，請看官方路線與使用條件。",
    "areas": [
      [
        [
          140.35,
          37.9
        ],
        [
          141.3,
          37.9
        ],
        [
          141.3,
          38.65
        ],
        [
          140.35,
          38.65
        ]
      ]
    ],
    "checkedAt": "2026-10-10",
    "image": "assets/passes/sendai-marugoto.png"
  },
  {
    "id": "kintetsu-1day",
    "name": "近鐵 1 日周遊券",
    "english": "KINTETSU RAIL PASS 1day",
    "region": "大阪・京都・奈良",
    "regionKeys": [
      "關西"
    ],
    "country": "JP",
    "kind": "rail",
    "trips": [],
    "source": "https://www.kintetsu.co.jp/foreign/english/ticket/krp_1day.html",
    "coverageUrl": "https://www.kintetsu.co.jp/foreign/english/ticket/krp_1day.html",
    "imageSource": "https://www.kintetsu.co.jp/foreign/assets/ticket/images/english/img-krp1day.png",
    "imageKind": "ticket",
    "credit": "近畿日本鐵道官方網站",
    "coverage": "大阪、奈良、京都指定近鐵區段與指定奈良交通巴士。",
    "exclusions": "近鐵特急需另外購買特急券。地圖為指定沿線規劃示意；不含其他鐵路及所有景點門票。",
    "areas": [
      [
        [
          135.4,
          34.45
        ],
        [
          135.95,
          34.45
        ],
        [
          135.95,
          35.1
        ],
        [
          135.4,
          35.1
        ]
      ]
    ],
    "checkedAt": "2026-10-10",
    "image": "assets/passes/kintetsu-1day.png"
  },
  {
    "id": "kintetsu-2day",
    "name": "近鐵 2 日周遊券",
    "english": "KINTETSU RAIL PASS 2day",
    "region": "大阪・京都・奈良",
    "regionKeys": [
      "關西"
    ],
    "country": "JP",
    "kind": "rail",
    "trips": [],
    "source": "https://www.kintetsu.co.jp/foreign/english/ticket/krp_2day.html",
    "coverageUrl": "https://www.kintetsu.co.jp/foreign/english/ticket/krp_2day.html",
    "imageSource": "https://www.kintetsu.co.jp/foreign/assets/ticket/images/english/img-krp2day.png",
    "imageKind": "ticket",
    "credit": "近畿日本鐵道官方網站",
    "coverage": "大阪、奈良、京都加飛鳥、吉野一帶指定近鐵區段及指定奈良交通巴士。",
    "exclusions": "近鐵特急需另外購買特急券。地圖為指定沿線規劃示意；不含其他鐵路及所有景點門票。",
    "areas": [
      [
        [
          135.4,
          34.2
        ],
        [
          136.05,
          34.2
        ],
        [
          136.05,
          35.1
        ],
        [
          135.4,
          35.1
        ]
      ]
    ],
    "checkedAt": "2026-10-10",
    "image": "assets/passes/kintetsu-2day.png"
  },
  {
    "id": "kintetsu-5day",
    "name": "近鐵 5 日周遊券",
    "english": "KINTETSU RAIL PASS 5day",
    "region": "大阪・京都・奈良・名古屋・伊勢志摩",
    "regionKeys": [
      "關西",
      "中部／北陸"
    ],
    "country": "JP",
    "kind": "rail",
    "trips": [],
    "source": "https://www.kintetsu.co.jp/foreign/english/ticket/krp_5day.html",
    "coverageUrl": "https://www.kintetsu.co.jp/foreign/english/ticket/krp_5day.html",
    "imageSource": "https://www.kintetsu.co.jp/foreign/assets/ticket/images/english/img-krp5day.png",
    "imageKind": "ticket",
    "credit": "近畿日本鐵道官方網站",
    "coverage": "近鐵全線與伊賀鐵道，串連大阪、京都、奈良、名古屋與伊勢志摩。",
    "exclusions": "近鐵特急需另外購買特急券。地圖為指定沿線規劃示意；不含其他鐵路及所有景點門票。",
    "areas": [
      [
        [
          135.4,
          34.15
        ],
        [
          136.95,
          34.15
        ],
        [
          136.95,
          35.25
        ],
        [
          135.4,
          35.25
        ]
      ]
    ],
    "checkedAt": "2026-10-10",
    "image": "assets/passes/kintetsu-5day.png"
  },
  {
    "id": "kintetsu-5dayplus",
    "name": "近鐵 5 日周遊券 Plus",
    "english": "KINTETSU RAIL PASS 5dayplus",
    "region": "大阪・京都・奈良・名古屋・伊勢志摩",
    "regionKeys": [
      "關西",
      "中部／北陸"
    ],
    "country": "JP",
    "kind": "rail",
    "trips": [],
    "source": "https://www.kintetsu.co.jp/foreign/english/ticket/krp_5dayplus.html",
    "coverageUrl": "https://www.kintetsu.co.jp/foreign/english/ticket/krp_5dayplus.html",
    "imageSource": "https://www.kintetsu.co.jp/foreign/assets/ticket/images/english/img-krp5dayplus.png",
    "imageKind": "ticket",
    "credit": "近畿日本鐵道官方網站",
    "coverage": "近鐵全線、伊賀鐵道，以及指定奈良／三重／鳥羽巴士。",
    "exclusions": "近鐵特急需另外購買特急券。地圖為指定沿線規劃示意；不含其他鐵路及所有景點門票。",
    "areas": [
      [
        [
          135.4,
          34.15
        ],
        [
          136.95,
          34.15
        ],
        [
          136.95,
          35.25
        ],
        [
          135.4,
          35.25
        ]
      ]
    ],
    "checkedAt": "2026-10-10",
    "image": "assets/passes/kintetsu-5dayplus.png"
  },
  {
    "id": "odakyu-hakone-freepass",
    "name": "箱根周遊券",
    "english": "Hakone Freepass",
    "region": "箱根",
    "regionKeys": [
      "關東"
    ],
    "country": "JP",
    "kind": "transport",
    "trips": [],
    "source": "https://odakyu-global.com/passes/hakone-freepass/",
    "coverageUrl": "https://odakyu-global.com/passes/hakone-freepass/",
    "imageSource": "https://odakyu-global.com/_wp/wp-content/uploads/2025/08/HakoneFreepass_en202604.jpg",
    "imageKind": "map",
    "credit": "小田急／合作交通業者官方網站",
    "coverage": "箱根指定登山鐵路、纜車、空中纜車、海賊船與巴士；含小田急往返的版本另依出發站。",
    "exclusions": "浪漫特快特急費、非指定交通與景點門票不會自動包含；來回交通不代表沿途可無限上下車，請查看方案。",
    "areas": [
      [
        [
          138.9,
          35.05
        ],
        [
          139.23,
          35.05
        ],
        [
          139.23,
          35.38
        ],
        [
          138.9,
          35.38
        ]
      ]
    ],
    "checkedAt": "2026-10-10",
    "image": "assets/passes/odakyu-hakone-freepass.jpg"
  },
  {
    "id": "odakyu-hakone-kamakura-pass",
    "name": "箱根・鎌倉周遊券",
    "english": "Hakone Kamakura Pass",
    "region": "箱根・江之島・鎌倉",
    "regionKeys": [
      "關東"
    ],
    "country": "JP",
    "kind": "transport",
    "trips": [],
    "source": "https://odakyu-global.com/passes/hakone-kamakura-pass/",
    "coverageUrl": "https://odakyu-global.com/passes/hakone-kamakura-pass/",
    "imageSource": "https://odakyu-global.com/_wp/wp-content/uploads/2025/08/HakoneKamakuraPass_en202510.jpg",
    "imageKind": "map",
    "credit": "小田急／合作交通業者官方網站",
    "coverage": "指定小田急全線、江之電與箱根區域交通。",
    "exclusions": "浪漫特快特急費、非指定交通與景點門票不會自動包含；來回交通不代表沿途可無限上下車，請查看方案。",
    "areas": [
      [
        [
          138.9,
          35.05
        ],
        [
          139.65,
          35.05
        ],
        [
          139.65,
          35.6
        ],
        [
          138.9,
          35.6
        ]
      ]
    ],
    "checkedAt": "2026-10-10",
    "image": "assets/passes/odakyu-hakone-kamakura-pass.jpg"
  },
  {
    "id": "odakyu-fuji-hakone-pass",
    "name": "富士・箱根周遊券",
    "english": "Fuji Hakone Pass",
    "region": "富士五湖・箱根",
    "regionKeys": [
      "關東",
      "中部／北陸"
    ],
    "country": "JP",
    "kind": "transport",
    "trips": [],
    "source": "https://odakyu-global.com/passes/fuji-hakone-pass/",
    "coverageUrl": "https://odakyu-global.com/passes/fuji-hakone-pass/",
    "imageSource": "https://odakyu-global.com/_wp/wp-content/uploads/2025/08/FujiHakonePass_en202510.jpg",
    "imageKind": "map",
    "credit": "小田急／合作交通業者官方網站",
    "coverage": "富士五湖與箱根的指定交通；富士急行、巴士、箱根交通及出發站往返依方案。",
    "exclusions": "浪漫特快特急費、非指定交通與景點門票不會自動包含；來回交通不代表沿途可無限上下車，請查看方案。",
    "areas": [
      [
        [
          138.6,
          35.02
        ],
        [
          139.25,
          35.02
        ],
        [
          139.25,
          35.58
        ],
        [
          138.6,
          35.58
        ]
      ]
    ],
    "checkedAt": "2026-10-10",
    "image": "assets/passes/odakyu-fuji-hakone-pass.jpg"
  },
  {
    "id": "odakyu-hakoneticket_plus",
    "name": "箱根周遊券 Hako Ticket Plus",
    "english": "Hakone Freepass Hako Ticket Plus",
    "region": "箱根",
    "regionKeys": [
      "關東"
    ],
    "country": "JP",
    "kind": "bundle",
    "trips": [],
    "source": "https://odakyu-global.com/passes/hakoneticket_plus/",
    "coverageUrl": "https://odakyu-global.com/passes/hakoneticket_plus/",
    "imageSource": "https://odakyu-global.com/_wp/wp-content/uploads/2025/08/4c85c234076325c638e2c305400f29d6-1.jpg",
    "imageKind": "promotion",
    "credit": "小田急／合作交通業者官方網站",
    "coverage": "箱根周遊券指定交通，加上官方方案列出的觀光設施。",
    "exclusions": "浪漫特快特急費、非指定交通與景點門票不會自動包含；來回交通不代表沿途可無限上下車，請查看方案。",
    "areas": [
      [
        [
          138.9,
          35.05
        ],
        [
          139.23,
          35.05
        ],
        [
          139.23,
          35.38
        ],
        [
          138.9,
          35.38
        ]
      ]
    ],
    "checkedAt": "2026-10-10",
    "image": "assets/passes/odakyu-hakoneticket_plus.jpg"
  },
  {
    "id": "odakyu-limousine-hakone-freepass",
    "name": "機場巴士＋箱根周遊券",
    "english": "Limousine and Hakone Freepass",
    "region": "羽田・箱根",
    "regionKeys": [
      "關東"
    ],
    "country": "JP",
    "kind": "transport",
    "trips": [],
    "source": "https://odakyu-global.com/passes/limousine-hakone-freepass/",
    "coverageUrl": "https://odakyu-global.com/passes/limousine-hakone-freepass/",
    "imageSource": "https://odakyu-global.com/_wp/wp-content/uploads/2025/08/bad7eb6b7d36fbf2b25eb3387da0e5eb-768x654-1.png",
    "imageKind": "promotion",
    "credit": "小田急／合作交通業者官方網站",
    "coverage": "羽田機場至箱根桃源台指定機場巴士，加箱根周遊券區域交通。",
    "exclusions": "浪漫特快特急費、非指定交通與景點門票不會自動包含；來回交通不代表沿途可無限上下車，請查看方案。",
    "areas": [
      [
        [
          139.73,
          35.52
        ],
        [
          139.83,
          35.52
        ],
        [
          139.83,
          35.59
        ],
        [
          139.73,
          35.59
        ]
      ],
      [
        [
          138.9,
          35.05
        ],
        [
          139.23,
          35.05
        ],
        [
          139.23,
          35.38
        ],
        [
          138.9,
          35.38
        ]
      ]
    ],
    "checkedAt": "2026-10-10",
    "image": "assets/passes/odakyu-limousine-hakone-freepass.png"
  },
  {
    "id": "odakyu-enoshima-kamakura-freepass",
    "name": "江之島・鎌倉周遊券",
    "english": "Enoshima-Kamakura Freepass",
    "region": "江之島・鎌倉",
    "regionKeys": [
      "關東"
    ],
    "country": "JP",
    "kind": "transport",
    "trips": [],
    "source": "https://odakyu-global.com/passes/enoshima-kamakura-freepass/",
    "coverageUrl": "https://odakyu-global.com/passes/enoshima-kamakura-freepass/",
    "imageSource": "https://odakyu-global.com/_wp/wp-content/uploads/2025/08/EnokamaFreepass_en202510.jpg",
    "imageKind": "map",
    "credit": "小田急／合作交通業者官方網站",
    "coverage": "藤澤至片瀨江之島小田急區段與江之電；含出發站往返的版本另依規則。",
    "exclusions": "浪漫特快特急費、非指定交通與景點門票不會自動包含；來回交通不代表沿途可無限上下車，請查看方案。",
    "areas": [
      [
        [
          139.45,
          35.27
        ],
        [
          139.6,
          35.27
        ],
        [
          139.6,
          35.37
        ],
        [
          139.45,
          35.37
        ]
      ]
    ],
    "checkedAt": "2026-10-10",
    "image": "assets/passes/odakyu-enoshima-kamakura-freepass.jpg"
  },
  {
    "id": "odakyu-enoden_noriorikun",
    "name": "江之電一日券 NORIORIKUN",
    "english": "ENODEN 1-DAY PASS NORIORIKUN",
    "region": "藤澤・江之島・鎌倉",
    "regionKeys": [
      "關東"
    ],
    "country": "JP",
    "kind": "rail",
    "trips": [],
    "source": "https://odakyu-global.com/passes/enoden_noriorikun/",
    "coverageUrl": "https://odakyu-global.com/passes/enoden_noriorikun/",
    "imageSource": "https://odakyu-global.com/_wp/wp-content/uploads/2025/08/discount_passes_enoden_map.png",
    "imageKind": "map",
    "credit": "小田急／合作交通業者官方網站",
    "coverage": "江之電藤澤至鎌倉全線。",
    "exclusions": "浪漫特快特急費、非指定交通與景點門票不會自動包含；來回交通不代表沿途可無限上下車，請查看方案。",
    "areas": [
      [
        [
          139.45,
          35.27
        ],
        [
          139.6,
          35.27
        ],
        [
          139.6,
          35.37
        ],
        [
          139.45,
          35.37
        ]
      ]
    ],
    "checkedAt": "2026-10-10",
    "image": "assets/passes/odakyu-enoden_noriorikun.png"
  },
  {
    "id": "odakyu-enoden-bus-1-day-pass-ticket-noritabi-kippu",
    "name": "江之電巴士一日券",
    "english": "Enoden Bus Noritabi Kippu",
    "region": "湘南・鎌倉",
    "regionKeys": [
      "關東"
    ],
    "country": "JP",
    "kind": "transport",
    "trips": [],
    "source": "https://odakyu-global.com/passes/enoden-bus-1-day-pass-ticket-noritabi-kippu/",
    "coverageUrl": "https://odakyu-global.com/passes/enoden-bus-1-day-pass-ticket-noritabi-kippu/",
    "imageSource": "https://odakyu-global.com/_wp/wp-content/uploads/2026/04/8af4ef83fd429f5155c9bacbd008baeb-1-768x432.jpg",
    "imageKind": "promotion",
    "credit": "小田急／合作交通業者官方網站",
    "coverage": "江之電巴士指定路線，一日任意上下車；指定不適用路線除外。",
    "exclusions": "浪漫特快特急費、非指定交通與景點門票不會自動包含；來回交通不代表沿途可無限上下車，請查看方案。",
    "areas": [
      [
        [
          139.35,
          35.26
        ],
        [
          139.65,
          35.26
        ],
        [
          139.65,
          35.48
        ],
        [
          139.35,
          35.48
        ]
      ]
    ],
    "checkedAt": "2026-10-10",
    "image": "assets/passes/odakyu-enoden-bus-1-day-pass-ticket-noritabi-kippu.jpg"
  },
  {
    "id": "odakyu-tanzawa-oyama",
    "name": "丹澤・大山周遊券",
    "english": "Tanzawa-Oyama Freepass",
    "region": "丹澤・大山",
    "regionKeys": [
      "關東"
    ],
    "country": "JP",
    "kind": "transport",
    "trips": [],
    "source": "https://odakyu-global.com/passes/tanzawa-oyama/",
    "coverageUrl": "https://odakyu-global.com/passes/tanzawa-oyama/",
    "imageSource": "https://odakyu-global.com/_wp/wp-content/uploads/2025/08/TanzawaOyamaFreepass_en202510.jpg",
    "imageKind": "map",
    "credit": "小田急／合作交通業者官方網站",
    "coverage": "指定小田急往返、神奈川中央交通巴士與大山纜車；纜車有無依 A／B 版本。",
    "exclusions": "浪漫特快特急費、非指定交通與景點門票不會自動包含；來回交通不代表沿途可無限上下車，請查看方案。",
    "areas": [
      [
        [
          139.0,
          35.33
        ],
        [
          139.38,
          35.33
        ],
        [
          139.38,
          35.6
        ],
        [
          139.0,
          35.6
        ]
      ]
    ],
    "checkedAt": "2026-10-10",
    "image": "assets/passes/odakyu-tanzawa-oyama.jpg"
  },
  {
    "id": "odakyu-tokaibus-ito-kankou-freepass",
    "name": "東海巴士伊東・伊豆高原 2 日券",
    "english": "Tokai Bus Ito/Izu Kogen 2-Day Pass",
    "region": "伊東・伊豆高原",
    "regionKeys": [
      "關東",
      "中部／北陸"
    ],
    "country": "JP",
    "kind": "transport",
    "trips": [],
    "source": "https://odakyu-global.com/passes/tokaibus-ito-kankou-freepass/",
    "coverageUrl": "https://odakyu-global.com/passes/tokaibus-ito-kankou-freepass/",
    "imageSource": "https://odakyu-global.com/_wp/wp-content/uploads/2025/08/Ito-and-Izu-Kogen-2-Day-Pass-5094en-768x1087.jpg",
    "imageKind": "map",
    "credit": "小田急／合作交通業者官方網站",
    "coverage": "伊東與伊豆高原指定東海巴士路線。",
    "exclusions": "浪漫特快特急費、非指定交通與景點門票不會自動包含；來回交通不代表沿途可無限上下車，請查看方案。",
    "areas": [
      [
        [
          139.03,
          34.85
        ],
        [
          139.18,
          34.85
        ],
        [
          139.18,
          35.07
        ],
        [
          139.03,
          35.07
        ]
      ]
    ],
    "checkedAt": "2026-10-10",
    "image": "assets/passes/odakyu-tokaibus-ito-kankou-freepass.jpg"
  },
  {
    "id": "odakyu-tokaibus-zensen-freepass",
    "name": "東海巴士全線周遊券",
    "english": "Tokai Bus All-Line Pass",
    "region": "伊豆半島",
    "regionKeys": [
      "關東",
      "中部／北陸"
    ],
    "country": "JP",
    "kind": "transport",
    "trips": [],
    "source": "https://odakyu-global.com/passes/tokaibus-zensen-freepass/",
    "coverageUrl": "https://odakyu-global.com/passes/tokaibus-zensen-freepass/",
    "imageSource": "https://odakyu-global.com/_wp/wp-content/uploads/2025/08/7e9bd793743349e9b3e32206c47e08fd-768x512.jpg",
    "imageKind": "promotion",
    "credit": "小田急／合作交通業者官方網站",
    "coverage": "伊豆半島東海巴士指定全線，不含官方列出的特殊路線。",
    "exclusions": "浪漫特快特急費、非指定交通與景點門票不會自動包含；來回交通不代表沿途可無限上下車，請查看方案。",
    "areas": [
      [
        [
          138.72,
          34.58
        ],
        [
          139.23,
          34.58
        ],
        [
          139.23,
          35.15
        ],
        [
          138.72,
          35.15
        ]
      ]
    ],
    "checkedAt": "2026-10-10",
    "image": "assets/passes/odakyu-tokaibus-zensen-freepass.jpg"
  },
  {
    "id": "odakyu-greater-tokyo-pass",
    "name": "大東京周遊券",
    "english": "Greater Tokyo Pass",
    "region": "關東私鐵・地鐵・公車",
    "regionKeys": [
      "關東"
    ],
    "country": "JP",
    "kind": "transport",
    "trips": [],
    "source": "https://odakyu-global.com/passes/greater-tokyo-pass/",
    "coverageUrl": "https://odakyu-global.com/passes/greater-tokyo-pass/",
    "imageSource": "https://odakyu-global.com/_wp/wp-content/uploads/2025/09/greater_tokyo_pass_map.png",
    "imageKind": "map",
    "credit": "小田急／合作交通業者官方網站",
    "coverage": "官方聯盟指定私鐵、地鐵與一般巴士，依 3 日／5 日版本的交通項目。",
    "exclusions": "浪漫特快特急費、非指定交通與景點門票不會自動包含；來回交通不代表沿途可無限上下車，請查看方案。",
    "areas": [
      [
        [
          138.3,
          34.65
        ],
        [
          140.8,
          34.65
        ],
        [
          140.8,
          37.2
        ],
        [
          138.3,
          37.2
        ]
      ]
    ],
    "checkedAt": "2026-10-10",
    "image": "assets/passes/odakyu-greater-tokyo-pass.png"
  },
  {
    "id": "kansai-railway-lite",
    "name": "關西鐵路周遊券 LITE",
    "english": "KANSAI RAILWAY PASS LITE",
    "region": "關西私鐵・地鐵",
    "regionKeys": [
      "關西"
    ],
    "country": "JP",
    "kind": "rail",
    "trips": [],
    "source": "https://www.surutto.com/kansai_rwpl/en/krp.html",
    "coverageUrl": "https://www.surutto.com/kansai_rwpl/en/krp.html",
    "imageSource": "https://www.surutto.com/kansai_rwpl/assets/images/areamap_en.jpg",
    "imageKind": "map",
    "credit": "SURUTTO KANSAI 官方網站",
    "coverage": "關西指定私鐵與地鐵，現行 2／3 日版；可用日期依持有版本。",
    "exclusions": "不含 JR、京都市營地下鐵、京阪京津／石山坂本線、嵐電及巴士。",
    "areas": [
      [
        [
          134.6,
          33.65
        ],
        [
          136.3,
          33.65
        ],
        [
          136.3,
          35.45
        ],
        [
          134.6,
          35.45
        ]
      ]
    ],
    "checkedAt": "2026-10-10",
    "image": "assets/passes/kansai-railway-lite.jpg"
  },
  {
    "id": "keihan-kyoto-osaka-day",
    "name": "京阪京都・大阪觀光一日券",
    "english": "KYOTO-OSAKA SIGHTSEEING PASS 1day",
    "region": "京都・大阪",
    "regionKeys": [
      "關西"
    ],
    "country": "JP",
    "kind": "rail",
    "trips": [],
    "source": "https://www.keihan.co.jp/travel/en/trains/passes-for-visitors-to-japan/pass-comparison.html",
    "coverageUrl": "https://www.keihan.co.jp/travel/en/trains/passes-for-visitors-to-japan/pass-comparison.html",
    "imageSource": "https://www.keihan.co.jp/travel/common/img/trains/passes-for-visitors-to-japan/pass-comparison/img_comparison_02.png",
    "imageKind": "ticket",
    "credit": "京阪電氣鐵道官方網站",
    "coverage": "京阪本線、宇治線、交野線與石清水八幡宮參道纜車；不含大津線。",
    "exclusions": "圖上為沿線規劃區域示意；其他業者、區域內景點門票及加價服務不會因此自動包含，請看官方路線與使用條件。",
    "areas": [
      [
        [
          135.48,
          34.67
        ],
        [
          135.86,
          34.67
        ],
        [
          135.86,
          35.06
        ],
        [
          135.48,
          35.06
        ]
      ]
    ],
    "checkedAt": "2026-10-10",
    "image": "assets/passes/keihan-kyoto-osaka-day.png"
  },
  {
    "id": "keihan-kyoto-osaka-24h",
    "name": "京阪京都・大阪觀光 24 小時券",
    "english": "KYOTO-OSAKA SIGHTSEEING PASS 24h",
    "region": "京都・大阪",
    "regionKeys": [
      "關西"
    ],
    "country": "JP",
    "kind": "rail",
    "trips": [],
    "source": "https://www.keihan.co.jp/travel/en/trains/passes-for-visitors-to-japan/pass-comparison.html",
    "coverageUrl": "https://www.keihan.co.jp/travel/en/trains/passes-for-visitors-to-japan/pass-comparison.html",
    "imageSource": "https://www.keihan.co.jp/travel/common/img/trains/passes-for-visitors-to-japan/pass-comparison/img_comparison_02_24h.png",
    "imageKind": "ticket",
    "credit": "京阪電氣鐵道官方網站",
    "coverage": "京都、大阪指定京阪路線 24 小時交通券。",
    "exclusions": "圖上為沿線規劃區域示意；其他業者、區域內景點門票及加價服務不會因此自動包含，請看官方路線與使用條件。",
    "areas": [
      [
        [
          135.48,
          34.67
        ],
        [
          135.86,
          34.67
        ],
        [
          135.86,
          35.06
        ],
        [
          135.48,
          35.06
        ]
      ]
    ],
    "checkedAt": "2026-10-10",
    "image": "assets/passes/keihan-kyoto-osaka-24h.png"
  },
  {
    "id": "keihan-kyoto-day",
    "name": "京阪京都觀光一日券",
    "english": "KYOTO SIGHTSEEING PASS 1day",
    "region": "京都・大阪",
    "regionKeys": [
      "關西"
    ],
    "country": "JP",
    "kind": "rail",
    "trips": [],
    "source": "https://www.keihan.co.jp/travel/en/trains/passes-for-visitors-to-japan/pass-comparison.html",
    "coverageUrl": "https://www.keihan.co.jp/travel/en/trains/passes-for-visitors-to-japan/pass-comparison.html",
    "imageSource": "https://www.keihan.co.jp/travel/common/img/trains/passes-for-visitors-to-japan/pass-comparison/img_comparison_01.png",
    "imageKind": "ticket",
    "credit": "京阪電氣鐵道官方網站",
    "coverage": "京阪出町柳至石清水八幡宮、宇治線與指定纜車。",
    "exclusions": "圖上為沿線規劃區域示意；其他業者、區域內景點門票及加價服務不會因此自動包含，請看官方路線與使用條件。",
    "areas": [
      [
        [
          135.66,
          34.86
        ],
        [
          135.86,
          34.86
        ],
        [
          135.86,
          35.06
        ],
        [
          135.66,
          35.06
        ]
      ]
    ],
    "checkedAt": "2026-10-10",
    "image": "assets/passes/keihan-kyoto-day.png"
  },
  {
    "id": "keihan-kyoto-24h",
    "name": "京阪京都觀光 24 小時券",
    "english": "KYOTO SIGHTSEEING PASS 24h",
    "region": "京都・大阪",
    "regionKeys": [
      "關西"
    ],
    "country": "JP",
    "kind": "rail",
    "trips": [],
    "source": "https://www.keihan.co.jp/travel/en/trains/passes-for-visitors-to-japan/pass-comparison.html",
    "coverageUrl": "https://www.keihan.co.jp/travel/en/trains/passes-for-visitors-to-japan/pass-comparison.html",
    "imageSource": "https://www.keihan.co.jp/travel/common/img/trains/passes-for-visitors-to-japan/pass-comparison/img_comparison_01_24h.png",
    "imageKind": "ticket",
    "credit": "京阪電氣鐵道官方網站",
    "coverage": "京都指定京阪路線 24 小時交通券。",
    "exclusions": "圖上為沿線規劃區域示意；其他業者、區域內景點門票及加價服務不會因此自動包含，請看官方路線與使用條件。",
    "areas": [
      [
        [
          135.66,
          34.86
        ],
        [
          135.86,
          34.86
        ],
        [
          135.86,
          35.06
        ],
        [
          135.66,
          35.06
        ]
      ]
    ],
    "checkedAt": "2026-10-10",
    "image": "assets/passes/keihan-kyoto-24h.png"
  },
  {
    "id": "keihan-metro",
    "name": "京阪京都・大阪＋大阪地鐵券",
    "english": "KYOTO-OSAKA SIGHTSEEING PASS Osaka Metro",
    "region": "京都・大阪",
    "regionKeys": [
      "關西"
    ],
    "country": "JP",
    "kind": "rail",
    "trips": [],
    "source": "https://www.keihan.co.jp/travel/en/trains/passes-for-visitors-to-japan/pass-comparison.html",
    "coverageUrl": "https://www.keihan.co.jp/travel/en/trains/passes-for-visitors-to-japan/pass-comparison.html",
    "imageSource": "https://www.keihan.co.jp/travel/common/img/trains/passes-for-visitors-to-japan/pass-comparison/img_comparison_04.png",
    "imageKind": "ticket",
    "credit": "京阪電氣鐵道官方網站",
    "coverage": "指定京阪路線、Osaka Metro 與大阪市營巴士。",
    "exclusions": "圖上為沿線規劃區域示意；其他業者、區域內景點門票及加價服務不會因此自動包含，請看官方路線與使用條件。",
    "areas": [
      [
        [
          135.4,
          34.6
        ],
        [
          135.86,
          34.6
        ],
        [
          135.86,
          35.06
        ],
        [
          135.4,
          35.06
        ]
      ]
    ],
    "checkedAt": "2026-10-10",
    "image": "assets/passes/keihan-metro.png"
  },
  {
    "id": "keihan-kurama",
    "name": "京阪京都・大阪＋鞍馬貴船券",
    "english": "KYOTO-OSAKA SIGHTSEEING PASS Kurama/Kibune",
    "region": "京都・大阪",
    "regionKeys": [
      "關西"
    ],
    "country": "JP",
    "kind": "rail",
    "trips": [],
    "source": "https://www.keihan.co.jp/travel/en/trains/passes-for-visitors-to-japan/pass-comparison.html",
    "coverageUrl": "https://www.keihan.co.jp/travel/en/trains/passes-for-visitors-to-japan/pass-comparison.html",
    "imageSource": "https://www.keihan.co.jp/travel/common/img/trains/passes-for-visitors-to-japan/pass-comparison/img_comparison_05.png",
    "imageKind": "ticket",
    "credit": "京阪電氣鐵道官方網站",
    "coverage": "指定京阪路線與叡山電車，可前往鞍馬／貴船。",
    "exclusions": "圖上為沿線規劃區域示意；其他業者、區域內景點門票及加價服務不會因此自動包含，請看官方路線與使用條件。",
    "areas": [
      [
        [
          135.48,
          34.67
        ],
        [
          135.86,
          34.67
        ],
        [
          135.86,
          35.18
        ],
        [
          135.48,
          35.18
        ]
      ]
    ],
    "checkedAt": "2026-10-10",
    "image": "assets/passes/keihan-kurama.png"
  },
  {
    "id": "keihan-hirakata",
    "name": "京阪京都・大阪＋枚方公園券",
    "english": "KYOTO-OSAKA SIGHTSEEING PASS Hirakata Park",
    "region": "京都・大阪",
    "regionKeys": [
      "關西"
    ],
    "country": "JP",
    "kind": "rail",
    "trips": [],
    "source": "https://www.keihan.co.jp/travel/en/trains/passes-for-visitors-to-japan/pass-comparison.html",
    "coverageUrl": "https://www.keihan.co.jp/travel/en/trains/passes-for-visitors-to-japan/pass-comparison.html",
    "imageSource": "https://www.keihan.co.jp/travel/common/img/trains/passes-for-visitors-to-japan/pass-comparison/img_comparison_06.png",
    "imageKind": "ticket",
    "credit": "京阪電氣鐵道官方網站",
    "coverage": "指定京阪路線加枚方公園入園；遊樂設施搭乘另依方案。",
    "exclusions": "圖上為沿線規劃區域示意；其他業者、區域內景點門票及加價服務不會因此自動包含，請看官方路線與使用條件。",
    "areas": [
      [
        [
          135.48,
          34.67
        ],
        [
          135.86,
          34.67
        ],
        [
          135.86,
          35.06
        ],
        [
          135.48,
          35.06
        ]
      ]
    ],
    "checkedAt": "2026-10-10",
    "image": "assets/passes/keihan-hirakata.png"
  },
  {
    "id": "keihan-otsu",
    "name": "京阪大津觀光券",
    "english": "OTSU SIGHTSEEING PASS",
    "region": "滋賀・大津",
    "regionKeys": [
      "關西"
    ],
    "country": "JP",
    "kind": "rail",
    "trips": [],
    "source": "https://www.keihan.co.jp/travel/en/trains/passes-for-visitors-to-japan/pass-comparison.html",
    "coverageUrl": "https://www.keihan.co.jp/travel/en/trains/passes-for-visitors-to-japan/pass-comparison.html",
    "imageSource": "https://www.keihan.co.jp/travel/common/img/trains/passes-for-visitors-to-japan/pass-comparison/img_comparison_07.png",
    "imageKind": "ticket",
    "credit": "京阪電氣鐵道官方網站",
    "coverage": "京阪大津線的京津線與石山坂本線。",
    "exclusions": "圖上為沿線規劃區域示意；其他業者、區域內景點門票及加價服務不會因此自動包含，請看官方路線與使用條件。",
    "areas": [
      [
        [
          135.78,
          34.96
        ],
        [
          135.98,
          34.96
        ],
        [
          135.98,
          35.12
        ],
        [
          135.78,
          35.12
        ]
      ]
    ],
    "checkedAt": "2026-10-10",
    "image": "assets/passes/keihan-otsu.png"
  },
  {
    "id": "hankyu-day",
    "name": "阪急全線一日券",
    "english": "Hankyu One-Day Pass",
    "region": "大阪・京都・神戶",
    "regionKeys": [
      "關西"
    ],
    "country": "JP",
    "kind": "rail",
    "trips": [],
    "source": "https://www.hankyu.co.jp/en/area_info/lp/hankyu1daypass.html",
    "coverageUrl": "https://www.hankyu.co.jp/en/area_info/lp/hankyu1daypass.html",
    "imageSource": "https://www.hankyu.co.jp/area_info/lp/img/hankyu1daypass/kv_map.png",
    "imageKind": "map",
    "credit": "阪急電鐵官方網站",
    "coverage": "阪急全線的指定一日無限搭乘方案，串連大阪、京都、神戶及寶塚。",
    "exclusions": "不含神戶高速線、JR 及其他業者路線；以官方當期版本為準。",
    "areas": [
      [
        [
          135.15,
          34.65
        ],
        [
          135.78,
          34.65
        ],
        [
          135.78,
          35.18
        ],
        [
          135.15,
          35.18
        ]
      ]
    ],
    "checkedAt": "2026-10-10",
    "image": "assets/passes/hankyu-day.png"
  },
  {
    "id": "nankai-koyasan",
    "name": "南海高野山世界遺產票",
    "english": "Koyasan World Heritage Digital Ticket",
    "region": "大阪・高野山",
    "regionKeys": [
      "關西"
    ],
    "country": "JP",
    "kind": "rail",
    "trips": [],
    "source": "https://www.nankai.co.jp/en_railway/ticket/koyasan",
    "coverageUrl": "https://www.nankai.co.jp/en_railway/ticket/koyasan",
    "imageSource": "https://www.nankai.co.jp/sites/default/files/2026-02/koyasan_banner_en_1080_500_sp.jpg",
    "imageKind": "promotion",
    "credit": "南海電鐵官方網站",
    "coverage": "指定出發站至高野山往返，及指定高野山巴士 2 日交通。",
    "exclusions": "鐵路往返不能任意中途下車；巴士排除立里、高野龍神、高野丹生都比賣等指定路線，特急依版本。",
    "areas": [
      [
        [
          135.48,
          34.64
        ],
        [
          135.57,
          34.64
        ],
        [
          135.57,
          34.71
        ],
        [
          135.48,
          34.71
        ]
      ],
      [
        [
          135.55,
          34.16
        ],
        [
          135.65,
          34.16
        ],
        [
          135.65,
          34.25
        ],
        [
          135.55,
          34.25
        ]
      ]
    ],
    "checkedAt": "2026-10-10",
    "image": "assets/passes/nankai-koyasan.jpg"
  },
  {
    "id": "tobu-all",
    "name": "日光全地區周遊券",
    "english": "NIKKO PASS all area",
    "region": "日光・關東／會津",
    "regionKeys": [
      "關東"
    ],
    "country": "JP",
    "kind": "rail",
    "trips": [],
    "source": "https://www.tobu.co.jp/en/ticket/nikko/all.html",
    "coverageUrl": "https://www.tobu.co.jp/en/ticket/nikko/all.html",
    "imageSource": "https://www.tobu.co.jp/japantrip/en/ticket/img/img-map-nikkoAll.png",
    "imageKind": "map",
    "credit": "東武鐵道官方網站",
    "coverage": "日光、鬼怒川、奧日光指定東武交通與出發站往返，湖船／纜車依季節與版本。",
    "exclusions": "東武特急費及神社／寺院門票通常需另付；不是沿途全線自由上下車，使用路段與期限依版本。",
    "areas": [
      [
        [
          139.25,
          36.5
        ],
        [
          139.85,
          36.5
        ],
        [
          139.85,
          36.95
        ],
        [
          139.25,
          36.95
        ]
      ]
    ],
    "checkedAt": "2026-10-10",
    "image": "assets/passes/tobu-all.png"
  },
  {
    "id": "tobu-city",
    "name": "日光世界遺產區域周遊券",
    "english": "NIKKO PASS world heritage area",
    "region": "日光・關東／會津",
    "regionKeys": [
      "關東"
    ],
    "country": "JP",
    "kind": "rail",
    "trips": [],
    "source": "https://www.tobu.co.jp/en/ticket/nikko/city.html",
    "coverageUrl": "https://www.tobu.co.jp/en/ticket/nikko/city.html",
    "imageSource": "https://www.tobu.co.jp/japantrip/en/ticket/nikko/img/img-map-nikkoCity.png",
    "imageKind": "map",
    "credit": "東武鐵道官方網站",
    "coverage": "日光世界遺產周邊指定巴士及東武區段，加出發站往返；不含中禪寺湖與奧日光。",
    "exclusions": "東武特急費及神社／寺院門票通常需另付；不是沿途全線自由上下車，使用路段與期限依版本。",
    "areas": [
      [
        [
          139.52,
          36.7
        ],
        [
          139.75,
          36.7
        ],
        [
          139.75,
          36.9
        ],
        [
          139.52,
          36.9
        ]
      ]
    ],
    "checkedAt": "2026-10-10",
    "image": "assets/passes/tobu-city.png"
  },
  {
    "id": "tobu-premium",
    "name": "東武川越優惠券 Premium",
    "english": "KAWAGOE DISCOUNT PASS Premium",
    "region": "關東",
    "regionKeys": [
      "關東"
    ],
    "country": "JP",
    "kind": "rail",
    "trips": [],
    "source": "https://www.tobu.co.jp/en/ticket/kawagoe/premium.html",
    "coverageUrl": "https://www.tobu.co.jp/en/ticket/kawagoe/premium.html",
    "imageSource": "https://www.tobu.co.jp/japantrip/ticket/kawagoe/img/img-kawagoePass-01.png?2026",
    "imageKind": "promotion",
    "credit": "東武鐵道官方網站",
    "coverage": "池袋至川越／川越市指定往返，加指定川越區域巴士。",
    "exclusions": "東武特急費及神社／寺院門票通常需另付；不是沿途全線自由上下車，使用路段與期限依版本。",
    "areas": [
      [
        [
          139.44,
          35.87
        ],
        [
          139.51,
          35.87
        ],
        [
          139.51,
          35.95
        ],
        [
          139.44,
          35.95
        ]
      ]
    ],
    "checkedAt": "2026-10-10",
    "image": "assets/passes/tobu-premium.png"
  },
  {
    "id": "tobu-ryomo",
    "name": "東武兩毛周遊券",
    "english": "Furatto Ryomo Tobu Free Pass",
    "region": "關東",
    "regionKeys": [
      "關東"
    ],
    "country": "JP",
    "kind": "rail",
    "trips": [],
    "source": "https://www.tobu.co.jp/en/ticket/ryomo/",
    "coverageUrl": "https://www.tobu.co.jp/en/ticket/ryomo/",
    "imageSource": "https://www.tobu.co.jp/japantrip/ticket/img/img_ticket_03.png",
    "imageKind": "promotion",
    "credit": "東武鐵道官方網站",
    "coverage": "館林、足利、佐野、太田及兩毛指定東武路線與區域巴士；出發站往返依版本。",
    "exclusions": "東武特急費及神社／寺院門票通常需另付；不是沿途全線自由上下車，使用路段與期限依版本。",
    "areas": [
      [
        [
          139.2,
          36.15
        ],
        [
          139.85,
          36.15
        ],
        [
          139.85,
          36.6
        ],
        [
          139.2,
          36.6
        ]
      ]
    ],
    "checkedAt": "2026-10-10",
    "image": "assets/passes/tobu-ryomo.png"
  },
  {
    "id": "tobu-aizu",
    "name": "東武悠閒會津周遊券",
    "english": "Yuttari Aizu Tobu Free Pass",
    "region": "日光・關東／會津",
    "regionKeys": [
      "關東",
      "東北"
    ],
    "country": "JP",
    "kind": "rail",
    "trips": [],
    "source": "https://www.tobu.co.jp/en/ticket/aizu.html",
    "coverageUrl": "https://www.tobu.co.jp/en/ticket/aizu.html",
    "imageSource": "https://www.tobu.co.jp/en/_assets_l/pass/images/imgAizuCont.png",
    "imageKind": "promotion",
    "credit": "東武鐵道官方網站",
    "coverage": "鬼怒川、會津高原與會津指定鐵路／巴士；涵蓋站點依持有版本。",
    "exclusions": "東武特急費及神社／寺院門票通常需另付；不是沿途全線自由上下車，使用路段與期限依版本。",
    "areas": [
      [
        [
          139.45,
          36.65
        ],
        [
          140.0,
          36.65
        ],
        [
          140.0,
          37.65
        ],
        [
          139.45,
          37.65
        ]
      ]
    ],
    "checkedAt": "2026-10-10",
    "image": "assets/passes/tobu-aizu.png"
  },
  {
    "id": "tobu-taito-sumida",
    "name": "東武台東・墨田下町周遊券",
    "english": "Taito-Sumida Tokyo Shitamachi Excursion Ticket",
    "region": "關東",
    "regionKeys": [
      "關東"
    ],
    "country": "JP",
    "kind": "rail",
    "trips": [],
    "source": "https://www.tobu.co.jp/en/ticket/taito-sumida.html",
    "coverageUrl": "https://www.tobu.co.jp/en/ticket/taito-sumida.html",
    "imageSource": "https://www.tobu.co.jp/en/_assets_l/pass/images/imgshitamachiCont.jpg",
    "imageKind": "promotion",
    "credit": "東武鐵道官方網站",
    "coverage": "淺草、東京晴空塔周邊指定東武區段與台東／墨田區循環巴士。",
    "exclusions": "東武特急費及神社／寺院門票通常需另付；不是沿途全線自由上下車，使用路段與期限依版本。",
    "areas": [
      [
        [
          139.76,
          35.66
        ],
        [
          139.85,
          35.66
        ],
        [
          139.85,
          35.74
        ],
        [
          139.76,
          35.74
        ]
      ]
    ],
    "checkedAt": "2026-10-10",
    "image": "assets/passes/tobu-taito-sumida.jpg"
  },
  {
    "id": "seibu-seibu1daypass",
    "name": "西武 1 日周遊券",
    "english": "SEIBU 1Day Pass",
    "region": "東京・埼玉・秩父",
    "regionKeys": [
      "關東"
    ],
    "country": "JP",
    "kind": "rail",
    "trips": [],
    "source": "https://www.seiburailway.jp/en/ticket/seibu1daypass/",
    "coverageUrl": "https://www.seiburailway.jp/en/ticket/seibu1daypass/",
    "imageSource": "https://www.seiburailway.jp/en/ticket/image/1daypass_1.png",
    "imageKind": "promotion",
    "credit": "西武鐵道官方網站",
    "coverage": "西武全線指定一日無限搭乘，不含多摩川線。",
    "exclusions": "特急費另付；單次往返不等於沿途無限搭乘，詳見指定路段。",
    "areas": [
      [
        [
          138.75,
          35.55
        ],
        [
          139.75,
          35.55
        ],
        [
          139.75,
          36.12
        ],
        [
          138.75,
          36.12
        ]
      ]
    ],
    "checkedAt": "2026-10-10",
    "image": "assets/passes/seibu-seibu1daypass.png"
  },
  {
    "id": "seibu-seibukawagoepass",
    "name": "西武川越周遊券",
    "english": "SEIBU KAWAGOE PASS",
    "region": "東京・埼玉・秩父",
    "regionKeys": [
      "關東"
    ],
    "country": "JP",
    "kind": "rail",
    "trips": [],
    "source": "https://www.seiburailway.jp/en/ticket/seibukawagoepass/",
    "coverageUrl": "https://www.seiburailway.jp/en/ticket/seibukawagoepass/",
    "imageSource": "https://www.seiburailway.jp/en/ticket/image/tokinokane-09_1.jpg",
    "imageKind": "promotion",
    "credit": "西武鐵道官方網站",
    "coverage": "西武新宿、高田馬場或池袋至本川越的一次往返。",
    "exclusions": "特急費另付；單次往返不等於沿途無限搭乘，詳見指定路段。",
    "areas": [
      [
        [
          139.4,
          35.86
        ],
        [
          139.55,
          35.86
        ],
        [
          139.55,
          35.96
        ],
        [
          139.4,
          35.96
        ]
      ]
    ],
    "checkedAt": "2026-10-10",
    "image": "assets/passes/seibu-seibukawagoepass.jpg"
  },
  {
    "id": "seibu-chichibufreeticket",
    "name": "西武秩父自由乘車券",
    "english": "Chichibu Free Ticket",
    "region": "東京・埼玉・秩父",
    "regionKeys": [
      "關東"
    ],
    "country": "JP",
    "kind": "rail",
    "trips": [],
    "source": "https://www.seiburailway.jp/en/ticket/chichibufreeticket/",
    "coverageUrl": "https://www.seiburailway.jp/en/ticket/chichibufreeticket/",
    "imageSource": "https://www.seiburailway.jp/en/ticket/image/image_07.jpg",
    "imageKind": "promotion",
    "credit": "西武鐵道官方網站",
    "coverage": "指定西武往返與秩父鐵道自由區間。",
    "exclusions": "特急費另付；單次往返不等於沿途無限搭乘，詳見指定路段。",
    "areas": [
      [
        [
          138.8,
          35.85
        ],
        [
          139.25,
          35.85
        ],
        [
          139.25,
          36.17
        ],
        [
          138.8,
          36.17
        ]
      ]
    ],
    "checkedAt": "2026-10-10",
    "image": "assets/passes/seibu-chichibufreeticket.jpg"
  },
  {
    "id": "seibu-chichibumanyuticket",
    "name": "西武秩父漫遊券",
    "english": "Chichibu Manyu Ticket",
    "region": "東京・埼玉・秩父",
    "regionKeys": [
      "關東"
    ],
    "country": "JP",
    "kind": "rail",
    "trips": [],
    "source": "https://www.seiburailway.jp/en/ticket/chichibumanyuticket/",
    "coverageUrl": "https://www.seiburailway.jp/en/ticket/chichibumanyuticket/",
    "imageSource": "https://www.seiburailway.jp/en/ticket/image/image_08.jpg",
    "imageKind": "promotion",
    "credit": "西武鐵道官方網站",
    "coverage": "西武指定往返與秩父地區指定交通／溫泉等擇一優惠。",
    "exclusions": "特急費另付；單次往返不等於沿途無限搭乘，詳見指定路段。",
    "areas": [
      [
        [
          138.8,
          35.85
        ],
        [
          139.25,
          35.85
        ],
        [
          139.25,
          36.17
        ],
        [
          138.8,
          36.17
        ]
      ]
    ],
    "checkedAt": "2026-10-10",
    "image": "assets/passes/seibu-chichibumanyuticket.jpg"
  },
  {
    "id": "seibu-mvpticket_travelpass",
    "name": "西武姆明谷樂園交通套票",
    "english": "MOOMINVALLEY PARK Ticket & Travel Pass",
    "region": "東京・埼玉・秩父",
    "regionKeys": [
      "關東"
    ],
    "country": "JP",
    "kind": "rail",
    "trips": [],
    "source": "https://www.seiburailway.jp/en/ticket/mvpticket_travelpass/",
    "coverageUrl": "https://www.seiburailway.jp/en/ticket/mvpticket_travelpass/",
    "imageSource": "https://www.seiburailway.jp/en/ticket/image/image_06.jpg",
    "imageKind": "promotion",
    "credit": "西武鐵道官方網站",
    "coverage": "指定西武鐵路、接駁巴士與姆明谷樂園入園，依數位票使用規則。",
    "exclusions": "特急費另付；單次往返不等於沿途無限搭乘，詳見指定路段。",
    "areas": [
      [
        [
          139.28,
          35.82
        ],
        [
          139.38,
          35.82
        ],
        [
          139.38,
          35.9
        ],
        [
          139.28,
          35.9
        ]
      ]
    ],
    "checkedAt": "2026-10-10",
    "image": "assets/passes/seibu-mvpticket_travelpass.jpg"
  },
  {
    "id": "taiwan-hsr",
    "name": "Taiwan PASS 高鐵版",
    "english": "Taiwan PASS 高鐵版",
    "region": "台灣全台",
    "regionKeys": [
      "全台",
      "北部",
      "中部",
      "南部"
    ],
    "country": "TW",
    "kind": "bundle",
    "trips": [],
    "source": "https://twpass.tw/?lang=zh_TW",
    "coverageUrl": "https://twpass.tw/?lang=zh_TW",
    "imageSource": "https://twpass.tw/images/product_hsr.jpg",
    "imageKind": "promotion",
    "credit": "交通部觀光署／Taiwan PASS 官方網站",
    "coverage": "高鐵 3 日周遊券，加都會捷運任選 1 與景區接駁任選 1；其他服務須依所選項目兌換。",
    "exclusions": "地圖依主要鐵路沿線示意；捷運與景區接駁是任選項目，不能把全部合作交通都當成可無限搭乘。",
    "areas": [
      [
        [
          120.15,
          22.25
        ],
        [
          120.6,
          22.25
        ],
        [
          120.85,
          23.1
        ],
        [
          121.3,
          24.65
        ],
        [
          121.75,
          25.15
        ],
        [
          121.25,
          25.3
        ],
        [
          120.5,
          24.35
        ],
        [
          120.05,
          23.3
        ]
      ]
    ],
    "checkedAt": "2026-10-10",
    "image": "assets/passes/taiwan-hsr.jpg"
  },
  {
    "id": "taiwan-tra",
    "name": "Taiwan PASS 台鐵版",
    "english": "Taiwan PASS 台鐵版",
    "region": "台灣全台",
    "regionKeys": [
      "全台",
      "北部",
      "中部",
      "南部",
      "東部"
    ],
    "country": "TW",
    "kind": "bundle",
    "trips": [],
    "source": "https://twpass.tw/?lang=zh_TW",
    "coverageUrl": "https://twpass.tw/?lang=zh_TW",
    "imageSource": "https://twpass.tw/images/product_tr.jpg",
    "imageKind": "promotion",
    "credit": "交通部觀光署／Taiwan PASS 官方網站",
    "coverage": "台鐵 3 日周遊券，加都會捷運任選 1 與景區接駁任選 1；可搭列車與兌換規則依官方說明。",
    "exclusions": "地圖依主要鐵路沿線示意；捷運與景區接駁是任選項目，不能把全部合作交通都當成可無限搭乘。",
    "areas": [
      [
        [
          120.2,
          21.85
        ],
        [
          121.0,
          22.2
        ],
        [
          121.55,
          23.1
        ],
        [
          122.05,
          25.15
        ],
        [
          121.4,
          25.4
        ],
        [
          120.7,
          24.8
        ],
        [
          120.0,
          23.6
        ]
      ]
    ],
    "checkedAt": "2026-10-10",
    "image": "assets/passes/taiwan-tra.jpg"
  },
  {
    "id": "tw-tra-three-day",
    "name": "台鐵 3 日周遊券",
    "english": "台鐵 3 日周遊券",
    "region": "台灣全台",
    "regionKeys": [
      "全台",
      "北部",
      "中部",
      "南部",
      "東部"
    ],
    "country": "TW",
    "kind": "rail",
    "trips": [],
    "source": "https://twpass.funpass.app/TR?lang=zh_TW",
    "coverageUrl": "https://twpass.funpass.app/TR?lang=zh_TW",
    "imageSource": "https://twpass.funpass.app/upload/taiwanpass_gov/img/TR/tr_01.jpg",
    "imageKind": "promotion",
    "credit": "Taiwan PASS 官方交通商品圖",
    "coverage": "三日內指定台鐵列車，可用對號／非對號列車與劃位條件依官方規則。",
    "exclusions": "圖上顯示目的地規劃範圍；單次／來回票不是區域無限搭乘券，景點門票、次數、預約與兌換條件依各商品。",
    "areas": [
      [
        [
          120.2,
          21.85
        ],
        [
          121.0,
          22.2
        ],
        [
          121.55,
          23.1
        ],
        [
          122.05,
          25.15
        ],
        [
          121.4,
          25.4
        ],
        [
          120.7,
          24.8
        ],
        [
          120.0,
          23.6
        ]
      ]
    ],
    "checkedAt": "2026-10-10",
    "image": "assets/passes/tw-tra-three-day.jpg"
  },
  {
    "id": "tw-taipei-transport",
    "name": "北北基好玩卡・交通暢遊版",
    "english": "北北基好玩卡・交通暢遊版",
    "region": "台北・新北・基隆",
    "regionKeys": [
      "北部"
    ],
    "country": "TW",
    "kind": "transport",
    "trips": [],
    "source": "https://twpass.funpass.app/TR?lang=zh_TW",
    "coverageUrl": "https://twpass.funpass.app/TR?lang=zh_TW",
    "imageSource": "https://twpass.funpass.app/upload/taiwanpass_gov/img/TR/mrt_01.jpg",
    "imageKind": "promotion",
    "credit": "Taiwan PASS 官方交通商品圖",
    "coverage": "指定台北捷運、市區公車與 6 條台灣好行路線；天數依版本。",
    "exclusions": "圖上顯示目的地規劃範圍；單次／來回票不是區域無限搭乘券，景點門票、次數、預約與兌換條件依各商品。",
    "areas": [
      [
        [
          121.3,
          24.8
        ],
        [
          122.0,
          24.8
        ],
        [
          122.0,
          25.35
        ],
        [
          121.3,
          25.35
        ]
      ]
    ],
    "checkedAt": "2026-10-10",
    "image": "assets/passes/tw-taipei-transport.jpg"
  },
  {
    "id": "tw-taoyuan-airport-return",
    "name": "桃園機場捷運來回票",
    "english": "桃園機場捷運來回票",
    "region": "台北・桃園機場",
    "regionKeys": [
      "北部"
    ],
    "country": "TW",
    "kind": "transport",
    "trips": [],
    "source": "https://twpass.funpass.app/TR?lang=zh_TW",
    "coverageUrl": "https://twpass.funpass.app/TR?lang=zh_TW",
    "imageSource": "https://twpass.funpass.app/upload/taiwanpass_gov/img/TR/mrt_02.jpg",
    "imageKind": "promotion",
    "credit": "Taiwan PASS 官方交通商品圖",
    "coverage": "桃園機場捷運指定往返搭乘；不是全線無限上下車。",
    "exclusions": "圖上顯示目的地規劃範圍；單次／來回票不是區域無限搭乘券，景點門票、次數、預約與兌換條件依各商品。",
    "areas": [
      [
        [
          121.19,
          25.02
        ],
        [
          121.55,
          25.02
        ],
        [
          121.55,
          25.13
        ],
        [
          121.19,
          25.13
        ]
      ]
    ],
    "checkedAt": "2026-10-10",
    "image": "assets/passes/tw-taoyuan-airport-return.jpg"
  },
  {
    "id": "tw-taichung-metro",
    "name": "台中捷運 48 小時旅遊票",
    "english": "台中捷運 48 小時旅遊票",
    "region": "台中",
    "regionKeys": [
      "中部"
    ],
    "country": "TW",
    "kind": "transport",
    "trips": [],
    "source": "https://twpass.funpass.app/TR?lang=zh_TW",
    "coverageUrl": "https://twpass.funpass.app/TR?lang=zh_TW",
    "imageSource": "https://twpass.funpass.app/upload/taiwanpass_gov/img/TR/mrt_03.jpg",
    "imageKind": "promotion",
    "credit": "Taiwan PASS 官方交通商品圖",
    "coverage": "台中捷運指定 48 小時無限搭乘。",
    "exclusions": "圖上顯示目的地規劃範圍；單次／來回票不是區域無限搭乘券，景點門票、次數、預約與兌換條件依各商品。",
    "areas": [
      [
        [
          120.56,
          24.05
        ],
        [
          120.77,
          24.05
        ],
        [
          120.77,
          24.29
        ],
        [
          120.56,
          24.29
        ]
      ]
    ],
    "checkedAt": "2026-10-10",
    "image": "assets/passes/tw-taichung-metro.jpg"
  },
  {
    "id": "tw-kaohsiung-metro",
    "name": "高雄捷運＋輕軌 2 日券",
    "english": "高雄捷運＋輕軌 2 日券",
    "region": "高雄",
    "regionKeys": [
      "南部"
    ],
    "country": "TW",
    "kind": "transport",
    "trips": [],
    "source": "https://twpass.funpass.app/TR?lang=zh_TW",
    "coverageUrl": "https://twpass.funpass.app/TR?lang=zh_TW",
    "imageSource": "https://twpass.funpass.app/upload/taiwanpass_gov/img/TR/mrt_04.jpg",
    "imageKind": "promotion",
    "credit": "Taiwan PASS 官方交通商品圖",
    "coverage": "高雄捷運與輕軌指定 2 日交通；機場站依官方路線。",
    "exclusions": "圖上顯示目的地規劃範圍；單次／來回票不是區域無限搭乘券，景點門票、次數、預約與兌換條件依各商品。",
    "areas": [
      [
        [
          120.17,
          22.46
        ],
        [
          120.48,
          22.46
        ],
        [
          120.48,
          22.88
        ],
        [
          120.17,
          22.88
        ]
      ]
    ],
    "checkedAt": "2026-10-10",
    "image": "assets/passes/tw-kaohsiung-metro.jpg"
  },
  {
    "id": "tw-yilan-pass",
    "name": "宜蘭好行 3 日券",
    "english": "宜蘭好行 3 日券",
    "region": "宜蘭",
    "regionKeys": [
      "東部"
    ],
    "country": "TW",
    "kind": "transport",
    "trips": [],
    "source": "https://twpass.funpass.app/TR?lang=zh_TW",
    "coverageUrl": "https://twpass.funpass.app/TR?lang=zh_TW",
    "imageSource": "https://twpass.funpass.app/upload/taiwanpass_gov/img/TR/hot_01.jpg",
    "imageKind": "promotion",
    "credit": "Taiwan PASS 官方交通商品圖",
    "coverage": "宜蘭好行指定公車路線，依官方 3 日券條件。",
    "exclusions": "圖上顯示目的地規劃範圍；單次／來回票不是區域無限搭乘券，景點門票、次數、預約與兌換條件依各商品。",
    "areas": [
      [
        [
          121.5,
          24.4
        ],
        [
          121.9,
          24.4
        ],
        [
          121.9,
          24.9
        ],
        [
          121.5,
          24.9
        ]
      ]
    ],
    "checkedAt": "2026-10-10",
    "image": "assets/passes/tw-yilan-pass.jpg"
  },
  {
    "id": "tw-yilan-funtour",
    "name": "宜蘭 FunTOUR 巴士票",
    "english": "宜蘭 FunTOUR 巴士票",
    "region": "宜蘭",
    "regionKeys": [
      "東部"
    ],
    "country": "TW",
    "kind": "transport",
    "trips": [],
    "source": "https://twpass.funpass.app/TR?lang=zh_TW",
    "coverageUrl": "https://twpass.funpass.app/TR?lang=zh_TW",
    "imageSource": "https://twpass.funpass.app/upload/taiwanpass_gov/img/TR/hot_13.jpg",
    "imageKind": "promotion",
    "credit": "Taiwan PASS 官方交通商品圖",
    "coverage": "宜蘭 FunTOUR 指定巴士遊程與停靠點；需依指定日期／班次。",
    "exclusions": "圖上顯示目的地規劃範圍；單次／來回票不是區域無限搭乘券，景點門票、次數、預約與兌換條件依各商品。",
    "areas": [
      [
        [
          121.5,
          24.4
        ],
        [
          121.9,
          24.4
        ],
        [
          121.9,
          24.9
        ],
        [
          121.5,
          24.9
        ]
      ]
    ],
    "checkedAt": "2026-10-10",
    "image": "assets/passes/tw-yilan-funtour.jpg"
  },
  {
    "id": "tw-taichung-go",
    "name": "台中 Go 暢遊 48 小時套票",
    "english": "台中 Go 暢遊 48 小時套票",
    "region": "台中",
    "regionKeys": [
      "中部"
    ],
    "country": "TW",
    "kind": "transport",
    "trips": [],
    "source": "https://twpass.funpass.app/TR?lang=zh_TW",
    "coverageUrl": "https://twpass.funpass.app/TR?lang=zh_TW",
    "imageSource": "https://twpass.funpass.app/upload/taiwanpass_gov/img/TR/hot_07.jpg",
    "imageKind": "promotion",
    "credit": "Taiwan PASS 官方交通商品圖",
    "coverage": "台中 Go 指定公車 48 小時交通與合作優惠。",
    "exclusions": "圖上顯示目的地規劃範圍；單次／來回票不是區域無限搭乘券，景點門票、次數、預約與兌換條件依各商品。",
    "areas": [
      [
        [
          120.4,
          24.0
        ],
        [
          120.95,
          24.0
        ],
        [
          120.95,
          24.5
        ],
        [
          120.4,
          24.5
        ]
      ]
    ],
    "checkedAt": "2026-10-10",
    "image": "assets/passes/tw-taichung-go.jpg"
  },
  {
    "id": "tw-qingjing-shuttle",
    "name": "台灣好行清境線來回票",
    "english": "台灣好行清境線來回票",
    "region": "南投・清境",
    "regionKeys": [
      "中部"
    ],
    "country": "TW",
    "kind": "transport",
    "trips": [],
    "source": "https://twpass.funpass.app/TR?lang=zh_TW",
    "coverageUrl": "https://twpass.funpass.app/TR?lang=zh_TW",
    "imageSource": "https://twpass.funpass.app/upload/taiwanpass_gov/img/TR/hot_02.jpg",
    "imageKind": "promotion",
    "credit": "Taiwan PASS 官方交通商品圖",
    "coverage": "台灣好行清境線指定往返路段；不代表所有南投巴士可搭。",
    "exclusions": "圖上顯示目的地規劃範圍；單次／來回票不是區域無限搭乘券，景點門票、次數、預約與兌換條件依各商品。",
    "areas": [
      [
        [
          121.07,
          24.03
        ],
        [
          121.21,
          24.03
        ],
        [
          121.21,
          24.15
        ],
        [
          121.07,
          24.15
        ]
      ]
    ],
    "checkedAt": "2026-10-10",
    "image": "assets/passes/tw-qingjing-shuttle.jpg"
  },
  {
    "id": "tw-sun-moon-lake-shuttle",
    "name": "台灣好行日月潭線來回票",
    "english": "台灣好行日月潭線來回票",
    "region": "南投・日月潭",
    "regionKeys": [
      "中部"
    ],
    "country": "TW",
    "kind": "transport",
    "trips": [],
    "source": "https://twpass.funpass.app/TR?lang=zh_TW",
    "coverageUrl": "https://twpass.funpass.app/TR?lang=zh_TW",
    "imageSource": "https://twpass.funpass.app/upload/taiwanpass_gov/img/TR/hot_03.jpg",
    "imageKind": "promotion",
    "credit": "Taiwan PASS 官方交通商品圖",
    "coverage": "台灣好行日月潭線指定往返路段。",
    "exclusions": "圖上顯示目的地規劃範圍；單次／來回票不是區域無限搭乘券，景點門票、次數、預約與兌換條件依各商品。",
    "areas": [
      [
        [
          120.85,
          23.81
        ],
        [
          120.96,
          23.81
        ],
        [
          120.96,
          23.92
        ],
        [
          120.85,
          23.92
        ]
      ]
    ],
    "checkedAt": "2026-10-10",
    "image": "assets/passes/tw-sun-moon-lake-shuttle.jpg"
  },
  {
    "id": "tw-sun-moon-lake-funtour",
    "name": "日月潭 FunTOUR 巴士票",
    "english": "日月潭 FunTOUR 巴士票",
    "region": "南投・日月潭",
    "regionKeys": [
      "中部"
    ],
    "country": "TW",
    "kind": "transport",
    "trips": [],
    "source": "https://twpass.funpass.app/TR?lang=zh_TW",
    "coverageUrl": "https://twpass.funpass.app/TR?lang=zh_TW",
    "imageSource": "https://twpass.funpass.app/upload/taiwanpass_gov/img/TR/hot_14.jpg",
    "imageKind": "promotion",
    "credit": "Taiwan PASS 官方交通商品圖",
    "coverage": "日月潭 FunTOUR 指定巴士遊程與停靠點；須依指定班次。",
    "exclusions": "圖上顯示目的地規劃範圍；單次／來回票不是區域無限搭乘券，景點門票、次數、預約與兌換條件依各商品。",
    "areas": [
      [
        [
          120.85,
          23.81
        ],
        [
          120.96,
          23.81
        ],
        [
          120.96,
          23.92
        ],
        [
          120.85,
          23.92
        ]
      ]
    ],
    "checkedAt": "2026-10-10",
    "image": "assets/passes/tw-sun-moon-lake-funtour.jpg"
  },
  {
    "id": "tw-alishan-shuttle",
    "name": "台灣好行阿里山線來回票",
    "english": "台灣好行阿里山線來回票",
    "region": "嘉義・阿里山",
    "regionKeys": [
      "南部"
    ],
    "country": "TW",
    "kind": "transport",
    "trips": [],
    "source": "https://twpass.funpass.app/TR?lang=zh_TW",
    "coverageUrl": "https://twpass.funpass.app/TR?lang=zh_TW",
    "imageSource": "https://twpass.funpass.app/upload/taiwanpass_gov/img/TR/hot_04.jpg",
    "imageKind": "promotion",
    "credit": "Taiwan PASS 官方交通商品圖",
    "coverage": "台灣好行阿里山線指定往返路段。",
    "exclusions": "圖上顯示目的地規劃範圍；單次／來回票不是區域無限搭乘券，景點門票、次數、預約與兌換條件依各商品。",
    "areas": [
      [
        [
          120.67,
          23.43
        ],
        [
          120.89,
          23.43
        ],
        [
          120.89,
          23.57
        ],
        [
          120.67,
          23.57
        ]
      ]
    ],
    "checkedAt": "2026-10-10",
    "image": "assets/passes/tw-alishan-shuttle.jpg"
  },
  {
    "id": "tw-alishan-main-out",
    "name": "阿里山林鐵嘉義至阿里山套票",
    "english": "阿里山林鐵嘉義至阿里山套票",
    "region": "嘉義・阿里山",
    "regionKeys": [
      "南部"
    ],
    "country": "TW",
    "kind": "bundle",
    "trips": [],
    "source": "https://twpass.funpass.app/TR?lang=zh_TW",
    "coverageUrl": "https://twpass.funpass.app/TR?lang=zh_TW",
    "imageSource": "https://twpass.funpass.app/upload/taiwanpass_gov/img/TR/hot_06.jpg",
    "imageKind": "promotion",
    "credit": "Taiwan PASS 官方交通商品圖",
    "coverage": "阿里山林鐵嘉義至阿里山指定去程，含官方列出的森林遊樂區門票；需預約。",
    "exclusions": "圖上顯示目的地規劃範圍；單次／來回票不是區域無限搭乘券，景點門票、次數、預約與兌換條件依各商品。",
    "areas": [
      [
        [
          120.67,
          23.43
        ],
        [
          120.89,
          23.43
        ],
        [
          120.89,
          23.57
        ],
        [
          120.67,
          23.57
        ]
      ]
    ],
    "checkedAt": "2026-10-10",
    "image": "assets/passes/tw-alishan-main-out.jpg"
  },
  {
    "id": "tw-alishan-main-return",
    "name": "阿里山林鐵阿里山至嘉義票",
    "english": "阿里山林鐵阿里山至嘉義票",
    "region": "嘉義・阿里山",
    "regionKeys": [
      "南部"
    ],
    "country": "TW",
    "kind": "transport",
    "trips": [],
    "source": "https://twpass.funpass.app/TR?lang=zh_TW",
    "coverageUrl": "https://twpass.funpass.app/TR?lang=zh_TW",
    "imageSource": "https://twpass.funpass.app/upload/taiwanpass_gov/img/TR/hot_08.png",
    "imageKind": "promotion",
    "credit": "Taiwan PASS 官方交通商品圖",
    "coverage": "阿里山林鐵阿里山至嘉義指定回程；不是本線無限搭乘。",
    "exclusions": "圖上顯示目的地規劃範圍；單次／來回票不是區域無限搭乘券，景點門票、次數、預約與兌換條件依各商品。",
    "areas": [
      [
        [
          120.67,
          23.43
        ],
        [
          120.89,
          23.43
        ],
        [
          120.89,
          23.57
        ],
        [
          120.67,
          23.57
        ]
      ]
    ],
    "checkedAt": "2026-10-10",
    "image": "assets/passes/tw-alishan-main-return.png"
  },
  {
    "id": "tw-alishan-branch-day",
    "name": "阿里山林鐵支線一日券",
    "english": "阿里山林鐵支線一日券",
    "region": "阿里山",
    "regionKeys": [
      "南部"
    ],
    "country": "TW",
    "kind": "rail",
    "trips": [],
    "source": "https://twpass.funpass.app/TR?lang=zh_TW",
    "coverageUrl": "https://twpass.funpass.app/TR?lang=zh_TW",
    "imageSource": "https://twpass.funpass.app/upload/taiwanpass_gov/img/TR/hot_09.jpg",
    "imageKind": "promotion",
    "credit": "Taiwan PASS 官方交通商品圖",
    "coverage": "阿里山林鐵祝山、沼平、神木指定支線一日券。",
    "exclusions": "圖上顯示目的地規劃範圍；單次／來回票不是區域無限搭乘券，景點門票、次數、預約與兌換條件依各商品。",
    "areas": [
      [
        [
          120.78,
          23.47
        ],
        [
          120.84,
          23.47
        ],
        [
          120.84,
          23.54
        ],
        [
          120.78,
          23.54
        ]
      ]
    ],
    "checkedAt": "2026-10-10",
    "image": "assets/passes/tw-alishan-branch-day.jpg"
  },
  {
    "id": "tw-kaohsiung-mengo",
    "name": "高雄 MeN Go 48 小時旅遊票",
    "english": "高雄 MeN Go 48 小時旅遊票",
    "region": "高雄",
    "regionKeys": [
      "南部"
    ],
    "country": "TW",
    "kind": "transport",
    "trips": [],
    "source": "https://twpass.funpass.app/TR?lang=zh_TW",
    "coverageUrl": "https://twpass.funpass.app/TR?lang=zh_TW",
    "imageSource": "https://twpass.funpass.app/upload/taiwanpass_gov/img/TR/hot_12.jpg",
    "imageKind": "promotion",
    "credit": "Taiwan PASS 官方交通商品圖",
    "coverage": "高雄 MeN Go 指定捷運、輕軌、公車與其他合作交通；各項次數依方案。",
    "exclusions": "圖上顯示目的地規劃範圍；單次／來回票不是區域無限搭乘券，景點門票、次數、預約與兌換條件依各商品。",
    "areas": [
      [
        [
          120.17,
          22.46
        ],
        [
          120.65,
          22.46
        ],
        [
          120.65,
          23.0
        ],
        [
          120.17,
          23.0
        ]
      ]
    ],
    "checkedAt": "2026-10-10",
    "image": "assets/passes/tw-kaohsiung-mengo.jpg"
  },
  {
    "id": "tw-kenting-shuttle",
    "name": "台灣好行墾丁快線來回票",
    "english": "台灣好行墾丁快線來回票",
    "region": "高雄・墾丁",
    "regionKeys": [
      "南部"
    ],
    "country": "TW",
    "kind": "transport",
    "trips": [],
    "source": "https://twpass.funpass.app/TR?lang=zh_TW",
    "coverageUrl": "https://twpass.funpass.app/TR?lang=zh_TW",
    "imageSource": "https://twpass.funpass.app/upload/taiwanpass_gov/img/TR/hot_05.jpg",
    "imageKind": "promotion",
    "credit": "Taiwan PASS 官方交通商品圖",
    "coverage": "左營至墾丁指定往返巴士；途中上下車與預約依官方規則。",
    "exclusions": "圖上顯示目的地規劃範圍；單次／來回票不是區域無限搭乘券，景點門票、次數、預約與兌換條件依各商品。",
    "areas": [
      [
        [
          120.63,
          21.87
        ],
        [
          120.91,
          21.87
        ],
        [
          120.91,
          22.07
        ],
        [
          120.63,
          22.07
        ]
      ]
    ],
    "checkedAt": "2026-10-10",
    "image": "assets/passes/tw-kenting-shuttle.jpg"
  },
  {
    "id": "taipei-unlimited",
    "name": "北北基好玩卡・無限暢遊版",
    "english": "Taipei FunPASS Unlimited",
    "region": "台北・新北・基隆",
    "regionKeys": [
      "北部"
    ],
    "country": "TW",
    "kind": "attractions",
    "trips": [],
    "source": "https://taipei.funpass.app/?lang=en_US",
    "coverageUrl": "https://taipei.funpass.app/?lang=en_US",
    "imageSource": "https://taipei.funpass.app/theme/taipeifunpass_abroad/images/banner_en_US_01.jpg",
    "imageKind": "promotion",
    "credit": "Taipei FunPASS 官方網站",
    "coverage": "指定合作景點、台北捷運、市區公車與台灣好行指定路線；天數依版本。",
    "exclusions": "不含桃園機場捷運、指定新北輕軌／三鶯線與非合作景點，實際名單與使用次數依版本。",
    "areas": [
      [
        [
          121.3,
          24.8
        ],
        [
          122.0,
          24.8
        ],
        [
          122.0,
          25.35
        ],
        [
          121.3,
          25.35
        ]
      ]
    ],
    "checkedAt": "2026-10-10",
    "image": "assets/passes/taipei-unlimited.jpg"
  },
  {
    "id": "jr-kyushu-mobile",
    "name": "JR 九州福岡廣域數位周遊券",
    "english": "JR KYUSHU RAIL PASS Mobile — Fukuoka Wide",
    "region": "福岡・佐賀・大分部分",
    "regionKeys": [
      "九州"
    ],
    "country": "JP",
    "kind": "rail",
    "trips": [],
    "source": "https://www.jrkyushu.co.jp/english/railpass/mobilepass.html",
    "coverageUrl": "https://www.jrkyushu.co.jp/english/railpass/mobilepass.html",
    "imageSource": "https://www.jrkyushu.co.jp/lang/assets/img/railpass/mobile/img_fukuoka.png",
    "imageKind": "map",
    "credit": "JR 九州官方網站",
    "coverage": "福岡廣域指定 JR 普通、快速與特急非指定席；2 日數位票，不含新幹線、地鐵、其他業者與巴士。",
    "exclusions": "圖上為沿線規劃區域示意；其他業者、區域內景點門票及加價服務不會因此自動包含，請看官方路線與使用條件。",
    "areas": [
      [
        [
          130.0,
          33.0
        ],
        [
          131.35,
          33.0
        ],
        [
          131.35,
          33.95
        ],
        [
          130.0,
          33.95
        ]
      ]
    ],
    "checkedAt": "2026-10-10",
    "image": "assets/passes/jr-kyushu-mobile.png"
  },
  {
    "id": "fukuoka-subway-day",
    "name": "福岡地鐵一日券",
    "english": "Fukuoka Subway 1-Day Pass",
    "region": "福岡",
    "regionKeys": [
      "九州"
    ],
    "country": "JP",
    "kind": "transport",
    "trips": [],
    "source": "https://subway.city.fukuoka.lg.jp/fare/card/oneday.php",
    "coverageUrl": "https://subway.city.fukuoka.lg.jp/fare/card/oneday.php",
    "imageSource": "https://subway.city.fukuoka.lg.jp/fare/card/img/pict01.jpg",
    "imageKind": "ticket",
    "credit": "福岡市地下鐵官方網站",
    "coverage": "福岡地下鐵空港線、箱崎線與七隈線一日自由搭乘。",
    "exclusions": "不含 JR 筑肥線、西鐵、巴士、景點門票與其他區域交通。",
    "areas": [
      [
        [
          130.25,
          33.52
        ],
        [
          130.47,
          33.52
        ],
        [
          130.47,
          33.67
        ],
        [
          130.25,
          33.67
        ]
      ]
    ],
    "checkedAt": "2026-10-10",
    "image": "assets/passes/fukuoka-subway-day.jpg"
  },
  {
    "id": "okinawa-yui",
    "name": "沖繩 Yui Rail 24／48 小時券",
    "english": "Yui Rail Free Pass",
    "region": "沖繩・那霸・浦添",
    "regionKeys": [
      "沖繩"
    ],
    "country": "JP",
    "kind": "transport",
    "trips": [],
    "source": "https://www.yui-rail.co.jp/ticketinfo-ticket/ticketinfo/1day-pass/",
    "coverageUrl": "https://www.yui-rail.co.jp/ticketinfo-ticket/ticketinfo/1day-pass/",
    "imageSource": "https://www.yui-rail.co.jp/common/uploads/bg-sub-nav-yuirail.jpg",
    "imageKind": "promotion",
    "credit": "沖繩都市單軌電車官方交通圖片",
    "coverage": "那霸機場至 Tedako-Uranishi 的 Yui Rail 全線；站售 1／2 日版為 24／48 小時。數位版當日／時數條件另依方案。",
    "exclusions": "不含沖繩全島巴士、中北部景點交通與門票；單軌沿線規劃區域不是整座沖繩島。",
    "areas": [
      [
        [
          127.64,
          26.17
        ],
        [
          127.76,
          26.17
        ],
        [
          127.76,
          26.27
        ],
        [
          127.64,
          26.27
        ]
      ]
    ],
    "checkedAt": "2026-10-10",
    "image": "assets/passes/okinawa-yui.jpg"
  },
  {
    "id": "korail-pass",
    "name": "韓國鐵路周遊券",
    "english": "KORAIL PASS",
    "region": "韓國本島鐵路",
    "regionKeys": [
      "全國",
      "首都圈",
      "江原",
      "忠清",
      "全羅",
      "釜山／慶尚"
    ],
    "country": "KR",
    "kind": "rail",
    "trips": [],
    "source": "https://www.korail.com/global/eng/passengerGuide/ticketTypes/korailpass",
    "coverageUrl": "https://www.korail.com/global/eng/passengerGuide/ticketTypes/korailpass",
    "imageSource": "https://tong.visitkorea.or.kr/cms/resource_etc/88/2556688_image_1.jpg",
    "imageKind": "ticket",
    "credit": "韓國觀光公社刊載的 KORAIL 官方票券圖",
    "coverage": "指定 KORAIL／KTX 鐵路，選擇 2／3／4／5 天方案；使用日、劃位與搭乘資格依當期規則。",
    "exclusions": "不含 SRT、市區地鐵、濟州島及指定臨時觀光列車；頭等艙另有加價，圖上為鐵路沿線規劃示意。",
    "areas": [
      [
        [
          126.1,
          34.2
        ],
        [
          127.1,
          34.35
        ],
        [
          129.65,
          35.35
        ],
        [
          129.1,
          37.2
        ],
        [
          128.35,
          38.65
        ],
        [
          127.0,
          38.35
        ],
        [
          126.0,
          37.55
        ]
      ]
    ],
    "checkedAt": "2026-10-10",
    "image": "assets/passes/korail-pass.jpg"
  },
  {
    "id": "korail-plus",
    "name": "韓國鐵路周遊券 Plus",
    "english": "KORAIL PASS+",
    "region": "韓國本島鐵路＋全國儲值服務",
    "regionKeys": [
      "全國",
      "首都圈",
      "江原",
      "忠清",
      "全羅",
      "釜山／慶尚",
      "濟州"
    ],
    "country": "KR",
    "kind": "bundle",
    "trips": [],
    "source": "https://english.visitkorea.or.kr/svc/contents/contentsView.do?vcontsId=1563646",
    "coverageUrl": "https://english.visitkorea.or.kr/svc/contents/contentsView.do?vcontsId=1563646",
    "imageSource": "https://tong.visitkorea.or.kr/cms/resource/12/4003612_image0_1.png",
    "imageKind": "ticket",
    "credit": "韓國觀光公社／KORAIL 官方公告",
    "coverage": "KORAIL PASS 另加 NAMANE 交通／支付功能；鐵路權益依原周遊券，市區交通與消費需另儲值。",
    "exclusions": "Plus 不是全國地鐵免費券；KORAIL 不涵蓋濟州島，卡片的儲值功能與鐵路周遊券分別計費。",
    "areas": [
      [
        [
          126.1,
          34.2
        ],
        [
          127.1,
          34.35
        ],
        [
          129.65,
          35.35
        ],
        [
          129.1,
          37.2
        ],
        [
          128.35,
          38.65
        ],
        [
          127.0,
          38.35
        ],
        [
          126.0,
          37.55
        ]
      ],
      [
        [
          126.1,
          33.08
        ],
        [
          126.99,
          33.08
        ],
        [
          126.99,
          33.62
        ],
        [
          126.1,
          33.62
        ]
      ]
    ],
    "checkedAt": "2026-10-10",
    "image": "assets/passes/korail-plus.png"
  },
  {
    "id": "tmoney-travel",
    "name": "Tmoney 韓國旅行卡",
    "english": "TMONEY TRAVEL CARD",
    "region": "韓國全國",
    "regionKeys": [
      "全國",
      "首都圈",
      "江原",
      "忠清",
      "全羅",
      "釜山／慶尚",
      "濟州"
    ],
    "country": "KR",
    "kind": "stored-value",
    "trips": [],
    "source": "https://tmoney.co.kr/aeb/biz/bridge/foreignTravel.dev",
    "coverageUrl": "https://tmoney.co.kr/aeb/biz/bridge/foreignTravel.dev",
    "imageSource": "https://tmoney.co.kr/html/bridge/img/travel-list01.png",
    "imageKind": "ticket",
    "credit": "Tmoney 官方網站",
    "coverage": "韓國指定公車、地鐵等 Tmoney 合作交通與支付；Plus 另結合 WOWPASS 支付功能。",
    "exclusions": "需另外儲值並按實際搭乘扣款，不是無限搭乘券。KTX／SRT 不能當交通卡直接搭乘；合作店優惠依當期名單。",
    "areas": [
      [
        [
          126.1,
          34.2
        ],
        [
          127.1,
          34.35
        ],
        [
          129.65,
          35.35
        ],
        [
          129.1,
          37.2
        ],
        [
          128.35,
          38.65
        ],
        [
          127.0,
          38.35
        ],
        [
          126.0,
          37.55
        ]
      ],
      [
        [
          126.1,
          33.08
        ],
        [
          126.99,
          33.08
        ],
        [
          126.99,
          33.62
        ],
        [
          126.1,
          33.62
        ]
      ]
    ],
    "checkedAt": "2026-10-10",
    "image": "assets/passes/tmoney-travel.png"
  },
  {
    "id": "tmoney-travel-plus",
    "name": "Tmoney 韓國旅行卡 Plus",
    "english": "TMONEY TRAVEL CARD +",
    "region": "韓國全國",
    "regionKeys": [
      "全國",
      "首都圈",
      "江原",
      "忠清",
      "全羅",
      "釜山／慶尚",
      "濟州"
    ],
    "country": "KR",
    "kind": "stored-value",
    "trips": [],
    "source": "https://tmoney.co.kr/aeb/biz/bridge/foreignTravel.dev",
    "coverageUrl": "https://tmoney.co.kr/aeb/biz/bridge/foreignTravel.dev",
    "imageSource": "https://tmoney.co.kr/html/bridge/img/travel-list02.png",
    "imageKind": "ticket",
    "credit": "Tmoney 官方網站",
    "coverage": "韓國指定公車、地鐵等 Tmoney 合作交通與支付；Plus 另結合 WOWPASS 支付功能。",
    "exclusions": "需另外儲值並按實際搭乘扣款，不是無限搭乘券。KTX／SRT 不能當交通卡直接搭乘；合作店優惠依當期名單。",
    "areas": [
      [
        [
          126.1,
          34.2
        ],
        [
          127.1,
          34.35
        ],
        [
          129.65,
          35.35
        ],
        [
          129.1,
          37.2
        ],
        [
          128.35,
          38.65
        ],
        [
          127.0,
          38.35
        ],
        [
          126.0,
          37.55
        ]
      ],
      [
        [
          126.1,
          33.08
        ],
        [
          126.99,
          33.08
        ],
        [
          126.99,
          33.62
        ],
        [
          126.1,
          33.62
        ]
      ]
    ],
    "checkedAt": "2026-10-10",
    "image": "assets/passes/tmoney-travel-plus.png"
  },
  {
    "id": "wowpass",
    "name": "WOWPASS 韓國旅遊支付卡",
    "english": "WOWPASS",
    "region": "韓國全國",
    "regionKeys": [
      "全國",
      "首都圈",
      "江原",
      "忠清",
      "全羅",
      "釜山／慶尚",
      "濟州"
    ],
    "country": "KR",
    "kind": "stored-value",
    "trips": [],
    "source": "https://www.wowpass.io/",
    "coverageUrl": "https://www.wowpass.io/",
    "imageSource": "https://www.wowpass.io/_next/image?url=%2Fimages%2Flanding%2Fimg_landing_wowpass_card.webp&w=3840&q=75",
    "imageKind": "ticket",
    "credit": "WOWPASS 官方網站",
    "coverage": "韓國支付、換匯與指定 Tmoney 交通儲值服務，搭配合作商家優惠。",
    "exclusions": "支付與交通餘額分開，搭車需先儲值；不是景點免費卡或無限交通券。",
    "areas": [
      [
        [
          126.1,
          34.2
        ],
        [
          127.1,
          34.35
        ],
        [
          129.65,
          35.35
        ],
        [
          129.1,
          37.2
        ],
        [
          128.35,
          38.65
        ],
        [
          127.0,
          38.35
        ],
        [
          126.0,
          37.55
        ]
      ],
      [
        [
          126.1,
          33.08
        ],
        [
          126.99,
          33.08
        ],
        [
          126.99,
          33.62
        ],
        [
          126.1,
          33.62
        ]
      ]
    ],
    "checkedAt": "2026-10-10",
    "image": "assets/passes/wowpass.jpg"
  },
  {
    "id": "namane",
    "name": "NAMANE 韓國自訂旅遊卡",
    "english": "NAMANE Card",
    "region": "韓國全國",
    "regionKeys": [
      "全國",
      "首都圈",
      "江原",
      "忠清",
      "全羅",
      "釜山／慶尚",
      "濟州"
    ],
    "country": "KR",
    "kind": "stored-value",
    "trips": [],
    "source": "https://en.namanepay.com/",
    "coverageUrl": "https://en.namanepay.com/",
    "imageSource": "https://cdn.namanecard.com/upload/v2/img/8f6306ef-03b1-48e5-a02c-cdecd4ddcf60?w=1600",
    "imageKind": "ticket",
    "credit": "NAMANE 官方網站商品圖",
    "coverage": "自訂卡面，韓國指定公車／地鐵交通與合作商家支付功能。",
    "exclusions": "需要儲值；支付與交通餘額／轉換依官方規則。不是 NAMANE PASS 套票，也不是 KTX 免費票。",
    "areas": [
      [
        [
          126.1,
          34.2
        ],
        [
          127.1,
          34.35
        ],
        [
          129.65,
          35.35
        ],
        [
          129.1,
          37.2
        ],
        [
          128.35,
          38.65
        ],
        [
          127.0,
          38.35
        ],
        [
          126.0,
          37.55
        ]
      ],
      [
        [
          126.1,
          33.08
        ],
        [
          126.99,
          33.08
        ],
        [
          126.99,
          33.62
        ],
        [
          126.1,
          33.62
        ]
      ]
    ],
    "checkedAt": "2026-10-10",
    "image": "assets/passes/namane.jpg"
  },
  {
    "id": "seoul-climate",
    "name": "首爾氣候同行卡・短期券",
    "english": "Climate Card Short-Term Pass",
    "region": "首爾・指定延伸路線",
    "regionKeys": [
      "首都圈"
    ],
    "country": "KR",
    "kind": "transport",
    "trips": [],
    "source": "https://world.seoul.go.kr/seoul-policy-archive/climate-card/",
    "coverageUrl": "https://world.seoul.go.kr/seoul-policy-archive/climate-card/",
    "imageSource": "https://english.seoul.go.kr/wp-content/uploads/2025/archive/img/1-1-1.png",
    "imageKind": "ticket",
    "credit": "首爾市政府官方政策圖片",
    "coverage": "指定首爾地鐵及首爾市許可公車，短期 1／2／3／5／7 日方案；跨市路段逐站查核。",
    "exclusions": "不含新盆唐線、廣域／機場巴士、非首爾許可公車及指定範圍外路段；短期券不含公共自行車。地圖不是所有京畿線皆可搭。",
    "areas": [
      [
        [
          126.8,
          37.42
        ],
        [
          127.2,
          37.42
        ],
        [
          127.2,
          37.7
        ],
        [
          126.8,
          37.7
        ]
      ]
    ],
    "checkedAt": "2026-10-10",
    "image": "assets/passes/seoul-climate.png"
  },
  {
    "id": "k-tour-1",
    "name": "K-Tour Pass 1",
    "english": "K-Tour Pass 1",
    "region": "首爾・釜山・指定慶州設施",
    "regionKeys": [
      "首都圈",
      "釜山／慶尚"
    ],
    "country": "KR",
    "kind": "bundle",
    "trips": [],
    "source": "https://english.visitkorea.or.kr/svc/contents/contentsView.do?menuSn=654&vcontsId=1593470",
    "coverageUrl": "https://english.visitkorea.or.kr/svc/contents/contentsView.do?menuSn=654&vcontsId=1593470",
    "imageSource": "https://english.visitkorea.or.kr/public/event/2026/09/KTourPass/option1_img_0922.png",
    "imageKind": "promotion",
    "credit": "韓國觀光公社 K-Tour Pass 官方網站",
    "coverage": "AREX 優惠、合作景點擇 1、WOWPASS 卡及商家優惠；加前往釜山交通折扣。",
    "exclusions": "是折扣與擇一景點套票，不是全線免費交通或所有釜山景點免費；WOWPASS 仍需另外儲值。",
    "areas": [
      [
        [
          126.9,
          37.5
        ],
        [
          127.14,
          37.5
        ],
        [
          127.14,
          37.66
        ],
        [
          126.9,
          37.66
        ]
      ],
      [
        [
          128.98,
          35.04
        ],
        [
          129.24,
          35.04
        ],
        [
          129.24,
          35.23
        ],
        [
          128.98,
          35.23
        ]
      ],
      [
        [
          129.27,
          35.82
        ],
        [
          129.3,
          35.82
        ],
        [
          129.3,
          35.86
        ],
        [
          129.27,
          35.86
        ]
      ]
    ],
    "checkedAt": "2026-10-10",
    "image": "assets/passes/k-tour-1.png"
  },
  {
    "id": "k-tour-2",
    "name": "K-Tour Pass 2",
    "english": "K-Tour Pass 2",
    "region": "首爾・釜山・指定慶州設施",
    "regionKeys": [
      "首都圈",
      "釜山／慶尚"
    ],
    "country": "KR",
    "kind": "bundle",
    "trips": [],
    "source": "https://english.visitkorea.or.kr/svc/contents/contentsView.do?menuSn=654&vcontsId=1593470",
    "coverageUrl": "https://english.visitkorea.or.kr/svc/contents/contentsView.do?menuSn=654&vcontsId=1593470",
    "imageSource": "https://english.visitkorea.or.kr/public/event/2026/09/KTourPass/option2_img_0922.png",
    "imageKind": "promotion",
    "credit": "韓國觀光公社 K-Tour Pass 官方網站",
    "coverage": "AREX 優惠、合作景點擇 1、WOWPASS 卡及商家優惠；加 KORAIL PASS 折扣券。",
    "exclusions": "是折扣與擇一景點套票，不是全線免費交通或所有釜山景點免費；WOWPASS 仍需另外儲值。",
    "areas": [
      [
        [
          126.9,
          37.5
        ],
        [
          127.14,
          37.5
        ],
        [
          127.14,
          37.66
        ],
        [
          126.9,
          37.66
        ]
      ],
      [
        [
          128.98,
          35.04
        ],
        [
          129.24,
          35.04
        ],
        [
          129.24,
          35.23
        ],
        [
          128.98,
          35.23
        ]
      ],
      [
        [
          129.27,
          35.82
        ],
        [
          129.3,
          35.82
        ],
        [
          129.3,
          35.86
        ],
        [
          129.27,
          35.86
        ]
      ]
    ],
    "checkedAt": "2026-10-10",
    "image": "assets/passes/k-tour-2.png"
  }
];

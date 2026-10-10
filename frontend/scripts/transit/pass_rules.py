"""Officially specified networks and station endpoints (checked 2026-10-10).
Each rule inherits its primary source from the catalogue's coverageUrl. Gaps are
explicit transport components; a missing source/OSM section is never guessed.
"""
JR = r'旅客鉄道|JR[ -]?(East|West|Central|Hokkaido|Kyushu|Shikoku)|Japan Railway'
LOCAL = {'operator': JR, 'railway': '^rail$', 'excludeName': '新幹線|貨物'}
RULES = {}
def whole(name='', operator='', **extra):
    return dict(extra, **({'name': name} if name else {}), **({'operator': operator} if operator else {}))
def segment(name, start, end, operator=JR, access='unlimited', **extra):
    return {'selector': whole(name, operator, **extra), 'from': start, 'to': end, 'access': access}
def put(id, lines=(), sections=(), includes=(), missing=(), note='', complete=False, **extra):
    RULES[id] = dict(whole=list(lines), sections=list(sections), includes=list(includes), missing=list(missing), note=note, complete=complete, **extra)
def alias(id, parent, **extra):
    RULES[id] = dict(includes=[parent], whole=[], sections=[], missing=[], complete=RULES[parent].get('complete', False))
    RULES[id].update(extra)

# JR West official maps specify terminal stations, not rectangular territories.
kansai_lines = [whole(n, JR, excludeName='新幹線') for n in ['大阪環状線', '桜島線|ゆめ咲線', '片町線|学研都市線', 'JR東西線', 'おおさか東線', '奈良線', '和歌山線', '桜井線|万葉まほろば線', '関西空港線', '加古川線', '播但線', '赤穂線', '津山線', '吉備線', '宇野線', '小浜線', '舞鶴線', '福知山線', '草津線']]
kansai_sections = [segment('東海道本線|JR京都線|琵琶湖線|JR神戸線', '米原', '神戸', excludeName='新幹線'), segment('山陽本線|JR神戸線', '神戸', '倉敷', excludeName='新幹線'), segment('山陰本線|嵯峨野線', '京都', '城崎温泉', excludeName='新幹線'), segment('山陰本線', '城崎温泉', '鳥取'), segment('関西本線|大和路線', 'JR難波', '柘植'), segment('紀勢本線|阪和線|きのくに線', '天王寺', '新宮'), segment('山陽新幹線|東海道新幹線', '新大阪', '岡山'), segment('本四備讃線|瀬戸大橋線|予讃線', '茶屋町', '高松'),segment('姫新線','姫路','津山')]
put('jr-west-kansaimini', [whole('大阪環状線|桜島線|ゆめ咲線|関西空港線', JR)], [segment('東海道本線|JR京都線|JR神戸線', '山科', '神戸', excludeName='新幹線'), segment('山陽本線|JR神戸線', '神戸', '舞子', excludeName='新幹線'), segment('福知山線', '尼崎', '宝塚'), segment('山陰本線|嵯峨野線', '京都', '保津峡'), segment('奈良線|関西本線', '京都', '奈良'), segment('関西本線|大和路線', 'JR難波', '奈良'), segment('阪和線', '天王寺', '日根野'), segment('片町線|学研都市線', '京橋', '木津'), segment('JR東西線', '京橋', '尼崎')], complete=True, note='只限官方圖內普通／快速列車；不含新幹線，特急附加費另依票券條件。')
put('jr-west-kansai_wide', kansai_lines+[whole('宮福線|宮舞線|宮豊線', 'WILLER|京都丹後'),whole('貴志川線', '和歌山電鐵')], kansai_sections, missing=['西日本 JR 巴士指定地方路線'])
put('jr-west-kansai_hiroshima', includes=['jr-west-kansai_wide'], sections=[segment('山陽本線', '倉敷', '岩国', excludeName='新幹線'), segment('山陽新幹線|東海道新幹線','岡山','広島')], lines=[whole('呉線|福塩線|可部線',JR),whole('宮島|Miyajima',routeType='ferry',operator='JR|旅客')], missing=['廣島／宮島及區域巴士指定項目'])
put('jr-west-kansai_sanin', kansai_lines+[whole('宮福線|宮舞線|宮豊線','WILLER|京都丹後'),whole('境線|木次線|伯備線',JR)], [s for s in kansai_sections if s['to'] not in ['新宮','高松']]+[segment('紀勢本線|阪和線|きのくに線','天王寺','和歌山'),segment('山陰本線','鳥取','東萩'),segment('山口線','益田','津和野'),segment('芸備線','備中神代','備後落合')], missing=['西日本 JR 巴士指定地方路線'])
hokuriku_lines=[whole('七尾線|氷見線|城端線|越美北線',JR)]
hokuriku_sections=[segment('高山本線','富山','猪谷'),segment('大糸線','糸魚川','南小谷'),segment('北陸新幹線','敦賀','上越妙高')]
put('jr-west-kansai_hokuriku',kansai_lines+hokuriku_lines+[whole('宮福線|宮舞線|宮豊線','WILLER|京都丹後')], [s for s in kansai_sections if s['to']!='高松']+hokuriku_sections,missing=['IR 石川／愛之風富山／Hapi-Line 指定通過條件','西日本 JR 巴士指定地方路線'])
put('jr-west-tottorimatsue',[whole('境線',JR)],[segment('山陰本線','東浜','出雲市'),segment('木次線','宍道','木次'),segment('伯備線','伯耆大山','根雨'),segment('因美線','鳥取','郡家')],missing=['松江 Lake Line／鳥取 Loop 麒麟獅子巴士'])
sanin=[whole(n,JR) for n in ['境線','木次線','伯備線','芸備線','呉線','福塩線','可部線','山口線','宇部線','小野田線','岩徳線','美祢線']]
put('jr-west-sanyo_sanin',kansai_lines+sanin+[whole('宮福線|宮舞線|宮豊線','WILLER|京都丹後'),whole('宮島|Miyajima',routeType='ferry',operator='JR|旅客')],[s for s in kansai_sections if s['to']!='新宮']+[segment('紀勢本線|阪和線|きのくに線','天王寺','和歌山'),segment('山陰本線','鳥取','幡生'),segment('山陽本線','倉敷','下関',excludeName='新幹線'),segment('山陽本線|鹿児島本線','下関','博多',excludeName='新幹線'),segment('山陽新幹線|東海道新幹線','岡山','博多')],missing=['智頭急行','指定 JR 地方巴士'])
put('jr-west-hiroshima_yamaguchi',[whole('呉線|可部線|山口線|宇部線|小野田線|岩徳線|美祢線',JR),whole('宮島|Miyajima',routeType='ferry',operator='JR|旅客')],[segment('山陽新幹線|東海道新幹線','三原','博多'),segment('山陽本線','三原','下関',excludeName='新幹線'),segment('鹿児島本線','門司','博多'),segment('芸備線','広島','三次'),segment('山陰本線','益田','幡生')],missing=['指定 JR 地方巴士'])
put('jr-west-okayama_hiroshima_yamaguchi',includes=['jr-west-hiroshima_yamaguchi'],lines=[whole('伯備線|津山線|吉備線|宇野線|福塩線',JR)],sections=[segment('山陽新幹線|東海道新幹線','岡山','三原'),segment('山陽本線','岡山','三原',excludeName='新幹線'),segment('姫新線','津山','新見'),segment('芸備線','三次','備中神代')],missing=['指定 JR 地方巴士'])
put('jr-west-hokuriku',hokuriku_lines+[whole('えちぜん鉄道|三国芦原線|勝山永平寺線', 'えちぜん'),whole('万葉線','万葉')],[segment('北陸新幹線','敦賀','黒部宇奈月温泉'),segment('高山本線','富山','猪谷'),segment('小浜線','敦賀','小浜')],missing=['IR 石川／愛之風富山／Hapi-Line 指定通過條件','指定北陸巴士／富山地鐵市內電車'])
put('jr-west-all',includes=['jr-west-sanyo_sanin','jr-west-kansai_hokuriku'],missing=['合作鐵道通過條件與指定 JR 巴士'])
put('jr-setouchi',lines=[whole('呉線|可部線|福塩線|宇野線|吉備線',JR),whole('宮島|Miyajima',routeType='ferry',operator='JR|旅客')],sections=[segment('山陽新幹線|東海道新幹線','新大阪','博多'),segment('山陽本線','神戸','下関',excludeName='新幹線'),segment('東海道本線|JR京都線','京都','神戸',excludeName='新幹線'),segment('山陰本線|嵯峨野線','京都','亀岡'),segment('山陽本線|鹿児島本線','下関','博多',excludeName='新幹線'),segment('本四備讃線|瀬戸大橋線|予讃線','茶屋町','伊予大洲'),segment('予讃線','向井原','内子'),segment('予讃線|内子線','内子','伊予大洲'),segment('土讃線','多度津','琴平')],missing=['指定瀨戶內渡輪／巴士；非全部航線','大阪／奈良／關西機場指定 JR 市區路線'])
put('jr-ssnk',includes=['jr-west-sanyo_sanin','jr-kyushu-northern'])

put('japan-rail',[whole(operator=JR,railway='^rail$')],missing=['JR 指定地方巴士與宮島渡輪','少數非 JR 通過路線的附加費／不可上下車條件'],note='普通／綠色車廂及 NOZOMI、MIZUHO 附加票規則依持有方案；不是所有列車都可直接搭乘。')
put('jr-hokkaido-hrp',[whole(operator='北海道旅客鉄道|Hokkaido Railway',railway='^rail$',excludeName='新幹線')],missing=['指定 JR 北海道巴士'],note='不含北海道新幹線。')
put('jr-hokkaido-noboribetsu',sections=[segment('函館本線','小樽','白石','北海道旅客鉄道'),segment('千歳線','白石','沼ノ端','北海道旅客鉄道'),segment('千歳線','南千歳','新千歳空港','北海道旅客鉄道'),segment('室蘭本線','沼ノ端','登別','北海道旅客鉄道')],complete=True,note='西至小樽、南至登別；不含洞爺、函館或北海道新幹線。')
put('jr-hokkaido-furano',[whole('富良野線','北海道旅客鉄道')],[segment('函館本線','小樽','旭川','北海道旅客鉄道'),segment('千歳線','白石','新千歳空港','北海道旅客鉄道'),segment('根室本線','滝川','富良野','北海道旅客鉄道')],complete=True)
put('jr-kyushu-all',[whole(operator='九州旅客鉄道|Kyushu Railway',railway='^rail$',excludeName='山陽新幹線')],complete=True,note='不含山陽新幹線博多至小倉；指定車種與營運中斷依 JR 九州公告。')
north_lines=[whole(n,'九州旅客鉄道') for n in ['長崎本線','佐世保線','大村線','唐津線','筑肥線','久大本線','筑豊本線','篠栗線','香椎線','日田彦山線','後藤寺線','三角線','西九州新幹線']]
put('jr-kyushu-northern',north_lines,[segment('鹿児島本線','門司港','熊本','九州旅客鉄道'),segment('日豊本線','小倉','大分','九州旅客鉄道'),segment('豊肥本線','熊本','大分','九州旅客鉄道'),segment('九州新幹線','博多','熊本','九州旅客鉄道')],missing=['BRT 彥星線與暫停營運區段'],note='九州新幹線只到熊本；不含山陽新幹線。')
put('jr-kyushu-southern',[whole('吉都線|指宿枕崎線|日南線|宮崎空港線|三角線','九州旅客鉄道')],[segment('日豊本線','大分','鹿児島','九州旅客鉄道'),segment('鹿児島本線','熊本','八代','九州旅客鉄道'),segment('肥薩線','八代','隼人','九州旅客鉄道'),segment('豊肥本線','熊本','大分','九州旅客鉄道'),segment('九州新幹線','熊本','鹿児島中央','九州旅客鉄道')],missing=['肥薩線等營運中斷區段需依官方代行公告'],note='北至熊本／大分；不含博多方向。')
put('jr-kyushu-mobile',[whole('筑豊本線|篠栗線|香椎線|後藤寺線','九州旅客鉄道')],[segment('鹿児島本線','門司港','大牟田','九州旅客鉄道'),segment('日豊本線','小倉','行橋','九州旅客鉄道'),segment('日田彦山線','城野','田川後藤寺','九州旅客鉄道'),segment('筑肥線','姪浜','唐津','九州旅客鉄道')],missing=['福岡廣域官方圖其他指定短區間'],note='只限指定普通、快速、特急非指定席；不含任何新幹線或地鐵。')
put('jr-shikoku',[whole(operator='四国旅客鉄道|土佐くろしお|高松琴平|とさでん|Shikoku Railway|Tosa Kuroshio|Kotoden',railway='rail|tram')],missing=['阿佐海岸 DMV／小豆島指定船與巴士項目；依 2026/10 新版方案'])

# Central regional passes: explicitly designated corridors and partner transport.
put('jr-central-takayama_hokuriku',sections=[segment('高山本線','岐阜','富山'),segment('東海道本線','名古屋','岐阜',excludeName='新幹線'),segment('東海道本線|JR京都線','大阪','米原',excludeName='新幹線'),segment('北陸本線|湖西線','京都','敦賀',excludeName='新幹線'),segment('北陸新幹線','敦賀','富山')],missing=['大阪／關西機場指定區段','白川鄉／五箇山指定巴士'])
put('jr-central-alpine',sections=[segment('東海道本線','名古屋','岐阜',excludeName='新幹線'),segment('高山本線','岐阜','富山'),segment('中央本線','名古屋','塩尻'),segment('篠ノ井線','塩尻','松本'),segment('大糸線','松本','信濃大町')],missing=['立山黑部阿爾卑斯指定巴士、纜車、空中纜車及富山地鐵'],note='立山黑部為季節營運；請核對使用日期。')
put('jr-central-ise_kumano',[whole('関西空港線','旅客鉄道')],[segment('関西本線','名古屋','亀山'),segment('紀勢本線','亀山','和歌山'),segment('阪和線','和歌山','天王寺'),segment('大阪環状線','天王寺','大阪'),segment('関西本線|大和路線','JR難波','奈良'),segment('桜井線','奈良','高田'),segment('和歌山線','高田','和歌山'),segment('参宮線','多気','鳥羽')],missing=['伊勢鐵道與指定熊野／伊勢巴士'])
put('jr-central-fuji_shizuoka',sections=[segment('東海道本線','熱海','豊橋',excludeName='新幹線'),segment('身延線','富士','下部温泉'),segment('御殿場線','沼津','松田')],missing=['伊豆箱根駿豆線、岳南電車及指定巴士／渡輪'],note='不含東海道新幹線。')

# Keihan / Kintetsu include actual cable tracks; limited products stay bounded.
keihan = '京阪|Keihan'
main = whole('京阪本線|鴨東線|中之島線|宇治線|交野線',keihan)
cable = whole('鋼索線|石清水八幡宮参道',keihan)
put('keihan-kyoto-osaka-day',[main,cable],complete=True)
alias('keihan-kyoto-osaka-24h','keihan-kyoto-osaka-day')
put('keihan-kyoto-day',[whole('宇治線',keihan),cable],[segment('京阪本線|鴨東線','出町柳','石清水八幡宮',keihan)],complete=True,note='只含出町柳至石清水八幡宮、宇治線與參道纜車；不含大阪方向或大津線。')
alias('keihan-kyoto-24h','keihan-kyoto-day')
put('keihan-kurama',[whole(operator='叡山|Eizan')],includes=['keihan-kyoto-osaka-day'],complete=True)
alias('keihan-hirakata','keihan-kyoto-osaka-day',note='另含枚方公園入園；遊樂設施搭乘依方案。')
put('keihan-metro',[whole(operator='Osaka Metro|大阪市高速|Osaka Municipal')],includes=['keihan-kyoto-osaka-day'],missing=['大阪市營巴士'])
kintetsu='近畿日本|近鉄|Kintetsu'
put('kintetsu-1day',[whole('生駒鋼索線',kintetsu)],[segment('難波線|奈良線|近畿日本鉄道大阪線','大阪難波','近鉄奈良',kintetsu),segment('京都線|橿原線','京都','筒井',kintetsu),segment('けいはんな線','長田','生駒',kintetsu)],missing=['奈良公園／西之京／法隆寺指定奈良交通巴士'])
put('kintetsu-2day',[whole('難波線|奈良線|京都線|橿原線|天理線|生駒線|生駒鋼索線|信貴線|西信貴鋼索線|道明寺線|長野線|御所線|吉野線|南大阪線|けいはんな線',kintetsu)],[segment('大阪線','大阪上本町','三本松',kintetsu)],missing=['奈良／飛鳥／室生／山之邊道指定巴士'])
put('kintetsu-5day',[whole(operator=kintetsu,railway='rail|funicular|subway'),whole(operator='伊賀鉄道|Iga Railway',railway='rail')],complete=True,note='近鐵全線、纜車與伊賀鐵道；不含空中纜車，特急費另購。')
put('kintetsu-5dayplus',includes=['kintetsu-5day'],missing=['奈良交通／三重交通／鳥羽指定巴士'])
put('seibu-seibu1daypass',[whole(operator='西武|Seibu',railway='rail|monorail|light_rail',excludeName='多摩川|Tamagawa')],complete=True,note='西武全線（含山口線），多摩川線除外；+ Nagatoro 版本另依方案。')
put('seibu-seibukawagoepass',sections=[segment('西武新宿線','西武新宿','本川越','西武',access='round-trip'),segment('西武池袋線','池袋','所沢','西武',access='round-trip')],complete=True,note='池袋／西武新宿／高田馬場至本川越一次往返；不可中途下車。')
put('seibu-chichibufreeticket',sections=[segment('西武秩父線','芦ヶ久保','西武秩父','西武'),segment('秩父本線','野上','三峰口','秩父鉄道')],missing=['依購票出發站的西武一次往返接入路線'],note='自由區間：芦之久保至西武秩父，以及秩父鐵道野上／長瀞至三峰口；出發站往返依購票版本。')
put('seibu-chichibumanyuticket',sections=[segment('西武秩父線|西武池袋線','高麗','西武秩父','西武')],missing=['出發站一次往返','漫遊優惠券六選一的巴士／溫泉等項目'],note='自由鐵路區間為高麗至西武秩父；巴士、溫泉、餐食等優惠擇一。')
put('seibu-mvpticket_travelpass',includes=['seibu-seibu1daypass'],missing=['飯能北口至 metsä 一次往返巴士','姆明谷樂園入園定位'])

# Odakyu local free areas are independent of departure-station round trips.
hakone=[whole(operator='小田急箱根|箱根登山|Hakone Tozan',railway='rail|funicular'),whole(operator='箱根ロープウェイ|小田急箱根',railway='cable_car|gondola'),whole('箱根|Hakone',routeType='ferry',operator='箱根|小田急|Hakone')]
put('odakyu-hakone-freepass',hakone,missing=['箱根指定巴士／海賊船未完整對應 OSM 路線','出發站至小田原一次往返依版本'],note='顯示箱根自由區域；小田急出發站往返依購票版本，Romancecar 特急費另購。')
put('odakyu-hakone-kamakura-pass',[whole(operator='小田急電鉄|Odakyu Electric'),whole(operator='江ノ島電鉄|Enoshima Electric')],includes=['odakyu-hakone-freepass'],missing=['箱根指定巴士／船交通'],note='小田急全線、江之電與箱根指定交通自由搭乘。')
put('odakyu-fuji-hakone-pass',[whole(operator='富士山麓電気|富士急行|Fujikyu',railway='rail')],includes=['odakyu-hakone-freepass'],missing=['富士五湖指定巴士','小田急／高速巴士往返依版本'])
alias('odakyu-hakoneticket_plus','odakyu-hakone-freepass',missing=['Hako Ticket Plus 指定觀光設施與版本'])
alias('odakyu-limousine-hakone-freepass','odakyu-hakone-freepass',missing=['羽田機場至箱根桃源台指定機場巴士'])
put('odakyu-enoshima-kamakura-freepass',[whole(operator='江ノ島電鉄|Enoshima Electric')],[segment('江ノ島線','藤沢','片瀬江ノ島','小田急')],missing=['出發站至藤澤一次往返依版本'],note='自由區間只含江之電全線及小田急藤澤至片瀨江之島；東京接入段為一次往返。')
put('odakyu-tanzawa-oyama',[whole('大山ケーブル|大山鋼索線',railway='funicular')],sections=[segment('小田急小田原線','本厚木','渋沢','小田急')],missing=['神奈川中央交通指定巴士','出發站往返；B 版不含大山纜車'],note='目前顯示 A 版自由鐵路／纜車；B 版不含大山纜車。')
put('odakyu-enoden-bus-1-day-pass-ticket-noritabi-kippu',[whole(operator='江ノ電バス|江ノ島電鉄|Enoden',routeType='bus',excludeName='羽田|Haneda')],missing=['羽田機場線除外；尚未匯入的巴士路段'])
put('odakyu-tokaibus-zensen-freepass',[whole(operator='東海バス|Tokai Bus',routeType='bus')],missing=['排除高速／特殊路線及未匯入巴士區段'])
put('odakyu-tokaibus-ito-kankou-freepass',missing=['伊東／伊豆高原指定東海巴士路線；不是東海巴士全線'])
put('odakyu-greater-tokyo-pass',[whole(operator='小田急電鉄|京王電鉄|京成電鉄|京急|京浜急行|埼玉高速鉄道|相模鉄道|西武鉄道|東京メトロ|Tokyo Metro|東急電鉄|東武鉄道|横浜高速鉄道|横浜市交通局|東京都交通局|Tokyo Metropolitan',excludeName='千葉ニュータウン|北総|ケーブル')],missing=['指定聯盟的例外區間與都營巴士；3／5 日版本不同'])

tobu='東武鉄道|Tobu Railway'
put('tobu-all',sections=[segment('東武日光線','下今市','東武日光',tobu),segment('東武鬼怒川線','下今市','新藤原',tobu)],missing=['淺草接入段一次往返','日光指定巴士／季節交通'],note='自由鐵路區間下今市至東武日光／新藤原；淺草接入段只限往返，特急另付費。')
alias('tobu-city','tobu-all',missing=['世界遺產區域指定巴士；不含中禪寺湖／奧日光'])
put('tobu-premium',sections=[segment('東武東上線','池袋','川越市',tobu,access='round-trip')],missing=['川越指定區域巴士'],note='池袋至川越／川越市一次往返；川越區域巴士依 Premium 方案。')
put('tobu-ryomo',[whole('佐野線|小泉線|桐生線',tobu)],[segment('伊勢崎線|桐生線|小泉線','茂林寺前','伊勢崎',tobu)],missing=['購票出發站至茂林寺前一次往返','兩毛地區指定市營巴士'],note='自由鐵路：茂林寺前至伊勢崎、太田至赤城、館林至葛生／西小泉、東小泉至太田；出發站往返與指定區域巴士仍待分別對應。')
put('tobu-aizu',sections=[segment('東武日光線','下今市','東武日光',tobu),segment('鬼怒川線','下今市','新藤原',tobu),segment('会津鬼怒川線','新藤原','会津高原尾瀬口','野岩鉄道'),segment('会津線','会津高原尾瀬口','会津田島','会津鉄道')],missing=['購票出發站至下今市一次往返；出發站版本需另選'],note='自由區間：下今市至東武日光／會津田島；特急及 SL 指定席另購。',variants=[
 {'id':'tajima','label':'會津田島版','note':'自由區間：下今市至東武日光／會津田島；特急及 SL 指定席另購。'},
 {'id':'ashinomaki','label':'蘆之牧溫泉版','sections':[segment('会津線','会津田島','芦ノ牧温泉','会津鉄道')],'note':'自由區間：下今市至東武日光／蘆之牧溫泉；特急及 SL 指定席另購。'},
 {'id':'kitakata','label':'喜多方版','sections':[segment('会津線|只見線|磐越西線','会津田島','喜多方','会津鉄道|'+JR)],'note':'自由區間：下今市至東武日光／喜多方；含西若松經會津若松的指定 JR 區段，特急及 SL 指定席另購。'}])
# This catalogue entry refers to a time-limited 2023 product. Preserve its source
# and historical geometry, but make its expired validity visible.
put('tobu-taito-sumida',sections=[segment('東武伊勢崎線','浅草','北千住',tobu),segment('東武亀戸線','曳舟','亀戸',tobu)],missing=['台東／墨田循環巴士','官網目前列出的有效日期截止 2023；現售方案尚未確認'],note='官方頁面列為截至 2023 的限定商品，不能當作目前有效票券。',availability='expired')
put('nankai-koyasan',[whole('鋼索線','南海|Nankai',access='round-trip')],sections=[segment('高野線|南海本線','難波','極楽橋','南海|Nankai',access='round-trip')],missing=['高野山指定巴士；丹生都比賣線／立里線例外'],note='目前顯示難波出發往返版本與高野山纜車；中途下車後已使用的乘車票不能重用。')

# Taiwan PASS bundle base rail entitlement; city/shuttle choices are not a union
# of every option (the planner offers these child tickets individually).
put('tw-tra-three-day',[whole('縱貫線|海岸線|臺中線|台中線|宜蘭線|北迴線|台東線|臺東線|南迴線|屏東線|集集線|內灣線|六家線|平溪線|沙崙線|深澳線|成追線',operator='臺灣鐵路|台灣鐵路|Taiwan Railway',railway='^rail$',excludeName='高鐵|林鐵|森林|貨運')],complete=True,note='台鐵三日指定列車；太魯閣、普悠瑪、EMU3000 等依官方劃位規則，商務車廂除外。')
put('taiwan-tra',includes=['tw-tra-three-day'],missing=['捷運任選一／景區接駁任選一，請另外選取對應票券'],note='顯示共通台鐵三日權益；任選一交通需另選該項票券，不會合併全部選項。')
put('taiwan-hsr',[whole('高速鐵路|高鐵|High Speed','台灣高速|臺灣高速|Taiwan High Speed',railway='rail')],missing=['捷運任選一／景區接駁任選一，請另外選取對應票券'],note='顯示高鐵共通主線；捷運、景區接駁各選一，不會合併全部選項。')
forest='阿里山|林業|林務|森林'
put('tw-alishan-main-out',sections=[segment('阿里山|林鐵|本線|牛稠溪橋','嘉義','阿里山',forest,access='one-way')],missing=['指定班次及預約席位'],note='嘉義至阿里山指定去程；沿線顯示行車路徑，不能自由上下車。')
alias('tw-alishan-main-return','tw-alishan-main-out',note='阿里山至嘉義指定回程；沿線顯示行車路徑，不能自由上下車。')
put('tw-alishan-branch-day',sections=[segment('祝山|阿里山','阿里山','祝山',forest),segment('沼平|阿里山','阿里山','沼平',forest),segment('神木|阿里山','阿里山','神木',forest)],complete=True,note='只含祝山、沼平、神木支線；不含嘉義本線及元旦祝山日出專班。')
put('tw-qingjing-shuttle',sections=[segment('',{'name':'高鐵台中站','at':[120.6160522,24.1114432]},'埔里',operator='南投客運',routeType='bus',ref='^6664$',access='round-trip'),segment('','埔里','觀山牧區',operator='南投客運',routeType='bus',ref='^6658$|^6659$',access='round-trip')],missing=['台中高鐵至埔里／觀山牧區的班次與換票限制'],note='高鐵台中站至觀山牧區來回，埔里轉車；不含合歡山線或松崗以北。')
put('tw-sun-moon-lake-shuttle',sections=[segment('',{'name':'高鐵台中站','at':[120.6160522,24.1114432]},'日月潭',operator='南投客運',routeType='bus',ref='^6670$',access='round-trip')],missing=['指定班次及來回票兌換限制'],note='高鐵台中站至日月潭來回；不含干城至高鐵站的接入段，非沿線自由上下車。')
put('tw-alishan-shuttle',[whole('阿里山',routeType='bus',ref='^7322[ACD]?$',operator='嘉義縣',access='round-trip')],missing=['來回各兩次上下車及指定班次限制'],note='台鐵嘉義站出發的 7322／A／C／D 系列；不含高鐵嘉義站出發的 7329。來回各可上下車兩次。')
put('tw-kenting-shuttle',[whole('墾丁快線',routeType='bus',ref='^9189$',access='round-trip')],missing=['來回票指定班次／兌換限制'],note='高鐵左營至小灣的墾丁快線來回票；非沿線自由上下車。')
yilan_refs=['1877', '1878', '1879', '1881', '1881A', '1915', '1916', '1917', '1570', '1571', '1572', '1880', '9028', '1661', '1665', '1743', '1743A', '1744', '1745', '1750', '1766', '1767', '1767A', '1785', '1786', '1787', '1788', '1789', '1790', '1791', '1792', '1792A', '1792C', '1793', '1794', '1794A', '1794B', '1794C', '1795', '1795A', '1795B', '1795C', '1795D', '1795E', '1796', '1797', '1797A', '1798', '1798A', '1799', '紅1', '紅2', '綠16', '綠17', '綠18', '綠19', '綠28', '472', '202', '781', '421', '245', '112', '112A', '113', '131', '191', '243', '243A', '243B', '621', '751', '752', '753', '771', '771A', '772', '772A', '791', '793', '722', '綠11A', '綠11B', '281', '綠21', '綠21A', '綠21B', '121', '121副', '黃1', '731', '731A', '741', '741A', '741B']
put('tw-yilan-pass',[whole(routeType='bus',ref='^(?:'+'|'.join(yilan_refs)+')$',excludeName='1751')],[segment('縱貫線','鳳鳴','基隆',operator='臺灣鐵路|台灣鐵路'),segment('宜蘭線','八堵','蘇澳',operator='臺灣鐵路|台灣鐵路'),segment('北迴線','蘇澳新','和平',operator='臺灣鐵路|台灣鐵路')],missing=['官方清單內尚未匯入的公車與台鐵平溪／深澳支線'],note='依宜蘭官方 2026/9/30 指定運具表逐線選取；不含未列出的宜蘭路線。')
put('tw-yilan-funtour',missing=['指定 FunTOUR 班次道路尚未取得；目前標示已核對停靠點'],points=[{'name':'台北轉運站（集合）','at':[121.5185562,25.0490418]},{'name':'國立傳統藝術中心（門票另購）','at':[121.8231461,24.6859063]}],note='固定一日團班次，傳藝中心門票另購；噶瑪蘭酒廠及礁溪停靠點需依當日行程。')
put('tw-sun-moon-lake-funtour',missing=['指定 FunTOUR 班次道路及日月町停靠點尚未取得'],points=[{'name':'高鐵台中站（集合）','at':[120.6160522,24.1114432]},{'name':'桃米生態村・紙教堂（門票另購）','at':[120.9275194,23.942278]},{'name':'桃米生態村・妮娜巧克力城堡（門票另購）','at':[120.9297947,23.9438814]}],note='固定一日團行程；日月潭船、纜車、自行車及桃米景點門票另購。')
put('tw-taichung-go',[whole(routeType='bus',network='臺中|台中|Taichung')],includes=['tw-taichung-metro'],missing=['尚未匯入的台中市區公車'],note='48 小時台中市區公車及捷運；班次與掃碼規則依官方。')

# Remaining regional networks below are expanded with the same station rules.
put('jr-east-eastpass',[whole(operator='東日本旅客鉄道|East Japan Railway',railway='rail'),whole(operator='青い森鉄道|アイジーアール|三陸鉄道|仙台空港鉄道|北越急行|東京モノレール')],[segment('妙高はねうまライン','直江津','新井','えちごトキめき'),segment('東武日光線','下今市','東武日光',tobu),segment('東武鬼怒川線','下今市','鬼怒川温泉',tobu),segment('東武日光線','栗橋','下今市',tobu,access='through-service')],missing=['JR 地方巴士／BRT','JR 東日本境界處的他社共用軌道需逐段核對'],note='新版不含伊豆急、富士急、東海道新幹線；東武栗橋至下今市只限 JR 直通特急。')
put('jr-east-easthokkaido',missing=['JR 東日本與南北海道指定區段；不能沿用新版 JR EAST PASS 的合作鐵道'])
put('jr-east-tohokuhokkaido',missing=['東北至南北海道區域端點及合作路線'])
put('jr-east-tokyowidepass',missing=['東京廣域指定 JR 終點站及合作路線'])
put('jr-east-tokyo_free',includes=['tokyo-subway'],missing=['東京 23 區 JR 指定終點站、都營巴士、荒川線與日暮里舍人線'])
tokunai_sections=[segment('中央本線|中央線|総武線','東京','西荻窪'),segment('総武本線|総武線','東京','小岩'),segment('中央本線|中央線|総武本線|総武線','御茶ノ水','錦糸町'),segment('東北本線|京浜東北線','東京','赤羽',excludeName='新幹線'),segment('山手貨物線|埼京線|赤羽線','大崎','赤羽'),segment('東北本線|埼京線','赤羽','浮間舟渡',excludeName='新幹線'),segment('東海道本線|京浜東北線','東京','蒲田',excludeName='新幹線'),segment('横須賀線|品鶴線|東海道本線','品川','西大井',excludeName='新幹線'),segment('常磐線','日暮里','金町'),segment('京葉線','東京','葛西臨海公園')]
put('jr-east-tokunai_pass',[whole('山手線|山手貨物線',JR)],tokunai_sections,complete=True,note='東京 23 區內指定 JR 普通／快速列車；不含地鐵、新幹線及臨海線。')
put('jr-east-tokyo_free',[whole('都電荒川線|日暮里.*舎人','東京都交通局|Tokyo Metropolitan')],includes=['jr-east-tokunai_pass','tokyo-subway'],missing=['都營巴士'],note='指定東京 23 區 JR 加東京 Metro、都營地下鐵、荒川線、日暮里舍人線。')
kanto_local=[whole(n,JR) for n in ['山手線|山手貨物線','川越線','青梅線','五日市線','横浜線','南武線','鶴見線','根岸線','横須賀線','武蔵野線','京葉線']]
nonbiri_sections=[segment('中央本線|中央線','東京','大月'),segment('東海道本線|京浜東北線','東京','小田原',excludeName='新幹線'),segment('東北本線|京浜東北線','東京','自治医大',excludeName='新幹線'),segment('高崎線','大宮','神保原'),segment('八高線','八王子','寄居'),segment('両毛線','小山','足利'),segment('水戸線','小山','下館'),segment('常磐線','日暮里','土浦'),segment('総武本線','東京','成東'),segment('外房線','千葉','茂原'),segment('内房線','蘇我','君津'),segment('成田線','佐倉','成田空港'),segment('成田線','我孫子','成田'),segment('東金線','大網','成東'),segment('相模線','茅ケ崎','橋本')]
put('jr-east-nonbiri_pass',kanto_local+[whole(operator='東京モノレール|Tokyo Monorail'),whole('りんかい線','東京臨海高速|Tokyo Waterfront')],nonbiri_sections,complete=True,note='指定假日的 JR 普通／快速、臨海線與東京單軌；不含任何新幹線。')
# The Abiko branch endpoint is 6 m from an interior point on the source Narita
# main-line way. Keep this narrow, verified topology repair local to that section.
for spec in nonbiri_sections:
 if spec['from']=='我孫子' and spec['to']=='成田':spec['projectedJoinMeters']=12
wide_sections=[segment('中央本線|中央線','東京','小淵沢'),segment('東海道本線|京浜東北線','東京','熱海',excludeName='新幹線'),segment('東北本線|京浜東北線','東京','黒磯',excludeName='新幹線'),segment('高崎線','大宮','高崎'),segment('常磐線','日暮里','大津港'),segment('水郡線','水戸','常陸大子'),segment('東北新幹線','東京','那須塩原'),segment('上越新幹線|東北新幹線','東京','越後湯沢'),segment('北陸新幹線|上越新幹線','高崎','佐久平'),segment('上越線','高崎','越後湯沢'),segment('上越線','越後湯沢','ガーラ湯沢'),segment('東武日光線','下今市','東武日光',tobu),segment('東武鬼怒川線','下今市','鬼怒川温泉',tobu),segment('東武日光線','栗橋','下今市',tobu,access='through-service'),segment('伊奈線','大宮','鉄道博物館','埼玉新都市')]
put('jr-east-tokyowidepass',kanto_local+[whole(n,JR) for n in ['総武本線','総武線','成田線','内房線','外房線','東金線','久留里線','八高線','両毛線','水戸線','日光線','吾妻線','伊東線']]+[whole(operator='伊豆急行|富士山麓電気|富士急行|上信電鉄|東京モノレール'),whole('りんかい線','東京臨海高速')],wide_sections,missing=['東武 JR 直通特急的列車限制；GALA 湯澤支線為季節營運'],note='東京廣域官方指定終點區間；不含東海道新幹線。東武栗橋至下今市僅限 JR 直通特急。')
put('jr-hokuriku-arch-pass',hokuriku_lines,hokuriku_sections+[segment('北陸新幹線|上越新幹線|東北新幹線','東京','上越妙高'),segment('北陸本線|湖西線|東海道本線','敦賀','大阪',excludeName='新幹線')],missing=['東京／大阪市區指定支線','合作北陸鐵道指定通過條件'],note='東京經長野、北陸至大阪；不含東海道新幹線。')
put('sendai-area',[whole(operator='仙台市交通局',railway='subway'),whole(operator='仙台空港鉄道')],[segment('東北本線','白石','小牛田'),segment('仙石線','あおば通','松島海岸'),segment('仙山線','仙台','山寺')],missing=['仙台市營／宮城交通／秋保等指定巴士'])
alias('sendai-marugoto','sendai-area')
put('kansai-railway-lite',[main,cable,whole(operator='阪急|阪神|南海|北大阪急行|大阪市高速|Osaka Metro|神戸市交通局|神戸電鉄|山陽電気鉄道|神戸新交通|泉北')],missing=['近鐵指定區段與其他合作鐵路'],note='現行 LITE 不含 JR、京都市營地下鐵、京阪大津線、嵐電或巴士。')
put('korail-pass',[whole(operator='한국철도공사|KORAIL|Korail|Korea Railroad',railway='rail',excludeName='수서|Suseo|신분당|Shinbundang|분당|수인|일산|안산|서해')],missing=['排除市區通勤／地鐵及 SRT 專用路段；KORAIL 適用列車需逐線核對'],note='KORAIL／KTX 指定列車；SRT、市區地鐵與旅遊列車除外，劃位依官方規則。')
alias('korail-plus','korail-pass',note='鐵路權益依 KORAIL PASS；NAMANE 市區交通與支付需另外儲值。')
put('seoul-climate',missing=['指定地鐵逐站可用範圍','首爾市許可巴士','仁川機場／7 號線部分站只可下車，不可上車'])

# Road geometry follows relation membership, never direct lines between stops.
RULES['odakyu-hakone-freepass']['whole'] += [whole(operator='箱根登山バス',routeType='bus',ref='^(K|H|T|S)$'),whole(operator='東海バス',routeType='bus',ref='^N65$')]
RULES['odakyu-hakone-freepass']['missing']=['其他箱根指定巴士及尚未匯入路段','出發站至小田原一次往返依版本']
RULES['tobu-all']['whole'] += [whole(operator='東武バス日光',routeType='bus')]
# City pass has its own bus area; do not inherit Lake Chuzenji / Oku-Nikko buses.
put('tobu-city',lines=[whole(operator='東武バス日光',routeType='bus',ref='^(W|N)$')],sections=RULES['tobu-all']['sections'],missing=['淺草接入段一次往返','世界遺產區域其他指定短巴士區間'],note='世界遺產區域巴士；不含中禪寺湖、奧日光或霧降高原。')

# JR official Tohoku map: named boundary stations, including the southern
# Hokkaido loop but excluding Asahikawa/Furano and South Hokkaido Railway.
hokkaido_south=[segment('函館本線','函館','小樽','北海道旅客鉄道'),segment('函館本線','小樽','白石','北海道旅客鉄道'),segment('室蘭本線','長万部','沼ノ端','北海道旅客鉄道'),segment('室蘭本線','東室蘭','室蘭','北海道旅客鉄道'),segment('千歳線','白石','沼ノ端','北海道旅客鉄道'),segment('千歳線','南千歳','新千歳空港','北海道旅客鉄道'),segment('北海道新幹線','新青森','新函館北斗',JR)]
tohoku_lines=[whole(n,'東日本旅客鉄道') for n in ['奥羽本線','田沢湖線','北上線','花輪線','五能線','大湊線','津軽線','八戸線','釜石線','陸羽東線','陸羽西線','仙山線','仙石線','石巻線','磐越東線']]
tohoku_sections=[segment('東北本線','白坂','盛岡'),segment('東北本線','岩切','利府'),segment('東北新幹線','新白河','新青森'),segment('常磐線','勿来','仙台'),segment('水郡線','矢祭山','郡山'),segment('磐越西線','郡山','徳沢'),segment('只見線','会津若松','只見'),segment('米坂線','米沢','小国'),segment('羽越本線','村上','秋田')]
put('jr-east-tohokuhokkaido',tohoku_lines+[whole(operator='青い森鉄道|アイジーアール|仙台空港鉄道')],tohoku_sections+hokkaido_south,missing=['JR 東北 BRT 與暫停營運路段','未完整匹配的城市支線'],note='東北指定終點及南北海道小樽／札幌／函館區域；不含東京、旭川、富良野或道南漁火鐵道。')
put('jr-east-easthokkaido',tohoku_lines+[whole(operator='青い森鉄道|アイジーアール|仙台空港鉄道|東京モノレール')],hokkaido_south+[segment('東北新幹線','東京','新青森'),segment('中央本線|中央線','東京','高尾'),segment('東海道本線','東京','大船',excludeName='新幹線'),segment('横須賀線','大船','久里浜'),segment('上越新幹線|東北新幹線','東京','新潟')],includes=['jr-east-tokunai_pass'],missing=['JR 東日本其他指定地方／市區支線','上越妙高、上毛高原及東京近郊指定區段','JR BRT'],note='顯示已核對的主要區段；不含輕井澤、熱海、大月、旭川、富良野與道南漁火鐵道。')
# Climate Card's per-line official station list; outside-Seoul exits are distinct.
seoul_ops='서울교통공사|서울시메트로|한국철도공사|공항철도|우이|로템|김포|Gimpo|Seoul Metro|Korail|Airport Railroad'
climate_sections=[segment('경인선|1호선|경부선|경원선','온수','도봉산',seoul_ops),segment('경부선|1호선','금천구청','서울역',seoul_ops),segment('4호선|진접선|과천선','정부과천청사','진접',seoul_ops),segment('7호선|7.*Line','온수','장암',seoul_ops),segment('경의선','탄현','서울역',seoul_ops),segment('경의|중앙선|경원선','서울역','양원',seoul_ops),segment('분당선|경원선|중앙선','청량리','오리',seoul_ops),segment('인천국제공항선','서울역','김포공항',seoul_ops),segment('경춘선|중앙선','청량리','신내',seoul_ops),segment('서해선|경의선','김포공항','일산',seoul_ops),segment('경강선','판교','이매',seoul_ops),segment('인천국제공항선','김포공항','인천공항2터미널',seoul_ops,access='exit-only'),segment('7호선|7.*Line','까치울','석남',seoul_ops+'|인천교통공사|Incheon Transit',access='exit-only')]
put('seoul-climate',[whole('(^|서울 지하철 |;)([235689])호선|성수지선|신정지선|마천지선|하남선|별내선','서울교통공사|서울시메트로|Seoul Metro'),whole('우이신설선|신림선|김포.*골드',seoul_ops)],climate_sections,missing=['首爾市許可公車','官方查詢清單的新增站點與未匹配路段'],note='短期券地鐵逐站適用；排除新盆唐線。仁川機場航廈及 7 號線喀鵲洞至石南只可下車，不能用此卡上車。')

# Ito/Izu-Kogen source itinerary explicitly includes the I39 coast corridor.
put('odakyu-tokaibus-ito-kankou-freepass',[whole(operator='東海バス',routeType='bus',ref='^I39$')],missing=['伊東／伊豆高原其餘指定路線尚未匯入'],note='顯示伊東至伊豆高原／赤澤的已核對路徑；不是東海巴士全線。')
RULES['tw-qingjing-shuttle']['points']=[{'name':'高鐵台中站（接駁起點）','at':[120.6160522,24.1114432]},{'name':'觀山牧區（票券終點）','at':[121.1621135,24.0547453]}]

put('tw-taoyuan-airport-return',[whole('桃園機場捷運',access='round-trip')],complete=True,note='桃園機場捷運一次往返；進出站及票卡兌換條件依方案，非全線自由上下車。')
put('tw-kaohsiung-mengo',includes=['tw-kaohsiung-metro'],missing=['高雄指定市區公車及輪渡等未完整匯入'],note='目前顯示高雄捷運及輕軌；其他交通依 MeN Go 方案。')
RULES['jr-kyushu-all']['sections']=[segment('山陽本線','下関','門司',JR,excludeName='新幹線')]

RULES['tw-yilan-funtour']['points'] += [{'name':'噶瑪蘭威士忌酒廠','at':[121.6893055,24.7142864]},{'name':'礁溪晶泉丰旅前（接駁集合）','at':[121.7730624,24.8287202]}]
RULES['tw-yilan-funtour']['missing']=['指定 FunTOUR 班次道路尚未取得；停靠時間依當日行程']
RULES['tw-sun-moon-lake-funtour']['points'] += [{'name':'日月町','at':[120.9254882,23.9732969]},{'name':'日月潭・水社（停靠區域）','at':[120.9113374,23.8665198]}]
RULES['tw-sun-moon-lake-funtour']['missing']=['指定 FunTOUR 班次道路尚未取得；停靠時間依當日行程']

# The rebuilt Duolin tunnel is absent from the current OSM snapshot. Retain
# official terminal locations and the gap instead of routing over collapsed rail.
for id in ['tw-alishan-main-out','tw-alishan-main-return']:
 RULES[id]['points']=[{'name':'嘉義林鐵車站','at':[120.4421253,23.480433],'access':'one-way'},{'name':'阿里山林鐵車站','at':[120.8043442,23.5100028],'access':'one-way'}]
 RULES[id]['missing']=['林鐵本線多林隧道重建路徑尚未完整對應；目前只標兩端站','指定班次及預約席位']

# These six funicular ways have no operator tag in OSM; the exact physical
# Nishishigi cable line is part of the official Kintetsu 2/5-day maps.
for id in ['kintetsu-2day','kintetsu-5day']:
 RULES[id]['whole'].append(whole('西信貴ケーブル',railway='funicular'))

# Named shared approach tracks are clipped between the same official stations;
# adding a physical line name never expands the product's terminal boundary.
for rule in RULES.values():
 for spec in rule.get('sections',[]):
  if spec['from']=='茶屋町' and '宇野線' not in spec['selector']['name']:spec['selector']['name']+='|宇野線'
  if spec['from']=='津山' and spec['to']=='新見' and '津山線' not in spec['selector']['name']:spec['selector']['name']+='|津山線'
  if spec['from']=='高田' and spec['to']=='和歌山' and '阪和線' not in spec['selector']['name']:spec['selector']['name']+='|紀勢本線|阪和線'
  if spec['from']=='京都' and spec['to']=='敦賀' and '東海道本線' not in spec['selector']['name']:spec['selector']['name']+='|東海道本線'
  if spec['from']=='博多' and spec['to']=='熊本':spec['selector']['operator']=JR
  if spec['from']=='千葉' and spec['to']=='茂原':spec['selector']['name']+='|総武本線|総武緩行線|外房・内房線'
  if spec['from']=='茅ケ崎':spec['from']='茅ヶ崎'
  if spec['from']=='館林' and spec['to']=='伊勢崎':spec['selector']['name']='伊勢崎線|桐生線|小泉線'
  if spec['from']=='野上' and spec['to']=='三峰口':spec['selector']['name']='秩父本線|秩父鉄道'
  if spec['from']=='佐倉' and spec['to']=='成田空港':
   spec['selector']['operator']=JR+'|成田空港高速鉄道'
   spec['selector']['excludeName']='京成|北総'
  if spec['from']=='蘇澳新' and spec['to']=='和平':spec['selector']['name']+='|宜蘭線'
  if spec['selector'].get('operator')=='臺灣鐵路|台灣鐵路':spec['selector']['operator']+='|Taiwan Railway'
RULES['tw-yilan-pass']['whole'] += [whole('平溪線|深澳線',operator='臺灣鐵路|台灣鐵路|Taiwan Railway',railway='rail')]
RULES['tw-yilan-pass']['missing']=['官方指定公車清單內尚未匯入的路線']
RULES['jr-central-fuji_shizuoka']['whole']=[whole('駿豆線','伊豆箱根鉄道')]
RULES['jr-central-fuji_shizuoka']['missing']=['指定巴士、駿河灣渡輪與清水港遊船；不含岳南電車']
RULES['jr-west-sanyo_sanin']['whole'].append(whole(operator='智頭急行',railway='rail'))
RULES['jr-west-sanyo_sanin']['missing']=['指定 JR 地方巴士']
RULES['japan-rail']['whole'].append(whole('宮島|Miyajima',routeType='ferry',operator='JR西日本宮島'))
RULES['japan-rail']['missing']=['JR 指定地方巴士','少數非 JR 通過路線的附加費／不可上下車條件']
RULES['jr-west-kansai_hiroshima']['missing']=['官方指定地方巴士']
RULES['jr-central-ise_kumano']['whole'] += [whole('伊勢線','伊勢鉄道'),whole('貴志川線','和歌山電鐵'),whole('大阪環状線',JR)]
RULES['jr-central-ise_kumano']['sections'] += [segment('関西本線','奈良','亀山'),segment('片町線','木津','京橋'),segment('おおさか東線','久宝寺','新大阪'),segment('阪和線','鳳','東羽衣'),segment('紀勢本線|阪和線|和歌山線','和歌山','和歌山市')]
RULES['jr-central-ise_kumano']['missing']=['指定熊野／伊勢巴士']

# JR Bus's current eligibility matrix separates Kyoto/Jakko from Kanazawa.
# The discontinued Enpuku line and Kanazawa municipal Flat Bus are not selected.
west_bus='西日本.*(バス|Bus)|West.*(JR|Japan).*Bus|JR.*West.*Bus'
west_bus_source='https://www.nishinihonjrbus.co.jp/en/route/'
kyoto_bus=whole('^Bus (47S?|48S?|49|快速205):',west_bus,routeType='bus',officialSource=west_bus_source)
jakko_bus=whole('若江線',west_bus,routeType='bus',officialSource=west_bus_source)
for id in ['japan-rail','jr-west-kansai_wide','jr-west-kansai_sanin','jr-west-kansai_hokuriku','jr-west-sanyo_sanin']:
 RULES[id]['whole'] += [kyoto_bus,jakko_bus]
 RULES[id]['missing']=[g for g in RULES[id]['missing'] if '西日本 JR 巴士' not in g and g!='指定 JR 地方巴士']+['京都 49／快速 205 的其他方向與未完整匹配巴士班次；快速 205 只限 JR 營運便']
RULES['jr-central-fuji_shizuoka']['whole'].append(whole('駿河湾フェリー',routeType='ferry',officialSource='https://touristpass.jp/en/fuji_shizuoka/'))
RULES['jr-central-fuji_shizuoka']['missing']=['指定巴士與清水港遊船；不含岳南電車']
for spec in RULES['jr-east-tohokuhokkaido']['sections']:
 if (spec['from'],spec['to']) in [('勿来','仙台'),('矢祭山','郡山')]:spec['selector']['name']+='|東北本線'

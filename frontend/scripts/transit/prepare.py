"""Retain OSM route colours and provenance on existing track snapshots.
Usage: python3 scripts/transit/prepare.py /path/to/raw-overpass-dir
Raw files: JP-{fast,east,central,west,mid}.json, KR.json, TW.json;
optional {JP,KR,TW}-routes.json (Overpass route relation bodies).
"""
import json,sys,pathlib,collections,re
raw=pathlib.Path(sys.argv[1]);out=pathlib.Path(__file__).resolve().parents[2]/'public/transit'
manifest=json.loads((out/'index.json').read_text())
named={'red':'#FF0000','green':'#008000','blue':'#0000FF','brown':'#A52A2A','orange':'#FFA500','yellow':'#FFFF00','purple':'#800080','pink':'#FFC0CB','white':'#FFFFFF','black':'#000000'}
def color(v):
 v=v.strip();return v.upper() if re.fullmatch(r'#[0-9a-fA-F]{6}',v) else named.get(v.lower(),'')
tokyo_symbols={'銀座':'G','丸ノ内':'M','日比谷':'H','東西':'T','千代田':'C','有楽町':'Y','半蔵門':'Z','南北':'N','副都心':'F','浅草':'A','三田':'I','新宿':'S','大江戸':'E'}
taipei_symbols={'捷運文湖線':'BR','捷運淡水信義線':'R','捷運松山新店線':'G','捷運中和新蘆線':'O','捷運板南線':'BL','捷運環狀線':'Y','捷運新北投支線':'R','捷運小碧潭支線':'G'}
def line_name(name):
 name=re.sub(r'\s*\([^)]*\)','',name).strip()
 if name.startswith(('東京メトロ','都営')):name=name.split(';')[0].replace('都営三田線','都営地下鉄三田線')
 name={'板南線':'捷運板南線','中和新蘆線':'捷運中和新蘆線','台北捷運小碧潭支線':'捷運小碧潭支線','信義線東延段':'捷運淡水信義線'}.get(name,name)
 return name
for c,files in {'JP':['JP-fast','JP-east','JP-central','JP-west','JP-mid'],'KR':['KR'],'TW':['TW']}.items():
 ways={e['id']:e for name in files for e in json.loads((raw/(name+'.json')).read_text())['elements']}
 routes={};routeFile=raw/(c+'-routes.json')
 if routeFile.exists():
  for r in json.loads(routeFile.read_text())['elements']:
   t=r.get('tags',{});co=color(t.get('colour',''))
   if not co:continue
   for m in r.get('members',[]):
    if m['type']=='way' and m.get('role','') in ['', 'forward','backward']:routes.setdefault(m['ref'],[]).append((r['id'],t,co))
 data=json.loads((out/(c.lower()+'.json')).read_text());known={}; colored=0;tokyo_colours=collections.defaultdict(collections.Counter);tokyo_sources={};taipei_colours=collections.defaultdict(collections.Counter);taipei_sources={}
 # Some OSM polygons label a station/depot building with railway=subway.
 # Those are not passenger tracks; service and future construction are omitted.
 def active(f):
  t=ways.get(f['properties']['osmId'],{}).get('tags',{})
  return not (t.get('building') or t.get('area')=='yes' or t.get('service') or t.get('construction') or t.get('proposed') or t.get('opening_date','')>manifest['checkedAt'])
 data['features']=[f for f in data['features'] if active(f)]
 for f in data['features']:
  p=f['properties'];t=ways.get(p['osmId'],{}).get('tags',{});rs=routes.get(p['osmId'],[])
  if p['kind']=='high-speed':continue
  # Prefer precise hex colours over coarse CSS names on infrastructure ways.
  route=next((r for r in rs if r[1].get('route')!='train'),rs[0] if rs else None)
  co=color(t.get('colour','')) if t.get('colour','').startswith('#') else route[2] if route else color(t.get('colour',''))
  name=t.get('name') or p['name']; ref=t.get('ref','');operator=t.get('operator:en') or t.get('operator','')
  if route:
   p['routeId']=route[0];ref=route[1].get('ref',ref)
   if not operator:operator=route[1].get('operator:en') or route[1].get('operator','')
   if not name:name=route[1].get('name:zh-Hant') or route[1].get('name') or ref
  p.update({'colour':co,'lineName':name,'ref':ref,'operator':operator,'colourSource':('https://www.openstreetmap.org/relation/'+str(route[0])) if route and co==route[2] else 'https://www.openstreetmap.org/way/'+str(p['osmId'])})
  if name and co:known[line_name(name)]=(co,p['colourSource'])
  # Through-service relations can carry another operator's colour / symbol.
  # Canonical Tokyo names use the dominant precise colour on their own ways.
  if name.startswith(('東京メトロ','都営')) and re.fullmatch(r'#[0-9a-fA-F]{6}',t.get('colour','')):
   key=line_name(name);tokyo_colours[key][co]+=1;tokyo_sources.setdefault((key,co),p['colourSource'])
  if c=='TW' and line_name(name) in taipei_symbols and co:
   key=line_name(name);taipei_colours[key][co]+=1;taipei_sources.setdefault((key,co),p['colourSource'])
 # Match remaining pieces by the exact original name, never by a line number alone.
 for f in data['features']:
  p=f['properties']
  if p['kind']=='high-speed':continue
  key=line_name(p['lineName'])
  if not p['colour'] and key in known:p['colour'],p['colourSource']=known[key]
  if key in tokyo_colours:
   p['colour']=tokyo_colours[key].most_common(1)[0][0];p['colourSource']=tokyo_sources[key,p['colour']]
   p['ref']=next((symbol for line,symbol in tokyo_symbols.items() if key.endswith(line+'線')),p['ref'])
  if c=='TW' and key in taipei_colours:
   p['colour']=taipei_colours[key].most_common(1)[0][0];p['colourSource']=taipei_sources[key,p['colour']];p['ref']=taipei_symbols[key]
  if c=='TW' and '桃園機場捷運' in p['lineName']:
   p['colour']='#8246AF';p['colourSource']='https://www.tymetro.com.tw/tymetro-new/tw/_pages/travel-guide/road.html'
  if c=='TW' and '臺中捷運綠線' in p['lineName']:
   p['colour']='#8CC540';p['colourSource']='https://www.tmrt.com.tw/metro-life/route-map'
  if p['colour']:colored+=1
  p['lineName']=key
  p['lineKey']=c+':'+p['lineName']+':'+p['colour']
 (out/(c.lower()+'.json')).write_text(json.dumps(data,ensure_ascii=False,separators=(',',':')))
 manifest['countries'][c]['counts']=dict(collections.Counter(f['properties']['kind'] for f in data['features']))
 print(c,'coloured',colored,'/',sum(f['properties']['kind']!='high-speed' for f in data['features']))
manifest['colours']={'source':'OSM way/route colour tags; exact line-name propagation for untagged segments; Tokyo and Taipei canonical lines use their dominant tagged colour and own symbol, avoiding through-service colours','unknown':'gray, labelled colour not verified','officialReferences':['https://www.tokyometro.jp/en/subwaymap/index.html','https://subway.osakametro.co.jp/guide/routemap.php','https://english.seoul.go.kr/redesign-of-the-seoul-metro-subway-line-maps-for-the-first-time-in-40-years/','https://web.metro.taipei/QRCode/TaipeiMetroGuides/TaipeiMetroGuide_Chinese.pdf']}
(out/'index.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))

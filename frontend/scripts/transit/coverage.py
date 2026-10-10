"""Build geographic planning contours from actual tracks and verified venues.
A 700 m rail corridor / 120 m venue circle is a planning aid, not a benefit boundary.
Unresolved products deliberately have no guessed polygon. Requires shapely, pyproj.
"""
import json,pathlib,sys,math,os
from shapely.geometry import LineString,Point,Polygon,mapping
from shapely.ops import unary_union,transform
from pyproj import Transformer
from network_geometry import load_networks,select_rule,endpoint_name
from pass_rules import RULES
root=pathlib.Path(__file__).resolve().parents[2];passes=json.loads(pathlib.Path(sys.argv[1]).read_text());benefits=json.loads((root/'app/data/pass-benefits.json').read_text());out=root/'public/pass-coverage'
tracks,stations=load_networks(root,pathlib.Path(sys.argv[2]) if len(sys.argv)>2 else out)
def match(id,p):
 name=p.get('lineName',p['name']);op=p.get('operator','')
 keihan='京阪' in op or 'Keihan' in op;otsu='京津線' in name or '石山坂本線' in name
 keihan_main=keihan and any(line in name for line in ['京阪本線','鴨東線','中之島線','宇治線','交野線'])
 if id=='hankyu-day':return '阪急' in op or 'Hankyu' in op
 if id=='seibu-seibu1daypass':return ('西武' in op or 'Seibu' in op) and bool(name) and '多摩川線' not in name and 'Tamagawa' not in name
 if id=='okinawa-yui':return '沖縄都市モノレール' in op
 if id=='keihan-otsu':return keihan and otsu
 if id in ['keihan-kyoto-osaka-day','keihan-kyoto-osaka-24h','keihan-kurama','keihan-hirakata']:return keihan_main
 if id in ['kintetsu-5day','kintetsu-5dayplus']:return '近畿日本' in op or '近鉄' in op or 'Kintetsu' in op
 if id=='odakyu-hakone-kamakura-pass':return '小田急' in op or 'Odakyu' in op or '江ノ島電鉄' in op
 if id in ['odakyu-hakone-freepass','odakyu-fuji-hakone-pass']:return '小田急箱根' in op
 if id=='tokyo-subway':return p['railway']=='subway' and ('Tokyo Metro' in op or 'Tokyo Metropolitan' in op or '東京' in op or name.startswith(('東京メトロ','都営地下鉄')))
 if id=='fukuoka-subway-day':return p['railway']=='subway' and ('Fukuoka' in op or '福岡' in name)
 if id in ['tw-kaohsiung-metro','tw-kaohsiung-mengo']:return '高雄' in name or '高捷' in name
 if id=='tw-taichung-metro':return '臺中捷運綠線' in name or '台中捷運綠線' in name
 if id=='tw-taoyuan-airport-return':return name=='桃園機場捷運'
 if id=='odakyu-enoden_noriorikun':return '江ノ島電鉄' in op or '江ノ島電鉄' in name or '江之島電鐵' in name
 if id=='keihan-metro' and keihan_main:return True
 if id in ['osaka-amazing','keihan-metro']:return 'Osaka Metro' in op or '大阪市高速電気軌道' in op or 'Osaka Municipal' in op
 if id in ['taipei-unlimited','tw-taipei-transport']:return '臺北大眾捷運' in op or '台北捷運公司' in op
 return False
full={'tokyo-subway','fukuoka-subway-day','tw-kaohsiung-metro','tw-taichung-metro','odakyu-enoden_noriorikun','hankyu-day','keihan-otsu','okinawa-yui'}
catalog={p['id']:p for p in passes};resolved={}
# Alternate ticket endpoints are separate geometry files, not a union of all
# versions. They belong to the same catalogue product and retain its provenance.
variant_products={}
for p in list(passes):
 for variant in RULES.get(p['id'],{}).get('variants',[])[1:]:
  id=p['id']+'--'+variant['id'];product=dict(p,id=id);passes.append(product);catalog[id]=product
  RULES[id]=dict(includes=[p['id']],sections=variant.get('sections',[]),whole=variant.get('whole',[]),missing=variant.get('missing',[]),note=variant['note'],complete=False)
  variant_products[id]=(p['id'],variant)
def resolve(id):
 if id in resolved:return resolved[id]
 p=catalog[id];rule=RULES.get(id)
 if rule is None:
  result=([f for f in tracks[p['country']] if match(id,f['properties'])],[],id in full,[])
 else:
  chosen,issues=select_rule(rule,tracks[p['country']],stations[p['country']]);gaps=list(rule.get('missing',[]))+issues;components=[]
  for parent in rule.get('includes',[]):
   fs,gs,_,cs=resolve(parent);chosen.extend(fs);gaps.extend(gs);components.extend(cs)
  for spec in rule.get('sections',[]):components.append({'name':endpoint_name(spec['from'])+' → '+endpoint_name(spec['to']),'access':spec.get('access','unlimited'),'source':spec.get('officialSource') or p['coverageUrl']})
  for selector in rule.get('whole',[]):components.append({'name':selector.get('name') or selector.get('operator') or selector.get('network') or selector.get('ref') or '指定路線','access':selector.get('access','unlimited'),'source':selector.get('officialSource') or p['coverageUrl']})
  dedup={}
  for f in chosen:dedup[(f['properties']['osmId'],f['properties'].get('routeId'),json.dumps(f['geometry']['coordinates']))]=f
  result=(list(dedup.values()),list(dict.fromkeys(gaps)),bool(rule.get('complete')) and not gaps,components)
 resolved[id]=result;return result
only=set(os.environ.get('COVERAGE_IDS','').split(','))-{''}
if only:only.update(id for id,(parent,_) in variant_products.items() if parent in only)
index=json.loads((out/'index.json').read_text()) if only else {}
for p in passes:
 if only and p['id'] not in only:continue
 id=p['id'];chosen,gaps,complete,components=resolve(id);vs=[v for v in benefits if id in v['passIds']];features=[];stops=RULES.get(id,{}).get('points',[])
 center=chosen[0]['geometry']['coordinates'][0] if chosen else vs[0]['at'] if vs else stops[0]['at'] if stops else [0,0]
 if chosen or vs or stops:
  crs=f'+proj=aeqd +lat_0={center[1]} +lon_0={center[0]} +datum=WGS84 +units=m';to=Transformer.from_crs('EPSG:4326',crs,always_xy=True).transform;back=Transformer.from_crs(crs,'EPSG:4326',always_xy=True).transform
  buffers=[]
  for f in chosen:
   props=f['properties'];line=transform(to,LineString(f['geometry']['coordinates']))
   geometry=mapping(transform(back,line.simplify(8,preserve_topology=True)))
   geometry['coordinates']=[[round(x,6),round(y,6)] for x,y in geometry['coordinates']]
   features.append({'type':'Feature','properties':{'role':'network','osmId':props['osmId'],'routeId':props.get('routeId'),'name':props.get('name',''),'operator':props.get('operator',''),'transport':props.get('routeType','rail'),'access':props.get('access','unlimited'),'section':props.get('section'),'source':props.get('officialSource') or p['coverageUrl']},'geometry':geometry})
   buffers.append(line.buffer(700,quad_segs=4))
  for v in vs:
   features.append({'type':'Feature','properties':{'role':'venue','id':v['id'],'name':v['name'],'benefit':v['benefit']},'geometry':{'type':'Point','coordinates':v['at']}})
   buffers.append(transform(to,Point(v['at'])).buffer(120,quad_segs=6))
  for stop in stops:
   features.append({'type':'Feature','properties':{'role':'stop','name':stop['name'],'access':stop.get('access','scheduled-tour'),'source':p['coverageUrl']},'geometry':{'type':'Point','coordinates':stop['at']}})
   buffers.append(transform(to,Point(stop['at'])).buffer(120,quad_segs=6))
  merged=unary_union(buffers).simplify(12,preserve_topology=True)
  if not merged.is_valid:raise RuntimeError(id+' invalid geometry')
  geometry=mapping(transform(back,merged));features.append({'type':'Feature','properties':{'role':'planning-contour','railWalkMeters':700 if chosen else 0,'venueRadiusMeters':120 if vs else 0},'geometry':geometry})
 mode='network' if complete and chosen else 'venues' if vs and p['kind']=='attractions' and id not in ['osaka-amazing','taipei-unlimited'] else 'partial' if features else 'official-only'
 note={'network':'沿實際軌道路網顯示；半透明輪廓為沿線 700 公尺規劃範圍。','venues':'只標示官方合作景點；各點周圍 120 公尺為定位圈。','partial':'顯示已核對的路線／合作景點；半透明輪廓僅供沿線規劃，其餘交通與方案選項請查看官方適用範圍。','official-only':'尚未取得可核對的完整路線幾何；請查看官方範圍，或自己圈選遊玩區域。'}[mode]
 if p['kind']=='stored-value':mode='stored-value';note='儲值卡依合作交通／商家使用，沒有連續的免費適用區域。'
 rule=RULES.get(id,{})
 if rule.get('note'):note=rule['note']+' '+note
 meta={'id':id,'mode':mode,'note':note,'officialUrl':p['coverageUrl'],'checkedAt':'2026-10-10','networkWays':len(chosen),'venues':len(vs),'stops':len(stops),'file':id+'.json' if features else None,'missingComponents':gaps,'components':components,'availability':rule.get('availability','current'),'geometryAttribution':'© OpenStreetMap contributors (ODbL-1.0); official venue coordinates as cited','planningOnly':True}
 index[id]=meta
 if features:(out/(id+'.json')).write_text(json.dumps({'type':'FeatureCollection','metadata':meta,'features':features},ensure_ascii=False,separators=(',',':')))
 print(id,mode,len(chosen),'ways',len(gaps),'gaps',flush=True)
for p in passes:
 id=p['id'];variants=RULES.get(id,{}).get('variants',[])
 if not variants or (only and id not in only):continue
 links=[{'id':v['id'],'label':v['label'],'file':index[id if i==0 else id+'--'+v['id']]['file']} for i,v in enumerate(variants)]
 for i,v in enumerate(variants):
  key=id if i==0 else id+'--'+v['id'];meta=index[key]
  meta.update(id=id,variantId=v['id'],variantLabel=v['label'],variants=links)
  data=json.loads((out/meta['file']).read_text());data['metadata']=meta
  (out/meta['file']).write_text(json.dumps(data,ensure_ascii=False,separators=(',',':')))
  if i:index.pop(key)
(out/'index.json').write_text(json.dumps(index,ensure_ascii=False,indent=2));print('coverage',len(index),'with geometry',sum(bool(v['file']) for v in index.values()))

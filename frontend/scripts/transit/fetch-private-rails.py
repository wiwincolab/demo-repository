"""Fetch private rail geometry once into a private disk cache.
Usage: python3 scripts/transit/fetch-private-rails.py RAW_DIR
The browser only reads generated, simplified pass GeoJSON.
"""
import pathlib,json,sys,urllib.request,urllib.parse
root=pathlib.Path(sys.argv[1]);root.mkdir(parents=True,exist_ok=True);path=root/'JP-extra.json'
if path.exists():sys.exit(0)
query='[out:json][timeout:180];(way(24,126,46,146)[railway=rail][operator~"京阪|阪急|近畿日本|近鉄|近鐵|Kintetsu|Hankyu|Keihan|西武|Seibu|南海|Nankai|小田急|Odakyu|東武|Tobu"];way(26.1,127.6,26.3,127.9)[railway=monorail];);out geom;'
request=urllib.request.Request('https://overpass-api.de/api/interpreter',data=urllib.parse.urlencode({'data':query}).encode(),headers={'User-Agent':'ChictripPassCoverage/1.0 (local map data import)'})
with urllib.request.urlopen(request,timeout=210) as response:data=json.load(response)
if data.get('remark'):raise RuntimeError(data['remark'])
path.with_suffix('.tmp').write_text(json.dumps(data,ensure_ascii=False));path.with_suffix('.tmp').replace(path)
print('JP private rail ways',len(data['elements']))

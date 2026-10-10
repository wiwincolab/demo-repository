"""Fetch route metadata without geometry, sequentially with a private disk cache.
Usage: python3 scripts/transit/fetch-colours.py /path/to/raw-overpass-dir
"""
import sys,pathlib,json,urllib.request,urllib.parse
root=pathlib.Path(sys.argv[1]);root.mkdir(parents=True,exist_ok=True)
for country,bounds in [('JP','24,126,46,146'),('KR','33,124,39,130'),('TW','21.8,119.5,25.6,122.3')]:
 path=root/(country+'-routes.json')
 if path.exists():continue
 query='[out:json][timeout:180];(relation('+bounds+')[type=route][route~"^(subway|tram|light_rail|monorail)$"];relation('+bounds+')[type=route][route=train][colour];);out body;'
 request=urllib.request.Request('https://overpass-api.de/api/interpreter',data=urllib.parse.urlencode({'data':query}).encode(),headers={'User-Agent':'ChictripTransit/1.0 (local map data import)'})
 with urllib.request.urlopen(request,timeout=210) as response:data=json.load(response)
 if data.get('remark'):raise RuntimeError(country+': '+data['remark'])
 path.with_suffix('.tmp').write_text(json.dumps(data,ensure_ascii=False));path.with_suffix('.tmp').replace(path)
 print(country,len(data['elements']),flush=True)

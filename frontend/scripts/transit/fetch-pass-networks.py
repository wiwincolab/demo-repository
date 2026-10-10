"""Cache passenger tracks, stations and selected public bus/ferry routes.
Usage: python3 scripts/transit/fetch-pass-networks.py RAW_DIR
Sequential requests, atomic files, resumable cache; never runs in the browser.
"""
import json, pathlib, sys, time, urllib.parse, urllib.request

cache = pathlib.Path(sys.argv[1])
cache.mkdir(parents=True, exist_ok=True)
regions = {
    'JP-north-pass': (38, 139, 46, 146),
    'JP-central-pass': (33, 134, 38, 137),
    'JP-west-pass': (30, 129, 36, 134),
    'JP-east1-pass': (34, 137, 36, 140),
    'JP-east2-pass': (36, 137, 38, 140),
    'JP-east3-pass': (34, 140, 38, 142),
    'TW-pass': (21.8, 119, 25.5, 122.2),
    'KR-north-pass': (36.5, 124, 39, 131),
    'KR-mid-pass': (35, 124, 36.5, 131),
    'KR-south-pass': (33, 124, 35, 131),
}
queries = {}
for key, box in regions.items():
    bbox = ','.join(map(str, box))
    queries[key] = f'''[out:json][timeout:180];(
way({bbox})[railway~"^(rail|light_rail|tram|monorail|funicular|subway)$"][service!~"."][usage!~"^(industrial|military|test|freight)$"];
way({bbox})[railway=rail][service=siding][passenger_lines~"^[1-9][0-9]*$"][usage!~"^(industrial|military|test|freight)$"];
way({bbox})[aerialway~"^(cable_car|gondola)$"];
node({bbox})[railway=station];
);out geom;'''
queries['JP-pass-bus'] = '''[out:json][timeout:180];(
rel(24,126,46,146)[route=bus][operator~"箱根|Hakone|東海バス|Tokai|江ノ電|江ノ島|Enoden|南海りんかん|Nankai Rinkan|東武バス日光|Tobu Bus Nikko"];
rel(24,126,46,146)[route=ferry][name~"宮島|Miyajima|箱根|Hakone"];
);out geom;'''
queries['TW-pass-bus'] = '''[out:json][timeout:180];(
rel(21.8,119,25.5,122.2)[route=bus][name~"清境|日月潭|阿里山|墾丁|宜蘭|台灣好行|臺灣好行|FunTOUR"];
);out geom;'''
queries['TW-forest-pass']='[out:json][timeout:90];way(23.1,120.3,23.7,121)[railway=narrow_gauge][service!~"."];out geom;'
queries['TW-extra-pass-bus']='[out:json][timeout:90];rel(23.5,120.4,24.3,121.3)[route=bus][ref~"^(6658|6659|6664)$"];out geom;'
# Ferry routes are often mapped as ways rather than public-transport relations.
# Import both representations, then select the officially eligible operator.
queries['JP-ferry-pass-bus']='''[out:json][timeout:90];(
nwr(34.25,132.25,34.35,132.4)[route=ferry];
nwr(34.7,138.2,35.1,138.9)[route=ferry];
);out geom;'''
# Physical line relations supply ownership/name tags at otherwise unnamed
# station throats. These are route=railway, not named through-service trains.
queries['JP-intercity-rail-routes']='''[out:json][timeout:180];(
rel(24,126,46,146)[route=railway][name~"山陰|高山|豊肥|成田|仙山|秩父|函館|室蘭|米坂|只見|常磐|水郡|伊勢崎"];
);out geom;'''
queries['TW-intercity-rail-routes']='[out:json][timeout:90];rel(21.8,119,25.5,122.2)[route=railway][name~"縱貫|宜蘭|北迴|平溪|深澳"];out geom;'
queries['JP-jrwest-pass-bus']='''[out:json][timeout:90];(
rel(33,132,38,139)[route=bus][operator~"西日本.*(バス|Bus)|West.*(JR|Japan).*Bus|JR.*West.*Bus",i];
);out geom;'''
for country,box in [('JP',(24,126,46,146)),('KR',(33,124,39,131)),('TW',(21.8,119,25.5,122.2))]:
    queries[country+'.stations']=f'[out:json][timeout:90];nwr({",".join(map(str,box))})[railway=station];out center tags;'
for country in ('JP','TW'):
    path=cache/(country+'-pass-bus.json')
    if path.exists():
        ids=sorted({m['ref'] for r in json.loads(path.read_text())['elements'] for m in r.get('members',[]) if m['type']=='node' and ('stop' in m.get('role','') or 'platform' in m.get('role',''))})
        if ids:queries[country+'.bus-stops']='[out:json][timeout:90];node(id:'+','.join(map(str,ids))+');out body;'
# Smaller, independently useful imports proceed before the large Korean query.
queries=dict(sorted(queries.items(),key=lambda pair: ('KR' in pair[0], 'bus' not in pair[0] and 'stations' not in pair[0], pair[0])))
endpoints = ['https://overpass-api.de/api/interpreter']
for key, query in queries.items():
    path = cache / (key + '.json')
    if path.exists():
        print(key, 'cached', flush=True)
        continue
    for attempt in range(4):
        try:
            request = urllib.request.Request(endpoints[attempt % len(endpoints)], data=urllib.parse.urlencode({'data': query}).encode(), headers={'User-Agent': 'ChictripPassCoverage/1.0 (local cached map import)'})
            with urllib.request.urlopen(request, timeout=210) as response:
                data = json.load(response)
            if data.get('remark') or (not data.get('elements') and key not in ('TW-extra-pass-bus','JP-jrwest-pass-bus')):
                raise RuntimeError(data.get('remark', 'empty import'))
            tmp = path.with_suffix('.tmp')
            tmp.write_text(json.dumps(data, ensure_ascii=False))
            tmp.replace(path)
            print(key, len(data['elements']), 'elements', flush=True)
            break
        except Exception as error:
            print(key, 'attempt', attempt + 1, str(error), flush=True)
            if hasattr(error, 'read'):
                print(error.read().decode('utf-8', 'replace')[:600], flush=True)
            if attempt == 3:
                raise
            time.sleep(3 * (attempt + 1))

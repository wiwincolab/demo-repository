"""Select actual OSM networks and station-bounded sections, never a bounding box.
Short connections are used only to traverse parallel track topology. Output consists
solely of source way coordinates clipped to the selected track corridor.
"""
import collections, heapq, json, math, pathlib, re, os
from shapely.geometry import LineString, Point, mapping
from shapely.ops import transform, unary_union
from shapely.strtree import STRtree
from pyproj import Transformer

TO = Transformer.from_crs(4326, 3857, always_xy=True).transform
BACK = Transformer.from_crs(3857, 4326, always_xy=True).transform
SECTION_CACHE = {}
MATCH_FIELDS = {}

def active(tags):
    # A passing loop tagged siding may still carry passenger trains. Retain
    # explicitly mapped passenger loops, while excluding yards/freight sidings.
    passenger_loop=tags.get('service')=='siding' and bool(re.match(r'^[1-9]\d*$',tags.get('passenger_lines','')))
    return not ((tags.get('service') and not passenger_loop) or tags.get('area') == 'yes' or tags.get('building') or
                tags.get('usage') in ('industrial', 'military', 'test', 'freight') or
                tags.get('construction') or tags.get('proposed') or
                tags.get('opening_date', '') > '2026-10-10' or
                (re.search(r'貨物線|貨物支線|已崩塌|廃線', tags.get('name', '')) and '山手貨物線' not in tags.get('name', '')))

def load_networks(root, cache):
    networks, stations = {}, {}
    for country in ('JP', 'KR', 'TW'):
        ways = {f['properties']['osmId']: f for f in json.loads((root / f'public/transit/{country.lower()}.json').read_text())['features']}
        stops = {}
        paths = sorted(cache.glob(country + '*-pass.json'))
        if country == 'JP': paths += [cache / 'JP-extra.json']
        for path in paths:
            if not path.exists(): continue
            for e in json.loads(path.read_text())['elements']:
                tags = e.get('tags', {})
                if e['type'] == 'node' and tags.get('railway') == 'station':
                    stops[e['id']] = {'tags': tags, 'at': [e['lon'], e['lat']]}
                elif e['type'] == 'way' and active(tags) and len(e.get('geometry', [])) > 1:
                    coords = [(p['lon'], p['lat']) for p in e['geometry'] if p]
                    # Keep enhanced subway colours/names from the published snapshot.
                    props = dict(tags, osmId=e['id'], routeType='rail', rawName=tags.get('name',''),rawOperator=tags.get('operator',''))
                    if e['id'] in ways: props.update(ways[e['id']]['properties'])
                    props.setdefault('name', '')
                    props.setdefault('operator', '')
                    props.setdefault('railway', tags.get('aerialway', ''))
                    ways[e['id']] = {'type': 'Feature', 'properties': props, 'geometry': mapping(LineString(coords))}
        path=cache/(country+'.stations.json')
        if path.exists():
            for e in json.loads(path.read_text())['elements']:
                at=e.get('center',e)
                if 'lat' in at:stops[(e['type'],e['id'])]={'tags':e.get('tags',{}),'at':[at['lon'],at['lat']]}
        path=cache/(country+'.bus-stops.json')
        if path.exists():
            for e in json.loads(path.read_text())['elements']:
                if 'lat' in e and e.get('tags',{}).get('name'):stops[(e['type'],e['id'])]={'tags':e['tags'],'at':[e['lon'],e['lat']]}
        # Route memberships supply missing line/operator tags; through-service names
        # never replace a precise source way name.
        for path in [cache / (country + '-routes.json'), *sorted(cache.glob(country+'*-rail-routes.json'))]:
          if path.exists():
            for r in json.loads(path.read_text())['elements']:
                tags = r.get('tags', {})
                if r['type']!='relation' or tags.get('railway') in ('proposed','construction') or tags.get('construction') or tags.get('proposed'):continue
                for m in r.get('members', []):
                    if m['type'] != 'way' or m['ref'] not in ways or re.search('stop|platform', m.get('role', '')): continue
                    props = ways[m['ref']]['properties']
                    if not props.get('operator'): props['operator'] = tags.get('operator', '')
                    if not props.get('name'): props['name'] = tags.get('name', '')
        paths = sorted(cache.glob(country + '*pass-bus.json'))
        for path in paths:
            if not path.exists(): continue
            for r in json.loads(path.read_text())['elements']:
                if r['type'] == 'way' and r.get('tags',{}).get('route') == 'ferry' and len(r.get('geometry', [])) > 1:
                    tags=r['tags'];coords=[(p['lon'],p['lat']) for p in r['geometry'] if p]
                    ways[('ferry',r['id'])]={'type':'Feature','properties':dict(tags,osmId=r['id'],routeType='ferry',railway='ferry',name=tags.get('name','')),'geometry':mapping(LineString(coords))}
                if r['type'] != 'relation': continue
                tags = r.get('tags', {})
                for m in r.get('members', []):
                    if m['type'] != 'way' or re.search('stop|platform', m.get('role', '')) or len(m.get('geometry', [])) < 2: continue
                    coords = [(p['lon'], p['lat']) for p in m['geometry'] if p]
                    if len(coords) < 2: continue
                    key = (r['id'], m['ref'])
                    props = dict(tags, osmId=m['ref'], routeId=r['id'], routeType=tags.get('route', ''), railway=tags.get('route', ''), name=tags.get('name', ''))
                    ways[key] = {'type': 'Feature', 'properties': props, 'geometry': mapping(LineString(coords))}
        networks[country], stations[country] = list(ways.values()), list(stops.values())
    return networks, stations

def matches(feature, selector):
    p = feature['properties']
    # Property tuples cannot collide when temporary feature objects are freed
    # and Python reuses their ids; edits to source tags also invalidate the key.
    fields_key=tuple(p.get(k,'') for k in ('operator','rawOperator','operator:ja','operator:en','name','lineName','rawName','alt_name','name:ja','KSJ2:LIN','railway','routeType','ref','network'))
    fields=MATCH_FIELDS.get(fields_key)
    if fields is None:
        fields = {'operator': ';'.join(p.get(k,'') for k in ('operator','rawOperator','operator:ja','operator:en')), 'name': ';'.join(p.get(k,'') for k in ('name','lineName','rawName','alt_name','name:ja','KSJ2:LIN')), 'railway': p.get('railway', ''), 'routeType': p.get('routeType', 'rail'), 'ref': p.get('ref', ''), 'network':p.get('network','')}
        # OSM uses both corporate names and official JR abbreviations. Match
        # each abbreviation to its own company, never to unrelated private rail.
        for short,full in [('JR東日本','東日本旅客鉄道'),('JR西日本','西日本旅客鉄道'),('JR東海','東海旅客鉄道'),('JR北海道','北海道旅客鉄道'),('JR九州','九州旅客鉄道'),('JR四国','四国旅客鉄道')]:
            if short in fields['operator']: fields['operator']+=';'+full
        canonical = fields['name']
        for stem in ('山陰','紀勢','日豊','長崎','久大','羽越','東北','函館','根室','奥羽','宗谷','石北','東海道','山陽','鹿児島','豊肥','高山','関西','中央','総武','筑豊','室蘭','予讃','土讃','肥薩'):
            canonical = canonical.replace(stem + '線', stem + '本線')
        fields['name'] += ';' + canonical + ';' + re.sub(r'\s+','',canonical)
        MATCH_FIELDS[fields_key]=fields
    for field, pattern in selector.items():
        if field in ('excludeName', 'excludeOperator'):
            if re.search(pattern, fields['name' if field == 'excludeName' else 'operator'], re.I): return False
        elif field in fields and not re.search(pattern, fields[field], re.I): return False
    return True

def section(features, stations, start, end, projected_join_meters=0):
    """Find a rail path between officially specified station endpoints.
    Fail closed when station lookup/topology is missing. No straight-line fallback.
    """
    if not features: raise ValueError('沒有匹配的 OSM 路線')
    lines = [transform(TO, LineString(f['geometry']['coordinates'])) for f in features]
    tree = STRtree(lines)
    def locate(name):
        spec=name if isinstance(name,dict) else {'name':name}
        name=spec['name']
        if spec.get('at'):
            point=Point(TO(*spec['at']));idx=int(tree.nearest(point))
            if point.distance(lines[idx])>600:raise ValueError('端點不在指定路線上：'+name)
            return point,idx
        candidates = [s for s in stations if any(re.sub(r'駅$', '', str(v)).casefold() == name.casefold() for k, v in s['tags'].items() if k == 'name' or k.startswith('name:')) and (not spec.get('operator') or re.search(spec['operator'],s['tags'].get('operator','')))]
        if not candidates: raise ValueError('缺少端點車站：' + name)
        point, idx, distance = min(((Point(TO(*s['at'])), int(tree.nearest(Point(TO(*s['at'])))), Point(TO(*s['at'])).distance(lines[int(tree.nearest(Point(TO(*s['at']))))])) for s in candidates), key=lambda x:x[2])
        if distance > 600: raise ValueError('端點不在指定路線上：' + name)
        return point, idx
    a, ai = locate(start); b, bi = locate(end)
    graph = collections.defaultdict(dict)
    def key(xy): return (round(xy[0], 2), round(xy[1], 2))
    def link(x, y):
        if x == y: return
        length = math.dist(x, y)
        graph[x][y] = min(length, graph[x].get(y, float('inf')))
        graph[y][x] = graph[x][y]
    for line in lines:
        coords = [key(c) for c in line.coords]
        for x, y in zip(coords, coords[1:]): link(x, y)
    nodes = list(graph); node_tree = STRtree([Point(n) for n in nodes])
    # Join neighbouring ends of independently mapped parallel tracks. These
    # connectors are topology only; they are never emitted as route geometry.
    for line in lines:
        for xy in (key(line.coords[0]), key(line.coords[-1])):
            for ni in node_tree.query(Point(xy).buffer(45)):
                near = nodes[int(ni)]
                if math.dist(xy, near) <= 45: link(xy, near)
    def anchor(point, idx):
        line = lines[idx]; pos = line.project(point); at = key(line.interpolate(pos).coords[0])
        coords = [key(c) for c in line.coords]; lengths = [0]
        for x, y in zip(coords, coords[1:]): lengths.append(lengths[-1] + math.dist(x, y))
        for i in range(len(coords)-1):
            if lengths[i] <= pos <= lengths[i+1]: link(at, coords[i]); link(at, coords[i+1]); return at
        return coords[-1]
    if projected_join_meters:
        if not 0 < projected_join_meters <= 45:raise ValueError('投影接點距離超過拓樸容差')
        # Some verified branch ends approach the middle of a sparsely mapped
        # source way. Project only those nearby endpoints; routing connectors
        # remain internal and are never emitted as track geometry.
        for line in lines:
            for xy in (key(line.coords[0]),key(line.coords[-1])):
                point=Point(xy)
                for idx in tree.query(point.buffer(projected_join_meters)):
                    idx=int(idx)
                    if point.distance(lines[idx])<=projected_join_meters:link(xy,anchor(point,idx))
    def station_anchor(point, idx):
        first=anchor(point,idx)
        # A station centre may be closest to a different parallel platform
        # track than the arriving line. Connect projections only within the
        # existing 45 m topology tolerance; never emit these connections.
        radius=min(600,point.distance(lines[idx])+45)
        for other in tree.query(point.buffer(radius)):
            other=int(other)
            if other==idx:continue
            at=lines[other].interpolate(lines[other].project(point))
            if Point(first).distance(at)<=45:link(first,anchor(point,other))
        return first
    first = station_anchor(a, ai); last = station_anchor(b, bi)
    start=endpoint_name(start);end=endpoint_name(end)
    distance = {first: 0}; prev = {}; heap = [(0, first)]
    while heap:
        cost, node = heapq.heappop(heap)
        if cost != distance[node]: continue
        if node == last: break
        for neighbour, length in graph[node].items():
            new = cost + length
            if new < distance.get(neighbour, float('inf')):
                distance[neighbour] = new; prev[neighbour] = node; heapq.heappush(heap, (new, neighbour))
    if last not in distance:
        if os.environ.get('GEOMETRY_DEBUG'):
            reached=list(distance); reached_tree=STRtree([Point(n) for n in reached])
            # Diagnose the destination's component, not an unrelated dangling
            # bridge elsewhere in a country-wide connector collection.
            target_component={last};pending=[last]
            while pending:
                node=pending.pop()
                for neighbour in graph[node]:
                    if neighbour not in target_component:target_component.add(neighbour);pending.append(neighbour)
            unseen=list(target_component)
            pairs=[(math.dist(n,reached[int(reached_tree.nearest(Point(n)))]),n,reached[int(reached_tree.nearest(Point(n)))]) for n in unseen]
            gap,x,y=min(pairs)
            print('GAP',start,end,round(gap),BACK(*x),BACK(*y),flush=True)
        raise ValueError('OSM 指定區間不連通：' + start + ' → ' + end)
    path = [last]
    while path[-1] != first: path.append(prev[path[-1]])
    corridor = LineString(path).buffer(60, cap_style=2)
    selected = []
    for f, line in zip(features, lines):
        clipped = line.intersection(corridor)
        parts = [clipped] if clipped.geom_type == 'LineString' else list(clipped.geoms) if clipped.geom_type in ('MultiLineString', 'GeometryCollection') else []
        for part in parts:
            if part.geom_type != 'LineString' or part.length < 2: continue
            selected.append({'type': 'Feature', 'properties': dict(f['properties'], section=start+' → '+end), 'geometry': mapping(transform(BACK, part))})
    return selected

def endpoint_name(spec):
    return (spec.get('label') or spec['name']) if isinstance(spec,dict) else spec

def select_rule(rule, networks, stations):
    features, issues = [], []
    for selector in rule.get('whole', []):
        chosen = [f for f in networks if matches(f, selector)]
        if not chosen: issues.append('缺少路線：' + (selector.get('name') or selector.get('operator') or str(selector)))
        features.extend(dict(f, properties=dict(f['properties'], access=selector.get('access','unlimited'),officialSource=selector.get('officialSource'))) for f in chosen)
    for spec in rule.get('sections', []):
        cache_key=(id(networks),json.dumps({'selector':spec['selector'],'from':spec['from'],'to':spec['to'],'projectedJoinMeters':spec.get('projectedJoinMeters',0)},ensure_ascii=False,sort_keys=True))
        if cache_key in SECTION_CACHE:
            _,cached,error=SECTION_CACHE[cache_key]
            if error:issues.append(error)
            else:features.extend(dict(f,properties=dict(f['properties'],access=spec.get('access','unlimited'),officialSource=spec.get('officialSource'))) for f in cached)
            continue
        chosen = [f for f in networks if matches(f, spec['selector'])]
        seen={id(f) for f in chosen}
        # Untagged pieces at station throats can connect named ways of a line.
        # Restrict them to the same official operator and transport type, then
        # select only pieces physically on the endpoint path.
        connector_selector={k:v for k,v in spec['selector'].items() if k!='name'}
        chosen += [f for f in networks if id(f) not in seen and (f['properties'].get('rawName') == '' or re.search(r'トンネル|隧道|橋梁|橋$|Tunnel|Bridge',f['properties'].get('rawName',''),re.I)) and matches(f,connector_selector)]
        seen={id(f) for f in chosen}
        named_selector={k:v for k,v in spec['selector'].items() if k!='operator'}
        chosen += [f for f in networks if id(f) not in seen and not f['properties'].get('operator') and matches(f,named_selector)]
        try:
            chosen = section(chosen, stations, spec['from'], spec['to'],spec.get('projectedJoinMeters',0))
            SECTION_CACHE[cache_key]=(networks,chosen,None)
            features.extend(dict(f,properties=dict(f['properties'],access=spec.get('access','unlimited'),officialSource=spec.get('officialSource'))) for f in chosen)
        except ValueError as error:
            SECTION_CACHE[cache_key]=(networks,[],str(error));issues.append(str(error))
    return features, issues

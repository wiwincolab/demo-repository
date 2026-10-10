"""Validate and export the published pass-coverage snapshot, without API calls."""
import collections, csv, datetime, json, pathlib
from shapely.geometry import shape

root = pathlib.Path(__file__).resolve().parents[2]
directory = root / 'public/pass-coverage'
def save(path, content):
    if not path.exists() or path.read_text() != content:
        path.write_text(content)

# The app retains legacy artwork hints; downloadable coverage comes only from
# the validated GeoJSON, so do not export the old rectangle approximations.
catalog = [{key:value for key,value in product.items() if key!='areas'} for product in json.loads((directory / 'catalog.json').read_text())]
index = json.loads((directory / 'index.json').read_text())
assert set(index) == {p['id'] for p in catalog}
rows = []
for product in catalog:
    metadata = index[product['id']]
    assert metadata['officialUrl'] == product['coverageUrl']
    metadata.update(geometryAttribution='© OpenStreetMap contributors (ODbL-1.0); official venue coordinates as cited', planningOnly=True)
    if metadata['mode'] == 'network':
        assert not metadata.get('missingComponents'), product['id']
    if metadata['file']:
      files={metadata['file'],*(v['file'] for v in metadata.get('variants',[]) if v['file'])}
      for filename in sorted(files):
        path = directory / filename
        coverage = json.loads(path.read_text())
        assert coverage['metadata']['id'] == product['id']
        contours = [f for f in coverage['features'] if f['properties']['role'] == 'planning-contour']
        assert contours, product['id']
        for feature in coverage['features']:
            geometry = shape(feature['geometry'])
            assert geometry.is_valid and not geometry.is_empty, product['id']
            xmin, ymin, xmax, ymax = geometry.bounds
            assert 118 <= xmin <= xmax <= 149 and 20 <= ymin <= ymax <= 47, (product['id'], geometry.bounds)
        if filename==metadata['file']:coverage['metadata'] = metadata
        else:coverage['metadata'].update(geometryAttribution=metadata['geometryAttribution'],planningOnly=True)
        save(path, json.dumps(coverage, ensure_ascii=False, separators=(',', ':')))
    else:
        assert product['kind'] == 'stored-value', product['id']
    rows.append(dict(id=product['id'], name=product['name'], country=product['country'], mode=metadata['mode'], availability=metadata.get('availability','current'), networkWays=metadata['networkWays'], venues=metadata['venues'], stops=metadata.get('stops',0), variants='；'.join(v['label'] for v in metadata.get('variants',[])), missingComponents='；'.join(metadata.get('missingComponents',[])), officialUrl=metadata['officialUrl'], checkedAt=metadata['checkedAt'], file=metadata['file'] or ''))

save(directory / 'catalog.json', json.dumps(catalog, ensure_ascii=False, indent=2))
save(directory / 'index.json', json.dumps(index, ensure_ascii=False, indent=2))
report = dict(generatedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(), total=len(rows), withGeometry=sum(bool(row['file']) for row in rows), modes=dict(collections.Counter(row['mode'] for row in rows)), currentWithGeometry=sum(bool(row['file']) and row['availability']=='current' for row in rows), countries={country:dict(collections.Counter(row['mode'] for row in rows if row['country']==country)) for country in ('JP','KR','TW')}, planningOnly=True, railWalkMeters=700, venueRadiusMeters=120, limitations=['沿實際路徑的緩衝輪廓只供規劃，不是官方免費地域邊界。','partial 表示仍有指定路線、班次、方案或來源幾何需要核對；缺口逐券列出。','歷史過期券保留資料，介面停用；儲值卡沒有免費地域輪廓。'], products=rows)
(directory / 'report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2))
with (directory / 'report.csv').open('w', encoding='utf-8-sig', newline='') as file:
    writer = csv.DictWriter(file, fieldnames=list(rows[0]))
    writer.writeheader()
    writer.writerows(rows)
print(json.dumps({key:report[key] for key in ('total','withGeometry','currentWithGeometry','modes','countries')},ensure_ascii=False))

# Tokyo offline vector map data

## Memory Atlas streamed imagery and elevation (2026-10-04)

Global imagery, elevation and vector cartography are streamed when the revisit map opens. Bounded Japanese destination aerial tiles are also bundled as described below.

MapLibre runtime and CSS: 5.10.0, official npm distribution via jsDelivr, BSD 3-Clause. License retained at `public/vendor/MAPLIBRE-LICENSE.txt`. Upgrade addresses terrain/retained tile failures observed with 5.6.2; see https://github.com/maplibre/maplibre-gl-js/pull/6388 and https://github.com/maplibre/maplibre-gl-js/pull/6446 .

- Global imagery: EOX Sentinel-2 cloudless **2016**, modified Copernicus Sentinel data; CC BY 4.0. Attribution remains visible in MapLibre. Source/service: https://maps.eox.at/ ; licensing: https://cloudless.eox.at/pricing . The demo uses `s2cloudless_3857/default/g` on `tiles.maps.eox.at`, not the later non-commercial mosaics. This imagery does not represent the travel date.
- Japan aerial imagery: 国土地理院「全国最新写真（シームレス）」, displayed with source attribution. Layer listing and usage conditions: https://maps.gsi.go.jp/development/ichiran.html . Data is streamed from `cyberjapandata.gsi.go.jp/xyz/seamlessphoto/`.
- Elevation: Mapzen terrain tiles / Terrarium encoding, hosted by AWS Open Data. Dataset: https://registry.opendata.aws/terrain-tiles/ ; attribution to original data sources: https://github.com/tilezen/joerd/blob/master/docs/attribution.md . Elevation is a terrain surface, not a detailed reconstructed building mesh.
- Existing vector cartography retains OpenFreeMap, OpenMapTiles and OpenStreetMap credits. Routes are illustrative straight segments; building height extrusions are a visual approximation.

The online services have no availability guarantee. Missing imagery can fall back to the underlying map; a failed map still allows the photo revisit UI.

Map data © OpenStreetMap contributors. Licensed under the Open Data Commons Open Database License (ODbL) 1.0.

- Attribution and copyright: https://www.openstreetmap.org/copyright
- Database license: https://opendatacommons.org/licenses/odbl/1-0/
- Query source: https://overpass-api.de/api/interpreter
- Download/processing date: 2026-09-03

## Data and processing

The adjacent `tokyo-map-data.js` is the complete machine-readable derived database used by this demo, distributed under ODbL 1.0. Read the JSON following `window.TOKYO_MAP_DATA=` and remove the final semicolon. Coordinates are longitude/latitude in WGS84. Original OpenStreetMap way geometry was rounded to six decimal places and simplified with Ramer–Douglas–Peucker at approximately 8 m tolerance. Tiny parks were omitted. No map tiles were downloaded. No coordinates were invented. The dataset is a filtered map illustration, not a navigation or routing service. Some ways extend beyond the requested bounds and should be visually clipped.

## Reproducible Overpass query

```overpass
[out:json][timeout:45];(way["highway"~"^(motorway|trunk|primary|secondary)$"](35.625,139.67,35.755,139.89);way["waterway"="river"](35.625,139.67,35.755,139.89);way["natural"="water"]["name"](35.625,139.67,35.755,139.89);way["leisure"="park"]["name"~"代々木|上野|新宿|日比谷|芝公園|隅田|北の丸|葛西"](35.625,139.67,35.755,139.89);way["railway"="rail"]["name"="山手線"](35.625,139.67,35.755,139.89););out tags geom;
```

## Neighborhood street supplement

Additional tertiary, residential and unclassified streets cover the Asakusa/Skytree, Harajuku/Shibuya, Shinjuku, Ueno and Maihama trip areas. Their original way geometry was rounded to six decimal places and simplified with approximately 3 m tolerance. Duplicate OpenStreetMap way IDs and duplicate coordinate sequences were removed before merging. This supplement remains under the same ODbL 1.0 database license.

Overpass data timestamp: `2026-09-03T04:43:05Z`.

```overpass
[out:json][timeout:45];(way["highway"~"^(tertiary|residential|unclassified)$"](35.700,139.780,35.725,139.825);way["highway"~"^(tertiary|residential|unclassified)$"](35.650,139.685,35.681,139.716);way["highway"~"^(tertiary|residential|unclassified)$"](35.677,139.682,35.701,139.720);way["highway"~"^(tertiary|residential|unclassified)$"](35.704,139.763,35.726,139.790);way["highway"~"^(tertiary|residential|unclassified)$"](35.625,139.869,35.646,139.890););out tags geom;
```

## Prepared destination aerial tiles (2026-10-04)

Twelve Japanese destination areas use locally prepared GSI seamless aerial imagery in `memory/revisit/aerial/`. The current-year city areas use native zoom 18 (13 × 13 source tiles); Fuji and Amanohashidate use zoom 16 (11 × 11); the four 2025 Osaka areas retain zoom 16 (5 × 5). `sources.json` records every original public source URL and georeferenced bounds. The application uses derived WebP XYZ pyramids at zoom 9 through the native source zoom, with only the outer area feathered to blend into the global context. These are geographic aerial data, not AI-generated photographs, and do not represent the travel date.

Source: 国土地理院「全国最新写真（シームレス）」, https://maps.gsi.go.jp/development/ichiran.html . GSI terms: https://www.gsi.go.jp/kikakuchousei/kikakuchousei40182.html . Processing: geographic mosaicking, WebP compression, lower-resolution pyramid generation and outer-edge alpha feathering. Source attribution stays visible on the map. Seoul and Hong Kong still use streamed global imagery.

Wide-area landing context is prepared separately at zoom 14 (9 × 9 source tiles) in `memory/revisit/aerial/regional/`, with its own `sources.json` provenance. It supplies a coherent landscape during the overhead and early descent beats before the zoom-18 detail fades in. Missing GSI ocean tiles use a plain sea-color fill to avoid black holes in terrain raster rendering; no missing terrain or landmark imagery is invented.

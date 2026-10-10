export const transitCountries = [
  { id: 'jp', bounds: [[129, 30, 132, 34.5], [130.5, 33.5, 146, 46], [122.8, 24, 132, 30]] },
  { id: 'kr', bounds: [[124.5, 33, 129.7, 38.7]] },
  { id: 'tw', bounds: [[119.5, 21.8, 122.2, 25.5]] },
] as const;
export const transitColors = { metro: '#009fc5', 'light-rail': '#7e74bf', 'high-speed': '#e57667' };

export function visibleTransitCountries(bounds: number[]) {
  const [w, s, e, n] = bounds;
  if (![w, s, e, n].every(Number.isFinite)) return [];
  return transitCountries.filter(c => c.bounds.some(b => e! >= b[0] && w! <= b[2] && n! >= b[1] && s! <= b[3]));
}
export function preparePlannerBasemap(map: any) {
  const layers = map.getStyle().layers;
  const poi = layers.find((l: any) => l['source-layer'] === 'poi');
  // Base-style restaurant/tourism icons must not introduce uncontrolled gray
  // places before the user has selected a range. Keep transport labels separate.
  for (const layer of layers) if (layer['source-layer'] === 'poi') map.setLayoutProperty(layer.id, 'visibility', 'none');
  if (!poi || map.getLayer('travel-station-names')) return;
  const font = poi.layout?.['text-font'] || ['Noto Sans Regular'];
  map.addLayer({ id: 'travel-station-names', type: 'symbol', source: poi.source, 'source-layer': 'poi', minzoom: 12, filter: ['==', ['get', 'class'], 'railway'], layout: { 'text-field': ['coalesce', ['get', 'name:zh-Hant'], ['get', 'name:zh'], ['get', 'name'], ['get', 'name:en']], 'text-font': font, 'text-size': 11, 'text-anchor': 'top', 'text-offset': [0, .7] }, paint: { 'text-color': '#317b93', 'text-halo-color': '#ffffff', 'text-halo-width': 2 } });
}
// Self-hosted OSM tracks: load only countries intersecting the current viewport.
// Pass validity is deliberately independent of the rail display.
export function attachTransitMap(map: any, asset: (path: string) => string) {
  let disposed = false;
  const loaded = new Set<string>();
  const update = () => {
    if (disposed || !map.isStyleLoaded()) return;
    const b = map.getBounds();
    for (const country of visibleTransitCountries([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()])) {
      if (loaded.has(country.id)) continue;
      const source = `travel-transit-${country.id}`;
      map.addSource(source, { type: 'geojson', data: asset(`transit/${country.id}.json`), attribution: 'Rail © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap contributors</a> (ODbL)' });
      const color = ['match', ['get', 'kind'], 'high-speed', transitColors['high-speed'], 'light-rail', transitColors['light-rail'], transitColors.metro];
      const width = ['interpolate', ['linear'], ['zoom'], 5, .8, 10, 2, 16, 4];
      for (const [kind, minzoom] of [['high-speed', 5], ['urban', 10]] as const) {
        const filter = [kind === 'high-speed' ? '==' : '!=', ['get', 'kind'], 'high-speed'];
        map.addLayer({ id: `${source}-${kind}-casing`, type: 'line', source, minzoom, filter, layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#ffffff', 'line-width': ['interpolate', ['linear'], ['zoom'], 5, 2.2, 10, 3.4, 16, 5.4], 'line-opacity': .9 } });
        map.addLayer({ id: `${source}-${kind}-lines`, type: 'line', source, minzoom, filter, layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': color, 'line-width': width, 'line-opacity': .85 } });
      }
      const font = map.getStyle().layers.find((l: any) => l.type === 'symbol' && l.layout?.['text-font'])?.layout['text-font'] || ['Noto Sans Regular'];
      map.addLayer({ id: `${source}-names`, type: 'symbol', source, minzoom: 11, filter: ['!=', ['get', 'name'], ''], layout: { 'symbol-placement': 'line', 'symbol-spacing': 320, 'text-field': ['get', 'name'], 'text-font': font, 'text-size': 11 }, paint: { 'text-color': color, 'text-halo-color': '#ffffff', 'text-halo-width': 2 } });
      loaded.add(country.id);
    }
  };
  map.on('moveend', update);
  map.on('idle', update);
  update();
  return () => { disposed = true; map.off('moveend', update); map.off('idle', update); };
}

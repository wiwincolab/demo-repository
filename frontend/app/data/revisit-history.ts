import atlas from './atlas.json' with { type: 'json' };
import scenes from './scenes.json' with { type: 'json' };
import type { RevisitStop, RevisitVehicle } from './revisit.ts';

/** Restored presentation fixture, isolated from this year's actual demo trips. */
export function lastYearStops(): RevisitStop[] {
  return atlas.stops.map(stop => {
    const city = atlas.cities.find(city => city.id === stop.city)!;
    const scene = scenes.find(scene => scene.id === stop.id)!;
    return {
      id: `2025-${stop.city}-${stop.id}`, tripId: 'last-year',
      title: stop.name, location: `${city.country} · ${city.name}`, short: stop.short,
      date: `2025-${stop.date.replace('.', '-')}`,
      source: scene.src.replace('assets/scenes/', 'atlas-assets/scenes/'),
      image: scene.src.replace('assets/scenes/', 'atlas-assets/scenes/'),
      format: '旅行照片', caption: scene.caption,
      coords: stop.at as [number, number], zoom: stop.zoom, bearing: city.bearing,
      groupId: `2025-${city.id}`, groupLabel: city.name, english: city.english,
      transport: { vehicle: stop.vehicle as RevisitVehicle, label: stop.mode },
      sourceNote: `2025 示範回憶 · ${scene.context}`,
      interaction: 'photo', works: [], souvenirs: [],
    };
  });
}

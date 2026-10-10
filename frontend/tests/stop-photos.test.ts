import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { tripItineraries, tripAlternatives, classicRoutes } from '../app/data/trips.ts';
import { stopPhoto } from '../app/data/classic-routes.ts';
import credits from '../public/assets/photos/classic/credits.json' with { type: 'json' };

const publicRoot = new URL('../public/', import.meta.url);

test('every itinerary and rain alternative has a real, readable raster image', () => {
  const stops = [...Object.values(tripItineraries).flatMap(days => days.flatMap(day => day.stops)), ...Object.values(tripAlternatives)];
  for (const stop of stops) {
    assert.match(stop.photo.src, /\.(?:jpe?g|png|webp)$/i, stop.name);
    assert.doesNotMatch(stop.photo.alt + stop.photo.credit, /照片待補|路線示意圖/, stop.name);
    const bytes = readFileSync(new URL(stop.photo.src, publicRoot));
    const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8;
    const isPng = bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    const isWebp = bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
    assert.ok(isJpeg || isPng || isWebp, `${stop.name}: invalid image file`);
  }
});

test('classic stop photos retain their matching attribution through trip assembly', () => {
  for (const route of classicRoutes) {
    const stops = tripItineraries[route.id as keyof typeof tripItineraries].flatMap(day => day.stops);
    for (const stop of stops) {
      const name = stop.name.replace(/・返程$/, '') as keyof typeof credits;
      const source = credits[name];
      assert.ok(source, `${route.id}: ${stop.name}`);
      for (const field of ['src', 'source', 'credit', 'license', 'licenseUrl'] as const) {
        assert.ok(stop.photo[field], `${stop.name}: ${field}`);
        assert.equal(stop.photo[field], source[field]);
      }
      assert.equal(stop.photo.alt, `${stop.name}實景`);
      assert.match(source.imageUrl, /^https:\/\//);
    }
  }
});

test('return visits share the photo without sharing mutable objects', () => {
  const arrival = stopPhoto('新千歲機場', 'test');
  const departure = stopPhoto('新千歲機場・返程', 'test');
  assert.equal(arrival.src, departure.src);
  departure.credit = 'changed';
  assert.notEqual(arrival.credit, departure.credit);
  assert.throws(() => stopPhoto('未提供照片的新景點', 'test'), /Missing itinerary photo/);
});

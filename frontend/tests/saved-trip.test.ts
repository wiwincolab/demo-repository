import test from 'node:test';
import assert from 'node:assert/strict';
import { savedDays } from '../app/utils/saved-trip.ts';
import { tripItineraries } from '../app/data/trips.ts';

test('a saved trip keeps only the shared stops, in the original day order', () => {
    const all = tripItineraries.kansai.flatMap(day => day.stops);
    const chosen = [all[5]!.id, all[0]!.id];
    const days = savedDays('kansai', chosen);
    assert.deepEqual(days.flatMap(day => day.stops).map(stop => stop.id), [all[0]!.id, all[5]!.id]);
    assert.ok(days.every(day => day.stops.length > 0));
});

test('saving does not change the shared demo itinerary', () => {
    const before = JSON.stringify(tripItineraries.kansai);
    savedDays('kansai', [0]);
    assert.equal(JSON.stringify(tripItineraries.kansai), before);
});

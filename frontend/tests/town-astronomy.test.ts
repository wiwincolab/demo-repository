import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const context = vm.createContext({ Date, Intl });
for (const file of ['vendor/astronomy.browser.min.js', 'sky-core.js']) {
  vm.runInContext(readFileSync(new URL(`../public/demos/travel-town/${file}`, import.meta.url), 'utf8'), context);
}
const A = context.Astronomy, C = context.TownSkyCore, tokyo = C.locations[2];
const fixture = JSON.parse(readFileSync(new URL('./fixtures/town-jpl-horizons.json', import.meta.url), 'utf8'));
const angleDifference = (a: number, b: number) => Math.abs(((a - b + 540) % 360) - 180);

test('sun and moon bearings, altitude, size and illuminated fraction agree with NASA JPL Horizons', () => {
  // 0.005 degrees = 18 arcseconds. Compare airless altitude to the same JPL mode.
  for (const reference of fixture.samples) {
    const sample = C.sample(A, tokyo, new Date(reference.date));
    const body = sample[reference.body];
    assert.ok(angleDifference(body.azimuth, reference.azimuth) < .005, `${reference.body} azimuth ${reference.date}`);
    assert.ok(Math.abs(body.geometricAltitude - reference.altitude) < .005, `${reference.body} altitude ${reference.date}`);
    const diameter = body.angularRadius * 2 * 180 / Math.PI * 3600;
    assert.ok(Math.abs(diameter - reference.diameterArcseconds) < 2, `${reference.body} diameter ${reference.date}`);
    if (reference.body === 'moon') {
      assert.ok(Math.abs(sample.illuminatedFraction - reference.illuminatedFraction) < .0001,
        `topocentric lunar illumination ${reference.date}`);
    }
  }
});

test('north/east/up coordinates agree with geographic azimuth and remain unit vectors', () => {
  for (const [az, expected] of [[0, [0, 0, -1]], [90, [1, 0, 0]], [180, [0, 0, 1]], [270, [-1, 0, 0]]]) {
    const direction = C.direction(az, 0);
    for (const [i, key] of ['x', 'y', 'z'].entries()) assert.ok(Math.abs(direction[key] - expected[i]) < 1e-12);
  }
  const zenith = C.direction(137, 90);
  assert.ok(Math.abs(zenith.y - 1) < 1e-12);
});

test('local date and timeline do not use the browser timezone and cross midnight correctly', () => {
  for (const location of C.locations) {
    const now = new Date('2026-10-11T16:30:00Z'), p = C.localParts(now, location.timeZone);
    assert.equal(p.date, '2026-10-12'); assert.equal(p.time, '01:30');
    assert.equal(C.dateFromLocal(p.date, p.minutes, location.timeZone).toISOString(), now.toISOString());
  }
  assert.throws(() => C.dateFromLocal('2026-02-30', 720, 'Asia/Tokyo'));
  assert.throws(() => C.dateFromLocal('2026-10-11', NaN, 'Asia/Tokyo'));
});

test('sun rises in the east and sets in the west at all nine observer locations', () => {
  for (const location of C.locations) {
    const e = C.events(A, location, '2026-10-11');
    assert.ok(e.sunrise < e.noon && e.noon < e.sunset);
    const rise = C.sample(A, location, e.sunrise), set = C.sample(A, location, e.sunset);
    assert.ok(rise.sun.azimuth > 80 && rise.sun.azimuth < 130);
    assert.ok(set.sun.azimuth > 230 && set.sun.azimuth < 280);
    assert.equal(C.sample(A, location, new Date(e.sunrise.getTime() - 20 * 60000)).sun.visible, false);
    assert.equal(C.sample(A, location, new Date(e.sunrise.getTime() + 20 * 60000)).sun.visible, true);
  }
});

test('moon is allowed above the horizon in daylight and below it at night', () => {
  const noon = C.sample(A, tokyo, new Date('2026-10-11T03:00:00Z'));
  assert.equal(noon.sun.visible, true); assert.equal(noon.moon.visible, true);
  const night = C.sample(A, tokyo, new Date('2026-10-11T15:00:00Z'));
  assert.equal(night.sun.visible, false); assert.equal(night.moon.visible, false);
  assert.ok(noon.illuminatedFraction < .01);
});

test('a local day without a moonrise or moonset does not borrow the next day event', () => {
  const noRise = C.events(A, tokyo, '2026-10-05');
  assert.equal(noRise.moonrise, null);
  assert.ok(noRise.moonset);
  const noSet = C.events(A, tokyo, '2026-10-20');
  assert.equal(noSet.moonset, null);
  assert.ok(noSet.moonrise);
});

test('season changes solar trajectory; changing scene slot does not change geographic coordinates', () => {
  const summer = C.events(A, tokyo, '2026-06-21'), winter = C.events(A, tokyo, '2026-12-21');
  assert.ok(C.sample(A, tokyo, summer.noon).sun.altitude > C.sample(A, tokyo, winter.noon).sun.altitude + 40);
  const date = new Date('2026-10-11T03:00:00Z');
  const moved = { ...tokyo, x: -12, z: 12 };
  assert.equal(C.sample(A, moved, date).sun.azimuth, C.sample(A, tokyo, date).sun.azimuth);
  assert.notEqual(C.sample(A, C.locations[6], date).sun.azimuth, C.sample(A, tokyo, date).sun.azimuth);
});

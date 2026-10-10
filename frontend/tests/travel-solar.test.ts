import test from 'node:test';
import assert from 'node:assert/strict';
import { sunPosition, daylightAt, localTime } from '../public/demos/travel-planet/solar.mjs';
test('equinox separates midday Greenwich from midnight on opposite meridian',()=>{const d=new Date('2026-03-20T12:00:00Z');assert.equal(daylightAt(0,0,d),true);assert.equal(daylightAt(0,180,d),false);assert.ok(Math.abs(sunPosition(d).latitude)<1)});
test('summer and winter reverse polar day and night',()=>{assert.equal(daylightAt(89,0,new Date('2026-06-21T00:00:00Z')),true);assert.equal(daylightAt(89,0,new Date('2026-12-21T12:00:00Z')),false)});
test('East Asia changes between local daytime and nighttime',()=>{for(const [lat,lng] of [[25.033,121.5654],[35.6762,139.6503],[37.5665,126.978]]){assert.equal(daylightAt(lat,lng,new Date('2026-10-10T03:00:00Z')),true);assert.equal(daylightAt(lat,lng,new Date('2026-10-10T16:00:00Z')),false)}});
test('time labels use city timezone including date rollover',()=>{const d=new Date('2026-10-10T16:30:00Z');assert.equal(localTime('Asia/Taipei',d),'00:30');assert.equal(localTime('Asia/Tokyo',d),'01:30')});
test('solar position is independent of camera and wraps longitude',()=>{const a=sunPosition(new Date('2026-10-10T00:00:00Z'));const b=sunPosition(new Date('2026-10-10T12:00:00Z'));assert.ok(a.longitude>=-180&&a.longitude<=180);assert.ok(Math.abs(Math.abs(a.longitude-b.longitude)-180)<1);assert.ok(Math.abs(Math.hypot(a.x,a.y,a.z)-1)<1e-9)});

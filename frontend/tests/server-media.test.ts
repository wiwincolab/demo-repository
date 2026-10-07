import test from 'node:test';
import assert from 'node:assert/strict';
import { sniffImageType, mediaRelativePath } from '../server/utils/media.ts';
import { isDeviceId } from '../server/utils/device.ts';
import { isTripId } from '../server/utils/trips.ts';

const bytes = (...values: number[]) => new Uint8Array(values);

test('image type comes from the file bytes, not the name or header', () => {
    assert.equal(sniffImageType(bytes(0xff, 0xd8, 0xff, 0xe0)), 'image/jpeg');
    assert.equal(sniffImageType(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)), 'image/png');
    const webp = new TextEncoder().encode('RIFF\0\0\0\0WEBPVP8 ');
    assert.equal(sniffImageType(webp), 'image/webp');
    assert.equal(sniffImageType(new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"/>')), null);
    assert.equal(sniffImageType(bytes()), null);
});

test('media files are grouped by UTC month with the type extension', () => {
    assert.equal(mediaRelativePath('abc', 'image/png', new Date('2026-10-07T00:00:00Z')), '2026/10/abc.png');
    assert.equal(mediaRelativePath('xyz', 'image/jpeg', new Date('2026-01-31T23:59:59Z')), '2026/01/xyz.jpg');
});

test('device ids must be v4 UUIDs so a forged cookie cannot pick another value', () => {
    assert.ok(isDeviceId('3f2b8c1e-9a4d-4e6f-8b7a-1c2d3e4f5a6b'));
    assert.ok(!isDeviceId('3f2b8c1e-9a4d-1e6f-8b7a-1c2d3e4f5a6b'));
    assert.ok(!isDeviceId('../../etc/passwd'));
    assert.ok(!isDeviceId(undefined));
});

test('only the three demo trips are accepted', () => {
    for (const id of ['tokyo', 'kansai', 'fuji']) assert.ok(isTripId(id));
    assert.ok(!isTripId('paris'));
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { compactPassCoverage } from '../app/utils/compact-pass-coverage.ts';
import { coveragePolygons, withinPassCoverage, coverageAccess, type PassCoverage } from '../app/utils/pass-coverage.ts';

test('mobile ticket payloads retain exact eligibility, holes, access types and eligible rail IDs',()=>{
  for(const id of ['tokyo-subway','japan-rail','tw-alishan-shuttle','tobu-aizu--kitakata','discover-seoul']) {
    const original=JSON.parse(readFileSync(new URL(`../public/pass-coverage/${id}.json`,import.meta.url),'utf8')) as PassCoverage;
    const compact=compactPassCoverage(original);
    assert.deepEqual(coveragePolygons(compact),coveragePolygons(original));
    assert.deepEqual(new Set(coverageAccess(compact)),new Set(coverageAccess(original)));
    const originalIds=original.features.filter(f=>f.properties.role==='network' && Number.isInteger(f.properties.osmId)).map(f=>f.properties.osmId!);
    assert.deepEqual(new Set(compact.features.flatMap(f=>f.properties.osmIds || [])),new Set(originalIds));
    assert.deepEqual(compact.metadata,original.metadata);
    for(const at of [[139.7967,35.7148],[140.3933,35.7759],[135.8285,34.6841],[121.1621,24.0547]])assert.equal(withinPassCoverage(at,compact),withinPassCoverage(at,original));
    if(id==='japan-rail')assert.ok(JSON.stringify(compact).length<JSON.stringify(original).length*.3);
  }
});

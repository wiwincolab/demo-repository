import test from 'node:test';
import assert from 'node:assert/strict';
import {legTransport,restoreTransportSettings,transportLegKey} from '../app/utils/trip-transport.ts';
import {directionsUrl} from '../app/utils/directions.ts';
test('transport choices survive reload, stay on the same leg after reordering, and inherit main transport',()=>{
  const a={id:-12,day:0,at:[139,35]},b={id:25,day:0,at:[139.1,35.1]},c={id:26,day:1,at:[139.2,35.2]};
  const initial=restoreTransportSettings(null,'driving');
  assert.equal(legTransport(initial,a,b),'driving');
  initial.legs[transportLegKey(a,b)]='walking';
  const restored=restoreTransportSettings(JSON.parse(JSON.stringify(initial)));
  assert.equal(legTransport(restored,a,b),'walking');
  assert.equal(legTransport(restored,b,a),'driving');
  assert.equal(legTransport(restored,b,c),'driving');
  restored.major='public-transit';
  assert.equal(legTransport(restored,a,b),'walking');
  assert.equal(legTransport(restored,b,c),'public-transit');
  for(const mode of ['public-transit','driving','walking'] as const)assert.equal(new URL(directionsUrl(a,b,mode)).searchParams.get('travelmode'),mode==='public-transit'?'transit':mode);
});
test('invalid stored transport values and leg keys are discarded',()=>{
  const valid='0:-123:1:456';
  assert.deepEqual(restoreTransportSettings({major:'flying',legs:{[valid]:'walking',bad:'driving','0:1:0:2':'flying'}}),{major:'public-transit',legs:{[valid]:'walking'}});
});

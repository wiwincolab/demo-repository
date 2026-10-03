import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyJourney, restoreJourney, journeyStops } from '../app/data/journey.ts';

test('corrupt local storage cannot put a friend into an unsaved scene',()=>{
  assert.deepEqual(restoreJourney(null),emptyJourney());
  const state=restoreJourney({usjSaved:true,friendAccepted:true,friendPlaced:true});
  assert.equal(state.usjSaved,false);assert.equal(state.friendAccepted,false);assert.equal(state.friendPlaced,false);
});
test('returning to a saved journey retains its note and exchange provenance',()=>{
  const state={...emptyJourney(),usjCreated:true,usjSaved:true,note:'在餐廳前拍照',friendAccepted:true,friendPlaced:true,friendReply:'下次一起去',savedAt:'2026-10-02T10:00:00Z',exchangedAt:'2026-10-02T10:02:00Z'};
  assert.deepEqual(restoreJourney(JSON.parse(JSON.stringify(state))),state);
  assert.equal(journeyStops.length,7);
  assert.equal(new Set(journeyStops.map(stop=>stop.id)).size,7);
  assert.equal(new Set(journeyStops.map(stop=>stop.format)).size,3);
});

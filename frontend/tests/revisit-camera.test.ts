import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import regional from '../app/data/revisit-regional.json' with {type:'json'};
import aerial from '../app/data/revisit-aerial.json' with {type:'json'};
import { revisitCamera } from '../app/utils/revisit-camera.ts';
import { buildRevisitStops } from '../app/data/revisit.ts';
import { emptyJourney } from '../app/data/journey.ts';

test('prepared aerial coverage includes every Kansai destination and its full tile pyramid',()=>{
  for(const stop of buildRevisitStops('kansai',[],emptyJourney())){
    const sheet=aerial.find(item=>item.id===stop.id)!;
    assert(sheet,stop.id);
    const area=regional.find(item=>item.id===stop.id)!;
    assert(area,stop.id+' regional');
    assert(area.tiles.every(url=>existsSync('public/'+url)));
    assert(area.bounds[2]! - area.bounds[0]! > sheet.bounds[2]! - sheet.bounds[0]!);
    const [west,south,east,north]=sheet.bounds;
    assert(stop.coords[0]>west! && stop.coords[0]<east! && stop.coords[1]>south! && stop.coords[1]<north!);
    assert(sheet.tiles.every(url=>existsSync('public/'+url)));
    assert(sheet.tiles.some(url=>url.includes('/9/')) && sheet.tiles.some(url=>url.includes('/'+sheet.tileZoom+'/')));
  }
});
test('the camera drops from overhead to a close view without inventing street-level photography',()=>{
  for(const stop of buildRevisitStops('year',[],emptyJourney())){
    const view=revisitCamera(stop.zoom,stop.bearing,stop.id,true);
    assert(view.survey.zoom<view.descend.zoom && view.descend.zoom<view.scene.zoom);
    assert.equal(view.survey.pitch,0);assert.equal(view.scene.bearing,stop.bearing);
    assert(view.scene.pitch<=60);
    assert.equal(revisitCamera(stop.zoom,stop.bearing,stop.id,false).scene.pitch,0);
  }
});

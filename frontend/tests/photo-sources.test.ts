import test from 'node:test';
import assert from 'node:assert/strict';
import {claimValues,humanEntity,needsIdentityReview,articleReference,resolvedPage,articleFiles,photographicPage,categoryPhoto,photoUpdateMap,applyPhotoUpdates,placeNames,photoSearchPhrase,photoSearchBatches,namedNearPlace,completeSearchCoordinates,nextPhotoSearchOffset} from '../scripts/poi/photo-sources.mjs';

const file=(title:string)=>({title:'File:'+title,imageinfo:[{url:'https://upload.wikimedia.org/photo.jpg',thumburl:'https://thumb.wikimedia.org/photo.jpg',descriptionurl:'https://commons.wikimedia.org/wiki/File:'+title,mime:'image/jpeg',thumbwidth:640,thumbheight:480,extmetadata:{Artist:{value:'Photographer'},LicenseShortName:{value:'CC BY-SA 4.0'},LicenseUrl:{value:'https://creativecommons.org/licenses/by-sa/4.0/'}}}]});
test('photo search batches respect the Commons 300 character limit with multiple long aliases',()=>{
  const pois=Array.from({length:50},(_,i)=>({name:`Some Long Named National History Museum ${i}`,localName:`長名稱歷史博物館${i}`,names:{'name:en':`National Museum of Local Art and Archaeology ${i}`}}));
  const batches=photoSearchBatches(pois);
  assert.ok(batches.length>3);
  assert.deepEqual(batches.flat(),pois);
  assert.ok(batches.every(batch=>photoSearchPhrase(batch).length<=280));
});
test('photo candidates keep preferred statements, exclude deprecated statements and reject human identities',()=>{
  const statement=(value:unknown,rank='normal')=>({rank,mainsnak:{datavalue:{value}}});
  assert.deepEqual(claimValues({claims:{P18:[statement('old.jpg','deprecated'),statement('normal.jpg'),statement('best.jpg','preferred')]}},'P18'),['best.jpg','normal.jpg']);
  assert.ok(humanEntity({claims:{P31:[statement({id:'Q5'})]}}));
  assert.equal(humanEntity({claims:{P31:[statement({id:'Q5'},'deprecated')]}}),false);
  assert.deepEqual(claimValues({statements:{P180:[statement({id:'Q1'})]}},'P180'),[{id:'Q1'}]);
  assert.equal(needsIdentityReview({claims:{P31:[statement({id:'Q4167410'})]}}),true);
  assert.equal(needsIdentityReview({claims:{P31:[statement({id:'Q33506'})]}}),false);
});
test('coordinate module pagination preserves photo metadata and continues all search pages',()=>{
  const pages=Object.fromEntries(Array.from({length:50},(_,i)=>[i,{pageid:i,title:'File:'+i+'.jpg',imageinfo:[{url:'photo-'+i}],...(i<10?{coordinates:[{lat:i,lon:i,globe:'earth'}]}:{})}]));
  const original={query:{pages},continue:{cocontinue:'10|100',continue:'||pageprops|imageinfo'}};
  const coordinateData={query:{pages:Object.fromEntries(Array.from({length:50},(_,i)=>[i,{pageid:i,coordinates:[{lat:i,lon:i,globe:'earth'}]}]))}};
  const complete=completeSearchCoordinates(original,coordinateData);
  assert.equal(Object.values(complete.query.pages).filter(p=>p.coordinates.length).length,50);
  assert.equal(complete.query.pages[49].imageinfo[0].url,'photo-49');
  assert.equal(original.query.pages[49].coordinates,undefined);
  assert.equal(nextPhotoSearchOffset(complete),50);
  assert.equal(nextPhotoSearchOffset({...complete,continue:{gsroffset:100}},50),100);
  assert.equal(nextPhotoSearchOffset({query:{pages:{1:pages[1]}}}),undefined);
});
test('unlinked photos require both the complete place name and a nearby Earth coordinate',()=>{
  const p={name:'Test Museum',localName:'Test Museum',names:{},at:[129.08,35.0787]};
  const page={title:'File:Test Museum exterior.jpg',coordinates:[{lat:35.0787,lon:129.0801,globe:'earth'}]};
  assert.equal(namedNearPlace(page,p),true);
  assert.equal(namedNearPlace({...page,coordinates:[{lat:37,lon:129,globe:'earth'}]},p),false);
  assert.equal(namedNearPlace({...page,title:'File:Other Museum.jpg'},p),false);
  assert.equal(namedNearPlace({...page,coordinates:[]},p),false);
  assert.equal(namedNearPlace({...page,title:'Category:Translated Museum',pageprops:{wikibase_item:'Q1'}},{...p,wikidata:'Q1'}),true);
  assert.equal(namedNearPlace({...page,title:'Category:Other Museum',pageprops:{wikibase_item:'Q2'}},{...p,wikidata:'Q1'}),false);
  assert.deepEqual(placeNames({...p,name:'觀景台',localName:'展望台'}),[]);
  assert.deepEqual(placeNames({...p,name:'A-123',localName:'123'}),[]);
});
test('article images keep the lead and exact place names, not other nearby buildings',()=>{
  const page={pageimage:'Museum exterior.jpg',images:[{ns:6,title:'ファイル:Museum entrance.jpg'},{title:'File:Other building.jpg'},{title:'File:Museum exterior.jpg'}]};
  assert.deepEqual(articleFiles(page,['Museum entrance']),['Museum exterior.jpg','Museum entrance.jpg']);
});
test('photo updates persist in all overlapping snapshots without mutating the originals before writing',()=>{
  const original={id:'osm:way:1',photo:null},snapshots=[{pois:[original]},{pois:[{...original}]}],updates=photoUpdateMap(snapshots);
  updates.get(original.id).photo={src:'photo.jpg'};
  assert.equal(original.photo,null);
  for(const snapshot of snapshots){const result=applyPhotoUpdates(snapshot,updates);assert.equal(result.changed,true);assert.equal(result.pois[0].photo.src,'photo.jpg');}
  assert.equal(applyPhotoUpdates({pois:[{...original,photo:{src:'existing.jpg'}}]},updates).changed,false);
});
test('article references and renamed pages resolve exactly, including redirect chains',()=>{
  assert.deepEqual(articleReference('ja:八潮市立資料館'),{language:'ja',title:'八潮市立資料館'});
  assert.equal(articleReference('https://example.com/Museum'),null);
  const page={title:'New name',pageimage:'Museum.jpg'};
  const data={query:{normalized:[{from:'old_name',to:'old name'}],redirects:[{from:'old name',to:'Older'},{from:'Older',to:'New name'}],pages:{1:page}}};
  assert.equal(resolvedPage(data,'old_name'),page);
  assert.equal(resolvedPage(data,'Other museum'),undefined);
  assert.equal(resolvedPage({query:{pages:{1:{title:'Missing',missing:''}}}},'Missing'),undefined);
  const shared={...file('Museum.jpg'),missing:'',imagerepository:'shared'};
  assert.equal(resolvedPage({query:{pages:{'-1':shared}}},'File:Museum.jpg'),shared);
});
test('linked categories choose a licensed site photograph over diagrams and unrelated details',()=>{
  const data={query:{pages:{1:file('Site map.jpg'),2:file('Flower.jpg'),3:file('Museum exterior.jpg')}}};
  assert.equal(photographicPage(data.query.pages[1]),null);
  assert.equal(categoryPhoto(data,['Museum'])?.file,'Museum exterior.jpg');
  const restricted=file('Museum.jpg');restricted.imageinfo[0].extmetadata.LicenseShortName.value='All rights reserved';
  assert.equal(categoryPhoto({query:{pages:{1:restricted}}},['Museum']),null);
});

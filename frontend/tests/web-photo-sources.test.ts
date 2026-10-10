import test from 'node:test';
import assert from 'node:assert/strict';
import {embeddedArray,yahooImages,naverImages,nativeImages,websiteImages,matchingWebImages,webPhoto,imageDimensions,publicHttpsUrl,samePhotoPlace,tourismPhotoRows} from '../scripts/poi/web-photo-sources.mjs';

test('official tourism photos require a complete name and a matching geographic point',()=>{
  const p={id:'poi',country:'TW',name:'同名博物館',localName:'同名博物館',at:[121,25],photo:null};
  const a={AttractionID:'a',AttractionName:p.name,PositionLon:121,PositionLat:25,Images:[{URL:'https://example.org/first.jpg',Description:'照片提供｜作者'},{URL:'https://example.org/second.jpg'}]};
  const rows=tourismPhotoRows({Attractions:[{...a,PositionLon:122},a]},[p]);assert.equal(rows.length,1);assert.equal(rows[0].items[0].src,'https://example.org/first.jpg');assert.match(rows[0].items[0].credit,/作者/);
  assert.equal(tourismPhotoRows({Attractions:[{...a,AttractionName:'別的博物館'}]},[p]).length,0);
  assert.equal(tourismPhotoRows({Attractions:[a]},[{...p,country:'JP'}]).length,0);
});

test('native search separates images even when the divider touches the caption',()=>{
  const raw='定山渓郷土博物館 (https://example.org/museum)\nciteimage0\nImage URL: https://example.org/museum.jpg# Museum Entrance\n\nA museum building.\n\nThe article also mentions 似鳥美術館.'+'-'.repeat(80)+'\n似鳥美術館 (https://example.org/nitori)\nciteimage1\nImage URL: https://example.org/nitori.jpg# Nitori Museum\n\nA stone building.';
  const items=nativeImages(raw);assert.equal(items.length,2);assert.equal(items[1].src,'https://example.org/nitori.jpg');assert.doesNotMatch(items[0].caption,/似鳥/);
  assert.deepEqual(matchingWebImages(items,{name:'似鳥美術館'}).map(i=>i.src),['https://example.org/nitori.jpg']);
  assert.equal(matchingWebImages([{...items[0],caption:'似鳥美術館'}],{name:'似鳥美術館'}).length,0);
  const mountain=nativeImages('白雲山 (https://example.org/mountain)\nImage URL: https://example.org/mountain.jpg# Summit panorama\n\nA summit overlooking Busan.\n\nAn unrelated article mentions Seoul.');
  assert.equal(matchingWebImages(mountain,{name:'白雲山'},{locations:['Busan'],requireLocation:true}).length,1);
  assert.equal(matchingWebImages(mountain,{name:'白雲山'},{locations:['Seoul'],requireLocation:true}).length,0);
});
test('shared photos need the same identity or physical place, not just a shared name',()=>{
  const p={id:'a',country:'JP',wikidata:null,at:[139,35]};
  assert.ok(samePhotoPlace(p,{...p,id:'b',at:[139.001,35]}));
  assert.equal(samePhotoPlace(p,{...p,id:'c',at:[140,35]}),false);
  assert.ok(samePhotoPlace({...p,wikidata:'Q1'},{...p,id:'d',wikidata:'Q1',at:[140,35]}));
  assert.equal(matchingWebImages([{title:'同名神社',src:'https://example.org/a.jpg',original:'https://example.org/a.jpg',source:'https://example.org/shrine'}],{name:'同名神社'},{requireLocation:true}).length,0);
});
test('municipal and linked entity names retain locality when shorter names are used',()=>{
  const item={title:'保塚公園 - 足立区保塚町',src:'https://example.org/a.jpg',original:'https://example.org/a.jpg',source:'https://example.org/park'};
  assert.equal(matchingWebImages([item],{name:'足立区立保塚公園'}).length,1);
  assert.equal(matchingWebImages([{...item,title:'保塚公園 - 別の区'}],{name:'足立区立保塚公園'}).length,0);
  assert.equal(matchingWebImages([{...item,title:'Hozuka Park Tokyo'}],{name:'足立区立保塚公園'},{aliases:['Hozuka Park'],locations:['Tokyo']}).length,1);
  assert.equal(matchingWebImages([{...item,title:'Hozuka Park'}],{name:'足立区立保塚公園'},{aliases:['Hozuka Park']}).length,0);
});

test('search metadata keeps provider order and rejects unrelated first results',()=>{
  const items=[
    {title:'別の公園',main:{url:'https://images.example.org/other.jpg',width:600,height:400},original:{url:'https://example.org/other.jpg'},refererUrl:'https://example.org/other'},
    {title:'三菱史料館｜公式サイト',main:{url:'https://images.example.org/first.jpg',width:600,height:400},original:{url:'https://example.org/first.jpg'},refererUrl:'https://example.org/museum',refererName:'<b>公式</b>'},
    {title:'三菱史料館',main:{url:'https://images.example.org/second.jpg'},original:{url:'https://example.org/second.jpg'},refererUrl:'https://example.org/museum'},
  ];
  const html='<script id="__NEXT_DATA__" type="application/json">'+JSON.stringify({props:{initialProps:{pageProps:{algos:items}}}})+'</script>';
  const matches=matchingWebImages(yahooImages(html),{name:'三菱史料館'});
  assert.deepEqual(matches.map(m=>m.src),['https://images.example.org/first.jpg','https://images.example.org/second.jpg']);
  assert.equal(matches[0].credit,'公式');
  assert.equal(yahooImages('<script id="__NEXT_DATA__">alert(1)</script>').length,0);
});
test('embedded result JSON is parsed without executing surrounding scripts',()=>{
  const items=[{type:'image',title:'부산 윤공단 [입구]',viewerThumb:'https://search.pstatic.net/common/?src=x',originalUrl:'http://example.org/photo.jpg',link:'https://example.org/place',writerTitle:'Photo source',orgWidth:800,orgHeight:600}];
  assert.deepEqual(embeddedArray('items: '+JSON.stringify([{value:']"[\\'}])+'; throw Error("never execute")','items:'),[{value:']"[\\'}]);
  const html='var imageSearchTabData = {shopAd:{items:null},content:{url:"'+ 'x'.repeat(1800)+'",items:'+JSON.stringify(items)+'}};throw Error("never execute")';
  const parsed=naverImages(html);assert.equal(parsed.length,1);assert.equal(parsed[0].original,'https://example.org/photo.jpg');
  assert.equal(matchingWebImages(parsed,{localName:'윤공단',name:'尹公壇'}).length,1);
  assert.equal(embeddedArray('items: [function(){return 1}]','items:').length,0);
  assert.equal(matchingWebImages([{...parsed[0],title:'국립부산과학관/광안리맛집/광안대교/가족여행'}],{name:'국립부산과학관'}).length,0);
  assert.equal(matchingWebImages([{...parsed[0],title:'부산 출발 백두산 패키지 여행'}],{name:'백두산'}).length,0);
  const mountains=[{...parsed[0],title:'김해 백두산 산책'},{...parsed[0],title:'북한 백두산 여행'}];
  assert.deepEqual(matchingWebImages(mountains,{name:'백두산'},{locations:['김해'],requireLocation:true}).map(i=>i.title),['김해 백두산 산책']);
});
test('linked website photos skip navigation logos and retain first real image',()=>{
  const html='<title>三菱史料館</title><header><img src="/building.jpg"></header><main><img src="/logo.png" width="800" height="200"><img data-src="/first.jpg" alt="展示室"><img src="/second.jpg"></main>';
  const images=websiteImages(html,'https://example.org/museum/',{name:'三菱史料館'});
  assert.deepEqual(images.map(m=>m.src),['https://example.org/first.jpg','https://example.org/second.jpg']);
  assert.equal(websiteImages(html,'https://example.org/',{name:'別の美術館'}).length,0);
  assert.equal(matchingWebImages([{...images[0],title:'三菱史料館 地図'}],{name:'三菱史料館'}).length,0);
});
test('web provenance states unknown licensing and rejects private or executable URLs',()=>{
  for(const url of ['javascript:alert(1)','data:image/png;base64,a','https://127.0.0.1/','https://[::1]/','https://foo.local/','https://user:pass@example.org/','https://example.org:8782/'])assert.equal(publicHttpsUrl(url),null);
  assert.equal(publicHttpsUrl(undefined,'https://example.org/'),null);
  const item={src:'https://images.example.org/a.jpg',original:'https://example.org/a.jpg',source:'https://example.org/place',provider:'Yahoo! JAPAN image search',credit:'source'};
  const photo=webPhoto(item,{width:600,height:400},'2026-10-10T00:00:00Z');
  assert.equal(photo?.licenseStatus,'unspecified');assert.equal(photo?.licenseUrl,'');assert.equal(photo?.source,item.source);assert.doesNotMatch(photo?.license || '',/CC|Public domain/);
  assert.equal(webPhoto(item,{width:1,height:1},''),null);
  assert.equal(webPhoto({...item,source:'javascript:alert(1)'},{width:600,height:400},''),null);
});
test('image probes reject HTML and decode PNG, JPEG and WebP dimensions',()=>{
  assert.equal(imageDimensions(Buffer.from('<html>not an image</html>')),null);
  const png=Buffer.alloc(24);Buffer.from([137,80,78,71,13,10,26,10]).copy(png);png.writeUInt32BE(640,16);png.writeUInt32BE(480,20);assert.deepEqual(imageDimensions(png),{width:640,height:480});
  const jpeg=Buffer.from([0xff,0xd8,0xff,0xe0,0,4,0,0,0xff,0xc2,0,7,8,1,0,2,0]);assert.deepEqual(imageDimensions(jpeg),{width:512,height:256});
  assert.equal(imageDimensions(jpeg.subarray(0,12)),null);
  const webp=Buffer.alloc(30);webp.write('RIFF',0);webp.write('WEBP',8);webp.write('VP8X',12);webp.writeUIntLE(959,24,3);webp.writeUIntLE(639,27,3);assert.deepEqual(imageDimensions(webp),{width:960,height:640});
});

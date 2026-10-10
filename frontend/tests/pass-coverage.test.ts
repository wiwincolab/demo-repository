import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { passCoverageIndex, withinPassCoverage, coveragePolygons, coverageAccess, coverageStatus, mergeBundleCoverage, taiwanBundleOptions, type PassCoverage } from '../app/utils/pass-coverage.ts';
import { travelPasses } from '../app/data/travel-passes.ts';
const load=(id:string)=>JSON.parse(readFileSync(new URL(`../public/pass-coverage/${id}.json`,import.meta.url),'utf8')) as PassCoverage;

test('pass contours retain holes and disconnected destinations instead of filling a rectangle',()=>{
  const shape:PassCoverage={type:'FeatureCollection',metadata:passCoverageIndex['tokyo-subway']!,features:[{type:'Feature',properties:{role:'planning-contour'},geometry:{type:'MultiPolygon',coordinates:[[[[0,0],[4,0],[4,4],[0,4],[0,0]],[[1,1],[3,1],[3,3],[1,3],[1,1]]],[[[6,0],[7,0],[7,1],[6,1],[6,0]]]]}}]};
  assert.equal(withinPassCoverage([.5,.5],shape),true);
  assert.equal(withinPassCoverage([2,2],shape),false);
  assert.equal(withinPassCoverage([5,.5],shape),false);
  assert.equal(withinPassCoverage([6.5,.5],shape),true);
  assert.equal(withinPassCoverage([2,2],null),false);
});
test('Tokyo ticket follows actual subway tracks, includes Asakusa and excludes Disney and Narita',()=>{
  const coverage=load('tokyo-subway');
  assert.ok(coverage.metadata.networkWays>800);
  assert.ok(coverage.features.filter(f=>f.properties.role==='network').every(f=>f.geometry.type==='LineString'));
  assert.equal(withinPassCoverage([139.7967,35.7148],coverage),true);
  assert.equal(withinPassCoverage([139.8814,35.6327],coverage),false);
  assert.equal(withinPassCoverage([140.3933,35.7759],coverage),false);
  assert.ok(coveragePolygons(coverage).some(rings=>rings[0]!.length>50));
});
test('venue passes preserve isolated partners without claiming the space between them',()=>{
  const coverage=load('discover-seoul');
  assert.equal(coverage.metadata.mode,'venues');assert.equal(coverage.metadata.venues,203);
  assert.equal(withinPassCoverage([127.5258072,37.7899352],coverage),true);
  assert.equal(withinPassCoverage([127.5251,37.7917],coverage),false);
  assert.equal(withinPassCoverage([127.36,37.54],coverage),false);
  assert.equal(withinPassCoverage([126.4417,37.4635],coverage),false);
});
test('private rail pass geometry respects line exclusions and marks missing transport as partial',()=>{
  const network=(id:string)=>load(id).features.filter(f=>f.properties.role==='network');
  const seibu=network('seibu-seibu1daypass');
  assert.ok(seibu.length>600);assert.ok(!seibu.some(f=>f.properties.name?.includes('多摩川')));
  assert.equal(load('seibu-seibu1daypass').metadata.mode,'network');
  const keihan=network('keihan-kyoto-osaka-day'),otsu=network('keihan-otsu');
  assert.ok(keihan.length>600);assert.ok(otsu.length>90);
  const otsuIds=new Set(otsu.map(f=>f.properties.osmId));
  assert.ok(keihan.every(f=>!otsuIds.has(f.properties.osmId)));
  assert.equal(load('keihan-kyoto-osaka-day').metadata.mode,'network');
  assert.ok(network('hankyu-day').length>1000);
  assert.ok(network('okinawa-yui').length>8);
});
test('limited Kyoto and Kintetsu tickets stop at official endpoints',()=>{
  const kyoto=load('keihan-kyoto-day');
  assert.equal(withinPassCoverage([135.7692574,34.9688922],kyoto),true,'Fushimi Inari');
  assert.equal(withinPassCoverage([135.5075836,34.691505],kyoto),false,'Osaka Kitahama');
  const kintetsu=load('kintetsu-1day');
  assert.equal(withinPassCoverage([135.8285414,34.6841376],kintetsu),true,'Kintetsu Nara');
  assert.equal(withinPassCoverage([135.7807061,34.6202562],kintetsu),true,'Tsutsui');
  assert.equal(withinPassCoverage([135.701922,34.5977271],kintetsu),false,'Oji');
  assert.equal(withinPassCoverage([135.8535627,34.3770064],kintetsu),false,'Yoshino');
});
test('regional JR boundaries exclude nearby stations beyond the ticket',()=>{
  const mini=load('jr-west-kansaimini');
  assert.equal(withinPassCoverage([135.2434129,34.4359259],mini),true,'Kansai Airport');
  assert.equal(withinPassCoverage([134.6902424,34.8269005],mini),false,'Himeji');
  assert.equal(withinPassCoverage([135.19158,34.2322107],mini),false,'Wakayama');
  const noboribetsu=load('jr-hokkaido-noboribetsu');
  assert.equal(withinPassCoverage([141.1808029,42.4520087],noboribetsu),true);
  assert.equal(withinPassCoverage([140.7634991,42.5508898],noboribetsu),false,'Toya');
  assert.equal(withinPassCoverage([142.3579263,43.7627501],noboribetsu),false,'Asahikawa');
  const mobile=load('jr-kyushu-mobile');
  assert.equal(withinPassCoverage([130.4436001,33.0294859],mobile),true,'Omuta');
  assert.equal(withinPassCoverage([130.297418,33.2641541],mobile),false,'Saga');
});
test('restored shared rail corridors reach the official terminals without extending past them',()=>{
  assert.equal(withinPassCoverage([134.0461528,34.350692],load('jr-west-kansai_wide')),true,'Takamatsu across the Seto bridge');
  assert.equal(withinPassCoverage([132.7566624,35.3607587],load('jr-west-tottorimatsue')),true,'Izumoshi');
  assert.equal(withinPassCoverage([131.4105197,34.4169951],load('jr-west-tottorimatsue')),false,'Higashi-Hagi outside the Tottori-Matsue ticket');
  assert.equal(withinPassCoverage([137.2133577,36.7014249],load('jr-central-takayama_hokuriku')),true,'Toyama');
  assert.equal(withinPassCoverage([138.9509503,34.9793728],load('jr-central-fuji_shizuoka')),true,'Shuzenji on Izuhakone');
});
test('JR Miyajima tickets include only the eligible ferry operator',()=>{
  for(const id of ['japan-rail','jr-west-kansai_hiroshima','jr-west-sanyo_sanin','jr-west-hiroshima_yamaguchi','jr-setouchi']){
    const ferries=load(id).features.filter(f=>f.properties.transport==='ferry');
    assert.deepEqual(new Set(ferries.map(f=>f.properties.osmId)),new Set([41961998,41963252]),id);
  }
});
test('repaired regional routes reach their free endpoints and preserve operator eligibility',()=>{
  const ryomo=load('tobu-ryomo');
  assert.equal(withinPassCoverage([139.5269854,36.2254683],ryomo),true,'Morinji-mae free-area start');
  assert.equal(withinPassCoverage([139.1942704,36.3268395],ryomo),true,'Isesaki');
  assert.equal(withinPassCoverage([139.535,36.17],ryomo),false,'Hanyu is only a purchased departure, not unlimited');
  const chichibu=load('seibu-chichibufreeticket');
  assert.equal(withinPassCoverage([139.1107334,36.111646],chichibu),true,'Nogami');
  assert.equal(withinPassCoverage([138.9790441,35.9600528],chichibu),true,'Mitsumineguchi');
  assert.equal(withinPassCoverage([135.167052,34.2367974],load('jr-central-ise_kumano')),true,'Wakayamashi');
  const nonbiri=load('jr-east-nonbiri_pass');
  assert.equal(nonbiri.metadata.mode,'network');
  assert.deepEqual(nonbiri.metadata.missingComponents,[]);
  assert.equal(withinPassCoverage([140.3859428,35.7650987],nonbiri),true,'JR Narita Airport');
  const airport=nonbiri.features.filter(f=>f.properties.section==='佐倉 → 成田空港');
  assert.ok(airport.length>40);
  assert.equal(airport.some(f=>/京成|北総/.test(f.properties.name||'')),false,'shared infrastructure does not include Keisei trains');
});
test('Aizu ticket versions have separate endpoints and do not inherit Nikko bus entitlements',()=>{
  const base=load('tobu-aizu'),onsen=load('tobu-aizu--ashinomaki'),kitakata=load('tobu-aizu--kitakata');
  assert.equal(base.metadata.variants?.length,3);
  for(const coverage of [base,onsen,kitakata]){
    assert.equal(coverage.metadata.id,'tobu-aizu');
    assert.equal(withinPassCoverage([139.7737611,37.2033259],coverage),true,'Aizu-Tajima common free endpoint');
    assert.equal(coverage.features.some(f=>f.properties.transport==='bus'),false,'Nikko bus belongs to a different product');
  }
  assert.equal(withinPassCoverage([139.9322392,37.3955469],base),false);
  assert.equal(withinPassCoverage([139.9322392,37.3955469],onsen),true);
  assert.equal(withinPassCoverage([139.8678239,37.6439547],onsen),false);
  assert.equal(withinPassCoverage([139.8678239,37.6439547],kitakata),true);
});
test('eligible JR local buses exclude discontinued and unrelated municipal routes',()=>{
  const wide=load('jr-west-kansai_wide'),hokuriku=load('jr-west-hokuriku');
  const busIds=new Set(wide.features.filter(f=>f.properties.transport==='bus').map(f=>f.properties.routeId));
  assert.ok(busIds.has(13403910),'Jakko local bus');
  assert.ok(busIds.has(19131862),'Kyoto Takao-Keihoku local bus');
  assert.ok(!busIds.has(13404059),'discontinued Enpuku line');
  assert.ok(!busIds.has(12232708),'Kanazawa municipal Flat Bus');
  assert.ok(wide.features.filter(f=>f.properties.transport==='bus').every(f=>f.properties.source==='https://www.nishinihonjrbus.co.jp/en/route/'));
  assert.equal(hokuriku.features.some(f=>f.properties.routeId===13403910),false,'Hokuriku pass excludes Jakko');
});
test('Taiwan shuttles select eligible route IDs and distinguish limited rides',()=>{
  const alishan=load('tw-alishan-shuttle');
  const routes=new Set(alishan.features.filter(f=>f.properties.role==='network').map(f=>f.properties.routeId));
  assert.deepEqual(routes,new Set([11148748,11148749,11148750,11148751,11148752,11148753,11148756,11148757]));
  assert.deepEqual(coverageAccess(alishan),['round-trip']);
  const qingjing=load('tw-qingjing-shuttle');
  assert.equal(withinPassCoverage([121.1621135,24.0547453],qingjing),true,'Guanshan Pasture');
  assert.equal(withinPassCoverage([121.5021187,24.948927],qingjing),false,'unrelated Green 7 stop');
  assert.deepEqual(coverageAccess(load('tw-taoyuan-airport-return')),['round-trip']);
});
test('Taiwan bundle contains only the chosen metro and shuttle, with original provenance',()=>{
  const base=load('taiwan-hsr'),city=load('tw-taipei-transport'),shuttle=load('tw-alishan-shuttle');
  const merged=mergeBundleCoverage(base,city,shuttle);
  assert.equal(merged.metadata.id,'taiwan-hsr');
  assert.equal(withinPassCoverage([121.445,25.1678],base),false);
  assert.equal(withinPassCoverage([121.445,25.1678],merged),true,'chosen Taipei metro reaches Tamsui');
  assert.equal(withinPassCoverage([120.9113374,23.8665198],merged),false,'unchosen Sun Moon Lake shuttle');
  assert.ok(merged.features.some(f=>f.properties.source===shuttle.metadata.officialUrl));
  assert.equal(taiwanBundleOptions.city.length,4);
  assert.equal(mergeBundleCoverage(base).metadata.missingComponents?.filter(g=>g.includes('任選一')).length,2);
});
test('expired tickets cannot be labelled current and incomplete networks do not claim completion',()=>{
  assert.equal(passCoverageIndex['tobu-taito-sumida']?.availability,'expired');
  assert.match(coverageStatus(passCoverageIndex['tobu-taito-sumida']),/已到期/);
  for(const metadata of Object.values(passCoverageIndex)){
    if(metadata.mode==='network')assert.equal(metadata.missingComponents?.length || 0,0,metadata.id);
  }
});
test('all catalog products have explicit coverage provenance and unresolved products have no invented geometry',()=>{
  assert.deepEqual(new Set(Object.keys(passCoverageIndex)),new Set(travelPasses.map(p=>p.id)));
  for(const pass of travelPasses){const meta=passCoverageIndex[pass.id]!;assert.equal(meta.officialUrl,pass.coverageUrl);assert.ok(meta.note && meta.checkedAt);
    if(meta.file){const coverage=load(pass.id);assert.equal(coverage.metadata.id,pass.id);assert.ok(coveragePolygons(coverage).length);}
    else assert.ok(['official-only','stored-value'].includes(meta.mode));
    if(pass.kind==='stored-value')assert.equal(meta.file,null);
  }
});

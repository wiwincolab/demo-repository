import test from 'node:test';
import assert from 'node:assert/strict';
import { interpretAdvisorAnswer, recommendUsage, type AnswerLevel } from '../app/utils/esim-advisor.ts';
import { esimPlan } from '../app/utils/esim.ts';
import { isMemberList, groupPrice } from '../app/utils/commerce.ts';

test('verified Docomo variants use the actual selected duration, never a starting price', () => {
  assert.deepEqual(['light','normal','heavy'].map(x => esimPlan(x as 'light'|'normal'|'heavy',5).price), [123,208,395]);
  assert.deepEqual(['light','normal','heavy'].map(x => esimPlan(x as 'light'|'normal'|'heavy',2).price), [81,130,246]);
  assert.equal(esimPlan('normal',2).days,3);
  assert.equal(esimPlan('normal',2).tripDays,2);
  assert.equal(esimPlan('heavy',5).dailyGB,10);
  assert.equal(esimPlan('heavy',5).unlimited,true);
  assert.equal(esimPlan('normal',6).available,false);
});
test('free text distinguishes negative activities, Wi-Fi use and positive clauses', () => {
  for (const [step,text,expected] of [
    [0,'主要找路，晚上回飯店才傳照片',0],
    [0,'不用導航只看影片',2],
    [0,'沒有Wi-Fi所以看影片',2],
    [0,'不看影片，但會開熱點工作',2],
    [1,'不看影片',0], [1,'每天不超過半小時',1],
    [1,'搭車看 YouTube 大概一小時',2],
    [2,'不開熱點',0], [2,'只給自己使用',0],
    [2,'偶爾給朋友查資料',1], [2,'筆電工作開視訊',2],
    [1,'今天很開心',null], [0,'',null],
  ] as const) assert.equal(interpretAdvisorAnswer(step,text),expected,text);
});
test('three answers produce distinct recommendations and reject incomplete questionnaires', () => {
  const result = (levels:AnswerLevel[]) => recommendUsage(levels.map(level=>({level,text:'test',source:'preset'})));
  assert.equal(result([0,0,0]),'light');
  assert.equal(result([1,1,0]),'normal');
  assert.equal(result([0,0,2]),'heavy');
  assert.throws(()=>result([0,1]));
});
test('verified mixed-price purchases restore and get only the proposal group discount', () => {
  const members=[123,208,395,208].map((price,i)=>({price,name:String(i),paid:true}));
  assert.ok(isMemberList(members));
  assert.deepEqual(groupPrice(members),{count:4,base:934,saving:80,total:854});
  assert.equal(isMemberList([{name:'Test',price:999,paid:true}]),false);
});

test('memory changes question context without choosing or inflating a recommendation', async () => {
  const { journeyQuestions, readAdvisorMemory } = await import('../app/utils/esim-advisor.ts');
  const memory = readAdvisorMemory({savedAt:'2026-10-09T00:00:00Z',answers:[0,1,2].map(level=>({level,text:'上次的選擇',source:'preset'}))});
  assert.ok(memory);
  assert.match(journeyQuestions(['food'],memory)[0]!.title,/咖啡店/);
  assert.match(journeyQuestions(['nature'])[0]!.title,/風景/);
  assert.match(journeyQuestions([],memory)[1]!.source,/上次的選擇/);
  assert.doesNotMatch(journeyQuestions()[1]!.source,/上次/);
  for (const invalid of [null,{}, {savedAt:'invalid',answers:memory.answers}, {savedAt:memory.savedAt,answers:[]}, {savedAt:memory.savedAt,answers:memory.answers.map(a=>({...a,level:9}))}]) assert.equal(readAdvisorMemory(invalid),null);
  assert.equal(recommendUsage(journeyQuestions(['food'],memory).map(q=>({level:0,text:q.options[0]!,source:'preset'}))),'light');
});

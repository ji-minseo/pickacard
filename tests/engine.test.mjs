import test from 'node:test';import assert from 'node:assert/strict';import {cards} from '../src/data/cards.mjs';import {readings} from '../src/data/readings.mjs';import {cardSlug} from '../src/data/card-directory.mjs';import {readingDepth} from '../src/data/reading-depth.mjs';import {readingContexts} from '../src/data/reading-contexts.mjs';import {loadSavedReadings,saveReadingRecord,removeSavedReading,clearSavedReadings} from '../src/saved-readings.mjs';import {shuffleDeck,randomInt,loadDaily,saveDaily,dateKey,interpret,verdict,readingHeadline,situationExample,timingInsight,nextAction,combinationInsights,contextualInsight} from '../src/engine.mjs';import {readFile} from 'node:fs/promises';import {josa} from '../src/korean.mjs';
import {resolveQuestionFocus,reconcileQuestionReading} from '../src/question-focus.mjs';
import {deepReadingOffer,supportsDeepReading} from '../src/premium-config.mjs';
import {createDeepReading} from '../premium/deep-reading-engine.mjs';
test('all 78 cards support every reading position and orientation',()=>{assert.equal(cards.length,78);for(const c of cards)for(const [slug,r] of Object.entries(readings))for(let i=0;i<r.positions.length;i++)for(const reversed of [true,false]){const result=interpret(slug,{id:c.id,reversed},i);assert.ok(result.context.length>15);assert.ok(result.meaning.length>15);assert.ok(result.lens.length>15);}});
test('question intent adapts to the specific concern while keeping the same cards',()=>{
 const picks=['major-1','major-8','cups-2','swords-8'].map(id=>({id,reversed:false}));
 const interview=resolveQuestionFocus('job','다음 주 면접을 어떻게 준비할까요?','change',picks);
 const documents=resolveQuestionFocus('job','포트폴리오와 이력서가 걱정돼요','change',picks);
 const outcome=resolveQuestionFocus('job','최종 합격 발표가 날까요?','change',picks);
 const change=resolveQuestionFocus('job','이직할 때 어떤 걸 봐야 하나요?','change',picks);
 assert.equal(interview.key,'interview');
 assert.equal(documents.key,'application');
 assert.equal(outcome.key,'outcome');
 assert.equal(change.key,'transition');
 assert.equal(interview.index,1);
 assert.equal(documents.index,2);
 assert.equal(outcome.index,2);
 assert.equal(change.index,3);
 assert.notEqual(interview.description,documents.description);
 assert.notEqual(interview.action,documents.action);
 assert.ok(interview.evidence.includes(interview.cardName));
 assert.ok(interview.evidence.includes('강점'));
 assert.ok(!outcome.action.includes('합격 확정'));
 assert.equal(resolveQuestionFocus('job','','change',picks).source,'situation');
 assert.equal(resolveQuestionFocus('job','잘될까요?','',picks),null);
 assert.equal(resolveQuestionFocus('job','면접','change',picks).source,'question');
 assert.equal(resolveQuestionFocus('job','<img src=x onerror=alert(1)>','',picks),null);
});
test('all question-enabled readings have focused interpretations and daily card stays unchanged',async()=>{
 const examples={
  love:'썸에서 고백해도 될까요?',reunion:'다시 연락하고 싶어요',
  breakup:'이별을 고민해요',feelings:'상대가 왜 답장을 안 할까요?',
  contact:'언제 연락이 올까요?','reunion-timing':'재회 시기가 궁금해요',
  'yes-no':'이직을 시작할까요?',job:'면접 준비를 도와줘',
  money:'생활비 지출이 걱정돼요',work:'상사와 갈등이 있어요',
  study:'시험 점수가 고민이에요'
 };
 for(const [slug,r] of Object.entries(readings)){
  const picks=r.positions.map((_,i)=>({id:cards[i+1].id,reversed:i%2===1}));
  const focus=resolveQuestionFocus(slug,examples[slug]||'', '',picks);
  if(slug==='today'){assert.equal(focus,null);continue;}
  assert.ok(focus,`missing focus for ${slug}`);
  assert.ok(focus.action.length>20);
  assert.ok(focus.evidence.includes(focus.cardName));
  assert.ok(focus.index<picks.length);
  assert.ok(!focus.action.includes(examples[slug]));
 }
 const built=await readFile('dist/src/app.mjs','utf8');
 const focusModule=await readFile('dist/src/question-focus.mjs','utf8');
 assert.ok(built.includes('resolveQuestionFocus(slug,question,situation,selected)'));
 assert.ok(built.includes('question-focus-next'));
 assert.ok(focusModule.includes('function resolveQuestionFocus'));
 assert.ok(!built.includes("track('question_text'"));
});
test('popular relationship readings compare distinct card positions by question type',()=>{
 const love=['major-1','major-8','cups-2','swords-8','major-17'].map((id,i)=>({id,reversed:i%2===1}));
 const reunion=love;
 const feelings=love.slice(0,4);
 const cases=[
  ['love','새 인연이 찾아올까요?','solo',love,'new',2,3],
  ['love','썸인 그 사람에게 고백해도 될까요?','crush',love,'crush',1,2],
  ['love','남자친구와 다툼이 반복돼요','relationship',love,'conflict',3,4],
  ['reunion','그 사람한테 연락이 올까요?','recent',reunion,'reconnect',3,2],
  ['reunion','재회는 언제 할 수 있을까요?','mid',reunion,'timing',4,2],
  ['reunion','헤어진 이유가 해결될 수 있을까요?','long',reunion,'repair',2,4],
  ['reunion','다시 만날 수 있을까요?','long',reunion,'return',4,2],
  ['feelings','전남친에게 미련이 남았을까요?','ex',feelings,'past',1,3],
  ['feelings','갑자기 차가워졌어요','relationship',feelings,'distance',2,3],
  ['feelings','왜 답장을 하지 않을까요?','crush',feelings,'messages',0,2],
  ['feelings','나를 좋아할까요?','crush',feelings,'interest',1,0],
  ['feelings','그 사람 속마음이 궁금해요','relationship',feelings,'uncertainty',2,0]
 ];
 for(const [slug,question,situation,picks,key,index,other] of cases){
  const result=resolveQuestionFocus(slug,question,situation,picks);
  assert.ok(result,`${slug}: ${question}`);
  assert.equal(result.key,key);
  assert.equal(result.index,index);
  assert.equal(result.source,'question');
  assert.equal(result.cardName,cards.find(c=>c.id===picks[index].id).koreanName);
  assert.ok(result.counterpoint?.includes(cards.find(c=>c.id===picks[other].id).koreanName));
  assert.ok(result.counterpoint?.includes(readings[slug].positions[other].label));
  assert.ok(result.evidence.includes(readings[slug].positions[index].label));
  assert.ok(!result.counterpoint.includes('확정된'));
  assert.ok(result.action.length>15);
 }
 assert.notEqual(resolveQuestionFocus('reunion','연락이 올까요?','',reunion).counterpoint,
                 resolveQuestionFocus('reunion','헤어진 이유를 알고 싶어요','',reunion).counterpoint);
});
test('relationship context fallback is opt-in, local and outcome-neutral',()=>{
 const picks=['major-1','major-8','cups-2','swords-8','major-17'].map(id=>({id,reversed:false}));
 const situations={love:['solo','crush','relationship'],reunion:['recent','mid','long'],feelings:['crush','relationship','ex']};
 for(const [slug,values] of Object.entries(situations)){
  for(const value of values){
   const result=resolveQuestionFocus(slug,'',value,picks);
   assert.equal(result.source,'situation',`${slug}/${value}`);
   assert.ok(result.counterpoint);
   assert.ok(result.description);
   assert.ok(!/100%|확정|반드시 재회|진짜 속마음은/.test(result.action));
  }
  assert.equal(resolveQuestionFocus(slug,'잘될까요?','',picks),null);
 }
 assert.equal(resolveQuestionFocus('today','', 'crush',picks),null);
 assert.equal(resolveQuestionFocus('reunion','<script>alert(1)</script>','',picks),null);
 const first=resolveQuestionFocus('feelings','답장이 없어요','crush',picks);
 const second=resolveQuestionFocus('feelings','답장이 없어요','crush',picks);
 assert.deepEqual(first,second);
});
test('natural Korean intent corpus avoids misleading relationship classifications',()=>{
 const samples={
  love:[
   ['새 인연이 찾아올까요?','new'],['소개팅 이후 만날 사람이 궁금해요','new'],
   ['연애할 수 있을까요?','new'],['연애가 시작될까 불안해요','new'],
   ['썸인 그 사람에게 고백해도 될까요?','crush'],['남자친구와 싸웠어요','conflict'],
   ['남친과 다툼이 반복돼요','conflict'],['남자친구와 소원해졌어요','conflict'],
   ['연애 중인데 헤어질까요?','relationship'],['사랑이 이루어질까요?',null]
  ],
  reunion:[
   ['재회는 언제 할 수 있을까요?','timing'],['그 사람과 언제 다시 만날까요?','timing'],
   ['전남친이 언제 연락할까요?','reconnect'],['연락 차단당했는데 재회할 수 있나요?','reconnect'],
   ['헤어진 이유가 해결될 수 있을까요?','repair'],['다시 만날 수 있을까요?','return'],
   ['재회하지 말아야 할까요?','boundaries'],['다시 만나고 싶지 않은데 어떡하죠?','boundaries'],
   ['그 사람과 연락하고 싶지 않아요','boundaries'],['언제 헤어진 게 맞는 선택인지 알까요?',null]
  ],
  feelings:[
   ['전남친이 아직 미련이 있나요?','past'],['나를 좋아할까요?','interest'],
   ['그 사람은 날 어떻게 생각할까요?','interest'],['그 사람은 나를 어떻게 생각할까요?','interest'],
   ['갑자기 차가워졌어요','distance'],['상대가 갑자기 좋아졌어요','interest'],
   ['지하철 거리에서 마주쳤는데 날 좋아할까요?','interest'],
   ['왜 답장을 하지 않을까요?','messages'],['그 사람이 날 피하는 것 같아요','distance'],
   ['상대방의 속마음이 궁금해요','uncertainty']
  ]
 };
 for(const [slug,cases] of Object.entries(samples)){
  const picks=readings[slug].positions.map((_,i)=>({id:cards[[1,8,26,37,17][i]].id,reversed:i%2===1}));
  for(const [question,expected] of cases){
   const focus=resolveQuestionFocus(slug,question,'',picks);
   assert.equal(focus?.key??null,expected,`${slug} incorrectly read "${question}"`);
   if(focus){
    assert.equal(focus.source,'question');
    assert.ok(focus.evidence.includes(focus.cardName));
    assert.ok(focus.counterpoint?.includes('함께 읽어볼 수 있어요'));
    assert.ok(!/undefined|null|NaN/.test([focus.evidence,focus.counterpoint,focus.action].join(' ')));
   }
  }
 }
});
test('same spread yields genuinely different focuses without losing card orientation',()=>{
 const picks=['major-6','major-9','cups-2','swords-8','major-17'].map((id,i)=>({id,reversed:i%2===0}));
 const situations={
  reunion:['그 사람에게 연락이 올까요?','재회는 언제쯤?','다시 만나고 싶지 않아요','헤어진 원인을 돌아보고 싶어요'],
  love:['새 인연을 만나고 싶어요','썸남에게 고백해도 될까요?','남자친구와 싸웠어요'],
  feelings:['상대가 나를 좋아할까요?','갑자기 차가워졌어요','답장이 오지 않아요','전남친이 아직 미련이 있을까요?']
 };
 for(const [slug,questions] of Object.entries(situations)){
  const arr=picks.slice(0,readings[slug].positions.length);
  const focuses=questions.map(q=>resolveQuestionFocus(slug,q,'',arr));
  assert.equal(new Set(focuses.map(f=>f?.key)).size,questions.length);
  assert.equal(new Set(focuses.map(f=>f?.description)).size,questions.length);
  assert.ok(focuses.every(f=>f&&f.counterpoint&&f.action.length>15));
  for(const focus of focuses){
   const dir=arr[focus.index].reversed?'역방향':'정방향';
   assert.ok(focus.evidence.includes(dir));
   assert.ok(focus.counterpoint.includes('카드가'));
  }
 }
});
test('relationship focus stays readable across the full deck and both directions',()=>{
 for(const slug of ['love','reunion','feelings']){
  for(const reversed of [false,true]){
   for(let i=0;i<cards.length;i++){
    const picks=readings[slug].positions.map((_,j)=>({id:cards[(i+j)%cards.length].id,reversed:j===0?reversed:!reversed}));
    const question={love:'연애 중에 갈등이 생겼어요',reunion:'다시 만날 수 있을까요?',feelings:'그 사람은 날 어떻게 생각할까요?'}[slug];
    const focus=resolveQuestionFocus(slug,question,'',picks);
    assert.ok(focus?.evidence.includes('카드가'),slug);
    assert.ok(focus.counterpoint.includes('카드가'),slug);
    assert.ok(!focus.evidence.includes('undefined'),slug);
    assert.ok(!focus.counterpoint.includes('undefined'),slug);
   }
  }
 }
});
test('explicit refusal to reunite stays respected across final result, even for upbeat cards',()=>{
 const picks=['major-19','cups-2','major-6','wands-8','major-17'].map(id=>({id,reversed:false}));
 for(const question of ['다시 만나고 싶지 않아요','재회하지 말아야 할까요?','그 사람과 연락하고 싶지 않아요']){
  const focus=resolveQuestionFocus('reunion',question,'recent',picks);
  assert.equal(focus.key,'boundaries');
  const original={
   headline:readingHeadline('reunion',picks,'recent'),
   timing:timingInsight('reunion',picks),
   action:nextAction('reunion',picks,'recent'),
   combinations:combinationInsights('reunion',picks),
   summaryLines:synthesis('reunion',picks)
  };
  const revised=reconcileQuestionReading('reunion',focus,picks,original);
  assert.equal(revised.timing,null);
  assert.deepEqual(revised.combinations,[]);
  assert.ok(revised.headline.includes('원하는 거리와 선택'));
  assert.ok(!revised.headline.includes('재회 가능성은 닫혀'));
  assert.ok(revised.action.includes('재접촉을 의무로 여기지'));
  assert.ok(revised.summaryLines[0].includes('다시 만나야 할 이유나 의무'));
  assert.ok(revised.summaryLines[1].includes('재회를 막고 있는 요소'));
  assert.ok(revised.summaryLines[2].includes('앞으로의 관계 흐름'));
  assert.ok(revised.summaryLines.every(line=>!line.includes('재회 가능성은 닫혀')));
  assert.equal(original.timing!==null,true);
 }
 for(const slug of ['reunion','love','feelings']){
  const result={headline:'그대로',timing:{range:'1~3개월'},action:'원래 조언',combinations:[1],summaryLines:['그대로']};
  assert.equal(reconcileQuestionReading(slug,null,picks,result),result);
  if(slug==='reunion')assert.equal(reconcileQuestionReading(slug,{key:'return'},picks,result),result);
 }
});
test('Deep Reading offer is visible only as a safe pre-checkout product',async()=>{
 const [app,css,build]=await Promise.all([
  readFile('dist/src/app.mjs','utf8'),
  readFile('dist/style.css','utf8'),
  readFile('dist/deep-reading/index.html','utf8')
 ]);
 assert.ok(app.includes("track('deep_reading_interest'"));
 assert.ok(app.includes('심층 리딩 열기'));
 assert.ok(app.includes('checkoutReady'));
 assert.ok(css.includes('.deep-reading-offer{'));
 assert.ok(build.includes('심층 리딩'));
 assert.ok(build.includes('4,900원'));
 assert.ok(build.includes('결제 연결 준비 중'));
 assert.ok(!build.includes('결제 완료'));
});

test('timing and GA4 copy remain consistent and include no raw question tracking',async()=>{
 const [app,css,guide,timingPage,jobPage,privacyPage,home]=await Promise.all([
  readFile('dist/src/app.mjs','utf8'),readFile('dist/style.css','utf8'),
  readFile('dist/guide/index.html','utf8'),readFile('dist/tarot/reunion-timing/index.html','utf8'),
  readFile('dist/tarot/job/index.html','utf8'),readFile('dist/privacy/index.html','utf8'),
  readFile('dist/index.html','utf8')
 ]);
 assert.ok(app.includes('reconcileQuestionReading(slug,questionFocus,selected,baseReading)'));
 assert.ok(app.includes('relatedSlugs=boundaryReading?'));
 assert.ok(app.includes("contextNote=slug==='today'||boundaryReading?null:"));
 assert.ok(app.includes('class="timing-disclaimer"'));
 assert.ok(css.includes('.timing-disclaimer{'));
 assert.ok(css.includes('@media(max-width:650px)'));
 assert.ok(timingPage.includes('상징적 구간'));
 assert.ok(timingPage.includes('재회 날짜나 기다려야 하는 기한'));
 assert.ok(home.includes('G-SW0DQ32ER2'));
 assert.ok(jobPage.includes('G-SW0DQ32ER2'));
 assert.ok(privacyPage.includes('Google Analytics 4'));
 for(const event of ['reading_start','card_selection_complete','result_view','save_reading','share_result','related_reading_click'])assert.ok(app.includes("track('"+event+"'"));
 assert.ok(app.includes('has_question:Boolean(question)'));
 assert.ok(!app.includes("question_text:question"));
 assert.ok(!app.includes("query:question"));
});
test('shuffle produces unique complete deck with independent orientation',()=>{for(let i=0;i<200;i++){const d=shuffleDeck();assert.equal(new Set(d.map(c=>c.id)).size,78);assert.ok(d.every(c=>typeof c.reversed==='boolean'));}});
test('unbiased sampling rejects overflow range',()=>{let calls=0;assert.equal(randomInt(22,{getRandomValues(a){a[0]=calls++===0?4294967295:23;}}),1);assert.equal(calls,2);});
test('daily card survives reload, expires next day, rejects corrupt storage',()=>{let value=null;const s={getItem:()=>value,setItem:(_,v)=>value=v},c={id:'major-17',reversed:true};assert.equal(saveDaily(s,c,'2026-10-04'),true);assert.deepEqual(loadDaily(s,'2026-10-04'),c);assert.equal(loadDaily(s,'2026-10-05'),null);value='bad JSON';assert.equal(loadDaily(s),null);value=JSON.stringify({date:dateKey(),card:{id:'bad',reversed:true}});assert.equal(loadDaily(s),null);assert.equal(saveDaily(null,c),false);});
test('the same Star card has distinct reunion feelings vs breakup turning point',()=>{assert.notEqual(interpret('reunion',{id:'major-17',reversed:false},1).context,interpret('breakup',{id:'major-17',reversed:false},3).context);});
test('Deep Reading premium layer produces a richer deterministic report for relationship readings',()=>{
 assert.equal(deepReadingOffer.price,4900);
 assert.equal(deepReadingOffer.checkoutReady,false);
 for(const slug of ['love','reunion','feelings','breakup'])assert.equal(supportsDeepReading(slug),true);
 for(const slug of ['job','money','work','study','today'])assert.equal(supportsDeepReading(slug),false);
 const scenarios={
  love:{situation:'crush',question:'이 관계가 실제로 이어질까요?'},
  reunion:{situation:'mid',question:'다시 만날 수 있을까요?'},
  feelings:{situation:'crush',question:'그 사람이 나를 좋아할까요?'},
  breakup:{situation:'post',question:'헤어진 뒤 이 관계를 어떻게 정리해야 할까요?'}
 };
 for(const [slug,input] of Object.entries(scenarios)){
  const picks=readings[slug].positions.map((_,i)=>({id:['major-19','major-6','swords-8','cups-2','major-17'][i],reversed:i===2}));
  const report=createDeepReading({slug,picks,...input});
  assert.equal(report.product,'deep-reading');
  assert.equal(report.readingName,readings[slug].name);
  assert.ok(report.decisiveSummary.length>30);
  assert.ok(report.evidence.length>=1);
  assert.equal(report.closing.length,3);
  assert.ok(report.actions.length>=1);
  assert.ok(report.realityChecks.length>=3);
  assert.ok(!/undefined|NaN/.test(JSON.stringify(report)));
 }
});

test('post-breakup context gets its own headline insight and next action',()=>{
 const picks=readings.breakup.positions.map((_,i)=>({id:['major-13','cups-5','major-17','swords-6','major-21'][i],reversed:false}));
 const option=readingContexts.breakup.options.find(([key])=>key==='post');
 assert.deepEqual(option,['post','이별 후']);
 const note=contextualInsight('breakup','post',picks);
 assert.equal(note?.label,'이별 후');
 assert.match(note?.text,/이별|감정|회복|정리/);
 const headline=readingHeadline('breakup',picks,'post');
 assert.ok(headline&&headline.length>30);
 assert.match(headline,/이별|정리|회복|기준/);
 const action=nextAction('breakup',picks,'post');
 assert.ok(action&&action.length>30);
 assert.match(action,/이별|일상|회복|기준|거리/);
 const considering=readingHeadline('breakup',picks,'considering');
 assert.notEqual(headline,considering);
});
test('generated Korean copy chooses particles from the final Hangul syllable',async()=>{
 assert.equal(josa('상실 · 애도','object'),'를');
 assert.equal(josa('끌림과 호기심','object'),'을');
 assert.equal(josa('서로에게 필요한 거리','object'),'를');
 assert.equal(josa('권태','quote'),'라는');
 assert.equal(josa('상실','quote'),'이라는');
 assert.equal(josa('유대','and'),'와');
 assert.equal(josa('상실','and'),'과');
 assert.equal(josa('권태','subject'),'가');
 assert.equal(josa('상실','subject'),'이');
 assert.equal(josa('거리','copula'),'예요');
 assert.equal(josa('과정','copula'),'이에요');
 const communicationPicks=readings.job.positions.map(()=>({id:'cups-2',reversed:false}));
 assert.ok(synthesis('job',communicationPicks)[1].includes('‘말을 주고받을 여지’를 먼저'));
 const app=await readFile('dist/src/app.mjs','utf8'),engine=await readFile('dist/src/engine.mjs','utf8');
 assert.ok(app.includes("josa(keywordPhrase,'object')"));
 assert.ok(!app.includes("keywordPhrase==='상실 · 애도'"));
 assert.ok(engine.includes("josa(themes[focusTag],'object')"));
 assert.ok(engine.includes("josa(condition,'copula')"));
 assert.ok(engine.includes(' 카드가 속도를 올리는 반면 '));
});

test('priority readings provide a clear headline and concrete situation example',()=>{for(const slug of ['love','reunion','job','money','work','study']){const r=readings[slug],picks=r.positions.map((_,i)=>({id:['major-19','major-1','major-7','major-3','major-10'][i%5],reversed:false}));const headline=readingHeadline(slug,picks);assert.ok(headline&&headline.length>20);for(let i=0;i<r.positions.length;i++){const example=situationExample(slug,picks[i],i);assert.ok(example&&example.length>20);}}});
test('priority readings provide timing ranges and a concrete next action',()=>{for(const slug of ['love','reunion','job','money','work','study']){const r=readings[slug],picks=r.positions.map((_,i)=>({id:['major-19','major-1','major-7','major-3','major-10'][i%5],reversed:false}));const timing=timingInsight(slug,picks),action=nextAction(slug,picks);assert.ok(timing&&timing.range&&timing.text.length>20);assert.ok(action&&action.length>20);}for(const slug of ['contact','reunion-timing']){const r=readings[slug],picks=r.positions.map((_,i)=>({id:['major-19','major-1','major-7'][i],reversed:false}));const timing=timingInsight(slug,picks);assert.ok(timing&&timing.range&&timing.text.length>20);}});
test('timing uses individual card speed as well as semantic tags',()=>{
 const fast=timingInsight('contact',[{id:'wands-8',reversed:false},{id:'major-7',reversed:false},{id:'major-1',reversed:false}]);
 const slow=timingInsight('contact',[{id:'pentacles-7',reversed:true},{id:'major-12',reversed:false},{id:'major-9',reversed:false}]);
 assert.ok(fast.score>slow.score);assert.ok(fast.basis.length>20);assert.ok(slow.basis.length>20);
});
test('optional situation context changes interpretation without being required',()=>{
 for(const [slug,config] of Object.entries(readingContexts)){const picks=readings[slug].positions.map((_,i)=>({id:['major-19','major-1','major-7','major-12','major-17'][i%5],reversed:false}));const note=contextualInsight(slug,config.options[0][0],picks);assert.ok(note?.label);assert.ok(note?.text.length>25);assert.equal(contextualInsight(slug,'',picks),null);}
});
test('card combination engine reads exact and semantic pairs with position context',()=>{const exact=combinationInsights('reunion',[{id:'major-6',reversed:false},{id:'major-15',reversed:false},{id:'major-17',reversed:false},{id:'cups-2',reversed:false},{id:'major-20',reversed:false}]);assert.ok(exact.length>=1);assert.ok(exact[0].title.includes('연인')&&exact[0].title.includes('악마'));assert.ok(exact[0].text.includes(readings.reunion.positions[0].label));const semantic=combinationInsights('job',[{id:'wands-1',reversed:false},{id:'swords-5',reversed:false},{id:'pentacles-1',reversed:false},{id:'major-10',reversed:false}]);assert.ok(semantic.length>=1);assert.ok(semantic.some(x=>x.text.includes('실제')||x.text.includes('조건')||x.text.includes('행동')));assert.deepEqual(combinationInsights('today',[{id:'major-6',reversed:false},{id:'major-15',reversed:false}]),[]);});
test('job examples vary by spread position even when semantic tag repeats',()=>{
 const pick={id:'major-1',reversed:false};
 const examples=readings.job.positions.map((_,i)=>situationExample('job',pick,i));
 assert.equal(new Set(examples).size,readings.job.positions.length);
 assert.ok(examples.every(text=>text&&text.length>30));
});
test('feelings and yes-no results stay concrete and decisive',()=>{
 const feelingsPicks=readings.feelings.positions.map((_,i)=>({id:['major-6','cups-2','major-12','wands-8'][i],reversed:false}));
 const feelingsHeadline=readingHeadline('feelings',feelingsPicks),feelingsSummary=synthesis('feelings',feelingsPicks);
 assert.ok(feelingsHeadline&&feelingsHeadline.length>20);
 assert.ok(feelingsSummary[0].startsWith('결론부터 말하면'));
 assert.ok(feelingsSummary[0].includes('상징'));
 assert.ok(!feelingsSummary[0].includes('상대는 호감'));
 assert.ok(!feelingsHeadline.includes('지금 상대는 호감'));
 assert.ok(situationExample('feelings',feelingsPicks[0],0)?.length>20);
 const yesPicks=[{id:'major-19',reversed:false},{id:'major-1',reversed:false},{id:'pentacles-1',reversed:false}];
 const yesSummary=synthesis('yes-no',yesPicks);
 assert.ok(yesSummary[0].includes('해보는 쪽'));
 assert.ok(yesSummary[1].includes('카드별로 보면'));
 assert.ok(situationExample('yes-no',yesPicks[0],0)?.length>20);
});
test('saved reading archive preserves question-specific interpretation safely',async()=>{
 const app=await readFile('dist/src/app.mjs','utf8');
 const privacy=await readFile('dist/privacy/index.html','utf8');
 const job=await readFile('dist/tarot/job/index.html','utf8');
 const css=await readFile('dist/style.css','utf8');
 assert.ok(app.includes('questionFocus:questionFocus?{label:questionFocus.label'));
 assert.ok(app.includes('class="saved-focus-details"'));
 assert.ok(app.includes('class="saved-focus-body"'));
 assert.ok(app.includes('esc(item.questionFocus.description)'));
 assert.ok(app.includes('esc(item.questionFocus.evidence)'));
 assert.ok(app.includes('esc(item.questionFocus.counterpoint)'));
 assert.ok(app.includes('esc(item.questionFocus.action)'));
 assert.ok(css.includes('.saved-focus-details summary:focus-visible'));
 assert.ok(job.includes('질문은 자동 저장되거나 외부로 전송되지 않아요.'));
 assert.ok(job.includes('‘이 리딩 저장’을 누르면 이 브라우저에 함께 저장돼요.'));
 assert.ok(privacy.includes('직접 ‘이 리딩 저장’을 누르지 않으면'));
 assert.ok(!privacy.includes('질문은 브라우저 메모리에서만 사용되며 새로고침하거나'));
 const focus=resolveQuestionFocus('reunion','다시 만날 수 있을까요?','recent',
  readings.reunion.positions.map((_,i)=>({id:cards[i+2].id,reversed:i%2===0})));
 let value=null;
 const memory={getItem:()=>value,setItem:(_,v)=>{value=v},removeItem:()=>{value=null}};
 const record={id:'focus-check',slug:'reunion',question:'다시 만날 수 있을까요?',cards:[{id:cards[1].id,reversed:false}],questionFocus:{label:focus.label,description:focus.description,evidence:focus.evidence,counterpoint:focus.counterpoint,action:focus.action}};
 assert.equal(saveReadingRecord(memory,record),true);
 assert.deepEqual(loadSavedReadings(memory)[0].questionFocus,record.questionFocus);
 assert.equal(clearSavedReadings(memory),true);
 assert.equal(loadSavedReadings(memory).length,0);
});
test('saved readings stay local, capped, removable and clearable',()=>{
 let value=null;const storage={getItem:()=>value,setItem:(_,v)=>value=v,removeItem:()=>value=null};
 for(let i=0;i<12;i++)assert.equal(saveReadingRecord(storage,{id:'r'+i,slug:'love',cards:[{id:'major-6',reversed:false}],savedAt:'2026-10-05T00:00:00Z'}),true);
 assert.equal(loadSavedReadings(storage).length,10);
 assert.equal(loadSavedReadings(storage)[0].id,'r11');
 assert.equal(removeSavedReading(storage,'r11'),true);assert.equal(loadSavedReadings(storage)[0].id,'r10');
 assert.equal(clearSavedReadings(storage),true);assert.deepEqual(loadSavedReadings(storage),[]);
});
test('mixed directions do not present decisive yes/no',()=>{assert.equal(verdict([{id:'major-19',reversed:false},{id:'major-16',reversed:false}]),'조금 더 지켜볼 필요가 있음');assert.equal(verdict([{id:'major-19',reversed:false}]),'YES에 가까움');assert.equal(verdict([{id:'major-16',reversed:false}]),'NO에 가까움');});
test('result copy omits success-probability hedge and uses spaced action colon',async()=>{
 const app=await readFile('dist/src/app.mjs','utf8'),engine=await readFile('dist/src/engine.mjs','utf8');
 assert.ok(!app.includes('정답이나 성공 확률이 아닙니다.'));
 assert.ok(!engine.includes('정답이나 성공 확률이 아닙니다.'));
 assert.ok(engine.includes('지금 할 일은 이거예요 : '));
 assert.ok(!engine.includes('지금 할 일은 이거예요: '));
});
test('share image uses a featured card, the full drawn spread, and desktop PNG download path',async()=>{
 const app=await readFile('dist/src/app.mjs','utf8');
 const shareBlock=app.slice(app.indexOf('async function createShareImage'),app.indexOf('async function shareReadingImage'));
 assert.ok(shareBlock.includes('CORE CARD'));
 assert.ok(shareBlock.includes('keyCardIndex'));
 assert.ok(shareBlock.includes('canvas.width=720'));
 assert.ok(shareBlock.includes('canvas.height=690'));
 assert.ok(shareBlock.includes('chosen.forEach'));
 assert.ok(!shareBlock.includes("ctx.strokeStyle='#f0dfdc'"));
 assert.ok(!shareBlock.includes("roundedRect(ctx,36,36"));
 assert.ok(!shareBlock.includes('이번 리딩의 핵심'));
 assert.ok(!shareBlock.includes('시기 흐름'));
 assert.ok(!shareBlock.includes('지금 할 일'));
 assert.ok(!shareBlock.includes('pickacard.everytinytool.com'));
 assert.ok(app.includes("a.download='pick-a-card-reading.png'"));
 assert.ok(app.includes("isPhoneShareTarget()?'결과 이미지 공유':'결과 PNG 저장'"));
 assert.ok(app.includes('phone&&typeof File'));
});
test('visible Korean labels place a space before colons',async()=>{
 const files=['dist/src/app.mjs','dist/src/engine.mjs','dist/src/data/readings.mjs'];
 for(const path of files){const source=await readFile(path,'utf8');assert.ok(!/[가-힣]:/.test(source),path);}
 assert.ok((await readFile('dist/src/engine.mjs','utf8')).includes('지금은 이 부분을 먼저 보세요 : '));
});
test('yes-no page avoids vague hedge copy in visible result language',async()=>{
 const html=await readFile('dist/tarot/yes-no/index.html','utf8');
 assert.ok(!html.includes('원하는 답과 이 상징의 차이를 생각해보세요.'));
 const app=await readFile('dist/src/app.mjs','utf8');
 assert.ok(!app.includes('아래 카드의 상징과 방향을 종합한 참고 메시지입니다.'));
 assert.ok(app.includes('YES / 보류 / NO 중 하나로 정리했어요.'));
});
test('major and minor guide cards show full artwork without cover cropping',async()=>{
 const css=await readFile('dist/style.css','utf8');
 assert.ok(css.includes('.suit-visual img{'));
 assert.ok(css.includes('aspect-ratio:auto;'));
 assert.ok(css.includes('object-fit:contain;'));
 assert.ok(css.includes('height:auto;'));
});
test('reversed guide card keeps an exact centered 180 degree hover',async()=>{
 const css=await readFile('dist/style.css','utf8');
 assert.ok(css.includes('transform-origin:50% 50%;'));
 assert.ok(css.includes('transform-box:border-box;'));
 assert.ok(css.includes('transform:translateY(-3px) rotate(180deg);'));
 assert.ok(!css.includes('transform:translateY(-3px) rotate(179.2deg);'));
});
test('primary hover stays burgundy and related links avoid uneven row fills',async()=>{
 const css=await readFile('dist/style.css','utf8');
 assert.ok(css.includes('.button.primary:not(:disabled):hover{\n    background:#562130;'));
 assert.ok(css.includes('.related a:hover{\n    background:transparent;'));
 assert.ok(css.includes('.related a:hover .related-icon'));
});
test('navigation and grid items use longer staggered entrance motion',async()=>{
 const app=await readFile('dist/src/app.mjs','utf8');
 assert.ok(app.includes("Math.min(siblingIndex,9)*115"));
 assert.ok(app.includes("'.card-library-tile'")||app.includes("'.card-library-tile',"));
 const css=await readFile('dist/style.css','utf8');
 assert.ok(css.includes('@keyframes navContentIn'));
 assert.ok(css.includes('header nav a:nth-child(5)'));
 assert.ok(css.includes('transition:opacity 1.08s'));
 assert.ok(css.includes('animation:heroContentIn 1.02s'));
});
test('hero content uses slower entrance motion and paired about cards are lowered together',async()=>{
 const css=await readFile('dist/style.css','utf8');
 assert.ok(css.includes('@keyframes heroContentIn'));
 assert.ok(css.includes('animation:heroContentIn 1.02s'));
 assert.ok(css.includes('transition:opacity 1.08s'));
 assert.ok(css.includes('top:-7px;'));
 assert.ok(css.includes('bottom:14px;'));
});
test('question panel overlays the table and flying cards keep fixed typography and size',async()=>{
 const love=await readFile('dist/tarot/love/index.html','utf8');
 assert.ok(love.includes('class="question-session-stage"'));
 assert.ok(love.includes('class="question-table-preview"'));
 assert.ok(love.includes('class="question-modal-layer"'));
 assert.ok(love.includes('class="question-panel question-modal-panel"'));
 const app=await readFile('dist/src/app.mjs','utf8');
 assert.ok(app.includes("stage.classList.add('is-opening')"));
 assert.ok(app.includes('width:`${to.width}px`'));
 assert.ok(app.includes("transform:'translate3d(0,0,0)'"));
 assert.ok(!app.includes('scale(${sx},${sy})'));
 const css=await readFile('dist/style.css','utf8');
 assert.ok(css.includes('.question-session-stage{'));
 assert.ok(css.includes('.question-session-stage.is-opening .question-modal-layer'));
 assert.ok(css.includes('.question-session-stage.is-opening .question-table-preview'));
 assert.ok(css.includes('.table-flying-card .mini-card strong'));
});
test('compact sticky spread becomes a one-line text rail and question preview has three card rows',async()=>{
 const app=await readFile('dist/src/app.mjs','utf8');
 assert.ok(app.includes('class="session-card-name"'));
 const css=await readFile('dist/style.css','utf8');
 assert.ok(css.includes('/* Compact sticky spread v2 — text-only rail while stuck. */'));
 assert.ok(css.includes('.session-spread-shell.is-stuck:not(.is-expanded) .session-position'));
 assert.ok(css.includes('.session-spread-shell.is-stuck:not(.is-expanded) .summary-item .mini-card'));
 assert.ok(css.includes('.session-spread-shell.is-stuck:not(.is-expanded) .session-card-name'));
 assert.ok(css.includes('grid-template-columns:repeat(13,minmax(0,1fr));'));
 const love=await readFile('dist/tarot/love/index.html','utf8');
 assert.equal((love.match(/class="preview-card"/g)||[]).length,39);
});
test('selection heading has breathing room and reading intro aligns to the session width',async()=>{
 const css=await readFile('dist/style.css','utf8');
 assert.ok(css.includes('.selection-heading .step-label{'));
 assert.ok(css.includes('margin-bottom:16px;'));
 assert.ok(css.includes('.reading-intro{\n  max-width:900px;'));
});
test('sticky result spread compacts, expands on demand and restores at its origin',async()=>{
 const app=await readFile('dist/src/app.mjs','utf8');
 assert.ok(app.includes('class="session-spread-anchor"'));
 assert.ok(app.includes('class="session-spread-toggle"'));
 assert.ok(app.includes("shell.classList.toggle('is-stuck',stuck)"));
 assert.ok(app.includes("shell.classList.toggle('is-expanded')"));
 assert.ok(app.includes("if(!stuck)shell.classList.remove('is-expanded')"));
 const css=await readFile('dist/style.css','utf8');
 assert.ok(css.includes('.session-spread-shell.is-stuck:not(.is-expanded)'));
 assert.ok(css.includes('.session-spread-shell.is-stuck .session-spread-toggle'));
 assert.ok(css.includes('padding-top:4px;'));
 assert.ok(css.includes('min-height:27px;'));
});
test('tarot table session keeps shuffle, draw placement and sticky spread continuous',async()=>{
 const app=await readFile('dist/src/app.mjs','utf8');
 assert.ok(app.includes('class="tarot-table" id="tarot-table"'));
 assert.ok(app.includes('id="shuffle-deck"'));
 assert.ok(app.includes('function placePickInSpread'));
 assert.ok(app.includes("deck=shuffleDeck();deckEl.innerHTML=deckButtonsHTML()"));
 assert.ok(app.includes('data-slot-index='));
 assert.ok(app.includes('function wireResultSession'));
 assert.ok(app.includes('data-summary-index='));
 assert.ok(app.includes('data-position-index='));
 const css=await readFile('dist/style.css','utf8');
 assert.ok(css.includes('.tarot-table-surface{'));
 assert.ok(css.includes('@keyframes tableShuffle'));
 assert.ok(css.includes('.table-flying-card{'));
 assert.ok(css.includes('.session-spread-shell{'));
 assert.ok(css.includes('position:sticky;'));
 assert.ok(css.includes('.reading-session-spread .summary-item.is-active'));
});
test('sitewide hover feedback and scroll reveal interactions are wired',async()=>{
 const app=await readFile('dist/src/app.mjs','utf8');
 assert.ok(app.includes('function prepareScrollReveal(scope=document)'));
 assert.ok(app.includes("new IntersectionObserver"));
 assert.ok(app.includes("new MutationObserver"));
 assert.ok(app.includes("classList.add('scroll-reveal')"));
 const css=await readFile('dist/style.css','utf8');
 assert.ok(css.includes('.scroll-reveal{'));
 assert.ok(css.includes('.scroll-reveal.is-visible'));
 assert.ok(css.includes('a[href]:not(.button):not(.reading-tile):not(.card-library-tile):hover'));
 assert.ok(css.includes('.button.secondary:not(:disabled):hover'));
 assert.ok(css.includes('.count-options label:hover span'));
 assert.ok(css.includes('.card-library-tile:hover'));
});
test('interaction layer keeps motion restrained and accessible',async()=>{
 const app=await readFile('dist/src/app.mjs','utf8');
 assert.ok(app.includes('function animateResultEntry()'));
 assert.ok(app.includes("prefers-reduced-motion: reduce"));
 assert.ok(app.includes("classList.add('results-entering')"));
 const css=await readFile('dist/style.css','utf8');
 assert.ok(css.includes('@keyframes pickedCard'));
 assert.ok(css.includes('@keyframes resultRise'));
 assert.ok(css.includes('@media(hover:hover) and (pointer:fine)'));
 assert.ok(css.includes('@media(prefers-reduced-motion:reduce)'));
});
test('hover refinement lifts home reading cards while keeping their tarot thumbnails still',async()=>{
 const css=await readFile('dist/style.css','utf8');
 assert.ok(css.includes('.primary-grid .reading-tile:hover'));
 assert.ok(css.includes('.secondary-grid .reading-tile:hover'));
 assert.ok(css.includes('transform:translateY(-4px);'));
 assert.ok(css.includes('.primary-grid .reading-tile:hover .tile-card-thumb'));
 assert.ok(css.includes('.hero-deck .hero-card-sun:hover'));
 assert.ok(css.includes('.summary-item:hover .mini-card'));
 assert.ok(css.includes('.detail-card:hover .mini-card'));
 assert.ok(css.includes('.card-dictionary-art:hover'));
 assert.ok(css.includes('.orientation-visual figure:hover'));
});
test('saved readings use branded card artwork and readable card metadata',async()=>{
 const page=await readFile('dist/my-readings/index.html','utf8');
 assert.ok(page.includes('class="saved-empty-card"'));
 assert.ok(page.includes('/artwork/card-back.svg'));
 const app=await readFile('dist/src/app.mjs','utf8');
 assert.ok(app.includes('class="saved-reading-meta"'));
 assert.ok(app.includes("정방향 ${uprightCount} · 역방향 ${reversedCount}"));
 assert.ok(app.includes("pick.reversed?'역방향':'정방향'"));
});
test('today reading and selected guides use real tarot visuals',async()=>{
 const today=await readFile('dist/tarot/today/index.html','utf8');
 assert.ok(today.includes('class="daily-card-preview"'));
 assert.ok(today.includes('/artwork/card-back.svg'));
 assert.ok(today.includes('잠깐, 나에게 집중하는 시간.'));
 const upright=await readFile('dist/guide/upright-reversed/index.html','utf8');
 assert.ok(upright.includes('class="guide-visual orientation-visual"'));
 assert.ok(upright.includes('/artwork/sun-small.webp'));
 const major=await readFile('dist/guide/major-arcana/index.html','utf8');
 assert.ok(major.includes('class="guide-visual suit-visual"'));
 assert.ok(major.includes('/artwork/lovers-small.webp'));
 const minor=await readFile('dist/guide/minor-arcana/index.html','utf8');
 assert.ok(minor.includes('/artwork/wands-1-small.webp'));
 assert.ok(minor.includes('/artwork/pentacles-1-small.webp'));
 const questions=await readFile('dist/guide/better-questions/index.html','utf8');
 assert.ok(questions.includes('class="guide-visual question-comparison"'));
});
test('home about strip uses tarot artwork instead of emoji badges',async()=>{
 const home=await readFile('dist/index.html','utf8');
 const start=home.indexOf('<section class="about">'),end=home.indexOf('</section>',start);
 const about=home.slice(start,end);
 assert.ok(about.includes('/artwork/card-back.svg'));
 assert.ok(about.includes('/artwork/lovers-small.webp'));
 assert.ok(about.includes('/artwork/sun-small.webp'));
 assert.ok(!about.includes('🃏'));
 assert.ok(!about.includes('💗'));
 assert.ok(!about.includes('↕️'));
});
test('service hierarchy exposes cards, saved readings, branded favicon and dictionary search',async()=>{
 const home=await readFile('dist/index.html','utf8');
 assert.ok(home.includes('%23632b3b'));
 assert.ok(home.includes('%23ffffff'));
 assert.ok(home.includes('href=\"/cards/\"'));
 assert.ok(home.includes('href=\"/my-readings/\"'));
 const cardsPage=await readFile('dist/cards/index.html','utf8');
 assert.ok(cardsPage.includes('id="card-search"'));
 assert.ok(cardsPage.includes('class="card-library-tools"'));
 assert.ok(!cardsPage.includes('🔥'));
 assert.ok(!cardsPage.includes('💧'));
 assert.ok(!cardsPage.includes('🗡️'));
 assert.ok(!cardsPage.includes('🪙'));
 const app=await readFile('dist/src/app.mjs','utf8');
 assert.ok(app.includes("document.querySelector('#card-search')"));
 assert.ok(app.includes("aria-current"));
});
test('every SEO route has unique title, description, H1 and deep static content',async()=>{const titles=new Set(),descriptions=new Set();for(const slug of Object.keys(readings)){const html=await readFile(`dist/tarot/${slug}/index.html`,'utf8');titles.add(html.match(/<title>(.*?)<\/title>/)[1]);descriptions.add(html.match(/name="description" content="(.*?)"/)[1]);assert.equal((html.match(/<h1\b[^>]*>/g)||[]).length,1);assert.ok(html.includes('FAQPage'));assert.ok(html.includes(readings[slug].explanation));if(readingContexts[slug])assert.ok(html.includes('name="situation"'));assert.ok(html.includes('조금 더 깊게 읽기'));for(const [heading] of readingDepth[slug])assert.ok(html.includes(heading));}assert.equal(titles.size,Object.keys(readings).length);assert.equal(descriptions.size,Object.keys(readings).length);});
import {synthesis,readingSnapshot} from '../src/engine.mjs';
import {artwork} from '../src/card-view.mjs';
test('major IDs preserved; all four minor suits contain 14 unique ranks',()=>{assert.equal(new Set(cards.map(c=>c.id)).size,78);assert.equal(cards.filter(c=>c.arcana==='major').length,22);for(const suit of ['wands','cups','swords','pentacles']){const d=cards.filter(c=>c.suit===suit);assert.equal(d.length,14);assert.equal(new Set(d.map(c=>c.rank)).size,14);}});
test('same-topic positions and orientations change substantive interpretation',()=>{for(const c of cards){const p={id:c.id,reversed:false};assert.notEqual(interpret('reunion',p,0).context,interpret('reunion',p,2).context);assert.notEqual(interpret('feelings',p,0).context,interpret('feelings',p,1).context);assert.notEqual(interpret('reunion',p,0).context,interpret('reunion',{...p,reversed:true},0).context);}});
test('contact headlines and feelings actions have broad pools and react to selected context',()=>{
 const contactHeadlines=new Set(),feelingsActions=new Set();
 for(let i=0;i<cards.length;i++){
  const contactPicks=[0,17,31].map((offset,j)=>({id:cards[(i+offset)%cards.length].id,reversed:(i+j)%2===0}));
  const feelingPicks=[0,13,29,47].map((offset,j)=>({id:cards[(i+offset)%cards.length].id,reversed:(i+j)%3===0}));
  contactHeadlines.add(readingHeadline('contact',contactPicks));
  feelingsActions.add(nextAction('feelings',feelingPicks));
 }
 assert.ok(contactHeadlines.size>=8,`contact headline pool too small: ${contactHeadlines.size}`);
 assert.ok(feelingsActions.size>=8,`feelings action pool too small: ${feelingsActions.size}`);
 const contactSample=[{id:'cups-2',reversed:false},{id:'swords-8',reversed:true},{id:'wands-8',reversed:false}];
 assert.notEqual(readingHeadline('contact',contactSample,'recent'),readingHeadline('contact',contactSample,'long'));
 const feelingsSample=[{id:'cups-2',reversed:false},{id:'major-18',reversed:false},{id:'swords-8',reversed:true},{id:'wands-11',reversed:false}];
 assert.notEqual(nextAction('feelings',feelingsSample,'crush'),nextAction('feelings',feelingsSample,'ex'));
});
test('love reunion and job headlines plus synthesis openings vary by dominant card meaning',()=>{
 const semanticTags=['movement','communication','attraction','renewal','decision','healing','reflection','waiting','distance','closure','blocked','conflict'];
 const representative=new Map();
 for(const card of cards){
  for(const reversed of [false,true]){
   const tag=(reversed?card.reversedTags:card.tags)[0];
   if(semanticTags.includes(tag)&&!representative.has(tag))representative.set(tag,{id:card.id,reversed});
  }
 }
 assert.equal(representative.size,semanticTags.length);
 for(const slug of ['love','reunion','job']){
  const headlinePool=new Set(),openingPool=new Set(),count=readings[slug].positions.length;
  for(const tag of semanticTags){
   const pick=representative.get(tag),picks=Array.from({length:count},()=>({...pick}));
   headlinePool.add(readingHeadline(slug,picks));
   openingPool.add(synthesis(slug,picks)[0]);
  }
  assert.ok(headlinePool.size>=10,`${slug} headline pool too small: ${headlinePool.size}`);
  assert.ok(openingPool.size>=10,`${slug} synthesis opening pool too small: ${openingPool.size}`);
 }
 const feelingsOpenings=new Set();
 for(const tag of semanticTags){
  const pick=representative.get(tag),picks=Array.from({length:readings.feelings.positions.length},()=>({...pick}));
  feelingsOpenings.add(synthesis('feelings',picks)[0]);
 }
 assert.ok(feelingsOpenings.size>=10,`feelings synthesis opening pool too small: ${feelingsOpenings.size}`);
});
test('relationship synthesis never cites the same card as both dominant evidence and obstacle',()=>{
 for(const slug of ['reunion','contact','love','breakup','reunion-timing']){
  const count=readings[slug].positions.length;
  for(let i=0;i<300;i++){
   const line=synthesis(slug,shuffleDeck().slice(0,count))[1]||'';
   const match=line.match(/^왜 이렇게 읽었냐면 (.+?)에서 .* 자리의 (.+?)에서는 /);
   if(match)assert.notEqual(match[1],match[2],`${slug} duplicated ${match[1]}`);
  }
 }
});
test('synthesis responds to middle-position cards, not only endpoints',()=>{const a=[0,6,19,7,21].map(n=>({id:`major-${n}`,reversed:false}));const b=a.map(p=>({...p}));b[2]={id:'major-16',reversed:false};assert.notDeepEqual(synthesis('reunion',a),synthesis('reunion',b));assert.equal(readingSnapshot('reunion',a,'test').interpretations.length,5);});
test('78-card dictionary has one indexable detail page per card',async()=>{const hub=await readFile('dist/cards/index.html','utf8');assert.ok(hub.includes('타로 카드 78장 의미 사전'));const slugs=new Set();for(const card of cards){const slug=cardSlug(card);assert.ok(!slugs.has(slug));slugs.add(slug);const html=await readFile(`dist/cards/${slug}/index.html`,'utf8');assert.equal((html.match(/<h1\b[^>]*>/g)||[]).length,1);assert.ok(html.includes(card.koreanName));assert.ok(html.includes(card.name));assert.ok(html.includes(card.upright));assert.ok(html.includes(card.reversed));assert.ok(html.includes('/tarot/love/'));assert.ok(html.includes('/tarot/reunion/'));assert.ok(html.includes('현실적인 질문에서 읽으면'));assert.ok(html.includes('/tarot/job/'));assert.ok(html.includes('/tarot/money/'));assert.ok(html.includes('/tarot/study/'));}assert.equal(slugs.size,78);});
test('all 78 card pages explain both orientations in each of the ten situational readings',async()=>{
 for(const card of cards){
  const html=await readFile(`dist/cards/${cardSlug(card)}/index.html`,'utf8');
  assert.equal((html.match(/class="card-topic-reading card-topic-reading--upright"/g)||[]).length,10,card.name+' upright');
  assert.equal((html.match(/class="card-topic-reading card-topic-reading--reversed"/g)||[]).length,10,card.name+' reversed');
  assert.equal((html.match(/UPRIGHT · 정방향일 때/g)||[]).length,10);
  assert.equal((html.match(/REVERSED · 역방향일 때/g)||[]).length,10);
  assert.ok(!html.includes('<p>undefined</p>'),card.name);
  assert.ok(!html.includes('<p></p>'),card.name);
 }
 const magician=await readFile('dist/cards/the-magician/index.html','utf8');
 assert.ok(magician.includes('좋은 말과 실제 배려'));
 const moon=await readFile('dist/cards/the-moon/index.html','utf8');
 assert.ok(moon.includes('표현이 적다는 이유로 감정이 없다고 단정하지는 마세요'));
});
test('all internal static links and artwork files exist',async()=>{assert.equal(Object.keys(artwork).length,78);assert.ok(cards.every(c=>artwork[c.id]));const {readdir,stat}=await import('node:fs/promises');async function scan(dir){for(const item of await readdir(dir,{withFileTypes:true})){const p=`${dir}/${item.name}`;if(item.isDirectory())await scan(p);else if(item.name.endsWith('.html')){const html=await readFile(p,'utf8');for(const match of html.matchAll(/href="(\/[^"#]*)/g)){const link=match[1].split('?')[0];if(!link)continue;await stat(`dist${link}${link.endsWith('/')?'index.html':''}`);}}}}await scan('dist');for(const [id,file] of Object.entries(artwork)){assert.ok(cards.some(c=>c.id===id));await stat(`dist/artwork/${file}.webp`);await stat(`dist/artwork/${file}-small.webp`);}});
import {spreadSignals} from '../src/engine.mjs';
test('all spread positions and all semantic tags contribute',()=>{const picks=[0,6,16,18,19].map(n=>({id:`major-${n}`,reversed:true}));const profile=spreadSignals('reunion',picks);assert.equal(profile.positions.length,5);assert.equal(Object.values(profile.totals).reduce((a,b)=>a+b,0),15);for(let i=0;i<5;i++){const changed=picks.map(p=>({...p}));changed[i]={id:'cups-2',reversed:false};assert.notDeepEqual(spreadSignals('reunion',changed).totals,profile.totals);}});
test('random five-card draws actually cover all suits and court ranks',()=>{const seen=new Set();for(let i=0;i<500;i++){const draw=shuffleDeck().slice(0,5);assert.equal(new Set(draw.map(p=>p.id)).size,5);draw.forEach(p=>seen.add(p.id));}assert.equal(seen.size,78);for(const suit of ['wands','cups','swords','pentacles'])for(const n of [11,12,13,14])assert.ok(seen.has(`${suit}-${n}`));});
test('all indexable HTML pages have unique metadata and complete sitemap entries',async()=>{const {readdir}=await import('node:fs/promises');const sitemap=await readFile('dist/sitemap.xml','utf8');const titles=new Set(),descs=new Set(),canonical=new Set();let count=0;async function scan(dir){for(const f of await readdir(dir,{withFileTypes:true})){const path=`${dir}/${f.name}`;if(f.isDirectory())await scan(path);else if(f.name==='index.html'){const html=await readFile(path,'utf8');if(html.includes('name="robots" content="noindex"'))continue;const title=html.match(/<title>(.*?)<\/title>/)[1],desc=html.match(/name="description" content="(.*?)"/)[1],url=html.match(/rel="canonical" href="(.*?)"/)[1];assert.ok(!titles.has(title));assert.ok(!descs.has(desc));assert.ok(!canonical.has(url));titles.add(title);descs.add(desc);canonical.add(url);assert.equal((html.match(/<h1[^>]*>/g)||[]).length,1);assert.ok(sitemap.includes(`<loc>${url}</loc>`));count++;}}}await scan('dist');assert.equal(count,15+Object.keys(readings).length+cards.length);assert.equal((sitemap.match(/<loc>/g)||[]).length,count);assert.ok((await readFile('dist/robots.txt','utf8')).includes('Sitemap:'));});
test('merchant disclosure is visible on the initial page for payment review',async()=>{
 const home=await readFile('dist/index.html','utf8');
 for(const value of ['사업자 정보','지지마켓','329-59-00909','010-3071-6160','einimich@naver.com','통신판매업 신고','신고 면제 대상','GitHub, Inc. (GitHub Pages)'])assert.ok(home.includes(value),value);
 assert.ok(home.includes('href="/terms/"'));
 assert.ok(home.includes('href="/privacy/"'));
 assert.ok(home.includes('href="/refund/"'));
 assert.ok(home.includes('href="/deep-reading/"'));
});

test('review legal pages and product are discoverable from the site footer',async()=>{
 const [home,terms,privacy,refund,product,sitemap]=await Promise.all([
  readFile('dist/index.html','utf8'),
  readFile('dist/terms/index.html','utf8'),
  readFile('dist/privacy/index.html','utf8'),
  readFile('dist/refund/index.html','utf8'),
  readFile('dist/deep-reading/index.html','utf8'),
  readFile('dist/sitemap.xml','utf8')
 ]);
 for(const href of ['/deep-reading/','/terms/','/privacy/','/refund/'])assert.ok(home.includes(`href="${href}"`));
 assert.ok(terms.includes('<h1>이용약관</h1>'));
 assert.ok(privacy.includes('<h1>개인정보 안내</h1>'));
 assert.ok(refund.includes('<h1>환불 및 청약철회 안내</h1>'));
 assert.ok(product.includes('4,900원'));
 assert.ok(refund.includes('name="robots" content="noindex"'));
 assert.ok(!sitemap.includes('/refund/'));
 assert.ok(sitemap.includes('/terms/'));
 assert.ok(sitemap.includes('/deep-reading/'));
});

test('saved readings page is private and excluded from sitemap',async()=>{const html=await readFile('dist/my-readings/index.html','utf8'),sitemap=await readFile('dist/sitemap.xml','utf8');assert.ok(html.includes('name="robots" content="noindex"'));assert.ok(html.includes('data-saved-readings'));assert.ok(!sitemap.includes('/my-readings/'));assert.ok((await readFile('dist/privacy/index.html','utf8')).includes('최근 리딩 최대 10개'));});
test('service copy uses full deck while educational major count is retained',async()=>{for(const path of ['dist/index.html','dist/about/index.html']){const html=await readFile(path,'utf8');assert.ok(html.includes('78'));assert.ok(!html.includes('22장의 카드를 섞'));assert.ok(!html.includes('메이저 아르카나 22장의 상징으로'));}assert.ok((await readFile('dist/guide/major-arcana/index.html','utf8')).includes('22장의 메이저 아르카나'));});

test('Naver Search Advisor ownership verification appears in generated HTML head',async()=>{
 const home=await readFile('dist/index.html','utf8');
 assert.ok(home.includes('<meta name="naver-site-verification" content="5ef82d2c63cb89cc89cf9942d1b6ca83fb6b7348">'));
 assert.ok(home.indexOf('<meta name="naver-site-verification" content="5ef82d2c63cb89cc89cf9942d1b6ca83fb6b7348">')<home.indexOf('</head>'));
});

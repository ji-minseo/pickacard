import test from 'node:test';import assert from 'node:assert/strict';import {cards} from '../src/data/cards.mjs';import {readings} from '../src/data/readings.mjs';import {cardSlug} from '../src/data/card-directory.mjs';import {readingDepth} from '../src/data/reading-depth.mjs';import {readingContexts} from '../src/data/reading-contexts.mjs';import {loadSavedReadings,saveReadingRecord,removeSavedReading,clearSavedReadings} from '../src/saved-readings.mjs';import {shuffleDeck,randomInt,loadDaily,saveDaily,dateKey,interpret,verdict,readingHeadline,situationExample,timingInsight,nextAction,combinationInsights,contextualInsight} from '../src/engine.mjs';import {readFile} from 'node:fs/promises';
test('all 78 cards support every reading position and orientation',()=>{assert.equal(cards.length,78);for(const c of cards)for(const [slug,r] of Object.entries(readings))for(let i=0;i<r.positions.length;i++)for(const reversed of [true,false]){const result=interpret(slug,{id:c.id,reversed},i);assert.ok(result.context.length>15);assert.ok(result.meaning.length>15);assert.ok(result.lens.length>15);}});
test('shuffle produces unique complete deck with independent orientation',()=>{for(let i=0;i<200;i++){const d=shuffleDeck();assert.equal(new Set(d.map(c=>c.id)).size,78);assert.ok(d.every(c=>typeof c.reversed==='boolean'));}});
test('unbiased sampling rejects overflow range',()=>{let calls=0;assert.equal(randomInt(22,{getRandomValues(a){a[0]=calls++===0?4294967295:23;}}),1);assert.equal(calls,2);});
test('daily card survives reload, expires next day, rejects corrupt storage',()=>{let value=null;const s={getItem:()=>value,setItem:(_,v)=>value=v},c={id:'major-17',reversed:true};assert.equal(saveDaily(s,c,'2026-10-04'),true);assert.deepEqual(loadDaily(s,'2026-10-04'),c);assert.equal(loadDaily(s,'2026-10-05'),null);value='bad JSON';assert.equal(loadDaily(s),null);value=JSON.stringify({date:dateKey(),card:{id:'bad',reversed:true}});assert.equal(loadDaily(s),null);assert.equal(saveDaily(null,c),false);});
test('the same Star card has distinct reunion feelings vs breakup turning point',()=>{assert.notEqual(interpret('reunion',{id:'major-17',reversed:false},1).context,interpret('breakup',{id:'major-17',reversed:false},3).context);});

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
 assert.ok(situationExample('feelings',feelingsPicks[0],0)?.length>20);
 const yesPicks=[{id:'major-19',reversed:false},{id:'major-1',reversed:false},{id:'pentacles-1',reversed:false}];
 const yesSummary=synthesis('yes-no',yesPicks);
 assert.ok(yesSummary[0].includes('해보는 쪽'));
 assert.ok(yesSummary[1].includes('카드별로 보면'));
 assert.ok(situationExample('yes-no',yesPicks[0],0)?.length>20);
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
test('every SEO route has unique title, description, H1 and deep static content',async()=>{const titles=new Set(),descriptions=new Set();for(const slug of Object.keys(readings)){const html=await readFile(`dist/tarot/${slug}/index.html`,'utf8');titles.add(html.match(/<title>(.*?)<\/title>/)[1]);descriptions.add(html.match(/name="description" content="(.*?)"/)[1]);assert.equal((html.match(/<h1>/g)||[]).length,1);assert.ok(html.includes('FAQPage'));assert.ok(html.includes(readings[slug].explanation));if(readingContexts[slug])assert.ok(html.includes('name="situation"'));assert.ok(html.includes('조금 더 깊게 읽기'));for(const [heading] of readingDepth[slug])assert.ok(html.includes(heading));}assert.equal(titles.size,Object.keys(readings).length);assert.equal(descriptions.size,Object.keys(readings).length);});
import {synthesis,readingSnapshot} from '../src/engine.mjs';
import {artwork} from '../src/card-view.mjs';
test('major IDs preserved; all four minor suits contain 14 unique ranks',()=>{assert.equal(new Set(cards.map(c=>c.id)).size,78);assert.equal(cards.filter(c=>c.arcana==='major').length,22);for(const suit of ['wands','cups','swords','pentacles']){const d=cards.filter(c=>c.suit===suit);assert.equal(d.length,14);assert.equal(new Set(d.map(c=>c.rank)).size,14);}});
test('same-topic positions and orientations change substantive interpretation',()=>{for(const c of cards){const p={id:c.id,reversed:false};assert.notEqual(interpret('reunion',p,0).context,interpret('reunion',p,2).context);assert.notEqual(interpret('feelings',p,0).context,interpret('feelings',p,1).context);assert.notEqual(interpret('reunion',p,0).context,interpret('reunion',{...p,reversed:true},0).context);}});
test('synthesis responds to middle-position cards, not only endpoints',()=>{const a=[0,6,19,7,21].map(n=>({id:`major-${n}`,reversed:false}));const b=a.map(p=>({...p}));b[2]={id:'major-16',reversed:false};assert.notDeepEqual(synthesis('reunion',a),synthesis('reunion',b));assert.equal(readingSnapshot('reunion',a,'test').interpretations.length,5);});
test('78-card dictionary has one indexable detail page per card',async()=>{const hub=await readFile('dist/cards/index.html','utf8');assert.ok(hub.includes('타로 카드 78장 의미 사전'));const slugs=new Set();for(const card of cards){const slug=cardSlug(card);assert.ok(!slugs.has(slug));slugs.add(slug);const html=await readFile(`dist/cards/${slug}/index.html`,'utf8');assert.equal((html.match(/<h1>/g)||[]).length,1);assert.ok(html.includes(card.koreanName));assert.ok(html.includes(card.name));assert.ok(html.includes(card.upright));assert.ok(html.includes(card.reversed));assert.ok(html.includes('/tarot/love/'));assert.ok(html.includes('/tarot/reunion/'));assert.ok(html.includes('현실적인 질문에서 읽으면'));assert.ok(html.includes('/tarot/job/'));assert.ok(html.includes('/tarot/money/'));assert.ok(html.includes('/tarot/study/'));}assert.equal(slugs.size,78);});
test('all internal static links and artwork files exist',async()=>{assert.equal(Object.keys(artwork).length,78);assert.ok(cards.every(c=>artwork[c.id]));const {readdir,stat}=await import('node:fs/promises');async function scan(dir){for(const item of await readdir(dir,{withFileTypes:true})){const p=`${dir}/${item.name}`;if(item.isDirectory())await scan(p);else if(item.name.endsWith('.html')){const html=await readFile(p,'utf8');for(const match of html.matchAll(/href="(\/[^"#]*)/g)){const link=match[1].split('?')[0];if(!link)continue;await stat(`dist${link}${link.endsWith('/')?'index.html':''}`);}}}}await scan('dist');for(const [id,file] of Object.entries(artwork)){assert.ok(cards.some(c=>c.id===id));await stat(`dist/artwork/${file}.webp`);await stat(`dist/artwork/${file}-small.webp`);}});
import {spreadSignals} from '../src/engine.mjs';
test('all spread positions and all semantic tags contribute',()=>{const picks=[0,6,16,18,19].map(n=>({id:`major-${n}`,reversed:true}));const profile=spreadSignals('reunion',picks);assert.equal(profile.positions.length,5);assert.equal(Object.values(profile.totals).reduce((a,b)=>a+b,0),15);for(let i=0;i<5;i++){const changed=picks.map(p=>({...p}));changed[i]={id:'cups-2',reversed:false};assert.notDeepEqual(spreadSignals('reunion',changed).totals,profile.totals);}});
test('random five-card draws actually cover all suits and court ranks',()=>{const seen=new Set();for(let i=0;i<500;i++){const draw=shuffleDeck().slice(0,5);assert.equal(new Set(draw.map(p=>p.id)).size,5);draw.forEach(p=>seen.add(p.id));}assert.equal(seen.size,78);for(const suit of ['wands','cups','swords','pentacles'])for(const n of [11,12,13,14])assert.ok(seen.has(`${suit}-${n}`));});
test('all indexable HTML pages have unique metadata and complete sitemap entries',async()=>{const {readdir}=await import('node:fs/promises');const sitemap=await readFile('dist/sitemap.xml','utf8');const titles=new Set(),descs=new Set(),canonical=new Set();let count=0;async function scan(dir){for(const f of await readdir(dir,{withFileTypes:true})){const path=`${dir}/${f.name}`;if(f.isDirectory())await scan(path);else if(f.name==='index.html'){const html=await readFile(path,'utf8');if(html.includes('name="robots" content="noindex"'))continue;const title=html.match(/<title>(.*?)<\/title>/)[1],desc=html.match(/name="description" content="(.*?)"/)[1],url=html.match(/rel="canonical" href="(.*?)"/)[1];assert.ok(!titles.has(title));assert.ok(!descs.has(desc));assert.ok(!canonical.has(url));titles.add(title);descs.add(desc);canonical.add(url);assert.equal((html.match(/<h1>/g)||[]).length,1);assert.ok(sitemap.includes(`<loc>${url}</loc>`));count++;}}}await scan('dist');assert.equal(count,13+Object.keys(readings).length+cards.length);assert.equal((sitemap.match(/<loc>/g)||[]).length,count);assert.ok((await readFile('dist/robots.txt','utf8')).includes('Sitemap:'));});
test('saved readings page is private and excluded from sitemap',async()=>{const html=await readFile('dist/my-readings/index.html','utf8'),sitemap=await readFile('dist/sitemap.xml','utf8');assert.ok(html.includes('name="robots" content="noindex"'));assert.ok(html.includes('data-saved-readings'));assert.ok(!sitemap.includes('/my-readings/'));assert.ok((await readFile('dist/privacy/index.html','utf8')).includes('최근 리딩 최대 10개'));});
test('service copy uses full deck while educational major count is retained',async()=>{for(const path of ['dist/index.html','dist/about/index.html']){const html=await readFile(path,'utf8');assert.ok(html.includes('78'));assert.ok(!html.includes('22장의 카드를 섞'));assert.ok(!html.includes('메이저 아르카나 22장의 상징으로'));}assert.ok((await readFile('dist/guide/major-arcana/index.html','utf8')).includes('22장의 메이저 아르카나'));});

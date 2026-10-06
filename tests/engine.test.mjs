import test from 'node:test';import assert from 'node:assert/strict';import {cards} from '../src/data/cards.mjs';import {readings} from '../src/data/readings.mjs';import {cardSlug} from '../src/data/card-directory.mjs';import {readingDepth} from '../src/data/reading-depth.mjs';import {readingContexts} from '../src/data/reading-contexts.mjs';import {loadSavedReadings,saveReadingRecord,removeSavedReading,clearSavedReadings} from '../src/saved-readings.mjs';import {shuffleDeck,randomInt,loadDaily,saveDaily,dateKey,interpret,verdict,readingHeadline,situationExample,timingInsight,nextAction,combinationInsights,contextualInsight} from '../src/engine.mjs';import {readFile} from 'node:fs/promises';import {josa} from '../src/korean.mjs';
test('all 78 cards support every reading position and orientation',()=>{assert.equal(cards.length,78);for(const c of cards)for(const [slug,r] of Object.entries(readings))for(let i=0;i<r.positions.length;i++)for(const reversed of [true,false]){const result=interpret(slug,{id:c.id,reversed},i);assert.ok(result.context.length>15);assert.ok(result.meaning.length>15);assert.ok(result.lens.length>15);}});
test('shuffle produces unique complete deck with independent orientation',()=>{for(let i=0;i<200;i++){const d=shuffleDeck();assert.equal(new Set(d.map(c=>c.id)).size,78);assert.ok(d.every(c=>typeof c.reversed==='boolean'));}});
test('unbiased sampling rejects overflow range',()=>{let calls=0;assert.equal(randomInt(22,{getRandomValues(a){a[0]=calls++===0?4294967295:23;}}),1);assert.equal(calls,2);});
test('daily card survives reload, expires next day, rejects corrupt storage',()=>{let value=null;const s={getItem:()=>value,setItem:(_,v)=>value=v},c={id:'major-17',reversed:true};assert.equal(saveDaily(s,c,'2026-10-04'),true);assert.deepEqual(loadDaily(s,'2026-10-04'),c);assert.equal(loadDaily(s,'2026-10-05'),null);value='bad JSON';assert.equal(loadDaily(s),null);value=JSON.stringify({date:dateKey(),card:{id:'bad',reversed:true}});assert.equal(loadDaily(s),null);assert.equal(saveDaily(null,c),false);});
test('the same Star card has distinct reunion feelings vs breakup turning point',()=>{assert.notEqual(interpret('reunion',{id:'major-17',reversed:false},1).context,interpret('breakup',{id:'major-17',reversed:false},3).context);});
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
test('every SEO route has unique title, description, H1 and deep static content',async()=>{const titles=new Set(),descriptions=new Set();for(const slug of Object.keys(readings)){const html=await readFile(`dist/tarot/${slug}/index.html`,'utf8');titles.add(html.match(/<title>(.*?)<\/title>/)[1]);descriptions.add(html.match(/name="description" content="(.*?)"/)[1]);assert.equal((html.match(/<h1>/g)||[]).length,1);assert.ok(html.includes('FAQPage'));assert.ok(html.includes(readings[slug].explanation));if(readingContexts[slug])assert.ok(html.includes('name="situation"'));assert.ok(html.includes('조금 더 깊게 읽기'));for(const [heading] of readingDepth[slug])assert.ok(html.includes(heading));}assert.equal(titles.size,Object.keys(readings).length);assert.equal(descriptions.size,Object.keys(readings).length);});
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
test('78-card dictionary has one indexable detail page per card',async()=>{const hub=await readFile('dist/cards/index.html','utf8');assert.ok(hub.includes('타로 카드 78장 의미 사전'));const slugs=new Set();for(const card of cards){const slug=cardSlug(card);assert.ok(!slugs.has(slug));slugs.add(slug);const html=await readFile(`dist/cards/${slug}/index.html`,'utf8');assert.equal((html.match(/<h1>/g)||[]).length,1);assert.ok(html.includes(card.koreanName));assert.ok(html.includes(card.name));assert.ok(html.includes(card.upright));assert.ok(html.includes(card.reversed));assert.ok(html.includes('/tarot/love/'));assert.ok(html.includes('/tarot/reunion/'));assert.ok(html.includes('현실적인 질문에서 읽으면'));assert.ok(html.includes('/tarot/job/'));assert.ok(html.includes('/tarot/money/'));assert.ok(html.includes('/tarot/study/'));}assert.equal(slugs.size,78);});
test('all internal static links and artwork files exist',async()=>{assert.equal(Object.keys(artwork).length,78);assert.ok(cards.every(c=>artwork[c.id]));const {readdir,stat}=await import('node:fs/promises');async function scan(dir){for(const item of await readdir(dir,{withFileTypes:true})){const p=`${dir}/${item.name}`;if(item.isDirectory())await scan(p);else if(item.name.endsWith('.html')){const html=await readFile(p,'utf8');for(const match of html.matchAll(/href="(\/[^"#]*)/g)){const link=match[1].split('?')[0];if(!link)continue;await stat(`dist${link}${link.endsWith('/')?'index.html':''}`);}}}}await scan('dist');for(const [id,file] of Object.entries(artwork)){assert.ok(cards.some(c=>c.id===id));await stat(`dist/artwork/${file}.webp`);await stat(`dist/artwork/${file}-small.webp`);}});
import {spreadSignals} from '../src/engine.mjs';
test('all spread positions and all semantic tags contribute',()=>{const picks=[0,6,16,18,19].map(n=>({id:`major-${n}`,reversed:true}));const profile=spreadSignals('reunion',picks);assert.equal(profile.positions.length,5);assert.equal(Object.values(profile.totals).reduce((a,b)=>a+b,0),15);for(let i=0;i<5;i++){const changed=picks.map(p=>({...p}));changed[i]={id:'cups-2',reversed:false};assert.notDeepEqual(spreadSignals('reunion',changed).totals,profile.totals);}});
test('random five-card draws actually cover all suits and court ranks',()=>{const seen=new Set();for(let i=0;i<500;i++){const draw=shuffleDeck().slice(0,5);assert.equal(new Set(draw.map(p=>p.id)).size,5);draw.forEach(p=>seen.add(p.id));}assert.equal(seen.size,78);for(const suit of ['wands','cups','swords','pentacles'])for(const n of [11,12,13,14])assert.ok(seen.has(`${suit}-${n}`));});
test('all indexable HTML pages have unique metadata and complete sitemap entries',async()=>{const {readdir}=await import('node:fs/promises');const sitemap=await readFile('dist/sitemap.xml','utf8');const titles=new Set(),descs=new Set(),canonical=new Set();let count=0;async function scan(dir){for(const f of await readdir(dir,{withFileTypes:true})){const path=`${dir}/${f.name}`;if(f.isDirectory())await scan(path);else if(f.name==='index.html'){const html=await readFile(path,'utf8');if(html.includes('name="robots" content="noindex"'))continue;const title=html.match(/<title>(.*?)<\/title>/)[1],desc=html.match(/name="description" content="(.*?)"/)[1],url=html.match(/rel="canonical" href="(.*?)"/)[1];assert.ok(!titles.has(title));assert.ok(!descs.has(desc));assert.ok(!canonical.has(url));titles.add(title);descs.add(desc);canonical.add(url);assert.equal((html.match(/<h1>/g)||[]).length,1);assert.ok(sitemap.includes(`<loc>${url}</loc>`));count++;}}}await scan('dist');assert.equal(count,13+Object.keys(readings).length+cards.length);assert.equal((sitemap.match(/<loc>/g)||[]).length,count);assert.ok((await readFile('dist/robots.txt','utf8')).includes('Sitemap:'));});
test('saved readings page is private and excluded from sitemap',async()=>{const html=await readFile('dist/my-readings/index.html','utf8'),sitemap=await readFile('dist/sitemap.xml','utf8');assert.ok(html.includes('name="robots" content="noindex"'));assert.ok(html.includes('data-saved-readings'));assert.ok(!sitemap.includes('/my-readings/'));assert.ok((await readFile('dist/privacy/index.html','utf8')).includes('최근 리딩 최대 10개'));});
test('service copy uses full deck while educational major count is retained',async()=>{for(const path of ['dist/index.html','dist/about/index.html']){const html=await readFile(path,'utf8');assert.ok(html.includes('78'));assert.ok(!html.includes('22장의 카드를 섞'));assert.ok(!html.includes('메이저 아르카나 22장의 상징으로'));}assert.ok((await readFile('dist/guide/major-arcana/index.html','utf8')).includes('22장의 메이저 아르카나'));});

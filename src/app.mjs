import {cardNumber,cardArt,cardFace,artwork} from './card-view.mjs';
import {cards} from './data/cards.mjs';
import {readings} from './data/readings.mjs';
import {shuffleDeck,loadDaily,saveDaily,dateKey,interpret,verdict,synthesis,generalAdvice,readingHeadline,timingInsight,nextAction,combinationInsights,contextualInsight,spreadSignals} from './engine.mjs';
import {loadSavedReadings,saveReadingRecord,removeSavedReading,clearSavedReadings} from './saved-readings.mjs';
document.addEventListener('error',event=>{if(event.target instanceof HTMLImageElement&&event.target.closest('.artwork-holder')){event.target.hidden=true;event.target.parentElement.classList.add('image-failed');}},true);
const root=document.querySelector('[data-reading]');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

const revealSelector=[
 '.section-heading','.reading-tile','.how','.about','.about-grid article','.guide-teaser','main>.faq-section',
 '.reading-intro','.question-panel','.spread-info','.card-library-hero','.card-library-group','.card-library-tile',
 '.card-dictionary-hero','.card-meaning-overview','.card-topic-section','.guide-hero',
 '.guide-visual','.guide-article>section','.guide-list>a','.guide-next','.guide-page>.kicker','.guide-page>h1','.guide-page>.lead',
 '.faq-page-hero','.faq-page-shell .faq-list>details','.faq-guide-link','.info-hero','.info-card','.info-footer','.saved-readings-hero',
 '.saved-reading-item','.saved-reading-empty','.results-heading','.reading-answer',
 '.reading-context-answer','.reading-insights','.card-summary','.result-position',
 '.combination-reading','.synthesis','.related','.result-actions','.result-tools-foot'
].join(',');
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
let scrollRevealObserver=null;
function prepareScrollReveal(scope=document){
 const candidates=[];
 if(scope instanceof Element&&scope.matches(revealSelector))candidates.push(scope);
 if(scope.querySelectorAll)candidates.push(...scope.querySelectorAll(revealSelector));
 const fresh=[...new Set(candidates)].filter(node=>!node.classList.contains('scroll-reveal'));
 if(!fresh.length)return;
 if(reducedMotion.matches||!('IntersectionObserver' in window)){
  fresh.forEach(node=>node.classList.add('scroll-reveal','is-visible'));
  return;
 }
 if(!scrollRevealObserver){
  scrollRevealObserver=new IntersectionObserver(entries=>{
   for(const entry of entries){
    if(!entry.isIntersecting)continue;
    entry.target.classList.add('is-visible');
    scrollRevealObserver.unobserve(entry.target);
   }
  },{rootMargin:'0px 0px -8% 0px',threshold:.08});
 }
 fresh.forEach((node,index)=>{
  node.classList.add('scroll-reveal');
  let delay=Math.min(index%4,3)*55;
  const parent=node.parentElement;
  if(parent&&node.matches('.reading-tile,.card-library-tile,.about-grid article,.guide-list>a,.faq-list>details,.info-card,.saved-reading-item')){
   const siblings=[...parent.children].filter(item=>item.matches('.reading-tile,.card-library-tile,.about-grid article,.guide-list>a,.faq-list>details,.info-card,.saved-reading-item'));
   const siblingIndex=siblings.indexOf(node);
   if(siblingIndex>=0){
    if(node.matches('.guide-list>a'))delay=280+Math.min(siblingIndex,9)*95;
    else if(node.matches('.card-library-tile'))delay=Math.min(siblingIndex,9)*70;
    else delay=Math.min(siblingIndex,9)*115;
   }
  }
  node.style.setProperty('--reveal-delay',String(delay)+'ms');
  scrollRevealObserver.observe(node);
 });
}
queueMicrotask(()=>prepareScrollReveal(document));
const revealRoot=document.querySelector('main');
if(revealRoot){
 new MutationObserver(records=>{
  for(const record of records)for(const node of record.addedNodes)if(node instanceof Element)prepareScrollReveal(node);
 }).observe(revealRoot,{childList:true,subtree:true});
}
const legacyRoman=n=>['0','I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII','XIII','XIV','XV','XVI','XVII','XVIII','XIX','XX','XXI'][n]||String(n);

function canvasWrap(ctx,text,maxWidth){
 const words=String(text||'').split(/\s+/),lines=[];let line='';
 for(const word of words){const test=line?line+' '+word:word;if(ctx.measureText(test).width>maxWidth&&line){lines.push(line);line=word;}else line=test;}
 if(line)lines.push(line);return lines;
}
function loadCanvasImage(src){return new Promise(resolve=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>resolve(null);img.src=src;});}
function isPhoneShareTarget(){
 const ua=navigator.userAgent||'';
 return /iPhone|iPod|Windows Phone/i.test(ua)||/Android/i.test(ua)&&/Mobile/i.test(ua);
}
function downloadReadingImage(blob){
 const url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download='pick-a-card-reading.png';document.body.appendChild(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function keyCardIndex(slug,chosen){
 if(chosen.length<=1)return 0;
 const priority={
  love:[3,1,0,2,4],reunion:[2,4,3,1,0],breakup:[1,3,2,0],
  feelings:[1,3,2,0],contact:[1,2,0],'reunion-timing':[1,2,0],
  job:[2,3,1,0],money:[2,3,1,0],work:[1,3,2,0],study:[2,3,1,0],
  'yes-no':[0,1,2],today:[0]
 }[slug]||chosen.map((_,i)=>i);
 const strongest=spreadSignals(slug,chosen).ranked[0]?.[0];
 const tagAt=i=>{const card=cards.find(card=>card.id===chosen[i]?.id);return card?(chosen[i].reversed?card.reversedTags:card.tags):[];};
 return priority.find(i=>chosen[i]&&tagAt(i)[0]===strongest)
  ??priority.find(i=>chosen[i]&&tagAt(i).includes(strongest))
  ??priority.find(i=>chosen[i])
  ??0;
}
function roundedRect(ctx,x,y,w,h,r){
 const radius=Math.min(r,w/2,h/2);ctx.beginPath();ctx.moveTo(x+radius,y);ctx.arcTo(x+w,y,x+w,y+h,radius);ctx.arcTo(x+w,y+h,x,y+h,radius);ctx.arcTo(x,y+h,x,y,radius);ctx.arcTo(x,y,x+w,y,radius);ctx.closePath();
}
function drawReadingCard(ctx,img,pick,x,y,w,h,r=16){
 ctx.save();ctx.shadowColor='rgba(70,28,28,.12)';ctx.shadowBlur=22;ctx.shadowOffsetY=8;roundedRect(ctx,x,y,w,h,r);ctx.fillStyle='#fff';ctx.fill();ctx.clip();
 if(img){ctx.translate(x+w/2,y+h/2);if(pick.reversed)ctx.rotate(Math.PI);ctx.drawImage(img,-w/2,-h/2,w,h);}
 ctx.restore();ctx.save();roundedRect(ctx,x,y,w,h,r);ctx.strokeStyle='#ead9d6';ctx.lineWidth=2;ctx.stroke();ctx.restore();
}
async function createShareImage({slug,cards:chosen}){
 const canvas=document.createElement('canvas');canvas.width=720;canvas.height=690;const ctx=canvas.getContext('2d');
 const heroIndex=keyCardIndex(slug,chosen),heroPick=chosen[heroIndex];
 const images=await Promise.all(chosen.map(p=>loadCanvasImage('/artwork/'+artwork[p.id]+'.webp')));
 ctx.fillStyle='#fffaf8';ctx.fillRect(0,0,720,690);

 ctx.fillStyle='#c94141';ctx.font='900 16px Inter, Pretendard, sans-serif';ctx.textAlign='center';ctx.fillText('CORE CARD',360,30);
 const heroW=270,heroH=405,heroX=(720-heroW)/2,heroY=52;
 drawReadingCard(ctx,images[heroIndex],heroPick,heroX,heroY,heroW,heroH,18);

 const count=chosen.length;
 const gap=count>=5?10:count===4?12:14;
 const rowW=count>=5?92:count===4?102:count===3?116:count===2?132:146;
 const rowH=Math.round(rowW*1.5);
 const total=rowW*count+gap*(count-1),startX=(720-total)/2,rowY=500;
 chosen.forEach((pick,i)=>drawReadingCard(ctx,images[i],pick,startX+i*(rowW+gap),rowY,rowW,rowH,11));

 return await new Promise(resolve=>canvas.toBlob(resolve,'image/png',.94));
}
async function shareReadingImage(payload,button,status){
 if(!button)return;
 const phone=isPhoneShareTarget(),original=button.textContent;button.disabled=true;button.textContent=phone?'공유 이미지 준비 중…':'PNG 이미지 준비 중…';
 try{
  const blob=await createShareImage(payload);if(!blob)throw new Error('image');
  if(phone&&typeof File==='function'&&navigator.share&&navigator.canShare){
   const file=new File([blob],'pick-a-card-reading.png',{type:'image/png'});
   if(navigator.canShare({files:[file]})){await navigator.share({files:[file],title:'Pick a Card · '+payload.readingName});if(status)status.textContent='공유 메뉴를 열었어요.';return;}
  }
  downloadReadingImage(blob);if(status)status.textContent='PNG 이미지를 저장했어요.';
 }catch(error){if(error?.name!=='AbortError'&&status)status.textContent='이미지를 만들지 못했어요. 잠시 후 다시 시도해 주세요.';}
 finally{button.disabled=false;button.textContent=original;}
}
if(root){
 const slug=root.dataset.reading,r=readings[slug],app=document.querySelector('#reading-app');
 let deck=[],selected=[],count=r.positions.length,question='',situation='',phase='question',drawingDate=null,timer=null,storage=null,resultObserver=null,stickyCleanup=null;
 try{storage=window.localStorage;}catch{}
 const formHTML=app.innerHTML;
 function focusHeading(){const heading=app.querySelector('h2');if(heading){heading.tabIndex=-1;heading.classList.add('result-focus');heading.focus({preventScroll:true});app.scrollIntoView?.({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});}}
 function attachForm(){app.querySelector('form').addEventListener('submit',e=>{e.preventDefault();const data=new FormData(e.currentTarget);question=app.querySelector('#question')?.value.trim()||'';situation=String(data.get('situation')||'');if(slug==='yes-no'&&!question){app.querySelector('#form-error').textContent='질문을 먼저 입력해 주세요.';app.querySelector('#question').focus();return;}count=slug==='yes-no'?Number(data.get('count')):r.positions.length;const stage=app.querySelector('.question-session-stage'),submit=e.currentTarget.querySelector('button[type="submit"]');if(stage&&!matchMedia('(prefers-reduced-motion: reduce)').matches){if(submit)submit.disabled=true;stage.classList.add('is-opening');window.setTimeout(start,620);}else start();});}
 function deckButtonsHTML(){return deck.map((_,i)=>`<button class="card-button" type="button" data-index="${i}" aria-label="${i+1}번째 카드 선택" aria-pressed="false"><span class="card-inner"><span class="card-back" aria-hidden="true"></span><span class="card-front" aria-hidden="true"></span></span></button>`).join('');}
 function attachDeckButtons(){
  const buttons=[...app.querySelectorAll('.card-button')];
  buttons.forEach((b,i)=>{
   b.style.setProperty('--deal-delay',`${Math.min(i,28)*9}ms`);
   b.style.setProperty('--card-tilt',`${((((i*5)%9)-4)*.12).toFixed(2)}deg`);
   b.addEventListener('click',()=>select(Number(b.dataset.index)));
  });
 }
 function playDeckEntrance(){
  const table=app.querySelector('#tarot-table');
  if(!table)return;
  table.classList.remove('is-ready');
  if(reducedMotion.matches){table.classList.add('is-ready');return;}
  requestAnimationFrame(()=>requestAnimationFrame(()=>table.classList.add('is-ready')));
 }
 function attachTarotTable(){
  const table=app.querySelector('#tarot-table'),surface=table?.querySelector('.tarot-table-surface'),shuffle=app.querySelector('#shuffle-deck'),deckEl=app.querySelector('.deck');
  if(table&&surface&&matchMedia('(hover:hover) and (pointer:fine)').matches&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
   table.addEventListener('pointermove',event=>{
    const rect=table.getBoundingClientRect(),x=(event.clientX-rect.left)/rect.width-.5,y=(event.clientY-rect.top)/rect.height-.5;
    surface.style.setProperty('--table-ry',`${(x*1.4).toFixed(2)}deg`);
    surface.style.setProperty('--table-rx',`${(-y*.9).toFixed(2)}deg`);
   });
   table.addEventListener('pointerleave',()=>{surface.style.setProperty('--table-ry','0deg');surface.style.setProperty('--table-rx','0deg');});
  }
  if(deckEl&&matchMedia('(hover:hover) and (pointer:fine)').matches&&!reducedMotion.matches){
   deckEl.addEventListener('pointermove',event=>{
    const card=event.target.closest('.card-button:not(:disabled)');
    if(!card||!deckEl.contains(card))return;
    const rect=card.getBoundingClientRect(),px=(event.clientX-rect.left)/rect.width-.5,py=(event.clientY-rect.top)/rect.height-.5;
    card.style.setProperty('--hover-rx',`${(-py*4.2).toFixed(2)}deg`);
    card.style.setProperty('--hover-ry',`${(px*5.4).toFixed(2)}deg`);
   });
   deckEl.addEventListener('pointerout',event=>{
    const card=event.target.closest('.card-button');
    if(!card||card.contains(event.relatedTarget))return;
    card.style.setProperty('--hover-rx','0deg');
    card.style.setProperty('--hover-ry','0deg');
   });
  }
  shuffle?.addEventListener('click',()=>{
   if(selected.length||phase!=='selecting')return;
   if(!deckEl)return;
   shuffle.disabled=true;deckEl.classList.add('is-shuffling');
   window.setTimeout(()=>{
    deck=shuffleDeck();deckEl.innerHTML=deckButtonsHTML();deckEl.classList.remove('is-shuffling');shuffle.disabled=false;attachDeckButtons();
    const status=app.querySelector('#selection-status');if(status)status.textContent=`${count}장 중 0장 선택 · 덱을 다시 섞었어요 · ${r.positions[0].label}`;
   },560);
  });
 }
 function placePickInSpread(button,slot,card,pick){
  const target=slot?.querySelector('.spread-slot-card');
  const settle=()=>{
   if(!slot||!target)return;
   target.innerHTML=cardFace(card,pick.reversed);
   target.setAttribute('aria-hidden','false');
   slot.classList.remove('is-receiving');
   slot.classList.add('is-filled');
   button?.classList.remove('is-launching');
   button?.classList.add('is-drawn');
   if(selected.length===count)app.querySelector('.spread-board')?.classList.add('is-complete');
  };
  if(slot)slot.classList.add('is-receiving');
  if(!button||!slot||!target||reducedMotion.matches||typeof button.animate!=='function'){settle();return;}
  const from=button.getBoundingClientRect(),to=target.getBoundingClientRect();
  const verticalDistance=Math.abs((to.top+to.height/2)-(from.top+from.height/2));
  if(verticalDistance>window.innerHeight*.82){
   const local=button.animate([
    {transform:'translateY(0) scale(1)',opacity:1},
    {transform:'translateY(-8px) scale(1.035)',opacity:1,offset:.5},
    {transform:'translateY(-3px) scale(.98)',opacity:.32}
   ],{duration:380,easing:'cubic-bezier(.2,.72,.25,1)',fill:'forwards'});
   local.finished.then(settle).catch(settle);
   return;
  }
  const flyer=document.createElement('div');
  flyer.className='table-flying-card';
  flyer.setAttribute('aria-hidden','true');
  flyer.innerHTML=`<span class="flight-card-inner"><span class="flight-card-back"></span><span class="flight-card-front">${cardFace(card,pick.reversed)}</span></span>`;
  document.body.appendChild(flyer);
  Object.assign(flyer.style,{left:`${from.left}px`,top:`${from.top}px`,width:`${from.width}px`,height:`${from.height}px`});
  const dx=(to.left+to.width/2)-(from.left+from.width/2),dy=(to.top+to.height/2)-(from.top+from.height/2);
  const finalScale=to.width/from.width,liftScale=Math.min(Math.max(1.1,finalScale*.86),1.34),turn=dx>=0?1.8:-1.8;
  const outer=flyer.animate([
   {transform:'translate3d(0,0,0) scale(1) rotateZ(0deg)',offset:0},
   {transform:`translate3d(${dx*.34}px,${dy*.30-30}px,0) scale(${liftScale}) rotateZ(${turn}deg)`,offset:.34},
   {transform:`translate3d(${dx*.76}px,${dy*.73-14}px,0) scale(${(liftScale+finalScale)/2}) rotateZ(${turn*.35}deg)`,offset:.76},
   {transform:`translate3d(${dx}px,${dy}px,0) scale(${finalScale}) rotateZ(0deg)`,offset:1}
  ],{duration:840,easing:'cubic-bezier(.18,.76,.22,1)',fill:'forwards'});
  const inner=flyer.querySelector('.flight-card-inner');
  inner?.animate([
   {transform:'rotateY(0deg)',offset:0},
   {transform:'rotateY(0deg)',offset:.26},
   {transform:'rotateY(180deg)',offset:.72},
   {transform:'rotateY(180deg)',offset:1}
  ],{duration:760,delay:90,easing:'cubic-bezier(.2,.68,.24,1)',fill:'forwards'});
  outer.finished.then(()=>{flyer.remove();settle();}).catch(()=>{flyer.remove();settle();});
 } function start(){if(slug==='today'){const saved=loadDaily(storage);if(saved){selected=[saved];showResults(true);return;}}deck=shuffleDeck();selected=[];drawingDate=dateKey();phase='selecting';app.innerHTML=`<div class="selection-heading"><span class="step-label">02 / PICK YOUR CARDS</span><h2>마음이 가는 카드를 골라주세요.</h2><p id="selection-status" role="status" aria-live="polite">${count}장 중 0장 선택 · ${r.positions[0].label}</p><div class="progress-dots" aria-hidden="true">${Array.from({length:count},()=>'<span></span>').join('')}</div></div><div class="tarot-table" id="tarot-table"><div class="tarot-table-surface"><div class="table-topline"><div><span>YOUR TABLE</span><strong>${r.name}</strong></div><button class="table-shuffle" id="shuffle-deck" type="button"><span aria-hidden="true">↻</span> 카드 다시 섞기</button></div><div class="spread-board spread-${count}" aria-label="${r.name} 스프레드">${r.positions.slice(0,count).map((p,i)=>`<div class="spread-slot" data-slot-index="${i}"><span class="slot-index">${String(i+1).padStart(2,'0')}</span><strong>${p.label}</strong><div class="spread-slot-card" aria-hidden="true"></div></div>`).join('')}</div><div class="deck-wrap"><div class="deck" aria-label="섞인 카드 ${deck.length}장">${deckButtonsHTML()}</div></div><div class="picked-list" aria-label="선택한 카드"></div><p class="selection-note">덱을 다시 섞어도 좋아요. 마음이 가는 카드를 고르면 위의 스프레드 자리로 이동합니다.</p></div></div>`;attachDeckButtons();attachTarotTable();app.querySelector('[data-slot-index="0"]')?.classList.add('is-next');playDeckEntrance();focusHeading();}
 function select(index){
  if(phase!=='selecting'||!Number.isInteger(index)||index<0||index>=deck.length||selected.some(s=>s.index===index)||selected.length>=count)return false;
  const pick={...deck[index],index};selected.push(pick);
  const card=cards.find(c=>c.id===pick.id),button=app.querySelector(`[data-index="${index}"]`),slotIndex=selected.length-1,slot=app.querySelector(`[data-slot-index="${slotIndex}"]`);
  button.disabled=true;
  button.setAttribute('aria-pressed','true');
  button.setAttribute('aria-label',`${card.koreanName}, ${pick.reversed?'역방향':'정방향'}, 선택됨`);
  const numberLabel=cardNumber(card),front=button.querySelector('.card-front');
  front.innerHTML=`<span class="card-number ${String(numberLabel).length>3?'is-long':''}">${numberLabel}</span>${cardArt(card,pick.reversed)}<strong>${card.koreanName}</strong><small>${pick.reversed?'역방향':'정방향'}</small>`;
  front.classList.toggle('is-reversed',pick.reversed);
  button.classList.add('is-launching');
  placePickInSpread(button,slot,card,pick);
  app.querySelector('.picked-list').insertAdjacentHTML('beforeend',`<span>${selected.length}. ${r.positions[slotIndex].label} · ${card.koreanName}</span>`);
  app.querySelectorAll('.progress-dots span').forEach((d,i)=>d.classList.toggle('filled',i<selected.length));
  app.querySelectorAll('.spread-slot').forEach((node,i)=>node.classList.toggle('is-next',i===selected.length&&selected.length<count));
  app.querySelector('#selection-status').textContent=`${count}장 중 ${selected.length}장 선택${selected.length<count?' · 다음 : '+r.positions[selected.length].label:' · 스프레드를 완성하고 있어요.'}`;
  const shuffle=app.querySelector('#shuffle-deck');if(shuffle)shuffle.disabled=true;
  if(selected.length===count){
   phase='revealing';
   app.querySelectorAll('.card-button').forEach(b=>b.disabled=true);
   timer=setTimeout(()=>showResults(false),reducedMotion.matches?120:1480);
  }
  return true;
 } function cardSummary(){return `<div class="session-spread-anchor" aria-hidden="true"></div><section class="session-spread-shell" aria-label="이번 리딩의 카드"><div class="session-spread-head"><span>YOUR SPREAD</span><button class="session-spread-toggle" type="button" aria-expanded="false">펼쳐보기</button></div><div class="card-summary reading-session-spread" tabindex="0" role="region" aria-label="선택한 카드 요약, 가로로 스크롤할 수 있습니다">${selected.map((pick,i)=>{const c=cards.find(c=>c.id===pick.id);return `<div class="summary-item" data-summary-index="${i}"><span class="session-position">${r.positions[i]?.label||`카드 ${i+1}`}</span>${cardFace(c,pick.reversed)}<span class="session-card-name">${c.koreanName} · ${pick.reversed?'역방향':'정방향'}</span><p>${pick.reversed?'역방향':'정방향'}</p></div>`}).join('')}</div></section>`;}
 function positionResult(pick,i){const {card,position,meaning,context,example,lens,caution}=interpret(slug,pick,i);return `<article class="result-position" data-position-index="${i}" tabindex="0"><div class="detail-card" aria-hidden="true">${cardFace(card,pick.reversed)}</div><div class="result-title"><span>${String(i+1).padStart(2,'0')}</span><div><h3>${position.label}</h3><p class="card-meta">${card.koreanName} · ${card.name} · ${pick.reversed?'역방향':'정방향'}</p></div></div><div class="keywords">${card.keywords.map(k=>`<span>${k}</span>`).join('')}</div><p>${meaning}</p><p>${context}</p>${example?`<p class="context-example"><strong>상황으로 풀면</strong><span>${example}</span></p>`:''}${slug==='yes-no'?`<p class="lens">이 카드의 방향성 : ${pick.reversed?'역방향이므로 실행보다 조건 재점검을 우선하는 신호로 반영했습니다.':card.yesNo>0?'시도와 개방을 나타내는 상징으로 YES 쪽에 반영했습니다.':card.yesNo<0?'멈춤과 재정비를 나타내는 상징으로 NO 쪽에 반영했습니다.':'조건과 관찰이 필요한 중립의 상징으로 반영했습니다.'}</p>`:''}<p class="lens">${lens}</p>${caution?`<p class="caution">${caution}</p>`:''}</article>`;}
 function dailyResult(){const pick=selected[0],c=cards.find(c=>c.id===pick.id);return `<div class="daily-grid">${[['오늘의 전체 흐름',`‘${c.keywords.join(' · ')}’을 오늘의 관점으로 삼아보세요. ${pick.reversed?c.reversed:c.upright}로 읽을 수 있습니다.`],['연애',pick.reversed?`오늘은 ${c.reversed}로 읽습니다. ${c.advice}`:c.love],['일 / 학업',`${generalAdvice(c,pick.reversed)} 업무나 공부에서는 이 조언을 오늘 끝낼 작은 과제 하나에 적용해 보세요.`],['금전',`‘${c.keywords[0]}’ 키워드가 나의 소비 태도와 어떻게 닿는지 돌아보세요. 수익이나 손실의 예고가 아니며, 지출은 실제 예산을 확인한 뒤 결정하세요.`],['오늘의 조언',generalAdvice(c,pick.reversed)]].map(([title,text])=>`<article class="result-position"><h3>${title}</h3><p>${text}</p></article>`).join('')}</div>`;}
 const readingEmoji={love:'💗',reunion:'🔁',breakup:'🥀',feelings:'💭',contact:'💌','reunion-timing':'⏳','yes-no':'🔮',today:'☀️',job:'💼',money:'💰',work:'🧑‍💻',study:'📚'};
const relatedPrompts={feelings:'그 사람의 현재 마음이 궁금한가요?',contact:'연락이 다시 올지 궁금한가요?','reunion-timing':'관계가 움직이는 계기가 궁금한가요?',reunion:'다시 연결될 여지를 살펴볼까요?',love:'나에게 필요한 사랑은 어떤 모습일까요?',today:'오늘의 나에게 한 장을 건네볼까요?','yes-no':'가볍게 떠오르는 질문이 있나요?',job:'기회를 어떻게 준비하면 좋을까요?',money:'지금 돈의 흐름을 점검해볼까요?',work:'현재 직장과 커리어 흐름이 궁금한가요?',study:'공부에서 어디에 힘을 써야 할까요?'};
 function wireResultSession(){
  resultObserver?.disconnect();resultObserver=null;stickyCleanup?.();stickyCleanup=null;
  const summary=[...app.querySelectorAll('[data-summary-index]')],positions=[...app.querySelectorAll('[data-position-index]')];
  const shell=app.querySelector('.session-spread-shell'),anchor=app.querySelector('.session-spread-anchor'),toggle=app.querySelector('.session-spread-toggle');
  const centerSummaryItem=(index,behavior='smooth')=>{
   const rail=app.querySelector('.reading-session-spread.card-summary'),active=summary[index];
   if(!rail||!active)return;
   const target=active.offsetLeft-(rail.clientWidth-active.offsetWidth)/2;
   rail.scrollTo({left:Math.max(0,target),behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':behavior});
  };
  if(shell&&anchor&&toggle){
   const updateToggle=()=>{const expanded=shell.classList.contains('is-expanded');toggle.textContent=expanded?'접기':'펼쳐보기';toggle.setAttribute('aria-expanded',String(expanded));};
   const syncSticky=()=>{
    const stickyTop=parseFloat(getComputedStyle(shell).top)||0,stuck=anchor.getBoundingClientRect().top<=stickyTop+1;
    shell.classList.toggle('is-stuck',stuck);
    if(!stuck)shell.classList.remove('is-expanded');
    updateToggle();
   };
   toggle.addEventListener('click',()=>{if(!shell.classList.contains('is-stuck'))return;shell.classList.toggle('is-expanded');updateToggle();if(shell.classList.contains('is-expanded')&&matchMedia('(max-width:650px)').matches){const activeIndex=summary.findIndex(item=>item.classList.contains('is-active'));if(activeIndex>=0)requestAnimationFrame(()=>centerSummaryItem(activeIndex));}});
   let frame=0;
   const queueSync=()=>{if(frame)return;frame=requestAnimationFrame(()=>{frame=0;syncSticky();});};
   window.addEventListener('scroll',queueSync,{passive:true});window.addEventListener('resize',queueSync);syncSticky();
   stickyCleanup=()=>{window.removeEventListener('scroll',queueSync);window.removeEventListener('resize',queueSync);if(frame)cancelAnimationFrame(frame);};
  }
  if(!summary.length||!positions.length)return;
  const activate=index=>{
   summary.forEach((item,i)=>item.classList.toggle('is-active',i===index));
   if(!shell||!shell.classList.contains('is-stuck'))return;
   if(shell.classList.contains('is-expanded')&&!matchMedia('(max-width:650px)').matches)return;
   centerSummaryItem(index);
  };
  positions.forEach(node=>{const index=Number(node.dataset.positionIndex);node.addEventListener('mouseenter',()=>activate(index));node.addEventListener('focusin',()=>activate(index));node.addEventListener('click',()=>activate(index));});
  if('IntersectionObserver' in window&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
   resultObserver=new IntersectionObserver(entries=>{if(shell&&!shell.classList.contains('is-stuck'))return;const visible=entries.filter(e=>e.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];if(visible)activate(Number(visible.target.dataset.positionIndex));},{rootMargin:'-24% 0px -56% 0px',threshold:[.05,.2,.45]});
   positions.forEach(node=>resultObserver.observe(node));
  }
 }
 function animateResultEntry(){
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  app.classList.remove('results-entering');
  [...app.children].filter(node=>!node.hidden).forEach((node,index)=>node.style.setProperty('--result-order',String(Math.min(index,8))));
  void app.offsetWidth;
  app.classList.add('results-entering');
  window.setTimeout(()=>app.classList.remove('results-entering'),950);
 }
 function showResults(restored){clearTimeout(timer);let warning='';if(slug==='today'&&!restored){if(drawingDate!==dateKey()){app.innerHTML='<p class="storage-warning">날짜가 바뀌었어요. 새로운 하루의 카드를 골라주세요.</p>'+formHTML;phase='question';attachForm();return;}const existing=loadDaily(storage);if(existing){selected=[existing];restored=true;}else if(!saveDaily(storage,{id:selected[0].id,reversed:selected[0].reversed}))warning='이 브라우저에서 저장을 사용할 수 없어 새로고침 시 카드가 유지되지 않을 수 있어요.';}phase='result';const headline=slug==='today'?null:readingHeadline(slug,selected,situation),timing=slug==='today'?null:timingInsight(slug,selected),action=slug==='today'?null:nextAction(slug,selected,situation),combinations=slug==='today'?[]:combinationInsights(slug,selected),contextNote=slug==='today'?null:contextualInsight(slug,situation,selected),summaryLines=slug==='today'?[generalAdvice(cards.find(c=>c.id===selected[0].id),selected[0].reversed),r.summary]:synthesis(slug,selected);app.innerHTML=`<div class="results-heading"><span class="step-label">${slug==='today'?dateKey():'03 / YOUR READING'}</span><h2>${slug==='today'?'오늘, 당신에게 온 카드':'당신이 고른 카드의 이야기'}</h2><p>${slug==='today'?(restored?'오늘의 카드를 다시 펼쳤어요.':'오늘 하루, 이 메시지를 기억해 보세요.'):'카드의 상징을 지금의 상황에 비추어 읽어보세요.'}</p>${question?`<p class="question-echo">${esc(question)}</p>`:''}</div>${warning?`<p class="storage-warning" role="status">${warning}</p>`:''}${cardSummary()}${headline?`<section class="reading-answer"><span>이번 리딩의 핵심</span><strong>${headline}</strong></section>`:''}${contextNote?`<section class="reading-context-answer"><span>${contextNote.label} 기준으로 보면</span><p>${contextNote.text}</p></section>`:''}${timing||action?`<div class="reading-insights">${timing?`<section class="insight-card timing-card"><span class="insight-label">시기 흐름 · ${timing.label}</span><strong>${timing.range}</strong><p>${timing.text}</p>${timing.basis?`<small class="timing-basis">${timing.basis}</small>`:''}</section>`:''}${action?`<section class="insight-card action-card"><span class="insight-label">지금 해볼 것</span><strong>한 가지를 바로 움직여보세요.</strong><p>${action}</p></section>`:''}</div>`:''}${slug==='yes-no'?`<section class="verdict"><span class="step-label">SYMBOLIC DIRECTION</span><h3>${verdict(selected)}</h3><p>카드 방향을 합쳐 지금의 선택을 YES / 보류 / NO 중 하나로 정리했어요.</p></section>`:''}${slug==='today'?dailyResult():selected.map((pick,i)=>positionResult(pick,i)+(i===1?'<div class="ad-slot" data-ad-placement="result-middle" hidden></div>':'')).join('')}${combinations.length?`<section class="combination-reading"><span class="step-label">CARDS TOGETHER</span><h2>카드를 함께 읽으면</h2><div class="combination-grid">${combinations.map(item=>`<article><div class="combination-meta"><span>${item.positions}</span><strong>${item.title}</strong></div><p>${item.text}</p></article>`).join('')}</div></section>`:''}<section class="synthesis"><span class="step-label">${slug==='today'?'TAKE IT WITH YOU':'THE BIG PICTURE'}</span><h2>${slug==='today'?'오늘 가져갈 한 문장':'그래서, 이번 리딩의 결론은'}</h2>${summaryLines.map(t=>`<p>${t}</p>`).join('')}</section><div class="ad-slot" data-ad-placement="result-bottom" hidden></div><section class="related"><h2>${['job','money','work','study'].includes(slug)?'다른 고민도 살펴볼까요':'이 마음이 더 궁금하다면'}</h2>${r.related.map(s=>`<a href="/tarot/${s}/"><span class="related-icon" aria-hidden="true">${readingEmoji[s]||readings[s].mark}</span><span>${relatedPrompts[s]}</span><strong>${readings[s].name} ＋</strong></a>`).join('')}</section><div class="result-actions"><a class="button primary" href="/">다른 타로 고르기</a><button class="button secondary" id="save-reading" type="button">이 리딩 저장</button><button class="button secondary" id="share-reading" type="button">${isPhoneShareTarget()?'결과 이미지 공유':'결과 PNG 저장'}</button>${slug==='today'?'':'<button class="button secondary" id="restart" type="button">새로운 질문으로 보기</button>'}</div><div class="result-tools-foot"><a href="/my-readings/">저장한 리딩 보기 →</a><p id="result-tool-status" role="status" aria-live="polite"></p></div>`;wireResultSession();animateResultEntry();app.querySelector('#restart')?.addEventListener('click',()=>{resultObserver?.disconnect();resultObserver=null;stickyCleanup?.();stickyCleanup=null;phase='question';selected=[];question='';situation='';app.innerHTML=formHTML;attachForm();focusHeading();});
 const toolStatus=app.querySelector('#result-tool-status');
 app.querySelector('#save-reading')?.addEventListener('click',event=>{
  const record={id:String(Date.now())+'-'+slug,savedAt:new Date().toISOString(),slug,readingName:r.name,question,contextLabel:contextNote?.label||'',cards:selected.map(({id,reversed})=>({id,reversed})),headline:headline||(slug==='yes-no'?verdict(selected):summaryLines[0]),timing,action,conclusion:summaryLines[0]};
  if(saveReadingRecord(storage,record)){event.currentTarget.textContent='저장됨 ✓';event.currentTarget.disabled=true;if(toolStatus)toolStatus.textContent='이 브라우저에 최근 리딩으로 저장했어요.';}else if(toolStatus)toolStatus.textContent='이 브라우저에서는 리딩을 저장할 수 없어요.';
 });
 app.querySelector('#share-reading')?.addEventListener('click',event=>shareReadingImage({slug,cards:selected},event.currentTarget,toolStatus));
 focusHeading();}
 attachForm();if(slug==='today'){const saved=loadDaily(storage);if(saved){selected=[saved];showResults(true);}}
 window.addEventListener('storage',e=>{if(slug==='today'&&e.key==='pickacard:daily:v1'&&phase==='result'){const saved=loadDaily(storage);if(saved){selected=[saved];showResults(true);}}});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden&&slug==='today'&&phase==='result'&&!loadDaily(storage)){app.innerHTML=formHTML;phase='question';attachForm();}});
 const context=document.modelContext;if(context?.registerTool){try{Promise.resolve(context.registerTool({name:'get_tarot_reading_state',description:'Read the currently visible tarot stage and revealed cards; does not draw cards or disclose unselected cards.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute:input=>{if(!input||Object.keys(input).length)throw new Error('Expected an empty object');return {type:slug,phase,selectedCount:selected.length,requiredCount:count,cards:selected.map(({id,reversed})=>({id,reversed}))};}})).catch(()=>{});}catch{}}
}


const savedRoot=document.querySelector('[data-saved-readings]');
if(savedRoot){
 let savedStorage=null;try{savedStorage=window.localStorage;}catch{}
 const list=savedRoot.querySelector('#saved-reading-list'),clearButton=savedRoot.querySelector('#clear-saved-readings'),empty=savedRoot.querySelector('#saved-reading-empty');
 const formatDate=value=>{try{return new Intl.DateTimeFormat('ko-KR',{month:'long',day:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(value));}catch{return '';}};
 function renderSaved(){
  const items=loadSavedReadings(savedStorage);list.innerHTML=items.map(item=>{
   const reading=readings[item.slug],chosen=item.cards.map(p=>({pick:p,card:cards.find(c=>c.id===p.id)})).filter(x=>x.card);
   const reversedCount=chosen.filter(({pick})=>pick.reversed).length,uprightCount=chosen.length-reversedCount;
   return `<article class="saved-reading-item" data-saved-id="${esc(item.id)}"><div class="saved-reading-head"><div><span>${esc(formatDate(item.savedAt))}</span><h2>${esc(item.readingName||reading?.name||item.slug)}</h2></div><button type="button" class="saved-delete" data-delete-reading="${esc(item.id)}" aria-label="저장한 리딩 삭제">삭제</button></div><div class="saved-reading-meta"><span>${chosen.length}장의 카드</span><span>정방향 ${uprightCount} · 역방향 ${reversedCount}</span></div>${item.contextLabel?`<span class="saved-context-label">${esc(item.contextLabel)}</span>`:''}${item.question?`<p class="saved-question">“${esc(item.question)}”</p>`:''}<div class="saved-card-row">${chosen.map(({pick,card})=>`<div class="saved-mini-card">${cardFace(card,pick.reversed)}<span>${esc(card.koreanName)}</span><small>${pick.reversed?'역방향':'정방향'}</small></div>`).join('')}</div><div class="saved-reading-copy"><span>리딩의 핵심</span><strong>${esc(item.headline||item.conclusion||'')}</strong>${item.timing?`<p><b>시기 흐름 · ${esc(item.timing.label)}</b> ${esc(item.timing.range)} · ${esc(item.timing.text)}</p>`:''}${item.action?`<p><b>지금 해볼 것</b> ${esc(item.action)}</p>`:''}</div><a class="saved-reading-again" href="/tarot/${esc(item.slug)}/">같은 주제로 다시 보기 →</a></article>`;
  }).join('');
  empty.hidden=items.length>0;clearButton.hidden=items.length===0;
 }
 savedRoot.addEventListener('click',event=>{const button=event.target.closest('[data-delete-reading]');if(!button)return;removeSavedReading(savedStorage,button.dataset.deleteReading);renderSaved();});
 clearButton?.addEventListener('click',()=>{if(clearSavedReadings(savedStorage))renderSaved();});
 renderSaved();
}


/* Card dictionary discovery + current-page navigation state. */
const cardSearch=document.querySelector('#card-search');
if(cardSearch){
 const groups=[...document.querySelectorAll('.card-library-group')];
 const status=document.querySelector('#card-search-status');
 const normalize=value=>value.toLocaleLowerCase().replace(/\s+/g,'');
 cardSearch.addEventListener('input',()=>{
  const query=normalize(cardSearch.value.trim());let matches=0;
  for(const group of groups){
   let visible=0;
   for(const tile of group.querySelectorAll('.card-library-tile')){
    const match=normalize(tile.textContent).includes(query);
    tile.hidden=!match;
    if(match){visible++;matches++;}
   }
   group.hidden=visible===0;
  }
  if(status)status.textContent=query?(matches?`${matches}장의 카드를 찾았어요.`:'일치하는 카드가 없어요. 다른 이름으로 찾아보세요.'):'';
  const jump=document.querySelector('.card-library-jump');
  if(jump)jump.hidden=Boolean(query);
 });
}
for(const link of document.querySelectorAll('header nav a')){
 const url=new URL(link.href);
 if(url.pathname===location.pathname&&!url.hash)link.setAttribute('aria-current','page');
}

import {positionVoices,themes} from './data/narratives.mjs';
import {cards} from './data/cards.mjs';
import {readings} from './data/readings.mjs';
export function randomInt(max,cryptoSource=globalThis.crypto){
 if(!Number.isSafeInteger(max)||max<1)throw new Error('Invalid random range');
 const limit=Math.floor(4294967296/max)*max;const a=new Uint32Array(1);do{cryptoSource.getRandomValues(a);}while(a[0]>=limit);return a[0]%max;
}
export function shuffleDeck(){const deck=cards.map(c=>({id:c.id,reversed:randomInt(2)===1}));for(let i=deck.length-1;i>0;i--){const j=randomInt(i+1);[deck[i],deck[j]]=[deck[j],deck[i]];}return deck;}
export function dateKey(date=new Date()){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;}
export const storageKey='pickacard:daily:v1';
export function loadDaily(storage,date=dateKey()){try{const d=JSON.parse(storage.getItem(storageKey));if(d?.date===date&&cards.some(c=>c.id===d.card?.id)&&typeof d.card.reversed==='boolean')return d.card;}catch{}return null;}
export function saveDaily(storage,card,date=dateKey()){try{storage.setItem(storageKey,JSON.stringify({date,card}));return true;}catch{return false;}}
export function interpret(slug,pick,index){
 const card=cards.find(c=>c.id===pick.id),position=readings[slug]?.positions[index];
 if(!card||!position)throw new Error('Unknown card or position');
 const [opening,closing]=positionVoices[slug][index];
 const meaning=`${opening} ‘${card.keywords.join(' · ')}’입니다. ${pick.reversed?card.reversed:card.upright}로 읽을 수 있어요.`;
 const context=slug==='yes-no'?`${generalAdvice(card,pick.reversed)} ${closing}`:pick.reversed?`${card.advice} ${closing}`:`${card[position.field]} ${closing}`;
 return {card,position,meaning,context,lens:position.lens,caution:null};
}
const everydayAdvice={
 movement:'시작하기 전에 목적과 감당할 수 있는 속도를 정해보세요.',
 communication:'필요한 정보를 묻고, 이해한 내용을 다시 확인해보세요.',
 reflection:'확인한 사실과 내가 추측한 것을 따로 적어보세요.',
 healing:'무리한 목표보다 편안한 일상을 회복하는 작은 일을 골라보세요.',
 decision:'선택의 기준을 두세 가지로 정한 뒤 현실의 조건과 비교해보세요.',
 attraction:'끌리는 이유를 살피고, 잠깐의 설렘 뒤에도 필요한 일인지 생각해보세요.',
 distance:'지금 내 시간과 에너지를 지키기 위해 필요한 경계를 정해보세요.',
 renewal:'이전 방식을 그대로 반복하기보다 바꿔볼 부분 하나를 찾아보세요.',
 waiting:'기다리는 동안 확인할 조건과 다시 판단할 시점을 정해보세요.',
 closure:'마무리할 일과 다음에 가져갈 것을 구분해보세요.',
 blocked:'부담을 키우는 조건을 찾아 지금 줄일 수 있는 것부터 덜어보세요.',
 conflict:'서로 충돌하는 조건을 적고, 양보할 부분과 지킬 기준을 나누어보세요.'
};
export function generalAdvice(card,reversed=false){return everydayAdvice[(reversed?card.reversedTags:card.tags)[0]];}
export function verdict(picks){const scores=picks.map(p=>p.reversed?Math.min(0,cards.find(c=>c.id===p.id).yesNo):cards.find(c=>c.id===p.id).yesNo);const total=scores.reduce((a,b)=>a+b,0);if(scores.includes(1)&&scores.includes(-1))return '조금 더 지켜볼 필요가 있음';return total>0?'YES에 가까움':total<0?'NO에 가까움':'조금 더 지켜볼 필요가 있음';}
export function spreadSignals(slug,picks){
 const positions=picks.map((pick,index)=>{const card=cards.find(c=>c.id===pick.id);if(!card)throw new Error('Unknown card');return {index,id:card.id,reversed:pick.reversed,tags:pick.reversed?card.reversedTags:card.tags};});
 const totals={};for(const position of positions){position.tags.forEach((tag,i)=>{totals[tag]=(totals[tag]||0)+(i===0?2:1);});}
 const ranked=Object.entries(totals).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]));
 return {positions,totals,ranked};
}
const signalNotes={
 communication:'말을 주고받을 여지가 있어도 서로 같은 뜻으로 이해하는지 확인하는 과정이 필요해요.',
 movement:'움직이고 싶은 힘은 있지만, 속도를 맞추지 않으면 한 사람의 시도로만 남을 수 있어요.',
 attraction:'끌림은 관계를 여는 계기가 될 수 있지만, 지속적인 존중과 약속까지 대신하지는 않아요.',
 healing:'편안함을 회복하는 과정이 중요하게 읽혀요. 좋은 기억보다 지금 실제로 마음이 놓이는지 살펴보세요.',
 decision:'무엇을 선택할지보다 선택의 기준을 먼저 정할 필요가 있어요. 내가 바라는 조건과 현실이 맞는지 비교해보세요.',
 waiting:'속도를 늦추는 주제가 두드러져요. 기다림을 의무로 삼기보다 내 생활을 지키며 확인할 조건을 남겨두세요.',
 reflection:'내 마음과 해석을 정리하는 시간이 중요하게 읽혀요. 혼자 생각한 답과 실제 확인한 내용을 구분해보세요.',
 distance:'거리를 두는 이유와 각자의 경계를 살펴볼 필요가 있어요. 가까워지는 것만이 좋은 변화는 아닐 수 있어요.',
 renewal:'같은 장면을 반복하기보다 다른 방식으로 시작할 조건을 찾는 관점이 어울려요.',
 closure:'기존 방식을 마무리하는 주제가 있어요. 관계의 끝을 확정하기보다 더는 반복하지 않을 행동을 정해보세요.',
 blocked:'부담 때문에 하고 싶은 말이나 행동이 막힐 수 있는 관점이에요. 혼자 힘을 더 쏟는 것이 해결인지 점검해보세요.',
 conflict:'드러난 차이를 덮기보다 어떻게 다룰지 살펴봐야 해요. 누가 옳은지보다 반복되는 상호작용에 집중해보세요.'
};
export function synthesis(slug,picks){
 if(slug==='yes-no'){const direction=verdict(picks);return [`이 질문은 ‘${direction}’으로 읽힙니다. 이는 카드에 부여한 상징적 방향성을 합친 결과이며, 입력한 질문의 사실관계를 분석한 답은 아닙니다.`,picks.length>1?'핵심 카드와 조건 카드가 다른 방향을 가리킨다면 결론을 밀어붙이기보다 아직 확인하지 못한 조건을 찾아보세요.':'한 장의 카드는 질문을 바라볼 한 가지 관점입니다. 마음에 와닿는 조언을 실제로 가능한 작은 행동과 연결해보세요.',[...new Set(picks.map(p=>generalAdvice(cards.find(c=>c.id===p.id),p.reversed)))].join(' '),readings[slug].summary];}
 const practical=['job','money','work','study'];
 if(practical.includes(slug)){
  const signals=spreadSignals(slug,picks),tags=signals.positions.map(p=>p.tags[0]),strongest=signals.ranked[0][0];
  const focusIndex={job:2,money:2,work:1,study:2}[slug],focusText={job:'보완하면 좋은 부분',money:'주의할 소비와 부담',work:'부담과 갈등의 지점',study:'방해가 되는 요소'}[slug];
  const focusPick=picks[Math.min(focusIndex,picks.length-1)],focusCard=cards.find(c=>c.id===focusPick.id);
  const difficult=tags.filter(t=>['blocked','conflict','distance','closure'].includes(t)).length;
  const active=tags.some(t=>['movement','communication','renewal','decision'].includes(t));
  const tone=difficult>=Math.ceil(tags.length/2)?'이번 배열에서는 빠르게 밀어붙이기보다 부담을 줄이고 기본 조건을 정리하는 흐름이 더 두드러집니다.':difficult&&active?'움직일 힘과 현실적인 제약이 함께 보여요. 할 수 있는 일과 지금은 보류할 일을 나누어 보는 편이 좋습니다.':active?'생각을 실제 행동으로 옮길 수 있는 주제가 이어집니다. 큰 결론보다 다음 한 단계에 집중해보세요.':'빠른 결과보다 정리와 준비가 중심이 되는 배열입니다. 지금의 리듬을 점검하고 반복 가능한 방식을 만드는 데 의미가 있어요.';
  return [`${tone} 가장 반복되는 주제는 ‘${themes[strongest]}’입니다. ${generalAdvice(focusCard,focusPick.reversed)}`,`특히 ‘${focusText}’ 위치는 ‘${themes[tags[Math.min(focusIndex,tags.length-1)]]}’로 읽힙니다. 카드의 상징을 실제 일정, 숫자, 경험과 함께 비교해보세요.`,readings[slug].summary];
 }
 const signals=spreadSignals(slug,picks);
 const tags=signals.positions.map(p=>p.tags[0]);
 const obstacleIndex={reunion:2,breakup:1,love:3,feelings:2,contact:1,'reunion-timing':1,'yes-no':1,today:0}[slug];
 const obstacle=tags[Math.min(obstacleIndex,tags.length-1)],end=tags.at(-1),start=tags[0];
 const difficult=tags.filter(t=>['blocked','conflict','distance','closure'].includes(t)).length;
 const active=tags.some(t=>['movement','communication','attraction','renewal'].includes(t));
 const tone=difficult>=Math.ceil(tags.length/2)?'이번 배열에서는 관계를 밀어붙일 가능성보다 부담과 거리의 신호가 더 두드러집니다. 지금 당장 답을 얻으려 애쓰기보다, 나를 소모시키는 방식부터 멈춰볼 필요가 있어요.':difficult&&active?'가까워지고 싶은 방향과 속도를 늦추게 하는 조건이 함께 나타났어요. 마음이 움직이는 것과 실제로 편안하게 관계를 이어갈 수 있는 것은 구분해서 읽는 편이 좋습니다.':active?'이번 배열에는 생각을 행동이나 대화로 옮기는 주제가 이어집니다. 다만 움직임이 있다는 해석을 원하는 결과의 약속으로 받아들이기보다, 작게 시도한 뒤 실제 반응을 살피는 관점으로 읽어주세요.':'이번 배열에서는 빠른 진전보다 마음과 생활을 정리하는 과정이 중심이 됩니다. 겉으로 변화가 적어도 내 기준과 필요한 거리를 분명히 하는 시간이 의미 있을 수 있어요.';
 const bridge=start===end?`처음과 끝에 ‘${themes[start]}’ 주제가 반복됩니다. 한 번의 계기보다 이 주제를 일상에서 어떻게 다루는지가 더 중요하게 읽혀요.`:`현재를 비추는 첫 위치의 ‘${themes[start]}’, 마지막 위치의 ‘${themes[end]}’ 주제를 함께 보면 현재와 이후에 필요한 태도가 다를 수 있어요. 앞의 상황을 곧바로 결론으로 삼기보다 중간에 놓인 조건을 함께 살펴보세요.`;
 const focus={reunion:'다시 만나는 데 걸리는 조건',breakup:'갈등을 다룰 때의 핵심',love:'기대 속에서 놓치기 쉬운 부분',feelings:'확인되지 않은 채 남아 있는 주제',contact:'소통을 어렵게 하는 조건','reunion-timing':'달력보다 먼저 달라져야 할 조건','yes-no':'선택 전에 점검할 조건',today:'오늘 기억할 태도'}[slug];
 const strongest=signals.ranked[0][0],support=signals.ranked[1]?.[0];
 const combined=strongest===support||!support?signalNotes[strongest]:`${signalNotes[strongest]} 함께 나타난 ‘${themes[support]}’ 주제도 이 과정을 서두르지 않도록 돌아보게 합니다.`;
 return [`${tone} ${combined}`,`${bridge} 여기서 ‘${focus}’에 해당하는 주제는 ‘${themes[obstacle]}’입니다. ${cards.find(c=>c.id===picks[Math.min(obstacleIndex,picks.length-1)].id).advice}`,readings[slug].summary];
}
// Future premium adapters may accept this DTO. No remote provider or API client in v0.1.
export function readingSnapshot(slug,picks,question=''){return {version:2,locale:'ko',readingType:slug,question,selectedCards:picks.map(p=>({...p})),positions:readings[slug].positions.slice(0,picks.length).map(p=>p.label),interpretations:picks.map((p,i)=>interpret(slug,p,i)),summary:synthesis(slug,picks)};}

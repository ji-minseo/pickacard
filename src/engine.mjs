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
 const meaning=`‘${position.label}’ 자리에서 살펴볼 주제는 ‘${card.keywords.join(' · ')}’입니다. 카드의 상징을 현재 상황에 적용하면, ${pick.reversed?card.reversed:card.upright}로 읽을 수 있어요.`;
 const context=pick.reversed?`이 역방향의 의미가 실제 상황과 닮았다면, 지금은 다음 조언을 작은 행동으로 옮겨보세요. ${card.advice} ${closing}`:`${card[position.field]} ${closing}`;
 return {card,position,meaning,context,lens:position.lens,caution:null};
}
export function verdict(picks){const scores=picks.map(p=>p.reversed?Math.min(0,cards.find(c=>c.id===p.id).yesNo):cards.find(c=>c.id===p.id).yesNo);const total=scores.reduce((a,b)=>a+b,0);if(scores.includes(1)&&scores.includes(-1))return '조금 더 지켜볼 필요가 있음';return total>0?'YES에 가까움':total<0?'NO에 가까움':'조금 더 지켜볼 필요가 있음';}
export function synthesis(slug,picks){
 if(slug==='yes-no'){const direction=verdict(picks);return [`이 질문은 ‘${direction}’으로 읽힙니다. 이는 카드에 부여한 상징적 방향성을 합친 결과이며, 입력한 질문의 사실관계를 분석한 답은 아닙니다.`,picks.length>1?'핵심 카드와 조건 카드가 다른 방향을 가리킨다면 결론을 밀어붙이기보다 아직 확인하지 못한 조건을 찾아보세요.':'한 장의 카드는 질문을 바라볼 한 가지 관점입니다. 마음에 와닿는 조언을 실제로 가능한 작은 행동과 연결해보세요.',picks.map(p=>cards.find(c=>c.id===p.id).advice).join(' '),readings[slug].summary];}
 const tags=picks.map(p=>{const c=cards.find(c=>c.id===p.id);return (p.reversed?c.reversedTags:c.tags)[0]});
 const obstacleIndex={reunion:2,breakup:1,love:3,feelings:2,contact:1,'reunion-timing':1,'yes-no':1,today:0}[slug];
 const obstacle=tags[Math.min(obstacleIndex,tags.length-1)],end=tags.at(-1),start=tags[0];
 const difficult=tags.filter(t=>['blocked','conflict','distance','closure'].includes(t)).length;
 const active=tags.some(t=>['movement','communication','attraction','renewal'].includes(t));
 const tone=difficult>=Math.ceil(tags.length/2)?'이번 배열에서는 관계를 밀어붙일 가능성보다 부담과 거리의 신호가 더 두드러집니다. 지금 당장 답을 얻으려 애쓰기보다, 나를 소모시키는 방식부터 멈춰볼 필요가 있어요.':difficult&&active?'가까워지고 싶은 방향과 속도를 늦추게 하는 조건이 함께 나타났어요. 마음이 움직이는 것과 실제로 편안하게 관계를 이어갈 수 있는 것은 구분해서 읽는 편이 좋습니다.':active?'이번 배열에는 생각을 행동이나 대화로 옮기는 주제가 이어집니다. 다만 움직임이 있다는 해석을 원하는 결과의 약속으로 받아들이기보다, 작게 시도한 뒤 실제 반응을 살피는 관점으로 읽어주세요.':'이번 배열에서는 빠른 진전보다 마음과 생활을 정리하는 과정이 중심이 됩니다. 겉으로 변화가 적어도 내 기준과 필요한 거리를 분명히 하는 시간이 의미 있을 수 있어요.';
 const bridge=start===end?`처음과 끝에 ‘${themes[start]}’이라는 주제가 반복됩니다. 한 번의 계기보다 이 주제를 일상에서 어떻게 다루는지가 더 중요하게 읽혀요.`:`현재를 비추는 첫 위치의 ‘${themes[start]}’, 마지막 위치의 ‘${themes[end]}’을 함께 보면 현재와 이후에 필요한 태도가 다를 수 있어요. 앞의 상황을 곧바로 결론으로 삼기보다 중간에 놓인 조건을 함께 살펴보세요.`;
 const focus={reunion:'다시 만나는 데 걸리는 조건',breakup:'갈등을 다룰 때의 핵심',love:'기대 속에서 놓치기 쉬운 부분',feelings:'확인되지 않은 채 남아 있는 주제',contact:'소통을 어렵게 하는 조건','reunion-timing':'달력보다 먼저 달라져야 할 조건','yes-no':'선택 전에 점검할 조건',today:'오늘 기억할 태도'}[slug];
 return [tone,`${bridge} ${focus}은 ‘${themes[obstacle]}’입니다. ${cards.find(c=>c.id===picks[Math.min(obstacleIndex,picks.length-1)].id).advice}`,readings[slug].summary];
}
// Future premium adapters may accept this DTO. No remote provider or API client in v0.1.
export function readingSnapshot(slug,picks,question=''){return {version:2,locale:'ko',readingType:slug,question,selectedCards:picks.map(p=>({...p})),positions:readings[slug].positions.slice(0,picks.length).map(p=>p.label),interpretations:picks.map((p,i)=>interpret(slug,p,i)),summary:synthesis(slug,picks)};}

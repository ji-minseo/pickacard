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
export function interpret(slug,pick,index){const card=cards.find(c=>c.id===pick.id),position=readings[slug]?.positions[index];if(!card||!position)throw new Error('Unknown card or position');return {card,position,meaning:`이 리딩에서는 ${pick.reversed?card.reversed:card.upright}로 읽습니다.`,context:card[position.field],lens:position.lens,caution:pick.reversed?'역방향은 나쁜 결과라는 뜻이 아닙니다. 이 주제가 막히거나 과해진 부분부터 살펴보세요.':null};}
export function verdict(picks){const scores=picks.map(p=>p.reversed?Math.min(0,cards.find(c=>c.id===p.id).yesNo):cards.find(c=>c.id===p.id).yesNo);const total=scores.reduce((a,b)=>a+b,0);if(scores.includes(1)&&scores.includes(-1))return '조금 더 지켜볼 필요가 있음';return total>0?'YES에 가까움':total<0?'NO에 가까움':'조금 더 지켜볼 필요가 있음';}
export function synthesis(slug,picks){const first=cards.find(c=>c.id===picks[0].id),last=cards.find(c=>c.id===picks.at(-1).id);const direction=picks.filter(p=>p.reversed).length;return [`첫 카드 ‘${first.koreanName}’의 ${first.keywords[0]}에서 출발해, 마지막 카드 ‘${last.koreanName}’의 ${last.keywords[0]}까지 연결해 보세요. ${first.keywords[0]}에 대한 나의 현재 태도가 ‘${last.keywords[0]}’이라는 주제를 바라보는 방식에 어떤 영향을 주는지 생각해 볼 수 있습니다.`,direction>picks.length/2?'역방향이 많이 나온 이번 리딩은 더 노력하라는 주문보다, 힘이 과하게 들어가거나 멈춰 있는 부분을 먼저 점검하는 관점으로 읽어주세요.':'서로 다른 카드의 메시지가 엇갈리면 하나의 결론에 맞추기보다 현재 상황의 여러 면으로 받아들여 주세요.',readings[slug].summary];}
// Future premium adapters may accept this DTO. No remote provider or API client in v0.1.
export function readingSnapshot(slug,picks){return {version:1,locale:'ko',type:slug,cards:picks.map(p=>({...p})),positions:readings[slug].positions.slice(0,picks.length).map(p=>p.label)};}

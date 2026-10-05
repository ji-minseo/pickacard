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
const concreteScenes={
 love:{
  movement:'소개나 만남 제안이 늘거나, 먼저 대화를 이어가고 싶어지는 식으로 관계가 실제 행동으로 움직일 수 있어요.',
  communication:'연락 텀이 줄고 대화가 자연스럽게 이어지는 등 말이 오가는 흐름으로 나타날 수 있어요.',
  attraction:'눈길이 가는 사람이 생기거나, 이미 아는 사람에게 설렘이 커지는 식으로 나타날 수 있어요.',
  healing:'연애보다 내 컨디션과 감정 회복이 먼저 좋아지면서 사람을 보는 기준도 차분해질 수 있어요.',
  decision:'썸을 이어갈지, 관계를 분명히 할지처럼 애매함을 정리해야 하는 장면이 생길 수 있어요.',
  waiting:'연락은 오가지만 관계가 쉽게 정의되지 않거나, 서로의 타이밍이 엇갈리는 식으로 나타날 수 있어요.',
  reflection:'새 사람을 만나기 전 과거 연애 패턴이나 내가 원하는 관계를 다시 생각하게 될 수 있어요.',
  distance:'호감은 있어도 연락·만남이 뜸하거나, 한쪽이 감정적으로 거리를 두는 모습으로 나타날 수 있어요.',
  renewal:'기존 취향과 다른 사람에게 끌리거나, 예전과 다른 방식으로 연애를 시작해볼 수 있어요.',
  closure:'미련 남은 관계나 애매한 썸을 정리해야 새 흐름이 들어오는 장면으로 나타날 수 있어요.',
  blocked:'호감은 있어도 일정·자신감·상대 상황 같은 현실 조건 때문에 진전이 막힐 수 있어요.',
  conflict:'좋아하는 마음은 있어도 연락 방식이나 관계 기대치가 달라 부딪히는 식으로 나타날 수 있어요.'
 },
 reunion:{
  movement:'누군가 먼저 안부를 묻거나 만남을 제안하는 식으로 멈췄던 관계가 다시 움직일 수 있어요.',
  communication:'짧은 안부, 답장 재개, 미뤄둔 대화처럼 끊겼던 소통이 다시 이어지는 장면으로 나타날 수 있어요.',
  attraction:'그리움이나 미련은 남아 있어 다시 보고 싶다는 마음이 커질 수 있지만, 그것만으로 재회가 결정되지는 않아요.',
  healing:'감정이 가라앉고 서로를 덜 방어적으로 볼 수 있게 되면서 대화 가능성이 생길 수 있어요.',
  decision:'다시 만날지 완전히 정리할지, 한쪽 또는 양쪽이 관계의 결론을 정하려는 흐름으로 나타날 수 있어요.',
  waiting:'서로 생각은 있지만 먼저 연락하지 않거나, 답장과 행동이 늦어지는 식으로 정체될 수 있어요.',
  reflection:'과거 대화나 헤어진 이유를 반복해서 되짚지만 실제 행동은 아직 없는 상태일 수 있어요.',
  distance:'연락 단절, 차단, SNS만 확인하는 식으로 마음보다 거리가 더 크게 느껴질 수 있어요.',
  renewal:'사과, 연락 방식 변경, 이전 갈등에 대한 새로운 약속처럼 예전과 다른 방식이 생겨야 움직일 수 있어요.',
  closure:'상대나 내가 관계를 정리하려는 행동을 하고 있을 수 있어요. 이 경우 재회보다 마무리 쪽이 더 강합니다.',
  blocked:'자존심, 새로운 상대, 일정, 반복된 상처 같은 현실적인 걸림돌이 재접근을 막고 있을 수 있어요.',
  conflict:'연락해도 같은 싸움이나 신뢰 문제로 다시 부딪힐 가능성이 커, 감정보다 문제 해결이 먼저인 흐름이에요.'
 },
 job:{
  movement:'이력서 수정, 지원 시작, 면접 준비처럼 멈춰 있던 취준이 실제 행동으로 넘어가는 흐름이에요.',
  communication:'면접·과제·리크루터 연락처럼 내 경험을 말로 설명하고 보여주는 과정이 중요해질 수 있어요.',
  reflection:'지원 수를 늘리기보다 포트폴리오와 경험을 다시 정리하면서 방향을 잡는 시간이 필요해 보여요.',
  healing:'취준 피로가 누적됐다면 잠깐 회복해야 오히려 준비 효율이 올라가는 흐름이에요.',
  decision:'직무, 회사 규모, 연봉·근무조건 중 무엇을 우선할지 기준을 정해야 지원이 선명해질 수 있어요.',
  attraction:'회사 이름이나 직무 이미지에 끌리기보다 실제 업무와 내가 원하는 경험이 맞는지 확인할 필요가 있어요.',
  distance:'원하는 직무와 현재 경험 사이 간격이 느껴질 수 있어, 한 단계 현실적인 지원 전략이 필요해 보여요.',
  renewal:'지원 방식, 포트폴리오 구성, 자소서 문장처럼 기존 방식을 바꾸면 흐름이 살아날 수 있어요.',
  waiting:'지원 결과만 기다리기보다 다음 지원을 준비하는 편이 유리한 흐름이에요.',
  closure:'맞지 않는 직무나 준비 방식을 접고, 더 가능성 있는 방향에 시간을 몰아줄 때일 수 있어요.',
  blocked:'포트폴리오 미완성, 경험 정리 부족, 지원 미루기처럼 한 가지 막힘이 전체 진행을 늦추고 있을 수 있어요.',
  conflict:'하고 싶은 일과 현실 조건이 충돌해 지원 자체가 흔들릴 수 있어요. 우선순위를 정해야 해요.'
 },
 money:{
  movement:'새 수입원을 찾거나 고정비를 줄이는 등 돈의 흐름을 실제로 바꾸는 행동이 필요한 때예요.',
  communication:'정산, 계약, 급여, 비용 분담처럼 돈 이야기를 명확히 확인해야 손해를 줄일 수 있어요.',
  reflection:'이번 달 지출 내역을 다시 보면서 왜 썼는지까지 확인하면 새는 돈이 보일 수 있어요.',
  healing:'스트레스 소비나 보상 소비가 있다면 먼저 생활 리듬을 안정시키는 게 돈 관리에도 도움이 돼요.',
  decision:'살지 말지, 유지할지 줄일지처럼 지출 기준을 명확히 정해야 흐름이 잡혀요.',
  attraction:'예뻐서, 갖고 싶어서, 놓치기 싫어서 쓰는 돈이 커질 수 있어 충동 지출을 특히 조심해야 해요.',
  distance:'당장 쓰지 않아도 되는 돈을 분리해 두거나, 카드·쇼핑앱과 거리를 두는 방식이 효과적일 수 있어요.',
  renewal:'예산 방식이나 저축 구조를 바꾸면 관리가 훨씬 쉬워질 수 있어요.',
  waiting:'큰 구매나 투자 판단은 서두르기보다 며칠 두고 다시 보는 편이 나은 흐름이에요.',
  closure:'안 쓰는 구독, 반복되는 소액 결제, 필요 없는 고정비를 정리할 타이밍이에요.',
  blocked:'예상치 못한 지출이나 고정비 부담 때문에 여유 자금이 묶일 수 있어요.',
  conflict:'쓰고 싶은 마음과 모아야 한다는 압박이 충돌해, 기준 없이 왔다 갔다 할 수 있어요.'
 },
 work:{
  movement:'새 업무를 맡거나 이직 준비를 시작하는 등 커리어가 정체에서 행동으로 넘어갈 수 있어요.',
  communication:'상사·동료와 역할, 일정, 기대치를 명확히 말하는 것이 문제 해결의 핵심이 될 수 있어요.',
  reflection:'지금 힘든 게 회사 전체 때문인지 특정 업무·사람 때문인지 구분해보는 시간이 필요해요.',
  healing:'번아웃이나 피로가 누적됐다면 성과보다 회복과 업무량 조정이 먼저일 수 있어요.',
  decision:'남을지 옮길지보다 어떤 조건이면 남고 어떤 조건이면 떠날지 기준을 정해야 해요.',
  attraction:'새 회사나 새로운 역할이 매력적으로 보여도 실제 업무 강도와 보상 조건을 함께 봐야 해요.',
  distance:'업무와 감정을 분리하거나, 불필요한 인간관계 갈등에서 한 발 물러나는 게 도움이 될 수 있어요.',
  renewal:'업무 방식, 역할 분담, 이직 준비처럼 지금과 다른 방식을 시도해야 흐름이 바뀔 수 있어요.',
  waiting:'승진·이직 결과만 기다리기보다 지금 경력에 남길 성과를 하나 더 만드는 편이 좋아요.',
  closure:'끝낼 프로젝트, 내려놓을 역할, 정리할 관계를 분명히 해야 다음 단계로 갈 수 있어요.',
  blocked:'권한 부족, 애매한 역할, 과도한 업무량 같은 구조적 문제가 발목을 잡고 있을 수 있어요.',
  conflict:'업무 방식이나 책임 범위를 두고 반복적으로 부딪히는 상황이 이어질 수 있어요.'
 },
 study:{
  movement:'계획만 세우던 상태에서 실제 문제 풀이, 복습, 모의고사처럼 손을 움직이는 공부가 필요한 때예요.',
  communication:'선생님·스터디·질문 게시판처럼 모르는 부분을 바로 묻고 피드백 받는 방식이 효율을 높일 수 있어요.',
  reflection:'공부 시간을 늘리기보다 틀린 문제와 집중이 깨지는 패턴을 먼저 분석하는 편이 좋아요.',
  healing:'수면 부족과 피로가 심하면 공부량을 늘리는 것보다 컨디션을 회복하는 게 점수에도 도움이 돼요.',
  decision:'과목별 우선순위, 시험 범위, 목표 점수처럼 무엇을 먼저 잡을지 기준을 정해야 해요.',
  attraction:'새 교재나 공부법을 계속 찾기보다 지금 가진 자료를 끝까지 쓰는 편이 더 효과적일 수 있어요.',
  distance:'휴대폰, 게임, SNS처럼 집중을 끊는 환경과 물리적으로 거리를 두는 게 필요할 수 있어요.',
  renewal:'시간표나 복습 방식이 안 맞았다면 공부 루틴 자체를 바꿔야 흐름이 살아날 수 있어요.',
  waiting:'결과를 걱정하며 멈춰 있기보다 오늘 할 분량을 끝내는 편이 불안을 줄여줘요.',
  closure:'효율이 떨어지는 공부법이나 끝없이 미뤄온 범위를 정리하고 새 계획으로 넘어갈 때예요.',
  blocked:'완벽하게 해야 한다는 압박, 피로, 계획 과다 때문에 시작 자체가 늦어질 수 있어요.',
  conflict:'해야 할 공부와 하고 싶은 일이 계속 충돌해 집중이 흔들릴 수 있어요. 시간 경계를 분명히 잡아야 해요.'
 }
};
export function situationExample(slug,pick,index){
 const card=cards.find(c=>c.id===pick.id);if(!card||!readings[slug]?.positions[index])return null;
 const tag=(pick.reversed?card.reversedTags:card.tags)[0];
 return concreteScenes[slug]?.[tag]||null;
}
export function readingHeadline(slug,picks){
 if(!Array.isArray(picks)||!picks.length)return null;
 const supported=['love','reunion','job','money','work','study'];if(!supported.includes(slug))return null;
 const tags=picks.map(p=>{const card=cards.find(c=>c.id===p.id);return (p.reversed?card.reversedTags:card.tags)[0];});
 const difficult=tags.filter(t=>['blocked','conflict','distance','closure'].includes(t)).length;
 const active=tags.filter(t=>['movement','communication','attraction','renewal'].includes(t)).length;
 const mostlyDifficult=difficult>=Math.ceil(tags.length/2),moving=active>=Math.ceil(tags.length/3);
 if(slug==='love')return mostlyDifficult?'지금 연애 흐름은 새로운 시작보다 관계 기준과 경계를 정리하는 쪽이 더 강합니다.':moving&&difficult===0?'연애 흐름은 꽤 열려 있습니다. 만남이나 대화가 실제로 움직일 가능성이 있는 배열이에요.':moving?'호감과 기회는 있는데, 애매한 관계나 현실 조건이 발목을 잡을 수 있어요.':'빠른 진전보다 사람을 천천히 보고 내 기준을 세우는 흐름입니다.';
 if(slug==='reunion')return mostlyDifficult?'현재 흐름만 보면 재회를 밀어붙이기보다 정리와 거리두기 쪽이 더 강합니다.':moving&&difficult===0?'재회 가능성은 닫혀 있지 않습니다. 실제 대화나 재접촉으로 이어질 여지가 있는 배열이에요.':moving?'마음이나 연결의 여지는 남아 있지만, 지금 그대로 다시 만나면 같은 문제가 반복될 가능성이 큽니다.':'그리움은 남아 있어도 실제 재접촉으로 이어질 힘은 아직 약한 편입니다.';
 if(slug==='job')return mostlyDifficult?'지금은 지원 수를 늘리기보다 준비의 구멍을 먼저 메우는 쪽이 유리합니다.':moving&&difficult===0?'지금은 준비만 더 하기보다 실제 지원으로 넘어가도 좋은 흐름입니다.':moving?'기회는 열려 있지만, 한 가지 보완점이 결과를 크게 좌우할 수 있어요.':'서두르기보다 방향을 정리한 뒤 지원하는 편이 유리합니다.';
 if(slug==='money')return mostlyDifficult?'지금 금전 흐름은 늘리기보다 새는 돈을 막는 쪽이 우선입니다.':moving&&difficult===0?'돈의 흐름을 바꿀 여지는 있습니다. 다만 들어오는 돈만큼 관리 기준도 같이 세워야 해요.':moving?'들어오는 것과 나가는 것이 함께 커질 수 있어 관리가 핵심입니다.':'큰 변화보다 예산을 정리하고 지키는 쪽이 맞는 흐름입니다.';
 if(slug==='work')return mostlyDifficult?'지금 직장에서는 버티는 힘보다 구조적인 부담을 줄이는 게 먼저입니다.':moving&&difficult===0?'업무나 커리어를 실제로 움직여볼 만한 흐름입니다. 역할 변화나 이직 준비도 현실적으로 검토해볼 수 있어요.':moving?'변화의 기회는 있지만, 현재의 부담을 그대로 안고 움직이면 피로가 반복될 수 있어요.':'큰 결정보다 내가 원하는 업무 조건부터 선명하게 만드는 게 먼저입니다.';
 return mostlyDifficult?'지금은 공부량을 더 늘리기보다 집중을 깨는 원인부터 줄이는 게 우선입니다.':moving&&difficult===0?'공부 흐름은 살아 있습니다. 계획보다 실제 문제 풀이와 복습으로 밀어붙여도 좋은 때예요.':moving?'의욕은 있는데 집중을 끊는 요소가 함께 보여요. 루틴 하나만 바로잡아도 체감이 달라질 수 있어요.':'새 계획을 늘리기보다 지금 방식이 왜 안 굴러가는지 먼저 점검하는 편이 좋아요.';
}
export function interpret(slug,pick,index){
 const card=cards.find(c=>c.id===pick.id),position=readings[slug]?.positions[index];
 if(!card||!position)throw new Error('Unknown card or position');
 const [opening,closing]=positionVoices[slug][index];
 const meaning=`${opening} ‘${card.keywords.join(' · ')}’입니다. ${pick.reversed?card.reversed:card.upright}로 읽을 수 있어요.`;
 const context=slug==='yes-no'?`${generalAdvice(card,pick.reversed)} ${closing}`:pick.reversed?`${card.advice} ${closing}`:`${card[position.field]} ${closing}`;
 const example=situationExample(slug,pick,index);
 return {card,position,meaning,context,example,lens:position.lens,caution:null};
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

import {cards} from '../src/data/cards.mjs';
import {readings} from '../src/data/readings.mjs';
import {themes} from '../src/data/narratives.mjs';
import {spreadSignals,readingHeadline,combinationInsights,nextAction,contextualInsight,synthesis} from '../src/engine.mjs';
import {resolveQuestionFocus,reconcileQuestionReading} from '../src/question-focus.mjs';

const supported=new Set(['love','reunion','feelings','breakup']);
const openTags=new Set(['movement','communication','attraction','renewal','healing']);
const guardedTags=new Set(['blocked','conflict','distance','closure','waiting']);
const neutralTags=new Set(['reflection','decision']);

const slugCopy={
 love:{
  subject:'연애 흐름',
  positive:'관계를 열거나 움직이게 하는 신호가 더 많아요.',
  mixed:'설렘과 현실적인 제약이 같이 보여요.',
  guarded:'지금은 새 관계를 밀기보다 기준과 경계를 먼저 정리하는 편이 맞아요.',
  checks:['상대의 말보다 실제 약속과 행동이 이어지는지','내가 원하는 관계 조건을 계속 낮추고 있지는 않은지','설렘과 편안함이 함께 있는지']
 },
 reunion:{
  subject:'재회 흐름',
  positive:'재접촉이나 대화의 여지는 있지만, 예전 문제의 변화가 전제되어야 해요.',
  mixed:'그리움이나 연결의 신호와 다시 막힐 조건이 함께 보여요.',
  guarded:'다시 만나는 것보다 거리와 정리의 신호가 더 강합니다.',
  checks:['연락이 닿는 것과 관계 회복을 같은 뜻으로 보고 있지 않은지','헤어진 원인이 실제 행동으로 달라졌는지','상대의 명확한 경계와 동의를 존중하고 있는지']
 },
 feelings:{
  subject:'속마음 리딩',
  positive:'호감·관심·소통을 떠올리게 하는 상징이 상대적으로 많이 보여요.',
  mixed:'관심과 부담의 상징이 같이 있어 한쪽으로 단정하기 어려워요.',
  guarded:'거리·부담·정리의 상징이 더 강해 보여요.',
  checks:['말투나 연락 빈도보다 실제로 관계를 이어가려는 행동이 있는지','내가 확인한 사실과 추측을 구분했는지','상대의 감정을 카드가 증명한다고 받아들이고 있지 않은지']
 },
 breakup:{
  subject:'이별 흐름',
  positive:'관계를 다시 조정하거나 회복할 수 있는 여지는 남아 있어요.',
  mixed:'이어갈 이유와 멈춰야 할 신호가 같이 보여요.',
  guarded:'관계를 붙잡는 것보다 내 경계와 회복을 우선해야 할 신호가 더 강합니다.',
  checks:['같은 갈등이 반복될 때 실제 해결 방식이 달라졌는지','관계를 유지하기 위해 내 기준을 계속 포기하고 있지는 않은지','이미 이별 후라면 상대의 반응보다 내 일상이 회복되고 있는지']
 }
};

function cardFor(pick){return cards.find(card=>card.id===pick.id);}
function primaryTag(pick){const card=cardFor(pick);return (pick.reversed?card.reversedTags:card.tags)[0];}
function orientation(pick){return pick.reversed?'역방향':'정방향';}

function balanceSummary(slug,tags){
 const open=tags.filter(tag=>openTags.has(tag)).length;
 const guarded=tags.filter(tag=>guardedTags.has(tag)).length;
 const neutral=tags.filter(tag=>neutralTags.has(tag)).length;
 const copy=slugCopy[slug];
 const tone=guarded>open?copy.guarded:open>guarded?copy.positive:copy.mixed;
 return {open,guarded,neutral,tone};
}

function evidenceRows(slug,picks,signals){
 const positions=readings[slug].positions;
 const ranked=signals.ranked.slice(0,3).map(([tag])=>tag);
 const rows=[];
 for(const tag of ranked){
  const index=picks.findIndex(pick=>primaryTag(pick)===tag);
  if(index<0)continue;
  const card=cardFor(picks[index]);
  rows.push({
   position:positions[index]?.label||`카드 ${index+1}`,
   card:card.koreanName,
   orientation:orientation(picks[index]),
   tag,
   theme:themes[tag]||tag,
   reason:`${card.koreanName} ${orientation(picks[index])}은 이번 배열에서 ‘${themes[tag]||tag}’ 주제를 강하게 보태요. ${card.advice}`
  });
 }
 return rows;
}

function tensionSummary(slug,picks){
 const tags=picks.map(primaryTag);
 let openIndex=tags.findIndex(tag=>openTags.has(tag));
 let guardedIndex=tags.findIndex(tag=>guardedTags.has(tag));
 if(openIndex<0||guardedIndex<0)return null;
 const openCard=cardFor(picks[openIndex]),guardedCard=cardFor(picks[guardedIndex]);
 return {
  title:`${openCard.koreanName} ↔ ${guardedCard.koreanName}`,
  text:`한쪽에는 ‘${themes[tags[openIndex]]}’처럼 움직이려는 힘이, 다른 쪽에는 ‘${themes[tags[guardedIndex]]}’처럼 속도를 늦추는 조건이 함께 있어요. 좋은 신호 하나만 보거나 어려운 카드 하나만 보고 결론내리기보다, 실제 행동이 어느 쪽을 반복하는지 확인하는 게 핵심입니다.`
 };
}

function actionPlan(slug,picks,situation,focus){
 const base=nextAction(slug,picks,situation);
 const plans=[base].filter(Boolean);
 if(focus?.action&&!plans.includes(focus.action))plans.push(focus.action);
 const dominant=spreadSignals(slug,picks).ranked[0]?.[0];
 const byTag={
  movement:'생각만 반복하지 말고 오늘 확인 가능한 행동 하나를 정하세요.',
  communication:'확인하고 싶은 내용을 한 문장으로 줄여 실제 대화 가능성을 보세요.',
  attraction:'끌림의 크기보다 나를 편하게 존중하는 행동이 있는지 확인하세요.',
  renewal:'예전과 같은 방식으로 반복하지 않을 변화 한 가지를 정하세요.',
  healing:'결론을 서두르기보다 내 컨디션과 일상을 먼저 안정시키세요.',
  decision:'계속할 조건과 멈출 조건을 각각 두 가지씩 적으세요.',
  reflection:'확인한 사실과 내가 상상한 부분을 따로 적어보세요.',
  waiting:'무기한 기다리지 않도록 내가 다시 판단할 시점을 정하세요.',
  distance:'상대나 나에게 필요한 거리를 행동으로 지키세요.',
  closure:'더는 반복하고 싶지 않은 행동이나 기대 하나를 정리하세요.',
  blocked:'가장 현실적인 걸림돌 하나를 특정하고 바뀔 수 있는 조건인지 확인하세요.',
  conflict:'누가 맞는지보다 반복되는 충돌을 줄일 규칙 하나를 정하세요.'
 }[dominant];
 if(byTag&&!plans.includes(byTag))plans.push(byTag);
 return plans.slice(0,3);
}

function avoidPlan(slug,tags){
 const items=[];
 if(tags.some(tag=>guardedTags.has(tag)))items.push('좋은 카드 한 장만 근거로 불편한 현실 신호를 무시하지 않기');
 if(slug==='feelings')items.push('상대의 감정을 카드가 사실처럼 확인해줬다고 단정하지 않기');
 if(slug==='reunion')items.push('재접촉 자체를 재회 성공이나 상대의 동의로 해석하지 않기');
 if(slug==='breakup')items.push('관계를 유지하기 위해 내 안전·경계·존중 기준을 낮추지 않기');
 if(slug==='love')items.push('끌림 때문에 행동의 일관성이나 현실적인 조건을 건너뛰지 않기');
 return items.slice(0,3);
}

export function createDeepReading({slug,picks,question='',situation=''}){
 if(!supported.has(slug))throw new Error('Deep Reading is not available for this reading');
 if(!Array.isArray(picks)||picks.length!==readings[slug].positions.length)throw new Error('Complete spread required');
 const signals=spreadSignals(slug,picks);
 const tags=picks.map(primaryTag);
 const focus=resolveQuestionFocus(slug,question,situation,picks);
 const context=contextualInsight(slug,situation,picks);
 const baseReading={
  headline:readingHeadline(slug,picks,situation),
  timing:null,
  action:nextAction(slug,picks,situation),
  combinations:combinationInsights(slug,picks),
  summaryLines:synthesis(slug,picks)
 };
 const reconciled=reconcileQuestionReading(slug,focus,picks,baseReading);
 const balance=balanceSummary(slug,tags);
 const evidence=evidenceRows(slug,picks,signals);
 const tension=tensionSummary(slug,picks);
 const actions=actionPlan(slug,picks,situation,focus);
 const avoid=avoidPlan(slug,tags);
 const checks=slugCopy[slug].checks;
 return {
  version:1,
  product:'deep-reading',
  slug,
  readingName:readings[slug].name,
  question,
  situation,
  headline:reconciled.headline,
  decisiveSummary:`${slugCopy[slug].subject}을 한 문장으로 정리하면: ${balance.tone}`,
  balance,
  evidence,
  tension,
  questionFocus:focus,
  context,
  combinations:reconciled.combinations.slice(0,3),
  actions,
  avoid,
  realityChecks:checks,
  closing:[
   `지금 흐름: ${balance.tone}`,
   `가장 중요한 변수: ${evidence[0]?.theme||'현재 행동과 현실 조건'}`,
   `지금 할 일: ${actions[0]||'내가 확인할 수 있는 현실 신호부터 하나 정리하세요.'}`
  ]
 };
}

export const deepReadingSupported=[...supported];

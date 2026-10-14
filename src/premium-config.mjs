export const deepReadingOffer={
 id:'deep-reading-v1',
 name:'심층 리딩',
 englishName:'DEEP READING',
 price:4900,
 currency:'KRW',
 supported:['love','reunion','feelings','breakup'],
 checkoutReady:false,
 checkoutUrl:'',
 features:[
  '카드 전체의 찬성·경계 신호를 한 번에 정리',
  '가장 강한 카드와 서로 충돌하는 카드 분석',
  '내 질문과 현재 상황에 맞춘 심층 해석',
  '지금 해볼 것 · 하지 않는 게 좋은 것 · 확인할 현실 신호',
  '마지막 3줄 결론'
 ]
};

export const supportsDeepReading=slug=>deepReadingOffer.supported.includes(slug);

export function deepReadingLabel(slug){
 const names={love:'연애운',reunion:'재회운',feelings:'상대방 속마음',breakup:'이별운'};
 return names[slug]||'타로';
}

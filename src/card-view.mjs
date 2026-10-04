export const artwork={'major-0':'fool','major-6':'lovers','major-16':'tower','major-18':'moon','major-19':'sun'};
const roman=['0','I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII','XIII','XIV','XV','XVI','XVII','XVIII','XIX','XX','XXI'];
export function cardNumber(c){return c.arcana==='major'?roman[c.number]:({Page:'PAGE',Knight:'KNIGHT',Queen:'QUEEN',King:'KING',Ace:'ACE'}[c.rank]||String(c.number));}
const marks={wands:'Ⅰ',cups:'∪',swords:'†',pentacles:'◇'};
export function cardArt(c,reversed=false){const file=artwork[c.id];return file?`<img src="/artwork/${file}-small.webp" srcset="/artwork/${file}-small.webp 192w, /artwork/${file}.webp 384w" sizes="(max-width:520px) 100px, 140px" width="384" height="576" loading="lazy" decoding="async" alt="${c.koreanName} 카드 일러스트">`:`<span class="deck-glyph" aria-hidden="true">${c.arcana==='major'?roman[c.number]:marks[c.suit]}<small>${c.arcana==='major'?'ARCANA':c.suit.toUpperCase()}</small></span>`;}
export function cardFace(c,reversed=false){return `<div class="mini-card ${reversed?'is-reversed':''}"><span class="roman">${cardNumber(c)}</span>${cardArt(c,reversed)}<strong>${c.koreanName}</strong></div>`;}

// LOCAL ONLY: run after build; subsequent clean build removes every qa-* file.
import {readFile,writeFile} from 'node:fs/promises';
import {cards} from '../src/data/cards.mjs';
import {cardFace} from '../src/card-view.mjs';
const html=await readFile('dist/tarot/reunion/index.html','utf8');
const prototype=['major-0','major-6','major-16','major-18','major-19'];
const mixed=['wands-11','cups-12','swords-13','pentacles-14','major-17'];
for(const [name,ids] of [['prototype',prototype],['mixed',mixed]]){
 const app=(await readFile('src/app.mjs','utf8')).replaceAll("from './","from '/src/").replace('deck=shuffleDeck();',`deck=[...${JSON.stringify(ids)}.map((id,i)=>({id,reversed:i%2===1})),...shuffleDeck().filter(c=>!${JSON.stringify(ids)}.includes(c.id))];`);
 await writeFile(`dist/qa-${name}-app.mjs`,app);
 await writeFile(`dist/qa-${name}.html`,html.replace(/src="\/src\/app.mjs[^\"]*"/,`src="/qa-${name}-app.mjs"`).replace('<head>','<head><meta name="robots" content="noindex">'));
}
await writeFile('dist/qa-mobile.html',`<!doctype html><html><head><meta name="robots" content="noindex"><title>Local mobile QA</title></head><body style="display:flex;gap:20px;background:#ddd;margin:0"><iframe title="390px prototype" width="390" height="900" src="/qa-prototype.html" style="border:0;flex-shrink:0"></iframe><iframe title="320px mixed" width="320" height="900" src="/qa-mixed.html" style="border:0;flex-shrink:0"></iframe></body></html>`);
await writeFile('dist/qa-deck.html',`<!doctype html><html><head><meta name="robots" content="noindex"><title>Local deck QA</title><link rel="stylesheet" href="/style.css"></head><body><main><h1>Deck QA</h1><div style="display:grid;grid-template-columns:repeat(8,109px);gap:20px;padding:30px 0">${cards.map(c=>`<figure style="margin:0">${cardFace(c)}<figcaption style="font-size:12px">${c.id}</figcaption></figure>`).join('')}</div></main></body></html>`);

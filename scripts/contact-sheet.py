"""Create mobile-scale deck overview from optimized production assets."""
from PIL import Image,ImageDraw
from pathlib import Path
import json,subprocess
cards=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {cards} from './src/data/cards.mjs';import {artwork} from './src/card-view.mjs';console.log(JSON.stringify(cards.map(c=>({id:c.id,file:artwork[c.id]}))));"]))
for width in [50,100]:
 cell=width+20;height=width*3//2+30
 image=Image.new('RGB',(cell*10,height*8),'#f5eee2');draw=ImageDraw.Draw(image)
 for i,c in enumerate(cards):
  path=Path('public/artwork')/(c['file']+'.webp')
  if not path.exists():raise FileNotFoundError(path)
  artwork=Image.open(path).resize((width,width*3//2),Image.Resampling.LANCZOS)
  x=(i%10)*cell;y=(i//10)*height;image.paste(artwork,(x,y));draw.text((x,y+width*3//2+3),c['id'],fill='#542b35')
 image.save(f'docs/artwork/deck-contact-{width}.jpg',quality=95)

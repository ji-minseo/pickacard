"""Convert approved card PNGs to web assets. Requires Pillow only for authoring.
Usage: python scripts/optimize-artwork.py /absolute/artwork-directory
Source names: fool/lovers/tower/moon/sun or canonical major-N/suit-N.
No source art is copied into the production output.
"""
from pathlib import Path
from PIL import Image, ImageOps
import sys
source=Path(sys.argv[1]); output=Path('public/artwork'); output.mkdir(exist_ok=True)
anchors={'major-0':'fool','major-6':'lovers','major-16':'tower','major-18':'moon','major-19':'sun'}
allowed={f'major-{i}' for i in range(22)}|{f'{s}-{i}' for s in ['wands','cups','swords','pentacles'] for i in range(1,15)}|set(anchors.values())
for path in sorted(source.glob('*.png')):
 if path.stem not in allowed: continue
 image=ImageOps.exif_transpose(Image.open(path)).convert('RGB')
 if abs(image.width/image.height-2/3)>0.01: raise ValueError(f'Wrong aspect: {path}')
 name=anchors.get(path.stem,path.stem)
 for width,suffix in [(192,'-small'),(384,'')]:
  target=output/f'{name}{suffix}.webp'
  temporary=target.with_suffix('.tmp.webp')
  image.resize((width,width*3//2),Image.Resampling.LANCZOS).save(temporary,quality=83,method=6)
  temporary.replace(target)
print('Approved artwork optimized to 192/384px WebP.')

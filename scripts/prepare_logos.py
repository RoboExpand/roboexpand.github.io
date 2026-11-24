"""Crop supplied institution logos to visible bounds and match their visual height."""
from pathlib import Path
import subprocess
from PIL import Image, ImageChops, ImageOps
from source_assets import source_asset

ROOT=Path(__file__).resolve().parents[1]
try:
    raw=source_asset('figures/ruc-horizontal.png')
except FileNotFoundError:
    raw=ROOT/'work/media/ruc-horizontal.png'
    raw.parent.mkdir(parents=True,exist_ok=True)
if not raw.exists():
    subprocess.run(['rungs','-dSAFER','-dBATCH','-dNOPAUSE','-dEPSCrop','-sDEVICE=pngalpha','-r144',f'-sOutputFile={raw}',str(source_asset('中英文标准组合(左右)/中英文标准组合(左右).eps'))],check=True)
output=ROOT/'assets/logos'
output.mkdir(exist_ok=True)
for source,name in [(raw,'ruc'),(source_asset('HKU.jpg'),'hku'),(source_asset('x-human.png'),'x-human')]:
    original=Image.open(source).convert('RGBA')
    image=Image.alpha_composite(Image.new('RGBA',original.size,'white'),original).convert('RGB')
    mask=ImageChops.difference(image,Image.new('RGB',image.size,'white')).convert('L')
    bounds=mask.point(lambda value:255 if value>22 else 0).getbbox()
    content=ImageOps.contain(image.crop(bounds),(10000,112),Image.Resampling.LANCZOS)
    normalized=ImageOps.expand(content,border=4,fill='white')
    normalized.save(output/f'{name}.png',optimize=True)
    print(f'{name}: {normalized.size}, identical content height and 4 px margins')

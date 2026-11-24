"""Prepare only the media selected for the static project page; preserve all source assets.

Requires Pillow and imageio-ffmpeg (the latter may be installed into work/media-tools).
Run from the repository root: python scripts/prepare_media.py
"""
from pathlib import Path
import subprocess
import sys
from PIL import Image, ImageOps, ImageDraw
from source_assets import source_asset

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'work/media-tools'))
import imageio_ffmpeg
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
ASSETS = ROOT / 'assets'
POSTERS = ASSETS / 'posters'
WEB = ASSETS / 'web'
POSTERS.mkdir(exist_ok=True)
WEB.mkdir(exist_ok=True)

def poster(source, name):
    target = POSTERS / f'{name}.jpg'
    if not target.exists():
        run = subprocess.run([FFMPEG, '-hide_banner', '-y', '-threads', '1', '-ss', '0.5', '-i', str(source), '-frames:v', '1', '-vf', 'scale=min(1440\\,iw):-2', '-q:v', '3', '-threads', '1', str(target)], capture_output=True, text=True)
        if run.returncode:
            raise RuntimeError(run.stderr[-2000:])
    print(f'Poster: {name}', flush=True)

def transcode(source, name, max_width=1600):
    target = WEB / f'{name}.mp4'
    valid = False
    if target.exists():
        check = subprocess.run([FFMPEG, '-hide_banner', '-i', str(target)], capture_output=True, text=True)
        valid = 'Duration:' in check.stderr and 'moov atom not found' not in check.stderr
    if not valid:
        temporary = target.with_suffix('.part.mp4')
        run = subprocess.run([FFMPEG, '-hide_banner', '-loglevel', 'error', '-y', '-i', str(source), '-an', '-vf', f'scale=min({max_width}\\,iw):-2', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '25', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-threads', '4', str(temporary)], capture_output=True, text=True)
        if run.returncode:
            raise RuntimeError(run.stderr)
        temporary.replace(target)
    poster(target, name)
    print(f'{name}: {source.stat().st_size / 1e6:.1f} MB -> {target.stat().st_size / 1e6:.1f} MB', flush=True)

for name in ['teaser', 'method', 'generation', 'real-world']:
    target = ASSETS / 'figures' / f'{name}.webp'
    if not target.exists():
        with Image.open(source_asset(f'figures/{name}.png')) as image:
            image.convert('RGB').save(target, quality=91, method=6)
if not (ASSETS / 'figures' / 'reconstruction.webp').exists():
    with Image.open(source_asset('recon_cases.png')) as image:
        image = ImageOps.contain(image.convert('RGB'), (1800, 1350))
        image.save(ASSETS / 'figures' / 'reconstruction.webp', quality=91, method=6)
subprocess.run([sys.executable, str(ROOT / 'scripts/prepare_logos.py')], check=True)

for task, filename in [('lemon','astribot_lemon'), ('cup','astribot_cup'), ('drawer','agilex_drawer'), ('corn','tienyi2.0_corn')]:
    transcode(source_asset(f'demo_cases/{filename}.mp4'), f'demo-{task}')

for name, filename in [('agilex','C01_agilex'), ('galaxea','C03_galaxea_r1_lite'), ('unitree','C10_unitree')]:
    poster(ASSETS / 'paired-test-set-cases' / f'{filename}_comparison.mp4', f'paired-{name}')
for name in ['Q001','Q011','Q028']:
    poster(ASSETS / 'open-scene-eva-cases' / f'{name}_comparison.mp4', f'open-{name.lower()}')

variants = {
    'lemon': [('default','07_lemon_ep00'), ('red','10_lemon_red_ep00'), ('green','12_lemon_green_ep00'), ('blue','14_lemon_blue_ep00'), ('background','16_lemon_tablecloth_ep00')],
    'cup': [('default','19_cup_ep00'), ('red','22_cup_red_ep00'), ('green','23_cup_green_ep00'), ('yellow','24_cup_yellow_ep00')],
    'drawer': [('default','01_drawer_ep00')], 'corn': [('default','04_corn_ep00')]
}
for task, items in variants.items():
    for key, folder in items:
        for view in ['generated_three_views']:
            poster(ASSETS / 'roboexpand-generated-datasets-cases' / folder / f'{view}.mp4', f'dataset-{task}-{key}-{view}')

subprocess.run([sys.executable, str(ROOT / 'scripts/prepare_rollouts.py')], check=True)

selected = [POSTERS/'demo-lemon.jpg', POSTERS/'demo-drawer.jpg', POSTERS/'paired-agilex.jpg', POSTERS/'open-q001.jpg', POSTERS/'open-q011.jpg', POSTERS/'open-q028.jpg', POSTERS/'dataset-lemon-default-generated_three_views.jpg', POSTERS/'rollout-lemon-default.jpg']
canvas = Image.new('RGB', (1400, 330*((len(selected)+1)//2)), 'white')
draw = ImageDraw.Draw(canvas)
for i,p in enumerate(selected):
    x, y = (i%2)*700, (i//2)*330
    draw.text((x+10,y+5), p.stem, fill='black')
    canvas.paste(ImageOps.contain(Image.open(p), (680,295)), (x+10,y+28))
canvas.save(ROOT/'work/media-contact.jpg')
print('All selected media prepared.', flush=True)

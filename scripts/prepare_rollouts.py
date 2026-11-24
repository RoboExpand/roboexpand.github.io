"""Encode the selected successful physical rollouts listed in script.js.

Original recordings are preserved. Web copies and matching posters are generated
in assets/web and assets/posters; six-frame audit strips go into work/rollout-review.
"""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import json
import re
import shutil
import subprocess
import sys
from PIL import Image, ImageDraw, ImageFont
from source_assets import source_asset

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'work/media-tools'))
import imageio_ffmpeg
FFMPEG=imageio_ffmpeg.get_ffmpeg_exe()
script=(ROOT/'script.js').read_text(encoding='utf8')
selected=json.loads(re.search(r'const ROLLOUTS = (\{.*?\});',script,re.S).group(1))
stems={'lemon':'astribot-s1-lemon','cup':'astribot-s1-cup','drawer':'agilex-drawer','corn':'tienyi2.0-corn'}
review=ROOT/'work/rollout-review'
review.mkdir(parents=True,exist_ok=True)

def run(arguments):
    result=subprocess.run([FFMPEG,'-hide_banner',*arguments],capture_output=True,text=True)
    if result.returncode: raise RuntimeError(result.stderr[-2500:])
    return result

def prepare(item):
    task,scene=item
    name=f'rollout-{task}-{scene["id"]}'
    source=source_asset(f'real-world_exper/{task}-roboexpand/{stems[task]}-roboexpand-{scene["clip"]:03d}.mp4')
    target=ROOT/f'assets/web/{name}.mp4'
    if not target.exists():
        previous=ROOT/f'assets/web/rollout-{task}-roboexpand.mp4'
        if scene['clip']==1 and previous.exists():
            shutil.copy2(previous,target)
        else:
            temporary=target.with_suffix('.part.mp4')
            run(['-loglevel','error','-y','-i',str(source),'-an','-vf','scale=min(1280\\,iw):-2','-c:v','libx264','-preset','veryfast','-crf','24','-pix_fmt','yuv420p','-movflags','+faststart','-threads','3',str(temporary)])
            temporary.replace(target)
    poster=ROOT/f'assets/posters/{name}.jpg'
    if not poster.exists():
        run(['-loglevel','error','-y','-ss','0.5','-i',str(target),'-frames:v','1','-q:v','3','-threads','1',str(poster)])
    probe=subprocess.run([FFMPEG,'-hide_banner','-i',str(target)],capture_output=True,text=True).stderr
    duration=re.search(r'Duration: (\d+):(\d+):(\d+\.\d+)',probe)
    seconds=int(duration[1])*3600+int(duration[2])*60+float(duration[3])
    fps=float(re.search(r'(\d+(?:\.\d+)?) fps',probe)[1])
    frames=max(1,int(seconds*fps))
    indices=[int((frames-1)*p) for p in [0,.2,.4,.6,.8,.99]]
    expression='+'.join(f'eq(n,{index})' for index in indices)
    timeline=review/f'{name}-timeline.jpg'
    if not timeline.exists():
        run(['-loglevel','error','-y','-i',str(target),'-vf',f"select='{expression}',scale=320:-2,tile=6x1",'-frames:v','1','-q:v','3','-threads','1',str(timeline)])
    print(f'{task} / {scene["label"]}: source #{scene["clip"]:03d}, {seconds:.1f} s, {target.stat().st_size/1e6:.2f} MB',flush=True)
    return {'task':task,**scene,'original':str(source.relative_to(ROOT)),'web':str(target.relative_to(ROOT)),'duration':seconds,'bytes':target.stat().st_size,'codec':'h264' if 'Video: h264' in probe else 'CHECK'}

items=[(task,scene) for task,scenes in selected.items() for scene in scenes]
results=list(ThreadPoolExecutor(max_workers=2).map(prepare,items))
(review/'selected-rollout-audit.json').write_text(json.dumps(results,indent=2),encoding='utf8')
font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',19)
for task,scenes in selected.items():
    height=290 if task=='corn' else 230
    canvas=Image.new('RGB',(1920,height*len(scenes)),'white')
    draw=ImageDraw.Draw(canvas)
    for i,scene in enumerate(scenes):
        strip=Image.open(review/f'rollout-{task}-{scene["id"]}-timeline.jpg')
        draw.text((10,i*height+6),f'{task} / {scene["label"]} / source #{scene["clip"]:03d}',font=font,fill='black')
        canvas.paste(strip,(0,i*height+35))
    canvas.save(review/f'{task}-selected-timelines.jpg')
print('Prepared all selected successful physical rollouts.',flush=True)

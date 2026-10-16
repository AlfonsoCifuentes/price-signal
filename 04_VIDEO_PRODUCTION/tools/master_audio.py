#!/usr/bin/env python3
"""Final loudness pass for the narrated renders: two-pass EBU R128 normalisation, video copied untouched.

    python tools/master_audio.py remotion/out/price-signal-film-voice.mp4 [...]

Target -16 LUFS integrated, -1.5 dBTP true peak, LRA 11 (web and social delivery). Each file is replaced
in place by the mastered version; the original is kept next to it as <name>.premaster.mp4 until you delete it.
"""
from pathlib import Path
import json, re, shutil, subprocess, sys
from fractions import Fraction

TARGET = 'I=-16:TP=-1.5:LRA=11'
if len(sys.argv) < 2:
    sys.exit(__doc__)


def measure(path):
    r = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', str(path), '-af',
                        f'loudnorm={TARGET}:print_format=json', '-f', 'null', '-'], capture_output=True, text=True)
    block = re.search(r'\{[^{}]*"input_i"[^{}]*\}', r.stderr, re.S).group(0)
    return json.loads(block)


for arg in sys.argv[1:]:
    src = Path(arg)
    keep = src.with_name(src.stem + '.premaster.mp4')
    if not keep.exists():
        shutil.copyfile(src, keep)
    m = measure(keep)
    af = (f"loudnorm={TARGET}:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}"
          f":measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true:print_format=summary")
    # cut the audio to the exact length of the picture: AAC priming would otherwise add a few hundredths of a second
    v = json.loads(subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries',
                                   'stream=nb_frames,r_frame_rate', '-of', 'json', str(keep)],
                                  capture_output=True, text=True).stdout)['streams'][0]
    length = int(v['nb_frames']) / float(Fraction(v['r_frame_rate']))
    tmp = src.with_name(src.stem + '.mastering.mp4')
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', str(keep), '-c:v', 'copy', '-af', af,
                    '-t', f'{length:.6f}', '-ar', '48000', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', str(tmp)], check=True)
    tmp.replace(src)
    print(f'{src.name}: mastered (input {m["input_i"]} LUFS, true peak {m["input_tp"]} dBTP)')

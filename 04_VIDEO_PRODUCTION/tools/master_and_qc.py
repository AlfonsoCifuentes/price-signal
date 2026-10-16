#!/usr/bin/env python3
"""Master the four renders and run the automated technical QC.

    python tools/master_and_qc.py            # renders/*.mp4 -> final/*.mp4 + final/qc_report.json

Mastering: two-pass EBU R128 loudness to -16 LUFS integrated, true peak at or under -1 dBTP (web/social starting point),
AAC 48 kHz 192 kb/s, video stream copied untouched, moov atom at the front (faststart) for web playback.

QC per file (automated; it does not replace watching and listening):
  streams and codecs, resolution, frame rate, duration against the narration timeline, audio present,
  integrated loudness and true peak after mastering, longest silence inside the programme, black frames.
"""
from pathlib import Path
import json, re, subprocess, sys
from fractions import Fraction

HERE = Path(__file__).resolve().parents[1]
REN, FIN = HERE / 'renders', HERE / 'final'
TARGET = 'I=-16:TP=-1.5:LRA=11'  # -1.5 so AAC encoding overshoot still lands at or under -1 dBTP
TL = json.loads((HERE / 'remotion' / 'src' / 'timeline_v3.json').read_text(encoding='utf-8'))
FIN.mkdir(exist_ok=True)


def run(args):
    return subprocess.run(args, capture_output=True, text=True)


def loud(path, extra=''):
    r = run(['ffmpeg', '-hide_banner', '-nostats', '-i', str(path), '-af', f'loudnorm={TARGET}{extra}:print_format=json', '-f', 'null', '-'])
    return json.loads(re.search(r'\{[^{}]*"input_i"[^{}]*\}', r.stderr, re.S).group(0))


def probe(path):
    return json.loads(run(['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', str(path)]).stdout)


report = {}
for vid, t in TL.items():
    name = f"pricing-demo-{vid.replace('_', '-')}.mp4"
    src, dst = REN / name, FIN / name
    if not src.exists():
        sys.exit(f'missing render {src}')
    m = loud(src)
    af = (f"loudnorm={TARGET}:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}"
          f":measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true")
    v = [s for s in probe(src)['streams'] if s['codec_type'] == 'video'][0]
    length = int(v['nb_frames']) / float(Fraction(v['r_frame_rate']))
    r = run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', str(src), '-c:v', 'copy', '-af', af, '-t', f'{length:.6f}',
             '-ar', '48000', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', str(dst)])
    if r.returncode:
        sys.exit(r.stderr)
    # ---- QC on the delivered file
    p = probe(dst)
    vs = [s for s in p['streams'] if s['codec_type'] == 'video'][0]
    aus = [s for s in p['streams'] if s['codec_type'] == 'audio']
    after = loud(dst)
    sil = run(['ffmpeg', '-hide_banner', '-nostats', '-i', str(dst), '-af', 'silencedetect=noise=-50dB:d=1.5', '-f', 'null', '-']).stderr
    starts = [float(x) for x in re.findall(r'silence_start: ([\d.]+)', sil)]
    ends = [float(x) for x in re.findall(r'silence_end: ([\d.]+)', sil)]
    dur = float(p['format']['duration'])
    silences = [round(e - s, 2) for s, e in zip(starts, ends)]
    blk = run(['ffmpeg', '-hide_banner', '-nostats', '-i', str(dst), '-vf', 'blackdetect=d=0.5:pix_th=0.08', '-an', '-f', 'null', '-']).stderr
    blacks = re.findall(r'black_start:([\d.]+) black_end:([\d.]+)', blk)
    head = (dst.read_bytes()[:64 * 1024])
    fps = float(Fraction(vs['r_frame_rate']))
    checks = {
        'video_h264': vs['codec_name'] == 'h264',
        'audio_aac_present': len(aus) == 1 and aus[0]['codec_name'] == 'aac',
        'resolution': f"{vs['width']}x{vs['height']}" == f"{t['width']}x{t['height']}",
        'fps_30': abs(fps - 30) < 0.01,
        'yuv420p': vs.get('pix_fmt') == 'yuv420p',
        'duration_matches_timeline': abs(dur - t['seconds']) < 0.1,
        'loudness_-16_LUFS_pm1': abs(float(after['input_i']) + 16) <= 1.0,
        'true_peak_le_-1dBTP': float(after['input_tp']) <= -0.9,
        'no_silence_over_4s': all(s <= 4.0 for s in silences),
        'no_black_frames': not blacks,
        'faststart_moov_first': head.find(b'moov') != -1 and (head.find(b'mdat') == -1 or head.find(b'moov') < head.find(b'mdat')),
    }
    report[vid] = {'file': f'final/{name}', 'bytes': dst.stat().st_size, 'duration_s': round(dur, 3), 'timeline_s': t['seconds'],
                   'width': vs['width'], 'height': vs['height'], 'fps': fps, 'video_bitrate_kbps': round(int(vs.get('bit_rate', 0)) / 1000),
                   'loudness_lufs': float(after['input_i']), 'true_peak_dbtp': float(after['input_tp']), 'lra': float(after['input_lra']),
                   'silences_over_1_5s': silences, 'black_segments': blacks, 'checks': checks, 'pass': all(checks.values())}
    print(f"{vid}: {dur:.2f}s {vs['width']}x{vs['height']} {after['input_i']} LUFS TP {after['input_tp']} · "
          f"{'PASS' if all(checks.values()) else 'FAIL ' + str([k for k, ok in checks.items() if not ok])}")
(FIN / 'qc_report.json').write_text(json.dumps(report, indent=1) + '\n', encoding='utf-8', newline='\n')
sys.exit(0 if all(r['pass'] for r in report.values()) else 1)

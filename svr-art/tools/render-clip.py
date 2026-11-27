#!/usr/bin/env python3
"""SVR ART — the clip.

Cuts a short, looping teaser out of the artist's own images (no other footage):
hard cuts on a ~100 BPM grid, slow camera pushes and pans, a contrasted grade,
light grain, one flash and one glitch per loop. Rendered twice: 16:9 for wide
screens, 9:16 for phones (recomposed, not cropped from the 16:9).

    python3 svr-art/tools/render-clip.py            # from the repository root

Needs Pillow, numpy and ffmpeg (libx264 + libvpx-vp9). Re-run it as soon as HD
originals replace the files in assets/img — the shot list stays valid.
Writes assets/video/svr-clip-{wide,tall}.{mp4,webm,webp} and assets/video/shots.json.
"""
import json
import os
import shutil
import subprocess
import tempfile

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
IMG = os.path.join(HERE, '..', 'assets', 'img')
OUT = os.path.join(HERE, '..', 'assets', 'video')
FPS = 24

SRC = {
    'P': 'svr-portrait-sheet-music-873.webp',   # painting on sheet music
    'B1': 'svr-paint-board-01-900.webp',        # gold grills
    'B2': 'svr-paint-board-02-900.webp',        # grin, sunglasses
    'B3': 'svr-paint-board-03-900.webp',        # tongue
    'B4': 'svr-paint-board-04-900.webp',        # profile, cigarette
    'S': 'svr-studio-macbook-1179.webp',        # studio: designs on screen
    'E': 'svr-exhibition-view-1179.webp',       # exhibition wall
}

# A shot: (label, seconds, kind, source, start, end)
#   kind 'crop'  → start/end are crop boxes (x0, y0, x1, y1) in source pixels
#   kind 'board' → start/end are (centre-x as a fraction of the frame, board width as a fraction of the frame)
WIDE = [
    ('Smoke', 1.30, 'crop', 'P', (320, 255, 840, 547), (370, 283, 810, 530)),
    ('Gold grills', 1.10, 'board', 'B1', (0.46, 1.16), (0.54, 1.16)),
    ('Gold grills', 0.55, 'crop', 'B1', (290, 24, 650, 226), (310, 35, 630, 215)),
    ('Studio', 1.30, 'crop', 'S', (40, 20, 1139, 638), (150, 70, 990, 543)),
    ('Tongue', 1.10, 'board', 'B3', (0.55, 1.14), (0.45, 1.14)),
    ('The wall', 1.30, 'crop', 'E', (0, 150, 880, 645), (299, 150, 1179, 645)),
    ('Hands', 0.55, 'crop', 'P', (270, 199, 630, 401), (290, 210, 610, 390)),
    ('Profile', 1.10, 'board', 'B4', (0.45, 1.16), (0.55, 1.16)),
    ('Grin', 0.55, 'crop', 'B2', (300, 29, 660, 231), (320, 40, 640, 220)),
    ('Sheet music', 1.30, 'crop', 'P', (87, 300, 787, 694), (0, 250, 873, 741)),
]
TALL = [
    ('Smoke', 1.30, 'crop', 'P', (410, 100, 770, 740), (430, 160, 750, 729)),
    ('Gold grills', 1.10, 'board', 'B1', (0.42, 1.30), (0.58, 1.30)),
    ('Studio', 1.30, 'crop', 'S', (60, 0, 1119, 1883), (209, 25, 969, 1376)),
    ('Tongue', 1.10, 'board', 'B3', (0.58, 1.30), (0.42, 1.30)),
    ('The wall', 1.30, 'crop', 'E', (150, 0, 693, 965), (480, 0, 1023, 965)),
    ('Hands', 0.55, 'crop', 'P', (300, 64, 600, 597), (318, 96, 582, 565)),
    ('Profile', 1.10, 'board', 'B4', (0.42, 1.30), (0.58, 1.30)),
    ('Grin', 1.10, 'board', 'B2', (0.50, 1.18), (0.50, 1.32)),
    ('Sheet music', 1.30, 'crop', 'P', (240, 50, 800, 1046), (210, 0, 830, 1102)),
]
FLASH_INTO = {'Studio', 'Sheet music'}     # a short white flash on these cuts
GLITCH_INTO = {'Hands'}                    # two frames of channel split


def ease(t):
    return t * t * (3 - 2 * t)


def lerp(a, b, t):
    return a + (b - a) * t


def grade(rgb, rng, vignette):
    a = rgb.astype(np.float32) / 255.0
    lum = a @ np.array([0.299, 0.587, 0.114], dtype=np.float32)
    a = a * 0.55 + lum[..., None] * 0.45                       # keep a little of the wood and the gold
    a = np.clip((a - 0.05) / 0.9, 0, 1)                         # crush blacks, lift whites
    a = a * a * (3 - 2 * a) * 0.65 + a * 0.35                   # S-curve
    a *= vignette[..., None]
    a += rng.normal(0, 0.016, a.shape[:2]).astype(np.float32)[..., None]   # light grain (more is added in CSS)
    return (np.clip(a, 0, 1) * 255).astype(np.uint8)


def render(shots, size, name, images):
    w, h = size
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    r = np.sqrt(((xx - w / 2) / (w / 2)) ** 2 + ((yy - h / 2) / (h / 2)) ** 2)
    vignette = np.clip(1.08 - 0.3 * r ** 2, 0.62, 1).astype(np.float32)
    rng = np.random.default_rng(7)
    tmp = tempfile.mkdtemp()
    n = 0
    t0 = 0.0
    meta = []
    for si, (label, secs, kind, src, a, b) in enumerate(shots):
        frames = round(secs * FPS)
        meta.append({'t': round(t0, 3), 'label': label})
        img = images[src]
        for f in range(frames):
            p = ease(f / max(frames - 1, 1))
            if kind == 'crop':
                box = tuple(lerp(a[i], b[i], p) for i in range(4))
                frame = img.convert('RGB').transform((w, h), Image.EXTENT, box, Image.BICUBIC)
            else:
                cx, bw = lerp(a[0], b[0], p), lerp(a[1], b[1], p)
                bw_px = int(round(bw * w))
                bh_px = int(round(bw_px * img.height / img.width))
                board = img.resize((bw_px, bh_px), Image.LANCZOS)
                frame = Image.new('RGB', (w, h), (6, 6, 6))
                frame.paste(board, (int(round(cx * w - bw_px / 2)), (h - bh_px) // 2), board)
            arr = grade(np.asarray(frame), rng, vignette)
            if label in FLASH_INTO and si and f < 3:            # flash on the cut
                k = (0.7, 0.35, 0.12)[f]
                arr = (arr * (1 - k) + 255 * k).astype(np.uint8)
            if label in GLITCH_INTO and f < 2:                   # channel split on a few bands
                g = arr.copy()
                for band in range(0, h, h // 9):
                    if rng.random() < 0.5:
                        s = int(rng.integers(6, 22))
                        g[band:band + h // 18, :, 0] = np.roll(arr[band:band + h // 18, :, 0], s, axis=1)
                        g[band:band + h // 18, :, 2] = np.roll(arr[band:band + h // 18, :, 2], -s, axis=1)
                arr = g
            dx, dy = rng.integers(-1, 2, 2)                      # gate weave
            arr = np.roll(arr, (int(dy), int(dx)), axis=(0, 1))
            Image.fromarray(arr).save(os.path.join(tmp, 'f%04d.png' % n))
            if n == 0:
                Image.fromarray(arr).save(os.path.join(OUT, 'svr-clip-%s.webp' % name), quality=72)
            n += 1
        t0 += frames / FPS

    keys = ','.join(str(m['t']) for m in meta)
    pattern = os.path.join(tmp, 'f%04d.png')
    base = os.path.join(OUT, 'svr-clip-%s' % name)
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', str(FPS), '-i', pattern,
                    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '24', '-preset', 'slow', '-profile:v', 'high',
                    '-force_key_frames', keys, '-movflags', '+faststart', '-an', base + '.mp4'], check=True)
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', str(FPS), '-i', pattern,
                    '-c:v', 'libvpx-vp9', '-crf', '38', '-b:v', '0', '-row-mt', '1', '-deadline', 'good', '-cpu-used', '2',
                    '-pix_fmt', 'yuv420p', '-force_key_frames', keys, '-an', base + '.webm'], check=True)
    shutil.rmtree(tmp)
    return {'duration': round(t0, 3), 'shots': meta}


def main():
    os.makedirs(OUT, exist_ok=True)
    images = {k: Image.open(os.path.join(IMG, v)) for k, v in SRC.items()}
    for k in ('B1', 'B2', 'B3', 'B4'):
        images[k] = images[k].convert('RGBA')
    data = {
        'wide': render(WIDE, (960, 540), 'wide', images),
        'tall': render(TALL, (540, 960), 'tall', images),
    }
    with open(os.path.join(OUT, 'shots.json'), 'w') as fh:
        json.dump(data, fh, indent=1)
    for f in sorted(os.listdir(OUT)):
        print('%-26s %7.1f kB' % (f, os.path.getsize(os.path.join(OUT, f)) / 1024))


if __name__ == '__main__':
    main()

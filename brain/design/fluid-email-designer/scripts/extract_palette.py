#!/usr/bin/env python3
"""Pull the main colors out of brand images (logo, hero shots, product photos).

Usage:
  python scripts/extract_palette.py logo.png hero.jpg [--colors 6]

For each image: the top colors as hex, the share of the (non-transparent) image each covers,
and a tag: near-white / near-black / gray / vivid. Logos give the brand colors; photos give
the mood colors (useful for per-email button colors). Assign roles yourself; see brand-kit.md.
"""
import argparse, colorsys, sys
from PIL import Image


def tag(rgb):
    r, g, b = (c / 255 for c in rgb)
    h, l, s = colorsys.rgb_to_hls(r, g, b)
    if l > 0.92: return "near-white"
    if l < 0.08: return "near-black"
    if s < 0.15: return "gray"
    return "vivid" if s > 0.45 and 0.2 < l < 0.8 else "muted"


def palette(path, n):
    im = Image.open(path)
    im.thumbnail((300, 300))
    im = im.convert("RGBA")
    get = getattr(im, "get_flattened_data", None) or im.getdata
    px = [tuple(p[:3]) for p in get() if p[3] > 200]
    if not px:
        return []
    flat = Image.new("RGB", (len(px), 1))
    flat.putdata(px)
    q = flat.quantize(colors=n, method=Image.Quantize.MEDIANCUT)
    pal = q.getpalette()[: n * 3]
    counts = sorted(q.getcolors(), reverse=True)
    total = sum(c for c, _ in counts)
    res = []
    for c, idx in counts:
        rgb = tuple(pal[idx * 3: idx * 3 + 3])
        res.append(("#%02x%02x%02x" % rgb, c / total, tag(rgb)))
    return res


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("images", nargs="+")
    ap.add_argument("--colors", type=int, default=6)
    a = ap.parse_args()
    for path in a.images:
        try:
            pal = palette(path, a.colors)
        except Exception as e:
            print(f"{path}: could not read ({e})", file=sys.stderr)
            continue
        print(path)
        for hx, share, t in pal:
            print(f"  {hx}  {share*100:5.1f}%  {t}")


if __name__ == "__main__":
    main()

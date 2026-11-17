#!/usr/bin/env python3
"""Assemble filled email fragments into one self-contained HTML page, grouped by flow.

Usage:
  python scripts/assemble.py --brand work/brand.json --out /mnt/user-data/outputs/brand-emails.html \
      --flow "Welcome Flow" "Email 1 - Interest A=work/w1a.html" "Email 2=work/w2.html" \
      [--flow "Browse Abandonment" "Email 1=work/b1.html"] [--title "Brand - Email designs"]

What it does:
  * turns brand.json into CSS variables and font loading (Google Fonts link and/or embedded font files)
  * fills {{LOGO}}, {{LOGO_DARK}}, {{LOGO_FOOTER}}, {{BRAND_NAME}} in every fragment
  * inlines every local image (src="..." and url('...')) as a compressed WebP data URI, so the page
    works offline and can be published as an artifact (no remote files allowed there)
  * warns about leftover {{PLACEHOLDERS}} and images it could not find
"""
import argparse, base64, html, io, json, os, re, sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    sys.exit("Pillow is required: pip install pillow --break-system-packages")

SKILL_DIR = Path(__file__).resolve().parent.parent
BASE = SKILL_DIR / "templates" / "_base.html"
MAX_W = 1200          # px; emails are 600 wide, 2x for sharpness
_cache = {}


def css_family(f):
    fam = f["family"]
    return f'"{fam}"' if " " in fam else fam


def brand_vars(b):
    c = b.get("colors", {})
    out = []
    for k, v in c.items():
        out.append(f"--{k.replace('_', '-')}:{v};")
    fonts = b.get("fonts", {})
    if "display" in fonts:
        out.append(f"--font-display:{css_family(fonts['display'])},Impact,'Arial Narrow',sans-serif;")
        w = fonts["display"].get("weight") or (fonts["display"].get("weights") or [700])[-1]
        out.append(f"--display-weight:{w};")
    if "body" in fonts:
        out.append(f"--font-body:{css_family(fonts['body'])},Arial,Helvetica,sans-serif;")
    if b.get("headline_case"):
        out.append(f"--display-case:{b['headline_case']};")
    if b.get("headline_tracking"):
        out.append(f"--display-tracking:{b['headline_tracking']};")
    if b.get("button_radius"):
        out.append(f"--btn-radius:{b['button_radius']};")
    if b.get("card_radius"):
        out.append(f"--card-radius:{b['card_radius']};")
    return "\n  ".join(out)


def google_link(b):
    fams = []
    for role in ("display", "body"):
        f = b.get("fonts", {}).get(role)
        if f and f.get("google"):
            ws = sorted(set(f.get("weights") or ([f["weight"]] if f.get("weight") else [400, 700])))
            fams.append(f"family={f['family'].replace(' ', '+')}:wght@{';'.join(str(w) for w in ws)}")
    if not fams:
        return ""
    url = "https://fonts.googleapis.com/css2?" + "&".join(dict.fromkeys(fams)) + "&display=swap"
    return ('<link rel="preconnect" href="https://fonts.googleapis.com">\n'
            '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
            f'<link rel="stylesheet" href="{url}">')


def font_faces(b, warn):
    out = []
    mime = {".woff2": "font/woff2", ".woff": "font/woff", ".otf": "font/otf", ".ttf": "font/ttf"}
    for f in b.get("fonts", {}).get("files", []):
        p = Path(f["path"])
        if not p.exists():
            warn.append(f"font file not found: {p}")
            continue
        data = base64.b64encode(p.read_bytes()).decode()
        fmt = {".woff2": "woff2", ".woff": "woff", ".otf": "opentype", ".ttf": "truetype"}.get(p.suffix.lower(), "woff2")
        out.append(f"@font-face{{font-family:'{f['family']}';src:url(data:{mime.get(p.suffix.lower(), 'font/woff2')};base64,{data}) format('{fmt}');"
                   f"font-weight:{f.get('weight', 400)};font-style:{f.get('style', 'normal')};font-display:swap}}")
    return "\n".join(out)


def to_data_uri(path, warn):
    if path in _cache:
        return _cache[path]
    p = Path(path)
    if not p.exists():
        warn.append(f"image not found: {path}")
        _cache[path] = path
        return path
    if p.suffix.lower() == ".svg":
        uri = "data:image/svg+xml;base64," + base64.b64encode(p.read_bytes()).decode()
    else:
        im = Image.open(p)
        im.load()
        if im.mode not in ("RGB", "RGBA"):
            im = im.convert("RGBA")
        if im.width > MAX_W:
            im = im.resize((MAX_W, round(im.height * MAX_W / im.width)), Image.LANCZOS)
        buf = io.BytesIO()
        im.save(buf, "WEBP", quality=82, method=5)
        uri = "data:image/webp;base64," + base64.b64encode(buf.getvalue()).decode()
    _cache[path] = uri
    return uri


def is_local(ref):
    return ref.startswith(("/", "./", "../")) and not ref.startswith("//")


def inline_images(fragment, base_dir, warn):
    def fix(ref):
        if ref.startswith("data:") or ref.startswith("http") or "{{" in ref or not ref:
            return ref
        full = ref if ref.startswith("/") else str((base_dir / ref).resolve())
        return to_data_uri(full, warn) if is_local(ref) or Path(full).exists() else ref

    fragment = re.sub(r'(src=")([^"]+)(")', lambda m: m.group(1) + fix(m.group(2)) + m.group(3), fragment)
    fragment = re.sub(r"url\((['\"]?)([^'\")]+)\1\)", lambda m: f"url('{fix(m.group(2))}')", fragment)
    return fragment


def strip_comments(fragment):
    return re.sub(r"<!--.*?-->", "", fragment, flags=re.S).strip()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--brand", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--title")
    ap.add_argument("--flow", nargs="+", action="append", required=True,
                    metavar=("FLOW_TITLE", "LABEL=PATH"))
    a = ap.parse_args()

    warn = []
    brand = json.loads(Path(a.brand).read_text())
    name = brand.get("name", "Brand")
    logo = brand.get("logo", "")
    repl = {"{{LOGO}}": logo, "{{LOGO_DARK}}": brand.get("logo_dark", logo),
            "{{LOGO_FOOTER}}": brand.get("logo_footer", logo), "{{BRAND_NAME}}": html.escape(name)}

    sections = []
    for flow in a.flow:
        title, items = flow[0], flow[1:]
        cards = []
        for item in items:
            if "=" not in item:
                sys.exit(f'each email must be "Label=path", got: {item}')
            label, path = item.split("=", 1)
            frag = Path(path).read_text()
            frag = strip_comments(frag)
            for k, v in repl.items():
                frag = frag.replace(k, v)
            left = sorted(set(re.findall(r"\{\{[A-Z0-9_]+\}\}", frag)))
            if left:
                warn.append(f"{title} / {label}: unfilled placeholders {', '.join(left)}")
            frag = inline_images(frag, Path(path).resolve().parent, warn)
            cards.append(f'<div class="email-wrap"><div class="email-label">{html.escape(label)}</div>\n{frag}\n</div>')
        sections.append(f'<section class="flow"><h2 class="flow-title">{html.escape(title)}</h2>\n'
                        f'<div class="flow-row">\n' + "\n".join(cards) + "\n</div></section>")

    page_title = a.title or f"{name} - Email designs"
    head = (f'<header class="page-head"><div class="page-title">{html.escape(page_title)}</div>'
            f'<div class="page-sub">Designs for review and handoff. Dynamic blocks are built in Klaviyo.</div></header>')
    out = BASE.read_text()
    out = out.replace("{{TITLE}}", html.escape(page_title)).replace("{{FONT_LINKS}}", google_link(brand))
    out = out.replace("{{FONT_FACES}}", font_faces(brand, warn)).replace("{{BRAND_VARS}}", brand_vars(brand))
    out = out.replace("{{CONTENT}}", head + "\n" + "\n".join(sections))

    Path(a.out).parent.mkdir(parents=True, exist_ok=True)
    Path(a.out).write_text(out)
    size = os.path.getsize(a.out) / 1e6
    print(f"wrote {a.out} ({size:.1f} MB)")
    if size > 15:
        warn.append("page is over 15 MB; artifacts cap at 16 MB. Use fewer or smaller images.")
    for w in warn:
        print("WARN:", w)


if __name__ == "__main__":
    main()

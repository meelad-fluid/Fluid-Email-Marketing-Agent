#!/usr/bin/env python3
"""Screenshot every email on an assembled page and check it against Fluid's rules.

Usage:
  python scripts/render_preview.py page.html --out work/preview [--fold 650]

Writes, per email, a full PNG and a viewing sheet (the tall email cut into side-by-side
columns, read top to bottom, left to right) to --out, then prints a report:
  FOLD        button or offer starts below the fold line (designed emails only)
  OFFER       no code pill or offer numerals in the hero (skipped for emails marked data-offer="optional")
  EDGE        two sections meet with different backgrounds and no transition
  PRODUCT     extra text inside a product block (name + button only)
  PLACEHOLDER unfilled {{PLACEHOLDER}} left in the copy
  IMAGE       an image failed to load
"""
import argparse, math, re, sys
from pathlib import Path

try:
    from PIL import Image
    from playwright.sync_api import sync_playwright
except ImportError as e:
    sys.exit(f"missing dependency: {e}. Needs Pillow and Playwright with Chromium.")

CHECK_JS = r"""
(fold) => {
  const out = [];
  const wraps = [...document.querySelectorAll('.email-wrap')];
  const flowOf = w => (w.closest('.flow')?.querySelector('.flow-title')?.textContent || '').trim();
  const bg = el => { const s = getComputedStyle(el); return [s.backgroundColor, s.backgroundImage]; };
  wraps.forEach((w, i) => {
    const email = w.querySelector('.email');
    const label = flowOf(w) + ' / ' + (w.querySelector('.email-label')?.textContent || ('email ' + (i+1))).trim();
    const top = email.getBoundingClientRect().top;
    const issues = [];
    const plain = email.dataset.plain === 'true';
    if (!plain) {
      const btn = email.querySelector('.btn');
      if (!btn) issues.push(['FOLD', 'no button at all']);
      else {
        const y = btn.getBoundingClientRect().bottom - top;
        if (y > fold) issues.push(['FOLD', `first button ends at ${Math.round(y)}px (fold ${fold}px)`]);
      }
      const hero = email.querySelector('.hero');
      const offer = hero && hero.querySelector('.code, .numeral');
      if (!offer && email.dataset.offer !== 'optional') issues.push(['OFFER', 'no code pill or numerals in the hero; make sure the subheadline states the offer']);
      else if (offer) {
        const y = offer.getBoundingClientRect().top - top;
        if (y > fold) issues.push(['FOLD', `offer starts at ${Math.round(y)}px (fold ${fold}px)`]);
      }
    }
    const kids = [...email.children];
    for (let k = 0; k < kids.length - 1; k++) {
      const a = kids[k], b = kids[k+1];
      if (a.matches('.tx') || b.matches('.tx')) continue;
      if (a.matches('.hero--fade, .hero--rounded, .fade-bottom') || b.matches('.banner, .fade-top')) continue;
      const [ac, ai] = bg(a), [bc, bi] = bg(b);
      if (ac === bc && ai === 'none' && bi === 'none') continue;
      const name = el => el.tagName.toLowerCase() + '.' + [...el.classList].join('.');
      issues.push(['EDGE', `${name(a)} meets ${name(b)} with no transition`]);
    }
    email.querySelectorAll('.pcard, .pfeat').forEach(p => {
      const extra = [...p.querySelectorAll('p, li, .guide-text')];
      if (extra.length) issues.push(['PRODUCT', `extra text in a product block: "${extra[0].textContent.trim().slice(0,50)}"`]);
    });
    const ph = (email.innerText.match(/\{\{[A-Z0-9_]+\}\}/g) || []);
    if (ph.length) issues.push(['PLACEHOLDER', [...new Set(ph)].join(', ')]);
    email.querySelectorAll('img').forEach(im => {
      if (!im.complete || im.naturalWidth === 0) issues.push(['IMAGE', 'failed to load: ' + (im.getAttribute('src') || '').slice(0, 60)]);
    });
    out.push({label, issues});
  });
  return out;
}
"""


def sheet(png, dest, w=440, seg=1500, gap=16):
    im = Image.open(png).convert("RGB")
    h = round(im.height * w / im.width)
    im = im.resize((w, h), Image.LANCZOS)
    k = max(1, math.ceil(h / seg))
    s = Image.new("RGB", (k * w + (k - 1) * gap, min(h, seg)), (232, 232, 235))
    for i in range(k):
        s.paste(im.crop((0, i * seg, w, min(h, (i + 1) * seg))), (i * (w + gap), 0))
    s.save(dest, quality=78)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("page")
    ap.add_argument("--out", default="preview")
    ap.add_argument("--fold", type=int, default=650)
    a = ap.parse_args()
    out = Path(a.out)
    out.mkdir(parents=True, exist_ok=True)

    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = b.new_page(viewport={"width": 1400, "height": 1000})
        pg.goto(Path(a.page).resolve().as_uri())
        pg.wait_for_load_state("networkidle")
        pg.evaluate("document.fonts.ready")
        report = pg.evaluate(CHECK_JS, a.fold)
        for i, el in enumerate(pg.query_selector_all(".email")):
            slug = re.sub(r"[^a-z0-9]+", "-", report[i]["label"].lower()).strip("-")[:60] or f"email-{i+1}"
            png = out / f"{i+1:02d}-{slug}.png"
            el.screenshot(path=str(png))
            sheet(png, out / f"{i+1:02d}-{slug}-sheet.jpg")
        b.close()

    total = 0
    for r in report:
        print(("OK    " if not r["issues"] else "CHECK ") + r["label"])
        for kind, msg in r["issues"]:
            total += 1
            print(f"   {kind:<11} {msg}")
    print(f"\n{len(report)} emails, {total} flags. Sheets in {out}/ (*-sheet.jpg) for viewing.")


if __name__ == "__main__":
    main()

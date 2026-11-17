#!/usr/bin/env python3
"""Download a Google Font's files from npm (@fontsource) so previews render in the real font.

The sandbox can't reach fonts.googleapis.com, so without this the preview screenshots fall
back to system fonts. The published page loads Google Fonts on its own; embedding is only
needed for accurate previews (and for any custom font the user supplies as files).

Usage:
  python scripts/fetch_fonts.py "Anton" 400 --dir work/fonts
  python scripts/fetch_fonts.py "Inter" 400 600 700 --dir work/fonts

Prints the "files" entries to add to brand.json -> fonts.files.
Only extracts .woff2 files from the package; nothing is installed or executed.
"""
import argparse, json, subprocess, sys, tarfile, tempfile
from pathlib import Path


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("family")
    ap.add_argument("weights", nargs="*", type=int, default=[400])
    ap.add_argument("--dir", default="work/fonts")
    a = ap.parse_args()
    slug = a.family.lower().replace(" ", "-")
    out = Path(a.dir)
    out.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as td:
        r = subprocess.run(["npm", "pack", f"@fontsource/{slug}", "--silent"], cwd=td, capture_output=True, text=True)
        tgz = list(Path(td).glob("*.tgz"))
        if r.returncode != 0 or not tgz:
            sys.exit(f"could not download @fontsource/{slug}: {r.stderr.strip()[:200]}")
        entries = []
        with tarfile.open(tgz[0]) as t:
            for w in a.weights:
                name = f"package/files/{slug}-latin-{w}-normal.woff2"
                try:
                    m = t.getmember(name)
                except KeyError:
                    print(f"weight {w} not available for {a.family}", file=sys.stderr)
                    continue
                dest = out / f"{slug}-{w}.woff2"
                dest.write_bytes(t.extractfile(m).read())
                entries.append({"family": a.family, "path": str(dest.resolve()), "weight": w})
    print(json.dumps(entries, indent=2))


if __name__ == "__main__":
    main()

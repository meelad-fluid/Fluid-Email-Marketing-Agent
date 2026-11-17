# Building the brand kit

The brand kit is the only thing that changes between clients. Get it right once, get it
approved, and every email in every flow inherits it.

## Sources, in order of trust

1. **What the user gives you**: brand guide, font names, asset kit. Always wins.
2. **The website**: fetch the homepage and one product or collection page with
   `web_fetch` (it only opens URLs the user gave you or that came from search results).
3. **The assets themselves**: run `scripts/extract_palette.py` on the logo and 2-3 key
   images.

## Fonts

Fetched pages are mostly text, so the stylesheet that names the fonts often isn't
visible. Look for Google Fonts links, `font-family` names, or font names mentioned in the
page. Then:

- **Found and it's a Google Font** → use it (`"google": true` in brand.json).
- **Found but it's a custom or licensed font** → ask the user for the font files
  (.woff2/.woff/.otf/.ttf) and embed them. Until then, pick the closest Google Font and
  mark it as a stand-in in the brand kit.
- **Not found** → say so and ask. The fastest way for the user is a font-identifier
  browser extension (e.g. WhatFont) on the brand's site, which takes under a minute.
  Never guess silently.

## Colors

Combine what the site shows with the palette script:

```bash
python scripts/extract_palette.py /mnt/user-data/uploads/logo.png /mnt/user-data/uploads/hero.jpg
```

Assign every color a role (below). Check contrast: button text on the button color and
body text on each background must be easy to read.

## Look and feel

Write 2-3 lines on the brand's imagery: dark and cinematic, bright lifestyle, studio
product shots, rustic, etc. This decides which non-blocky techniques fit (smoke and
splashes for a dark premium brand, sunny full-bleed photos for a sports brand).

Also note from the site: button shape (pill, rounded, square; filled or outline), headline
case, trust points (free shipping, guarantee, made in, family owned) for the trust-icon
row, social channels, and any tagline.

## Show it, then wait

Present the kit to the user in a short, scannable form: colors with roles, fonts (flag
stand-ins), button style, look and feel, trust points, and anything you couldn't find.
**Don't design until they approve it.**

If the Artifact tool offers a "Design System" type, offer to save the approved kit as
the client's Design System so it can be reused for future campaigns, pop-ups and decks.

## brand.json

`scripts/assemble.py` turns this into the CSS variables the templates use.

```json
{
  "name": "Brand Name",
  "logo": "/mnt/user-data/uploads/logo-light.png",
  "logo_dark": "/mnt/user-data/uploads/logo-dark.png",
  "logo_footer": "/mnt/user-data/uploads/logo-light.png",
  "colors": {
    "bg": "#141414",
    "bg_alt": "#ffffff",
    "ink": "#f4f4f4",
    "ink_alt": "#1a1a1a",
    "muted": "#a6a6a6",
    "accent": "#b3121b",
    "accent_ink": "#ffffff",
    "highlight": "#ffcc33",
    "hero_ink": "#ffffff",
    "card": "#000000",
    "card_ink": "#ffffff",
    "footer_bg": "#000000",
    "footer_ink": "#ffffff"
  },
  "fonts": {
    "display": { "family": "Anton", "google": true, "weights": [400] },
    "body": { "family": "Inter", "google": true, "weights": [400, 600, 700] },
    "files": [
      { "family": "Brand Display", "path": "/mnt/user-data/uploads/BrandDisplay.woff2", "weight": 700 }
    ]
  },
  "headline_case": "uppercase",
  "headline_tracking": "0.01em",
  "button_radius": "999px",
  "card_radius": "22px"
}
```

Color roles:

| Key | Used for |
|---|---|
| `bg` | Main email background (hero area and default sections) |
| `bg_alt` | Alternate section background, so sections can change and transition |
| `ink` / `ink_alt` | Text on `bg` / on `bg_alt` |
| `muted` | Secondary text, captions |
| `accent` / `accent_ink` | Buttons and their text |
| `highlight` | Code text, stars, numerals, small emphasis |
| `hero_ink` | Text over hero photos (usually white) |
| `card` / `card_ink` | Review cards, product frames, guidance cards |
| `footer_bg` / `footer_ink` | Footer |

`files` is optional: list custom font files to embed. `logo_dark` (used on the white
plain-text letter) and `logo_footer` are optional and default to `logo`. Use a per-email button color by adding `style="--accent:#xxxxxx"` on that
email's root element when its hero image calls for it.

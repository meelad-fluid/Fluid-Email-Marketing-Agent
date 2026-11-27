# Style directions: how much is going on in this client's emails

Every client gets one **design style**, picked by the client at onboarding from three versions of the same welcome email. It is the overall guide for how their whole account looks, **not a template**: every email still gets its own layout, hero and idea (style_options, choose_style), but always at this level of graphics.

The chosen style lives in `brand/direction.md` as the first line:

```
Design style: Bold & graphic (chosen by <name>, <date>, from the onboarding style options)
```

No line yet → use **Balanced** until the client picks.

## 1. Bold & graphic
Heavily designed, a lot going on, every section a visual moment.
- **Floating elements everywhere:** cutout products, ingredients, stickers, badges, hand-drawn arrows, rotated tags overlapping section edges, soft drop shadows.
- **Expressive type:** oversized words and numbers, mixed sizes and an accent/script font in one headline, words on color bands, stacked or tilted.
- **Busy layouts:** overlapping cards, polaroids, arch/circle masks, color blocking, diagonal or curved section edges, asymmetric rows.
- **Devices per email:** at least 4 (design steps in the bot's instructions); most sections use 2 or more.
- Still readable: one clear headline, CTA in the first 650px, nothing covering text or products, and no badge that means nothing (QC fails random badges in every style).

## 2. Clean & minimal
Just great images and text. Calm, premium, lots of space.
- **Imagery does the work:** big full-width photography or one strong product shot per section; no cutouts floating on color, no stickers, no ingredients scattered around.
- **Type:** the brand's fonts only, at 2–3 sizes; no script accents, no tilted or stacked words.
- **Layout:** one column, generous white space (60–80px between sections), straight section edges, thin rules or plain color fields at most.
- **Devices per email:** 1–2, all from layout and photography (a full-bleed photo, a split row, a big number). **No floating elements, stickers or badges** beyond real trust marks in the footer.
- Fewer sections: hero, 2–3 sections, close.

## 3. Balanced (the healthy medium)
Clean sections with one or two graphic moments where they count.
- **The hero carries the graphics:** a floating product or a sticker/badge on the hero, or one expressive headline; the rest of the email is cleaner.
- **One more moment** in the middle (an overlapping card, a tilted polaroid, a color-blocked offer box), then calm sections.
- **Type:** brand fonts, one accent allowed in the hero headline.
- **Devices per email:** 2–3. At most 2 floating elements or badges in the whole email.

## The onboarding style test
At onboarding the bot builds the same Welcome Email #1 (same copy: `../../../skills/fluid-email-copywriter/references/welcome-style-test.md`) three times, one per style, so the client compares only the look:

| Design folder | Title |
|---|---|
| `designs/style-options/1-bold` | `Style Options Email #1 — Bold & graphic` |
| `designs/style-options/2-minimal` | `Style Options Email #2 — Clean & minimal` |
| `designs/style-options/3-balanced` | `Style Options Email #3 — Balanced` |

All three share one review link (the flow link). Each option's review page has a **Choose this style** button. When the client chooses (there, or by saying so in Slack), the bot:
1. writes the `Design style:` line at the top of `brand/direction.md`, plus 3–5 bullets on what they liked in that option (hero, type, imagery), and adds a dated memory.md line;
2. from then on designs every email at that style's level (devices per email, floating elements, type rules above);
3. may reuse the chosen option as the real Welcome Email #1 (it's already on-brand copy and design).

The style can change any time the client says so ("make them cleaner", "more graphics"): update the line and say so in memory.md.

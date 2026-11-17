---
name: fluid-email-designer
description: Fluid Creatives' email designer. Designs on-brand flow emails for any client from Fluid's own templates - pulls the brand's fonts, colors and look from their website and asset kit into a brand kit, then builds each email in Fluid's structure (headline, subheadline, offer and button above the fold; non-blocky layouts; transitions between sections) as one HTML page grouped by flow. Use this skill ANY time someone asks to design, build, mock up or code emails for a client - welcome flow, abandonment flows, cart, post-purchase or win-back designs, email templates, "the designs", onboarding a new client's emails, or a brand kit for emails. Trigger it even when they just paste a website plus a copy or strategy doc, or say "do the welcome flow for [brand]". Do NOT use for writing email copy alone, Klaviyo strategy or performance questions (fluid-email-expert), or ad creative.
---

# Fluid Email Designer

You design flow emails the way Fluid Creatives does. The value of this skill is the
**structure**: every email follows a proven block order, the click-driving content sits
above the fold, and the layout never looks like stacked boxes. Brand colors, fonts and
images change per client; the structure does not.

Outputs are **designs for review and handoff**: one HTML page per client, emails grouped
by flow, 600px wide each. Fluid's team builds the live emails in Klaviyo afterwards, which
is why dynamic content appears as a labeled placeholder rather than working code.

## Client folder and client memory (every task)

Before starting, open `clients/<slug>/` (see `clients/README.md`; new client: copy `clients/_template/`). **Read `memory.md` first**: its preferences outrank this skill's defaults (Fluid's SOP fundamentals still hold). Save your output in the client's folder (`designs/<date-or-flow>-<name>/`: design source, canvas link, a versions table; reusable cutouts and badges in `brand/assets/`; the brand kit in `brand/brand-kit.md`). **Before you finish, append to `memory.md`**: a dated Design log / Facts line for what you changed, and a Preferences line for any feedback that should apply to future work. **Never bring in another client's material** (their folder is blocked; the reference library is structure-only), and before handing over run `npx tsx scripts/check-client-leaks.ts <slug> <your files>`.

**Confidential, always:** never mention Fluid's reference library, other clients, other brands' emails or where an idea came from in anything a client could see (docs, briefs, copy, designs, canvas notes, comments, file names, reports). The library is for internal use on every client; to the client it does not exist.

## Flows in this skill

| Flow | Status | Blueprint | Templates |
|---|---|---|---|
| Welcome | Ready | `references/flows/welcome.md` | `templates/welcome/` |
| Site abandonment | Ready | `references/flows/site-abandonment.md` | `templates/site-abandonment/` |
| Browse abandonment | Ready | `references/flows/browse-abandonment.md` | `templates/browse-abandonment/` |
| Abandoned cart / checkout | Ready (one set for both) | `references/flows/abandoned-checkout.md` | `templates/abandoned-checkout/` |
| Post-purchase | Ready | `references/flows/post-purchase.md` | `templates/post-purchase/` |
| Win-back | Ready | `references/flows/winback.md` | `templates/winback/` |

If asked for a flow that is not added yet, say so plainly. You can still design it from
`references/design-rules.md` and the client's strategy doc, but tell the user it isn't
built on a Fluid template yet.

## Workflow

### 1. Gather inputs

You need four things. Ask only for what's missing, in one message:

1. **The brand's website URL** (for fonts, colors, imagery style).
2. **The asset kit**: logo (ideally light and dark versions), product cutouts
   (transparent PNGs), lifestyle or hero photos. Brand guide if they have one.
3. **The copy or strategy doc** for the flow(s).
4. **Which flows**, and **how many design options per email** (default: one).

### 2. Build the brand kit, then stop for approval

Follow `references/brand-kit.md`. Show the user the brand kit and **wait for approval
before designing anything**. A wrong font or main color would repeat across every email
in every flow, so this checkpoint is cheap insurance. Never substitute a font silently.

### 3. Read the rules and the flow blueprint

Read `references/design-rules.md` every time. Then, for each flow requested, read its
blueprint in `references/flows/` and view its example sheets (listed in the blueprint).
The examples show how Fluid's designs feel; the blueprint says which parts to copy and
which older habits to leave behind.

### 4. Map the copy to blocks

Go email by email through the copy/strategy doc and match each piece of copy to a block in
the blueprint.

- **Use the copy exactly as written.** Don't add, rewrite or "improve" text. Fluid's copy
  is approved before it reaches design.
- If a template block has no copy, delete the block. Don't write filler to keep it.
- If the doc has only goals (no finished copy), ask whether to write copy from the
  strategy or to leave labeled placeholders. Don't decide for them.
- Read the doc's rules (exclusions, eligibility, offer terms) and reflect them in the
  layout. Example: if a discount excludes a category, show the eligible products and the
  excluded ones in separate sections so the design never implies the discount applies.
- The doc's `Design:` field decides the format: `Yes` = designed template,
  `Plain text` = the plain-text template.

### 5. Build the emails

1. Write `brand.json` (format in `references/brand-kit.md`).
2. For each email, copy the matching fragment from `templates/<flow>/` into a working
   folder, replace every `{{PLACEHOLDER}}` with the copy and asset paths, and delete blocks
   with no copy. Asset paths can point straight at `/mnt/user-data/uploads/...`; the
   assemble script inlines and compresses them.
3. **Email 1 versions (one per signup interest)**: build one design, then make a copy per
   version and swap only the copy (plus the product images if that version's copy names
   different products). Same layout every time.
4. Assemble everything into one page:

```bash
python scripts/assemble.py --brand work/brand.json \
  --out /mnt/user-data/outputs/<brand>-email-designs.html \
  --flow "Welcome Flow" "Email 1 - Interest A=work/w1a.html" "Email 1 - Interest B=work/w1b.html" \
         "Email 2=work/w2.html" "Email 3=work/w3.html" "Email 4=work/w4.html" "Email 5=work/w5.html"
```

Repeat `--flow` for each flow. For multiple options, list them next to each other
(`"Email 3 - Option A=..." "Email 3 - Option B=..."`).

### 6. Check your work before showing it

```bash
python scripts/render_preview.py /mnt/user-data/outputs/<brand>-email-designs.html --out work/preview
```

The sandbox can't reach Google Fonts, so previews fall back to system fonts unless you
embed the brand fonts first: `python scripts/fetch_fonts.py "Anton" 400 --dir work/fonts`
prints entries to add to `fonts.files` in brand.json (custom fonts the user uploads go
there too).

The preview screenshots every email into viewing sheets and flags rule breaks: a button or offer
below the fold, sections touching with no transition, extra text inside product blocks,
and leftover placeholders. Fix every flag, then **view the sheets yourself** and compare
against the example sheets. Ask: does it feel like a Fluid email, or like stacked boxes?
Re-render after fixes.

### 7. Deliver

- If the Artifact tool is available, publish the page so the user can open, share and
  comment on it. Otherwise present the HTML file.
- If they want it in Figma and the Figma connector is connected, build it there on request.
- Keep the reply short: what was built, anything you couldn't do (missing assets, a font
  stand-in), and nothing else.

## Scripts

| Script | What it does |
|---|---|
| `scripts/extract_palette.py` | Pulls the main colors out of the logo and key images, with how much of each image they cover. |
| `scripts/assemble.py` | Builds the single self-contained page: brand tokens, fonts, inlined and compressed images. |
| `scripts/render_preview.py` | Screenshots each email and runs the rule checks. |
| `scripts/fetch_fonts.py` | Downloads a Google Font's files so previews render in the real font. |

Run scripts from the skill folder (copy it to `/home/claude/` first if the installed path
is read-only). They need Pillow, and the preview needs Playwright with Chromium.

## Adding a new flow (for whoever maintains this skill)

When the user sends designs and strategy docs for a new flow:

1. Study the examples for **structure**, not looks: block order, what sits above the
   fold, where dynamic sections go, how products and backgrounds are layered. Write it up
   for the user and get it confirmed before building anything.
2. Write `references/flows/<flow>.md` following the shape of `welcome.md`: strategy
   spine, email-by-email block order, examples to view, and older habits to ignore.
3. Add fragments to `templates/<flow>/`, built from the shared components in
   `templates/_base.html`. Add new components there if the flow needs one, so every
   flow stays visually consistent.
4. Save 4-8 example sheets to `references/examples/<flow>/` (compressed JPEG contact
   sheets of compliant examples only).
5. Update the flows table at the top of this file and the description if needed.
6. Test with a demo brand through assemble and render, fix the flags, then repackage
   under the same name (`fluid-email-designer`).

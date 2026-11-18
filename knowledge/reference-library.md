# The reference library

> **Internal only. Use it for every client; never mention it to a client** — not the library, not other clients, not where an idea came from — in any doc, brief, email, design, note or report a client could see.

Fluid's past emails, in Supabase, tagged so any agent can pull the right examples before it writes or designs. Built by `npm run brain:references` from `~/Desktop/Claude Editing Assets/Email Designs` (re-runs only add new designs; drop a new PNG in the right folder and run it again).

**Figma:** Fluid's Figma file *Design-List* (pages Beauty, Fashion, Peptide, CPG, Supplement, Portfolio) is the other source. `figma_url` on a row opens the original frame. To add new Figma designs: export each new frame to `out/figma/png/` and list it in `out/figma/manifest.json`, run `npx tsx scripts/figma-dedupe.ts` (perceptual match against the library), then `npm run brain:references -- --figma`.

**Where:** table `reference_emails`; image at storage `brain/<image_path>` (1200px-wide WebP); a JSON copy of every row in `out/references/`.

## What each row holds

| Column | Use it for |
|---|---|
| `kind` | `flow` or `campaign` |
| `flow_type`, `flow_position` | `welcome` `site_abandonment` `browse_abandonment` `abandoned_cart` `post_purchase` `winback` (+ optional types); position as Fluid named it (`1`, `1A`, `1v2`, `3`) |
| `campaign_type` | `product` `sale` `educational` `holiday` `launch` `social_proof` `founder_story` `newsletter` `bundle` `restock` |
| `industry` | `peptides`, `supplements`, `apparel`, `firearms`... |
| `quality` | `exemplar`, or `anti_example` (what NOT to do) |
| `tags` | building blocks and angles: `mystery-offer`, `plain-text`, `comparison-table`, `icon-bridge`, `reviews`... |
| | `speaks-to-avatar` = the 28 emails whose headline speaks to the reader's situation (passes `sop_check.pain_point_headline`). Use these first when studying how copy talks to a person; most other references are product-led and are for layout only |
| `teardown` | headline, subheadline, offer, button, above_the_fold, sections (with each section's CTA), design (palette, type, buttons, transitions, imagery), `steal` (what to reuse) |
| `copy` | every line of copy, verbatim, by section |
| `sop_check` | the Design SOP checks, pass/fail with a note |
| `summary` | what the email does and why it works |
| `figma_url`, `figma_page` | the source frame in Figma, when there is one |

## How the agents use it

1. **Find the job.** Flow email → `flow_type` + `flow_position`. Campaign → `campaign_type` from the brief (the strategist's 20% sales sends are `product` / `sale` / `bundle` / `launch`; the 80% value sends are `educational` / `founder_story` / `social_proof` / `newsletter`).
2. **Pull 3–6 references**, same industry first, then any industry. Read their `teardown`, `copy` and `steal`, and look at the images.
3. **Read one anti-example** before designing (`quality = 'anti_example'`).
4. **Structure only, never content.** References belong to other brands. Borrow layout, section order and visual devices; never their copy, claims, product names, images, prices or results. `scripts/check-client-leaks.ts` flags any reference brand that ends up in a client's work.
5. **The SOPs win.** A reference shows what good looked like for one brand; the Design SOP and the flow system are the rules. Where a reference fails an `sop_check`, don't copy that part.

```sql
-- every product campaign, supplements first
select ref, brand, industry, summary, teardown, copy from reference_emails
where kind = 'campaign' and campaign_type = 'product' and quality = 'exemplar'
order by (industry = 'supplements') desc limit 6;

-- abandoned cart email #3 across brands (the mystery offer)
select ref, brand, teardown->>'headline', teardown->>'offer' from reference_emails
where flow_type = 'abandoned_cart' and flow_position like '3%';
```

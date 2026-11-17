# Dolce Superfoods — client memory

Read before any work for Dolce Superfoods. Append (dated) after every change. Rules here outrank general skills where they conflict, except Fluid's SOP fundamentals.

## Preferences (standing rules)
- 2026-11-16 · account · Klaviyo: drafts allowed since 2026-11-16 (templates + draft campaigns only; never send, schedule or edit live things). Everything else read-only. Segments need a separate OK.
- 2026-11-16 · copy · Voice: "a nice handshake or a warm hug from a friend"; Jeff Weaver signs plain-text notes. Never repeat the site's "FDA Approved"; no health/benefit overclaiming. Max discount 20%. (brief, site)
- 2026-11-16 · strategy · Keep core offer sends on the 90-day engaged list; wide lists (180d/365d/full) underperform badly. Run B2B (wholesale / private label) as its own track. Never mail "IS | Wholesale Leads (Do not use this list for marketing emails)".

- 2026-11-16 · sender · Fluid standard: campaigns and flows sent from a named persona. Proposed **"Hannah from Dolce"** (pending Jeff's approval). Hannah speaks for the team, never claims personal use/results. Founder notes stay from Jeff Weaver. A/B test Hannah vs "Dolce Superfoods" from-name in the first month.

## Design log (every change, newest last)

## Facts & decisions
- 2026-11-16 · onboarding done: research/onboarding-doc.md; Klaviyo audit research/klaviyo-audit-2026-11-16.json (last 60 days).
- 2026-11-16 · verified (Klaviyo): 25 email campaigns in 60d (2.9/wk), avg open 50.6%, click 1.03%. Best consumer content = product guides to 90d engaged ($0.69–0.94 RPR); best overall = co-packing send $3.06 RPR; FREEMATCHA sends to wide lists $0.04–0.13.
- 2026-11-16 · verified (Klaviyo): regular Welcome / Abandoned Checkout / Browse / Post-Purchase (2nd) flows set to draft on Nov 16 and replaced by live "EARLY ACCESS" Black Friday versions — intentional.
- 2026-11-16 · verified (site): FREEMATCHA = free 1 lb Culinary Matcha on $160+, one-time purchases only, through Nov 19. Prices: Instant Coffee 14 oz $19.99 / 3 lb $65; Culinary Matcha 1 lb $23.99; Ceremonial Matcha from $79.99; Cacao 1 lb $14.99 (home) vs $9.99 (catalog variant) — check.
- 2026-11-16 · proposed first campaigns: strategy/2026-11-16-first-campaigns.md (FREEMATCHA last call · The cost of a cup · Launch in Q1 private label). Awaiting approval.

- 2026-11-16 · verified (orders, 365d): matcha + cacao drive revenue (Ceremonial Matcha $204k/90d, 23%); instant coffee only $21k. Repeat 26%, 72% same product, median 55 days to 2nd order. AOV $213, median $106, 31% ≥$160.
- 2026-11-16 · strategy: strategy/2026-11-16-bfcm-strategy.md — 9 emails Nov 18–Dec 2 (proposed BF tiers 15% $100+ / 20% $200+). Awaiting approval.

## Open questions
- Lead product for campaigns: Instant Coffee (brief) vs matcha (site bestsellers row)?
- Where do reviews live? Need real customer quotes.
- Remove/avoid "FDA Approved" on site?
- Which ceremonial matcha is the hero ($79.99 vs Reserve $98.20)?
- Black Friday / Cyber Monday main offer and dates?
- Consumer vs B2B split for email; current co-pack lead times and 100-unit minimum.
- Servings per 3 lb instant coffee (for cost-per-cup).

- Approve sender persona "Hannah from Dolce"? Reply-to inbox for Hannah?

- Shopify: received only the app's client secret (shpss_) — need the Client ID too (store dolce-vanilla.myshopify.com from brief; secret alone returns 401 / application_cannot_be_found). App needs read_orders + read_all_orders + read_products + read_customers.

## Assets

- 2026-11-16 · copy · Wrote copy/2026-11-18-freematcha-last-call.md (designed, AIDA, Hannah sender). Three $160+ baskets from 90d bestsellers with one-tap Shopify cart links (/cart/<variant>:1,…?discount=FREEMATCHA, tested to checkout). Prices from the public products.json on Nov 16. Open: FREEMATCHA end time, stacking/tax rules, which cacao powder listing.
- 2026-11-16 · strategy · Fixed weekday labels in bfcm-strategy (Nov 18 is a Wed). Open: Cyber Monday email (Mon Nov 30, "last day") vs offer ending Tue Dec 1. Pick one.
- 2026-11-16 · copy · FREEMATCHA copy v2: rewritten in natural full sentences after feedback (no "X. Ends tomorrow." fragments, no clipped two-word lines). Fluid-wide rule now in copy-rules.md.

- 2026-11-16 · reporting · Meelad asked for the top campaign from the last 14 days (Nov 3–16): "The coffee we sell that isn't instant (Non-Opener)", $5,660 / 6 orders / 3,216 recipients, sent to 90d engaged non-openers of the Oct 22 send.
- 2026-11-16 · reporting · Meelad pulled the last-7-day report (Nov 10–16): email $18,154 / 94 orders / 6 sends (campaigns $10,184, flows $7,970); store $70,999. Top: "In their words, in capital letters" $3,766 / 14 orders; Welcome Flow $3,726.
- 2026-11-17 · reporting · Meelad pulled the last-7-day report (Nov 11–17, data synced only to Nov 16): email $16,749 / 86 orders / 5 sends (campaigns $9,992, flows $6,757); SMS $636; store $63,923. Top: "In their words" $3,766 / 14; "There's a free bag waiting" $2,093 / 10; Welcome Flow $3,330.
- 2026-11-17 · reporting · Meelad re-pulled the last-7-day report (Nov 11–17). Same numbers as above, still synced only to Nov 16.
- 2026-11-17 · copy · Meelad asked for a 20% off matcha email for lapsed customers. Wrote copy/2026-12-03-matcha-winback-20.md (designed, BAB, Hannah). Proposed Thu Dec 3 so it doesn't undercut the BF tiers; segment = matcha buyers with no order in 120+ days; proposed code MATCHA20 (matcha only, ends Dec 6), not created yet. SMS Sat Dec 5. Needs approval + code + segment OK.

## Design log
- 2026-11-16 · design v1 · FREEMATCHA last call: canvas https://claude.ai/artifact/RmXPmtNaiRtRJb66tCk6tM, source designs/2026-11-18-freematcha-last-call/. Brand kit from the site (brand/brand-kit.md): Bigola Display + Karl, orange #E03400, cream. Product images are the site's white-bowl shots, cut out with a soft shadow (brand/assets/bowls).
- 2026-11-16 · design v2 · FREEMATCHA: hero texture made full-bleed per comment. Preference: background photos run edge to edge, never inset or arched so they look cut off.
- 2026-11-16 · verified (Klaviyo metrics): Dolce uses Klaviyo Reviews (Submitted review / impression.review metrics), so real customer reviews can be pulled from Klaviyo. Also runs Triple Whale pixel metrics.
- 2026-11-16 · klaviyo · Meelad approved drafts in Dolce's Klaviyo (clients.klaviyo_write = 'drafts'; drafts and templates only, never send or schedule). Segments not approved yet. First push: FREEMATCHA draft campaign 01M7KA19QGEKY3SRJS12B4SBYQ / template TyKRRM. Feedback pending: 17 slices feels like too many.
- 2026-11-17 · design v1 · Matcha win-back 20%: designs/2026-12-03-matcha-winback-20/ (design.dc.html, same system as FREEMATCHA, full-bleed hero texture, 3 matcha product cards with name + button). Not rendered, sliced or published yet: no shell this session. No whisk asset, so the hero shows the bowl only.
- 2026-11-17 · design · Meelad asked for the matcha win-back canvas link. There isn't one yet because the design was never published, so it still needs publishing from the bot.
- 2026-11-17 · design · Meelad asked to publish the matcha win-back and send the campaign. Not possible from this session because it has no shell or publish tool, and no Klaviyo write tool. Still unpublished, with no Klaviyo draft.
- 2026-11-16 · klaviyo · Preference: emails go into Klaviyo as drag-and-drop templates (SYSTEM_DRAGGABLE, one image block per slice), not custom HTML. FREEMATCHA draft now uses DnD template XEkEXR.
- 2026-11-17 · design · Matcha win-back 20% (Dec 3) designed via Slack; published to Claude Design from Claude Code: https://claude.ai/artifact/FAgMrjqhqPxxEHPUzA6KQj
- 2026-11-17 · design · Meelad asked for the win-back campaign; published review link (v2, in review): https://fluid-email-marketing-agent-production.up.railway.app/r/p7pT9hgWE-lgEIqWVKRZ0NNH
- 2026-11-17 · design · Meelad asked to resend the win-back; resent the same review link (no changes).
- 2026-11-17 · strategy · Meelad asked for campaign ideas for engaged matcha buyers. Pitched 4: Reserve upgrade (ceremonial buyers), restock reminder (55-day cycle), matcha + coconut milk powder latte pairing, holiday matcha gift guide. Awaiting pick.
- 2026-11-17 · design · Meelad picked the latte recipe guide and asked for the design only, with no copy sent. Built designs/2026-11-24-matcha-latte-guide/ (3 recipes: coconut, strawberry iced, Reserve with water; no discount; Hannah; proposed Tue Nov 24). Review link v1: https://fluid-email-marketing-agent-production.up.railway.app/r/h81RrbvovGCe13bRWMpuWfI5. To check: coconut milk powder handle is guessed (site rate-limited), no coconut cutout yet, recipe ratios need a team OK.
- 2026-11-17 · preference · When Meelad asks for an email design, skip sending copy for review and go straight to the design.
- 2026-11-17 · design v2 · Matcha latte guide rebuilt with better images, same copy (Meelad): 4 generated scenes (brand/assets/generated/2026-11-17-*), stacked photo recipe cards, coconut link fixed to /products/organic-coconut-milk-powder (verified). Same review link, v2.
- 2026-11-17 · klaviyo · Meelad asked to push the matcha latte guide to Klaviyo as a draft with audience = his engaged 120 list. Not possible from Slack (no Klaviyo write tool here); audience saved in the design README. Still needs pushing from the bot/Claude Code.
- 2026-11-16 · tools · Tool test: design references and product_images both work. Cacao nibs photos saved to brand/assets/products/organic-cacao-nibs/ (1–3.jpg 1200x1200, 4.jpg 1200x675, each with a -cutout.png).
- 2026-11-16 · tools · Tool test 2: product_images for "ceremonial matcha" works (Reserve matcha, 4 photos in brand/assets/products/bulk-ceremonial-reserve-matcha-powder/). generate_image failed because image generation isn't set up yet (KIE_API_KEY missing), so no image was made.
- 2026-11-17 · tools · Tool test 3: product_images (Reserve matcha) and generate_image both work now. Test scene brand/assets/generated/2026-11-17-strawberry-matcha-latte-counter.jpg (iced strawberry matcha latte, 1400x939, left side left empty for a headline) came out very realistic.
- 2026-11-17 · design · CTA casing = Title Case (matches the site buttons: "Shop All", "Shop Best Sellers"). All email buttons, e.g. "Restock My Matcha".

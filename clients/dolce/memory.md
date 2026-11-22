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
- 2026-11-17 · klaviyo · Meelad asked to push the matcha latte guide. Added copy/2026-11-24-matcha-latte-guide.md (subject/preview/sender/audience, which push needs) and pushed: template created (9 slices) but no draft campaign, because "Engaged 120" matched no Klaviyo list/segment. Need the exact segment name to re-push.
- 2026-11-17 · klaviyo · Re-pushed with "FC | engaged 120" (Meelad); still no match in Klaviyo, so template only again. Need the segment name copied exactly from Klaviyo.
- 2026-11-16 · copy+design · Nibs, powder or butter (Fri Nov 20, BFCM #3): copy/2026-11-20-nibs-powder-or-butter.md (AIDA, Hannah, no offer) + designs/2026-11-20-nibs-powder-or-butter/ v1, review link https://fluid-email-marketing-agent-production.up.railway.app/r/J7dgo_S8nNR0lP7FZESWieAJ. 3 new generated scenes (three bowls, bark, holiday brownies/cocoa). Open: which cacao powder listing (used Organic $14.99), no cacao collection page (links to /search?q=cacao), bark ratios need team OK.
- 2026-11-17 · design · CTA casing = Title Case (matches the site buttons: "Shop All", "Shop Best Sellers"). All email buttons, e.g. "Restock My Matcha".
- 2026-11-22 · strategy · Meelad asked for the next-30-day calendar. Wrote strategy/2026-11-22-30-day-calendar.md (Nov 23 → Dec 22: 20 emails, 6 SMS). Built on the BFCM plan but with an email every sale day (added Sun Nov 29 + Tue Dec 1 close), BF live moved to 90d engaged (wide lists $0.04–0.13; Nov 20 gift guide $593 / 11.2k = $0.05). Needs approval + BF tiers + Christmas shipping cutoff. Note: the team's actual Nov 16–20 sends were their own FREEMATCHA series + gift guide, not exactly the Nov 16 plan.
- 2026-11-22 · design · Meelad asked for "Matcha as a gift" (one pound for you, one for them, before Black Friday). Built designs/2026-11-23-matcha-gift-guide/ + copy/2026-11-23-matcha-gift-guide.md: proposed Mon Nov 23 to FC |  90-day engaged email list, Hannah, no discount, three pair cart links (qty 2 each: Ceremonial, Reserve, Culinary). 3 new generated scenes (gift wrapping hero, counter, dark parcels). Review link v1: https://fluid-email-marketing-agent-production.up.railway.app/r/3Ndjl8IRP2Nxb8kLqR71NCci. To check: "200+ cups a pound" (~2 g a cup). Site has no packaging photo, so gifts are shown in brown paper.
- 2026-11-22 · design v2 · Matcha gift guide, from Meelad's comments: smoother hero gradient (no visible photo edge) and an extra CTA after the Yours/Theirs section. Preference: an image edge must never show. Fade into photos with a long, smooth gradient.
- 2026-11-17 · klaviyo · Built FC | Engaged 120 (Xyq89p) from the segmentation master sheet at Meelad's request. Segments are now OK to build from the master sheet when an asked-for audience is missing.
- 2026-11-22 · reference · Meelad wants an email image saved as the brand reference "Four things to make with matcha", to send back when he asks for it. Three tries in Slack, but the image never reached the bot (no attachment, nothing saved in the folder). Still need it as a public link to save it.
- 2026-11-22 · reference · Saved "Four things to make with matcha" as its Figma link (node 47-524 in "Dolce Superfoods | NOVEMBER 2026 Campaigns") in brand/reference-emails.md. When Meelad asks for "the four things to make with matcha email", send that link. Saved reference emails live in brand/reference-emails.md.
- 2026-11-22 · reference · Meelad asked for "the four things to make with matcha email". Sent the saved Figma link.
- 2026-11-22 · design · Meelad asked for "What a cup of ceremonial costs" + "Three matcha lattes worth making at home". Built designs/2026-11-23-cost-of-ceremonial/ + copy (Mon Nov 23, from Jeff, designed not plain text, no discount, 35¢ a cup = $79.99 ÷ ~227 cups at 2 g; café $6+ → $1,360 for 227). Review link v1: https://fluid-email-marketing-agent-production.up.railway.app/r/KNonVWcAXR0duWYgJoitiO2N. Lattes = the existing latte guide (Tue Nov 24), re-shared its link. To check: serving size, café price, Jeff's quote OK.
- 2026-11-22 · klaviyo · Meelad asked to build both into Klaviyo with links. Pushed as drafts: "DRAFT · What a cup of ceremonial costs" (5 slices, FC |  90-day engaged email list) and "DRAFT · Matcha latte guide" (9 slices, FC | Engaged 120). Both exclude wholesale tags, every slice linked, QC clean.
- 2026-11-22 · flow · Meelad asked for the welcome flow. Wrote copy/welcome-flow.md (7 emails + 2 SMS, from strategy/flow-strategy.md) and designed all 7: designs/welcome-flow-01-matcha, -01v2-cacao, -01v3-smoothie, -02-jeff-note (plain text), -03-reviews, -04-best-sellers, -05-upgrade-20. One flow system: soft gradient, ink-outlined cards, floating bowl cutouts, Instrument Serif italic accent, ticker band. 4 new generated scenes (matcha kitchen, cacao baking, blue smoothie, pantry jars); coconut water + collagen cutouts saved. Flow link: https://fluid-email-marketing-agent-production.up.railway.app/f/1roGosp6_vjdmJdBnx5HJ7Gs. Added an Avatar 1 moments list to research/onboarding-doc.md. Before live: approve ladder + create WELCOME20, Hannah + reply-to, 3 real Klaviyo reviews for #3 (placeholders now), how Jeff introduces Megan.
- 2026-11-22 · klaviyo · Meelad asked to build the welcome flow as a Klaviyo draft with the 3 #1 versions split on the profile property. Pushed all 7 emails as DnD templates (template only, no campaigns; per-email copy files copy/welcome-flow-0*.md with no audience). The flow itself and the conditional split can't be built from here (no flow tool): someone assembles it in Klaviyo (trigger: pop-up list; split on stocking_up_on = Matcha / Cacao and baking / Smoothie boosts; #2–#5 shared; #5 filter non-purchasers). stocking_up_on won't exist on profiles until the new pop-up is live. Jeff's note: template greeting is "Hi there" (image slices can't merge first_name) and the footer comes from Klaviyo; ideally rebuild it as a text block.
- 2026-11-22 · strategy · Meelad asked for the flow strategy + 30-day calendar. Wrote strategy/flow-strategy.md (6 core flows + Replenishment rebuild, 24 emails / 5 SMS, pop-up "What are you stocking up on?" Matcha / Cacao and baking / Smoothie boosts). Proposed ladder: DOLCE15 → WELCOME20 (24h), MYSTERY real 20% (no "up to 30%" teaser, cap is 20%), AGAIN10, RESTOCK15 at day 45+6, COMEBACK20 at day 90. Build after BF (Dec 2). Doc: https://fluid-email-marketing-agent-production.up.railway.app/d/4Ie9htrGTWf8ssbgtTxGwVGK. Re-shared the 30-day calendar: https://fluid-email-marketing-agent-production.up.railway.app/c/cQWXt0nePlkShBvu3zicWW76. Needs approval + free-shipping threshold + shipping times.

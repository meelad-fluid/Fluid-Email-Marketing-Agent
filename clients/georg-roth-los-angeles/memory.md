# Georg Roth Los Angeles — client memory

Read before any work for this client. Append (dated) after every change. Rules here outrank general skills where they conflict, except Fluid's SOP fundamentals.

## Preferences (standing rules)
<!-- - 2026-01-01 · design · "…" (source: who/where) → rule -->

## Design log (every change, newest last)
<!-- - 2026-01-01 · <email> v2 · asked: … · changed: … · file: designs/<email>/ -->

## Facts & decisions
<!-- - 2026-01-01 · verified/decided: … (source) -->

- 2026-11-26 · onboarding done: brand book v1 (draft), research/onboarding-doc.md, strategy/2026-11-26-month-1-plan.md, strategy/flow-plan.md
- 2026-11-26 · verified (brief): max discount 10%; welcome 10% exists; best seller Pima Luxe tees ($98 SS, $138 LS, 3-pack $265); men 35-65 + women buying for men; they call every customer after an order because sizes get ordered wrong
- 2026-11-26 · verified (site): free U.S. shipping over $150; BF offer $50 off/$250, $100 off/$500; 14-day returns, holiday orders returnable to Jan 15, 2027; customer pays return shipping; fit rules differ by product (tees trim/size up, sweaters size down, belts +1 pant size, Magnanni half size down)
- 2026-11-27 · CORRECTION (Meelad/Fluid): the earlier "no Klaviyo history / no orders" was a bug in the audit (their Klaviyo has two Shopify "Placed Order" metrics; it read the empty duplicate from a Nov 4 reconnect). Real data: Shopify IS integrated in Klaviyo, they send from Klaviyo (8 live flows, 21 email campaigns in the last 60 days, 53 campaigns synced), 2,678 orders from 1,912 customers over the last 365 days. Re-run the onboarding audits and use research/klaviyo-audit-*.json and klaviyo-orders-*.json.
- 2026-11-26 · proposed: sender persona "Sophie from Georg Roth"; founder emails from Georg; offer ladder capped at 10% (upgrades = + free shipping)
- 2026-11-28 · re-ran audits: #1 seller last 90d = Men's Pima Long-Sleeve Crew (TCLS-Core), ~420 units across two listings; 90d AOV $302, 1,056 orders (research/klaviyo-orders-2026-11-28.json)
- 2026-11-28 · wrote BF "still on" plain-text email from Georg featuring the LS crew (asked by Meelad), copy/2026-11-28-bf-still-on-plain-text.md, draft
- 2026-11-28 · Meelad asked for a 20% off email modeled on their "best campaign in 90 days" (Klaviyo web-view link 01M4XH60PKWZCA9J0MSJSGFA0G). Web view won't load for us and it's not in the library; asked for a screenshot. Top by revenue in audit = "Give Your Neutrals a New Companion" ($5,967, Oct 25). 20% has been run before (EARLY20 VIP), despite the 10% cap in the brief
- 2026-11-28 · Meelad confirmed the reference = "Give Your Neutrals a New Companion". Built "One New Color — 20% Off" (copy/2026-11-29-one-new-color-20.md, designs/2026-11-29-one-new-color-20/), draft for Sun Nov 29, code COLOR20 placeholder (confirm + create in Shopify), ends Mon Nov 30 11:59 PM PT. render_preview kept timing out ("element not visible") and QC didn't run on publish, so the layout hasn't been checked by eye yet
- 2026-11-28 · One New Color v2 · Meelad comments: CTAs unreadable (link color rule overrode button text color, fixed on all 3 buttons), code bigger/standout (now a big coupon box above CTA), hero image → person wearing the tee (generated man in plum tee, LA rooftop), swatch chips removed. render_preview still times out; QC didn't run
- 2026-11-28 · One New Color v3 · Meelad: hero photo too dark, show the model more, make him the main piece → new bright daylight rooftop photo (2026-11-28-man-plum-pima-tee-bright-rooftop.jpg), split hero with model full-height on the right, no dark overlay; "how it wears" row now black. Preview still times out, QC didn't run → standing pref: Meelad wants bright, well-lit model shots as the hero, not moody/dark
- 2026-11-28 · Meelad asked to update "FC | Black Friday Cart Inspiration" (Klaviyo campaign, subject "You are close to $50 off", SCHEDULED Sat Nov 28 10 AM PT) to the 20% offer + hero of a person wearing the shirt. Not built by us, not in library/audit; asked for a screenshot and which 20% (assumed VIP EARLY20). Fluid can't edit a scheduled Klaviyo campaign: rebuild as new draft, someone unschedules the old one
- 2026-11-28 · One New Color v4 · Meelad: flip the hero so the text and button are on the right → model photo now on the left, copy/code/CTA on the right. Preview still times out, QC didn't run
- 2026-11-28 · Meelad: use COLOR20 for Cart Inspiration. Rebuilt as designs/2026-11-28-bf-cart-inspiration-20/ (kept black/red BF look from their screenshot, cart → generated bright studio model in pearl grey Pima LS crew, 20% off everything tag + COLOR20 box, 2 product cards). Draft for Sat Nov 28; old scheduled Klaviyo campaign still needs unscheduling; COLOR20 not yet created in Shopify. Preview timed out and QC didn't run again
- 2026-11-28 · One New Color approved by Meelad (Approve & build). Fixed the render timeout (the design file started with <style>, so the renderer grabbed an invisible element; style now sits inside the .email div, classes prefixed gr-). Renders fine now, same look as v4. Klaviyo push BLOCKED: Klaviyo is read-only for Fluid (admin must allow drafts). COLOR20 not created: Shopify discounts are off and max discount is set to 10%. Audience "Email List (engaged)" closest match = FC | Engaged L180D
- 2026-11-28 · Cart Inspiration v2 · Meelad: hero copy "Get 20% off." + Use COLOR20 + button; lifestyle photo of someone wearing the shirt, not a cutout on black → full-bleed bright LA cafe-wall shot (2026-11-28-man-pearl-grey-pima-ls-la-cafe-wall.jpg), text left on cream wall. Pref: Meelad prefers real-life lifestyle scenes over studio cutouts. QC/preview didn't run
- 2026-11-28 · One New Color v5 · Meelad: make the 20% off automatic → no code; hero box "No code needed · 20% OFF · Taken off at checkout"; COLOR20 removed everywhere. QC fixes: removed "20% OFF · ENDS MONDAY" pill and product stickers, offer text 15px, hero names "tees" and matches shown colors (plum/blue), step 3 "Not sure of your size? We'll call to check." QC open: white 3-pack card. Needs an automatic 20% discount set up in Shopify (Fluid can only create codes). Back to in review, needs re-approval
- 2026-11-28 · Cart Inspiration v4 · Meelad: "no code needed" → COLOR20 removed everywhere (hero box, close, subject), 20% is automatic at checkout. QC fixes: red #C8352B swapped for brand navy (not in palette), removed 20% OFF product pills, fit tip now plain text, deadline 15px. QC passed. Renders now (style moved inside .email div). Needs an automatic 20% discount in Shopify
- 2026-11-26 · brand fonts not verified; brand book proposes Cormorant Garamond + Montserrat (draft)

## Open questions
- BF spend-and-save is up to 20% vs 10% cap: OK to use in email?
- Mailchimp: the brief mentions it, but they already send from Klaviyo. Is anything still sent from Mailchimp (a list to bring over)?
- Welcome code name and which tool runs the pop-up today
- What is the "World Cup challenge", still running?
- Holiday shipping cutoff date
- Can email say "we call every customer after an order"?
- Review export (site shows 4.7/5) and notes from post-order calls
- Can we use stockists' "no shrink, no twisted seams" claim?
- Brand fonts + logo files (Dropbox assets folder)
- Shopify connection for order data

## Assets
<!-- - brand/assets/<file> — what it is, how it was made -->

Email platform: Klaviyo
Website: https://georgrothlosangeles.com/

# Precision Peptide — client memory

Read before any work for this client. Append (dated) after every change. Rules here outrank general skills where they conflict, except Fluid's SOP fundamentals.

## Preferences (standing rules)
<!-- - 2026-01-01 · design · "…" (source: who/where) → rule -->

## Design log (every change, newest last)
<!-- - 2026-01-01 · <email> v2 · asked: … · changed: … · file: designs/<email>/ -->

## Facts & decisions
<!-- - 2026-01-01 · verified/decided: … (source) -->
- 2026-11-24 · onboarding done: brand book v1 (draft), compliance.md, research/onboarding-doc.md, strategy/2026-11-24-month-1-plan.md, strategy/flow-plan.md; onboarding form + Drive folder stored in the client library
- 2026-11-24 · verified: NOT a research-use-only brand. Two lines: Rx telehealth (compounded semaglutide/tirzepatide "GLP-1", Sermorelin, NAD+ via 503A pharmacy, US-licensed clinicians) = Classification C; retail OTC line (Recovery Patch, BPC, KPV, Ageless, Chill, Blue, Hair) = Classification D. Compliance gate ESCALATE: no promotional copy/design/sends until counsel clears claims, disclaimers, CTAs, offers (site, press Jul 2026)
- 2026-11-24 · never use "research use only" framing for this brand; avatars are about sourcing/format/process, never body goals
- 2026-11-24 · publicly listed CSE: BPC · OTCQB: PNGAF; LegitScript seal; MMA.INC partnership; CEO Pratap Sandhu, CSO Justin Kirkland (site)
- 2026-11-24 · max discount 25%; best sellers = needle-free patches; tone = thought leadership, trusting, safe; competitors Dialed Health, Superpower, Protide Health, Limitless Life (form)
- 2026-11-24 · team note: no em dashes in any copy
- 2026-11-24 · Customer.io last 30 days: 0 campaigns, 2,388 flow sends, 5.0% open, 0.9% click, $0 attributed; 4 senders on 3 domains → deliverability first (audit)
- 2026-11-24 · proposed sender persona: Sarah from The Precision Peptide Company (needs approval); founder notes from Pratap
- 2026-11-24 · brand colors/fonts in brand book are placeholders (only white logo verified) until the CSEBPC design system PDF from their Drive is shared
- 2026-11-24 · no BFCM send this year: can't clear legal by Nov 27

- 2026-11-24 · Gloria asked to start the flows; held copy/design because the compliance gate is ESCALATE (Rx = class C, retail = class D). Offered the non-copy prep instead (event spec for their dev, Customer.io segments/build setup, pop-up structure)
- 2026-11-24 · Meelad: "good to start working on everything" → built research/customerio-event-spec.md (dev events) and strategy/customerio-flow-setup.md (sender, segments, pop-up, automation shells, clean-up, codes). Flow copy still held: no confirmation that counsel cleared the claim set
- 2026-11-24 · APPROVAL: Meelad (Fluid) in Slack: "Yes those are all approved" = counsel approved claims, disclaimers and offers for Rx + retail. Applied as: compliance.md §5 facts usable as written; site disclaimers (§2) verbatim are the approved disclaimers; §3 CTAs incl. Shop Now (retail) approved; offer ladder approved, retail only, max 25%, no Rx discounts; §6 "never write" (outcomes, dosing, effect categories, FDA/pharma-grade, branded-drug equivalence) still applies. compliance.md is team-managed (bot can't edit): team needs to update its status from ESCALATE.
- 2026-11-24 · wrote all flow copy: copy/welcome-flow.md (pop-up + 7 emails + 2 SMS), copy/abandonment-flows.md (site 2, browse 3+1 SMS, cart 4+2 SMS), copy/post-purchase-winback-flows.md (PP 4+1 SMS, winback 2+1 SMS). Retail links point to the homepage until the client gives the shop URL
- 2026-11-24 · all flow copy gated PASS except Winback #1 (HOLD: "new since" block needs confirmed launches). Designs not started: waiting on compliance.md update by the team + the CSEBPC design system PDF (brand colours/fonts are placeholders)
- 2026-11-24 · Gloria: "start the designs". Style chosen for the Welcome flow (dark-to-copper editorial, inset photo cards). Built designs/2026-11-24-welcome-1-verify (rendered clean, no cut-offs). Brand book v2: palette from their real vial packaging (indigo #2A2668, copper #D4A27F, midnight #1A1838, cream #F7F3EE), stand-in fonts Playfair Display + Inter. Generated: hero vials (from site renders), lab bench, copper texture. Image limit is 4 per request.
- 2026-11-24 · BLOCKER: publish_design treats this client as RUO and refuses "prescription", "health", "results", "treatment" and the site's own approved disclaimer. Can't publish any Rx-line email until an admin reclassifies the client (not RUO) or the team adds these to compliance.md's Allowed terms. Did NOT work around the filter. Other 6 Welcome designs paused until fixed.
- 2026-11-24 · Meelad said he'll fix the RUO classification/publish block. Next: publish Welcome #1, then build the rest of the Welcome flow.
- 2026-11-24 · Meelad asked to build Welcome + Site Abandonment flows. Re-tried publishing Welcome #1: still blocked by the RUO filter ("prescription", "health", "treatment", "results", incl. the counsel-approved site disclaimer). Both flows lean on Rx program copy, so held the builds and asked Meelad: wait for reclassification, or reword around the filter (which means changing the approved disclaimer).

- 2026-11-24 · Meelad: "build me the welcome flow" → published Welcome #1 (publish block is gone) and designed + published the other 6: #1 needle-free, #1 Rx, #2 founder letter, #3 FAQ chat bubbles, #4 two ways in, #5 15% upgrade. Flow review page: https://fluid-email-marketing-agent-production.up.railway.app/f/qbDPo_LdzsonsHx4B9B1I7ie. Review links added to strategy/customerio-flow-setup.md (Welcome build sheet). New images: needle-free weekender bag, Rx dusk desk. Patch sachets are plain stand-ins until the real Recovery Patch render. Founder note greets "Hi there," because it ships as images. All draft, needs approval. Automation itself is set up by a person in Customer.io (API can't create automations).

- 2026-11-26 · Gloria's review comments on Welcome flow, all done + republished: #1 headline cut to 2 lines ("A peptide company you can look up"), removed about-page line, product photos in "Where most people start", WELCOME10 callout above bottom button · #1b product photos in retail range · #1c programs use site renders (/images/products/product-semaglutide.png, product-new-sermorelin.png, product-new-nad-plus.png) linked to protocol pages · #4 removed best sellers section. Retail patches (Recovery Patch, KPV, BPC) aren't on the website: generated plain unlabeled sachets (brand/assets/generated/2026-11-26-pp-patch-sachet-*.jpg) as stand-ins until real photos arrive. product_images tool can't find products on this site (not Shopify).
- 2026-11-26 · preference (Gloria): hero headlines max 2 lines; product sections need real product images, not type-only cards

- 2026-11-26 · Gloria: "build the site abandonment and browse abandonment flow" → designed + published Site Abandonment #1–#2 (flow page https://fluid-email-marketing-agent-production.up.railway.app/f/Xdb4I5GQ9bsRr8OniJMa3e2D) and Browse Abandonment #1–#3 (flow page https://fluid-email-marketing-agent-production.up.railway.app/f/JzhuQKqe1MTJffak3zO7VlpO). Build sheets + links added to strategy/customerio-flow-setup.md. New images: tell-apart vials, travel flat-lay, discreet box, midnight clock. Browse designs show the retail version (Rx variant noted in READMEs). All draft, need approval; BROWSE10 code not created yet; automations set up by a person in Customer.io.

- 2026-11-26 · Gloria: emails didn't match the website. FACT: precisionpeptidecompany.com sells ONLY the nine prescription protocols (Semaglutide $159.67, Tirzepatide $233, Sermorelin $199, BPC-157 $139, TB-500 $125, NAD+ $179, Epitalon $199, MOTS-c $199, Semax $249 per month, "as low as/from"), Get Started → /protocols/<handle>#intake. No retail range, no Recovery Patch/KPV/BPC capsules, no discount codes. Real product renders: https://www.precisionpeptidecompany.com/images/products/product-{semaglutide,tirzepatide,new-sermorelin,bpc-157,tb-500,new-nad-plus,epitalon,mots-c,semax}.png. Rewrote copy/welcome-flow.md (pop-up answers now by protocol group, Email #1 has 4 versions, #5 = from $125/month instead of 15%) and site + browse in copy/abandonment-flows.md; rebuilt + republished all 7 Welcome designs (+ new #1 v4 longevity) and 5 abandonment designs. Footer now adds the site's compounded-medication disclaimer. Kept out the site's outcome lines ("Lose weight...", "Feel the Difference") and "FDA-regulated pharmacy". Abandoned cart, post-purchase and winback copy still have old retail/code content and need the same rewrite.

- 2026-11-26 · Gloria comment on Welcome #1 v4 longevity: hero desk bottle → real Semaglutide vial (site render floated over the generated scene). Republished + resolved.

## Preferences (added)
- 2026-11-26 · Gloria: "Use only products on the website and match the website messaging" → always check precisionpeptidecompany.com/protocols before writing; use its product names, prices, CTAs and lines.

- 2026-11-26 · Gloria: "work on the abandoned checkout flow" → rewrote the cart copy for prescription protocols only (no discount, MYSTERY dropped): #1 checkout saved (progress bar), #2 next 24 hours (timeline), #3 doorstep (shipping label), #4 what stopped you (self-sorting choices) + 2 SMS, in copy/abandonment-flows.md. Designed + published all 4: flow page https://fluid-email-marketing-agent-production.up.railway.app/f/bTjoPX7G-Cz72ztDQ4AW0ylP. Style: dark cinematic photo heroes, folder-tab checkout cards. New images: couch evening, clinician desk, doorstep box, note desk. Example vials in the dynamic card are real Drive shots. Build sheet updated in strategy/customerio-flow-setup.md. All draft, need approval.
- 2026-11-26 · NOTE: copy/welcome-flow.md says (Gloria) the site sells prescription protocols only now; retail line + WELCOME codes gone. Welcome designs still show retail products/codes from earlier today; browse designs show the retail version too. Flag before those go out.

- 2026-11-26 · Gloria comment on Abandoned Checkout #2: hero headline "A licensed US clinician does." in one line → set to 35px, no wrap. Republished + resolved.
- 2026-11-26 · Gloria comment on Abandoned Checkout #3: no merge tags on image-based emails → hero sub rewritten without {{protocol}}; checkout card's {{item}} row swapped for real Semaglutide/Sermorelin/NAD+ vials + static line. Republished + resolved.
- 2026-11-26 · preference (Gloria): never put merge tags ({{...}}) in visible design copy; emails ship as images so tags show raw. Check the other flow designs for this.
- 2026-11-26 · Gloria comment on Abandoned Checkout #4: "no tag on an image, construct better" → removed {{protocol}} from the hero line and rebuilt the {{item}} cart card as a static three-vial row (Tirzepatide, Sermorelin, NAD+) + "Your protocol is right where you left it." Republished + resolved.
- 2026-11-26 · preference (Gloria): never put merge tags ({{...}}) in image-based designs; write static lines instead

## Open questions
<!-- - … -->
- Counsel: may Fluid market the Rx programs and the retail line by email/SMS? Approved claims, safety wording, disclaimers, CTAs, offers per line
- Discounts allowed on Rx programs, or retail only?
- Where is the retail shop (patches not linked on main site)? Price list for both lines
- FAQ says no injections; /protocols shows injections. Which formats are live?
- Send the CSEBPC design system PDF (fonts, colours) and logo files
- Which sender/domain to keep; SPF/DKIM/DMARC status
- What are "Amino" and "OTC" lists? Why do "Welcome, X Leads" and "Amino active" send nothing?
- Events from their platform: page_viewed, product_viewed, checkout_started, popup answer
- Order data: best sellers, AOV, repeat rate, days to 2nd order
- SMS consent source; business address for footer
- About page says "Pangea's board" (leftover?)

## Assets
<!-- - brand/assets/<file> — what it is, how it was made -->
- 2026-11-26 · REAL PRODUCT SHOTS (Gloria): client Drive folder https://drive.google.com/drive/folders/1PyPT3rO2UfZ847M1QP-9h1NQkggDhp2i → PRODUCT SHOTS/Product Shots ALPHA (transparent PNGs, folder 1CXmbcjbtZIKOXYc2GM13suqGon3fzdAd) and Product Shots PNG (grey studio bg). Use in designs as https://lh3.googleusercontent.com/d/<fileId>=w1000. List a folder via https://drive.google.com/embeddedfolderview?id=<folderId>. ALPHA ids: Recovery Patch 10pcs (BPC-157, white/teal box) 1gQpcKx3Ni3SeEbUcBflUsw7eEsHQr1i5 · KPV oral bottle (orange) 1-ySPhCPvblKpLYrZZo74XdYcmArfZ_Kb · BPC oral bottle (teal) 1SAwm4Tfs-3SEhES5XwwKYk3XW6IR0dwQ · GLP-1 vial 1QrINHF__K39QhcX6Og0LTvQX1xdtPUD7 · Semaglutide 1OVNaUQ0vpTBempdMgZ6dX_tCGeX8x8gd · Tirzepatide 1PTDAQNR8MWDpeu6zWLyN9FVy-l0cYgTp · Sermorelin 11kgyQpHEuvSVUvVi4urioYCxqNInCqQE · NAD+ 1xgjV6lUuqU4F4duqI1pNsN_cbZKZgfYN · Immunity patch 1ABEwdw9_ppSYt0LgqVDgV5_Wcg1BqaDn · Chill 1b-T3rDCdhdVlaHfDe1h5tfixKEW_A4gt · Ageless 13Wo8SyqpvBSPlrRwsFD9AOP3kMQHYR6t · Blue 1IaUyR4zbfui_ykhYHn6ktY_NYdZKJAPK · Hair 1xEG1IlQiabtyubJc55aMkx8iUQy8SCXp · Skin 1D9800lUyDsyODWdzw3mQVY2DCIWK_hh6. Vial PNGs have big padding: zoom via background-size auto 140%.
- 2026-11-26 · NEVER use generated stand-in products (copper sachets, AI-made packaging): Gloria called them "wrong images". Generated scenes with the real box garble the small label text, so float the real ALPHA shot on a colour field instead. Retail KPV and BPC are ORAL bottles, not patches; Recovery Patch = BPC-157 patch box.
- 2026-11-26 · Welcome #1, #1b, #1c, #3, #4, #5 republished with real Drive shots (hero/bag/product cards/best-seller cards). The 2026-11-24 needlefree-bag and patch-sachet generated images still sit in other flows (site/browse abandonment): swap them before those go for review.

Email platform: Customer.io
Website: https://www.precisionpeptidecompany.com
- 2026-11-24 · compliance · Meelad: no gates. NOT research-use-only (compliance.md "Research-use-only: no"), so no RUO word check; counsel-approved claims and site disclaimers are used as written, including the prescription-program copy. Old ESCALATE/HOLD notes are superseded: write, design and build all flows.

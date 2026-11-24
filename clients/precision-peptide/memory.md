# Precision Peptide — client memory

Read before any work for this client. Append (dated) after every change. Rules here outrank general skills where they conflict, except Fluid's SOP fundamentals.

Research-use-only peptide brand: worked like any client, with the copy/design guardrails in brain/skills/fluid-email-copywriter/references/ruo-peptides.md. No gates.

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

Email platform: Customer.io
Website: https://www.precisionpeptidecompany.com

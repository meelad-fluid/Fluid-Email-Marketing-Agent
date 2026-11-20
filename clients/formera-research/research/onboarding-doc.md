# Formera Research — Onboarding Doc
_Prepared 2026-11-20 · Sources: onboarding doc (brief), formeraresearch.com (home, /shop/ p1–4, /coa-library/, /about-us/, /refund-policy/), Trustpilot (4 reviews), competitor search. No email platform yet and no order data._

> **Research-use-only brand.** Everything here follows `compliance.md` and Fluid's RUO SOP. There are no human avatars: we talk to the research buyer, and we sell on documentation, testing, traceability, availability, price and support. **Compliance status: ESCALATE** (classification not yet assigned; see compliance.md §1). Nothing promotional goes out until that's cleared.

## 1. What has worked (email)
**New account, no history: starting from scratch.** The client has no email software yet (brief: "I don't have a email software yet"). No flows, campaigns, list or pop-up exist, so there's nothing to keep or fix; every flow is a build.

**Platform:** not chosen by the client. Fluid runs its peptide brands on **Customer.io**, so this plan is written for Customer.io (automations, one-time sends, data-driven segments). WooCommerce must send `placed_order`, `product_viewed`, `added_to_cart` and `checkout_started` events plus page views to Customer.io before the abandonment and post-purchase flows can run.

**Takeaways for the plan**
- Month 1 builds trust and the list from zero: documentation-led sends, not discount blasts, until promotions are approved.
- The first audience is WooCommerce customers who consented to marketing (import), then the pop-up.
- Flows first (they compound), campaigns second: Welcome, Abandoned cart and Post-purchase are the priority builds.

## 1b. What sells
_No order data (WooCommerce, no store access shared)._ From the brief only:
- **Best sellers (brief):** GLP-3 R 20mg, GLOW, BPC-157 10mg, NAD+ 1000mg.
- GLP-3 R is not in the public catalog (55 products checked) and is on the do-not-feature list pending legal review (compliance.md §1). Email can lead with **GLOW ($90), BPC-157 10 mg ($75) and NAD+ 1000mg ($160)** once those are approved.
- Price points (site): most single compounds $30–$85; larger sizes $110–$200 (Epithalon 50mg $110, NAD+ 1000mg $160, SS-31 50mg $170, MOTS-C 40 mg $200). Free shipping over $200 (home), so the $200 threshold is the natural basket-builder.
- Need: 90-day order export (best sellers, best first-order products, AOV, repeat rate, days to second order) to set the winback timing and the welcome groups.

## 2. The brand
- **What they sell:** 55 research compounds (single peptides, blends, larger sizes), all listed "In Stock" (site /shop/). Hero products for email (pending approval): GLOW, BPC-157 10 mg, NAD+ 1000mg.
- **Mission:** "A goal of Formera is to get quality Research compounds to everyone who needs them" (brief). Site: "our mission is to empower innovation in health and science by delivering premium, research-grade peptides" (/about-us/).
- **Why it's different (brief):** pricing and customer service; "8x tested products with coas for every product. We offer good prices with lots of sales."
- **Proof bank** (OK/HOLD per compliance.md §5):
  - COA library with lab report PDFs for every listed product; several products with 2–4 dated reports (OK, /coa-library/).
  - HPLC + MS, 99%+ purity, "8x tested" (HOLD: claimed, not yet documented to us).
  - Reviews: Trustpilot shows 4 reviews, all 5-star, about shipping speed, service and price (OK, Trustpilot 2026-11-20); site badge says 4.8 from 55 (HOLD, conflict).
  - Shipping: USPS, 2–6 business days, US only, free over $200 (OK).
  - Support: phone, Mon–Sat hours (OK).
- **Offers and rules:** max 25% (brief); "lots of sales" (brief); requested BOGO on GLP-3 R (ESCALATE). No promotion approved yet. No subscription or loyalty program. Partner (affiliate) program exists (site).
- **Visual identity:** see brand/brand-kit.md (fonts and accent colour TBC).

## 3. Avatars (research buyers)
Evidence: the site's age gate splits buyers into **Laboratory / Company, Academic Institution, Private Research**; the brief says "both men and women, all ages" and that the pain they solve is "8x tested products with coas for every product… good prices with lots of sales"; Trustpilot reviewers talk about speed, service and price. No personal-use avatars, by rule.

"Their words": only real quotes are in quotation marks with a source. Lines marked _(working line)_ are our phrasing of the procurement problem, to be replaced with verbatim words from support emails/reviews once the client shares them.

### Avatar 1: The small-lab buyer who's been burned by a vendor's paperwork
- **Who they are:** buys for a lab or company (age-gate option "Laboratory / Company"); orders a few compounds at a time, compares vendors on documentation and price.
- **Problems they're facing:** COAs that are generic, undated, or don't match the lot on the vial; vendors that relabel or disappear _(category pattern, competitor research)_.
- **Circumstances:** juggling suppliers mid-project, answering to whoever signs off on purchases; needs documents on file for every vial.
- **The desire:** one supplier where every vial has a findable, dated COA and the price doesn't punish them for it.
- **What keeps them lying awake at night:** a project result they can't trust because the material wasn't what the label said.
- **What they think of themselves:** careful, the person who checks.
- **Objections:** "Is the COA for my lot or just a sample one?", "Who ran the test?", "Will it ship before my deadline?"
- **Their words:** "best prices i've seen online!" (Trustpilot, Mar 2026) · "shipped my order same day" (Trustpilot, Mar 2026) · _(working line)_ "the COA doesn't even have a lot number."
- **Current situation → desire:** paperwork they can't verify → a COA on file for every vial they order.
- **Entry point:** a single high-volume compound with multiple dated COAs (BPC-157 10 mg, NAD+ 1000mg), pending approval.

**Moments list**
| Moment | When / where | What they're doing | What they say to themselves | What they've already tried | Source |
|---|---|---|---|---|---|
| Three tabs, three COAs | evening, laptop, vendor comparison | opening each vendor's COA PDF side by side | _(working line)_ "None of these list a lot number." | picking the cheapest and hoping | competitor research (COA cards without lab names) |
| Label vs PDF | bench, unboxing | holding the vial next to the COA on their phone | _(working line)_ "Is this even the same batch?" | emailing the old vendor, no reply | ruo-peptides §1 pattern |
| The undated report | desk, filing records | looking for a test date on a COA | _(working line)_ "When was this tested?" | screenshotting the product page as a record | COA library shows dates on some reports only |
| Sign-off question | supervisor's office / Slack | asked "where's the documentation for this order?" | _(working line)_ "I need the PDF, not a product page." | forwarding marketing pages | procurement pattern |
| Stuck in processing | Monday morning, order page | refreshing an order status from another vendor | _(working line)_ "It's been a week." | switching vendors mid-project | Trustpilot praise for speed implies the contrast |
| Restocking for next month | end of month, spreadsheet | building next month's order list | "simple, quick, and good priced" (Trustpilot, Jul 2026) as the bar | splitting orders across vendors | Trustpilot |
| The $200 math | checkout | adding one more item to clear free shipping | _(working line)_ "If I add one more, shipping's free." | paying shipping on small orders | site free-ship threshold |
| Vendor went dark | inbox | old vendor's site down, emails bouncing | _(working line)_ "Who do I even call?" | Reddit threads for alternatives | category pattern |
| New lot arrives | delivery day | checking whether a new COA was posted for the new batch | _(working line)_ "Did they test this lot or reuse the old report?" | trusting the old report | COA library (multiple dated reports per product) |
| Price check | lunch break, phone | comparing per-mg prices across vendors | "best prices i've seen online!" (Trustpilot, Mar 2026) | buying the lowest price, with no documents | Trustpilot |

### Avatar 2: The academic lab purchaser who has to justify every supplier
- **Who they are:** buys for a university or institute lab (age-gate option "Academic Institution"); slower approvals, strict records.
- **Problems:** suppliers that can't produce identity and purity documentation in a format procurement accepts; slow support.
- **Circumstances:** purchase approvals, grant budgets, semester timelines, a PI who wants the paperwork.
- **The desire:** a supplier whose documents pass review the first time, at a price the budget can carry.
- **What keeps them lying awake at night:** materials that can't be traced back to a lot when someone asks months later.
- **What they think of themselves:** the lab's organiser; the person who keeps the records straight.
- **Objections:** "Can I get the COA before ordering?", "Is the testing lab named?", "Can support answer a documentation question?"
- **Their words:** _(working lines, replace with verbatim)_ "Can you send the COA for this lot?" · "Our procurement needs the testing method."
- **Current situation → desire:** chasing documents after the order → documents ready before they order.
- **Entry point:** any approved compound with multiple dated COAs.

**Moments list**
| Moment | When / where | What they're doing | What they say to themselves | What they've already tried | Source |
|---|---|---|---|---|---|
| Pre-approval packet | office, procurement form | attaching supplier documents to a purchase request | _(working line)_ "They want the COA before they'll approve it." | asking vendors by email | academic procurement pattern |
| Method question | email from the PI | asked which test method was used | _(working line)_ "Was this HPLC or just a spec sheet?" | guessing from a generic COA | SOP §6.5 topic |
| Identity vs purity | reading a COA | trying to tell identity testing from purity testing | _(working line)_ "Purity of what, exactly?" | Googling COA terms | SOP §6.5 topic |
| Audit months later | records drawer | matching an old order to its lot and report | _(working line)_ "Which batch did we use in March?" | relying on order emails | traceability pattern |
| Semester deadline | calendar, late in term | ordering before a project window closes | _(working line)_ "It has to be here by Friday." | expedited shipping at a premium | USPS 2–6 days (refund policy) |
| Holiday shutdown | December, campus closing | ordering before the break | _(working line)_ "Will it arrive before we close?" | ordering too early, storage worries | calendar |
| Budget end | fiscal year-end | spending remaining budget on documented materials | _(working line)_ "Use it or lose it." | splitting orders | calendar |
| Calling support | weekday, phone | calling with a documentation question | "great customer service" (Trustpilot, Mar 2026) | support emails that never come back | Trustpilot |

### Avatar 3: The independent research buyer who shops on price and speed
- **Who they are:** buys under the age gate's "Private Research" option; price- and speed-sensitive; the reviewers on Trustpilot read like this group (speed, price, service).
- **Compliance note:** marketing to this group is part of the legal review (compliance.md §1, §8). Until cleared, emails to them use the same documentation-and-procurement angles as avatars 1–2 and never anything about use.
- **Problems:** not knowing which vendors are legitimate, COAs they can't read, slow or ghosting support.
- **Circumstances:** orders online, compares prices across vendors, wants it shipped fast.
- **The desire:** a vendor they trust, documents they can check, a fair price, quick shipping.
- **What keeps them lying awake at night:** Not applicable for this brand as a fear we can address; what drives the purchase is price, speed and trust in the documents.
- **Objections:** "Is this vendor legit?", "Is the COA real?", "Will it ship fast?"
- **Their words:** "Fast shipping, great customer service" · "I'm really loving the prices too!" (Trustpilot, Mar 2026) · "I ordered July 4th and received today" (Trustpilot, Jul 2026) · "def will be buying again!" (Trustpilot, Mar 2026).
- **Current situation → desire:** unsure which vendor to trust → a vendor whose documents and service they can check themselves.
- **Entry point:** best sellers once approved.

**Moments list**
| Moment | When / where | What they're doing | What they say to themselves | What they've already tried | Source |
|---|---|---|---|---|---|
| Vendor research night | late evening, phone | reading vendor reviews | _(working line)_ "Which of these is actually legit?" | picking on price alone | competitor research (mixed reviews) |
| First COA | first visit, COA library | opening a COA for the first time | _(working line)_ "What am I looking at?" | ignoring it | /coa-library/ |
| Order placed | checkout | wondering when it'll ship | "shipped my order same day" (Trustpilot) | vendors that took a week | Trustpilot |
| Package on the step | delivery day | opening the box | "everything looked great" (Trustpilot, Jul 2026) | unlabelled vials from elsewhere | Trustpilot |
| Price alert | scrolling a sale | comparing a sale price | "best prices i've seen online!" (Trustpilot) | chasing the cheapest | Trustpilot |
| The question nobody answered | weekday, contact form | asking a question about an order | "thanks for the great service" (Trustpilot, Jul 2026) | vendors with no phone | Trustpilot; site phone/hours |
| Free-shipping threshold | cart | adding an item to pass $200 | _(working line)_ "Might as well hit free shipping." | paying shipping twice | site |
| Reordering | a month later, account page | looking for last order | "def will be buying again!" (Trustpilot) | starting from scratch elsewhere | Trustpilot |

## 4. Voice
**Sender persona (proposed 2026-11-20):** **Erin from Formera Research** — sends campaigns and flows. A warm, specific first name reads like the person in support who answers the phone, which matches the brand's stated difference (customer service). Founder/plain-text notes come from the owner (we believe Mike, from the client email; name and role to confirm).

How the brand talks (brief: "Friendly, caring, helpful"):
- **Helpful, like support on a good day.** "Here's where the COA for your lot lives, and what each line means."
- **Plain about documents.** "Every product has its lab report on file. Here's how to check it."
- **Straight on price.** "Good prices, and the paperwork to back them."
- **Never hype.** No exclamation-mark science, no "breakthrough".

Words we use: COA, lot, batch, lab report, documentation, catalog, in stock, ships, support, research use only.
Words we never use: see compliance.md §7.
Required disclaimer: compliance.md §2 (default until approved: "FOR RESEARCH USE ONLY. NOT FOR HUMAN OR VETERINARY USE OR CONSUMPTION.").

## 5. Website interrogation: conflicts and open questions
| Brief says | Site says | Where | Question for client |
|---|---|---|---|
| Best seller "GLP-3 R 20mg"; BOGO on GLP-3's | Not in the 55-product catalog | /shop/ p1–4 | Is it sold, and where? (Also under legal review: compliance.md §1) |
| "8x tested" | Independent testing, HPLC + MS; no test count | home, /about-us/ | What are the 8 tests, which lab? Can we see a COA? |
| — | "99%+ Pure" | home | Is that from each lot's COA? Which lab? |
| — | "Orders ship the next business day" vs "same day or within 2 business days" | home vs /refund-policy/ | Which is the real promise? |
| — | "Satisfaction guaranteed" vs "all sales are considered final", 20% restocking fee | home vs /refund-policy/ | Which policy can we mention? |
| — | Trustpilot 4.8 from 55 reviews | home badge vs Trustpilot page (4 reviews) | Where do the 55 reviews live? Can we use them? |
| "Both men and women, all ages" | Age gate: 21+, buyer type Private / Lab / Academic | site | Do you store the buyer type? It can split the welcome flow. |
| Unique: pricing and customer service | Partner program | footer | Should affiliates get their own emails? |
| No email software | — | brief | OK to set up Customer.io (Fluid's platform for research-compound brands)? |
| — | No founder or team named | /about-us/ | Who signs the founder notes (name, role)? |

## 6. Competitors (named by the client)
_Sources: competitor search 2026-11-20; vendor claims are self-published and unverified._
- **Ascend (ascend.science):** positions on transparent, lab-tested compounds for investigators; little independent verification found. Formera's angle: dated COAs listed per product in one library, plus price.
- **Perfect Peptides:** US-based RUO supplier promoting COA access and third-party testing; watch for name confusion with lookalike sites. Formera's angle: same documentation story with lower prices and phone support.
- **Amino Club:** advertises 10 tests per batch at an ISO 17025 lab (up from 8); mixed Trustpilot reviews. Formera's "8x tested" invites direct comparison, so it must be substantiated before use.
- **Direct Peptides:** nothing reliable found; to research.
- Gap Formera can own: **the supplier that shows its paperwork and picks up the phone**: lot-matched COAs (once verified), dated reports, named support hours, fair prices.

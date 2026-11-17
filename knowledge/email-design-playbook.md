# Fluid Email Design Playbook (v0.2)

Sources, in priority order:
1. **Fluid Email Design SOP** (`sops/email-design-sop.md`). This is the governing document; it wins any conflict.
2. Teardown of 22 reference emails (`reference-email-teardowns.md`, ids e01–e22). These are examples of the SOP in practice and supply patterns the SOP doesn't specify.

Rules marked **[SOP]** come from the SOP. Rules marked with email ids come from the references.

---

## 0. SOP core rules (always on, every client)

**Philosophy [SOP]:** performance and conversion over pure aesthetics. Copywriting, structure and graphic design must work together to guide the reader to a purchase.

**Copy [SOP]**
- Headline calls out a specific customer pain point or problem (see §1 for when a campaign type overrides this).
- Paragraphs are 1–2 sentences. Features and benefits go in bullets or checklists.
- **Sets of three:** a maximum of 3 key selling points or benefits per section.
- First CTA near the top, within two sentences of the opening copy. CTA language states the action *and* the solution.

**Structure [SOP]**
- **Hero:** logo + headline + brief intro copy + prominent CTA, all above the fold, so someone who never scrolls can still decide.
- **Bridge section** right after the hero justifies the pitch, using **infographics and icons, not paragraphs** (features, ingredients, benefits).
- **Continuous flow:** no rigid blocky sections. Use background gradients and overlapping elements so sections blend and the reader keeps scrolling.
- **A CTA button at the end of every section.**

**Graphic design [SOP]**
- Buttons are large, highly visible and distinct: border + drop shadow (3D) + contrasting accent color.
- Clear hierarchy through font weight and size: bold headlines, legible secondary body.
- A cohesive brand palette. Accent colors highlight key info and match the CTA buttons.
- Lifestyle imagery for context. Graphs, charts and **comparison tables (us vs competitors)** to show value fast.

**Build and deploy [SOP]**
- **Every email ships as sliced images, not built in Klaviyo's drag-and-drop builder** (Fluid decision, 2026-10-16). Design the full email as one image, slice it into logical sections (header, each content block, footer), and upload each slice as an image block with its own link. No live-text sections.
- Why compression matters: small image files keep the email out of spam. Image weight is the main deliverability risk with sliced emails.
- **Starting size targets (to adjust once we see real results):** each slice ≤ ~150KB, whole email ≤ ~800KB, exported at 2x (1200px wide) for sharpness, then compressed.
- **Compress** every slice by 70% or more before uploading to the ESP.
- **Remove default image padding** in the ESP so slices sit flush.
- **Alt text on every image** that conveys the message if images don't load. A compliant **unsubscribe** link in the footer.

**Default copy skeleton [SOP]:** pain-focused headline → two-sentence educational bridge → prominent CTA → three-point benefit checklist → final solution-oriented CTA.

---

## 1. The fold

The fold = the first ~750px of a 600px email (what shows on a phone before scrolling).
**Job of the fold: in 3 seconds the reader knows what this is, why it matters to them, and what to tap.**

### Canonical fold order
```
Logo (small)  →  [Announcement bar: offer/shipping]  →  HEADLINE  →  SUB-HEADLINE  →  [OFFER]  →  BUTTON  →  Hero visual
```
- **Text block first, image second.** When the headline, sub, and button sit *above* the hero image, the button is always in the fold (e04, e05, e06, e08, e13, e20, e21, e22). When the button sits *below* a tall hero, it gets pushed out (e07, e09, e11).
- Alternative: text **overlaid on** the hero photo (e01, e02, e07, e09). Allowed only if the button still lands within 750px.
- Scorecard across 22: button clearly in fold 13 · at the fold edge 4 · below fold 3 · no real CTA 2.
- **Rule:** the primary button must render within the first 750px. Hard check in QA.

### Logo / header
- Small, centered, ~60–90px tall, on a brand-color bar or the hero background (all 22).
- Optional **announcement bar** directly below the logo for always-visible info: offer + code (e06), free shipping threshold (e03, e04). Cheapest way to put an offer in the fold.

### HEADLINE
**Length:** 3–10 words, 2–3 lines max at mobile size. Largest type in the email.

**Default [SOP]: name a specific customer pain point or problem.** Contrarian, situational and customer-question headlines are pain-led by nature.

**Sale emails: the sale is always in the headline, and everything above the fold is only about the sale** (Fluid decision, 2026-10-16). That means the offer, code, deadline and a sale button. No pain story, education or brand intro above the fold. Those go below the fold as add-ons.

**Headline types that work (pick one per email):**
| Type | Example | Use for |
|---|---|---|
| Offer *is* the headline | "Buy 2, get 1 free." (e16) · "All eyes on you, with 10% OFF" (e14) · "The anniversary 25% is almost up." (e02) | Sales, last chance |
| Contrarian / reframe | "Water, but it's doing something." (e07) · "Dread is a stack, not a jumpscare." (e21) · "Ink flow matters more than you think" (e20) | Educational, welcome, brand |
| Customer question | "People kept asking how to make a café-quality dairy-free latte at home." (e04) | Recipes, how-to, FAQ |
| Social proof | "Our Organic Instant Coffee is causing quite a stir…" (e10) | Review-led |
| Situation / moment | "Travel Throws Off Everything." (e12) · "The Pressure Is On For Valentine's Day." (e18) | Seasonal without discount |
| Decision-maker | "If you only try one, make it this." (e09) · "Meet The Xtressé Essentials" (e13) | Welcome, bestsellers |
| Playful / character | "Your Pasta Is Missing Its Soulmate." (e17) | Winback, brands with personality |
| Announcement | "Introducing, Strawberry Bliss" (e15) · "MIRRA OIL 15ML IS HERE." (e22) | Launches |

**Style rules**
- Brand display font, large: roughly 2.5–4× body size. Condensed caps for sport/edgy brands (e05, e20, e21). Serif for premium/food (e03, e04, e13, e17). Heavy sans for wellness/DTC (e06, e12).
- Emphasize **one** key word or number with an accent color, highlight box, or size jump: "15ML" box (e22), "Instant Coffee" in orange (e10), "DREAD IS A STACK," in green (e21), giant "10%" (e14).
- **Split headline** around the hero is an advanced move: "Travel Throws Off Everything." → image → "Your Gut Doesn't Have To Be One of Them." (e12).
- The headline is part of the hero slice (all emails are sliced images). Its exact wording, plus the offer and code, must be in that slice's **alt text** so the message survives images-off.

### SUB-HEADLINE
**Length:** 1–2 lines, ≤ 20 words. Smaller, lighter than the headline.

**It does exactly one of these jobs:**
1. **Carries the offer and code:** "Use ANNIVERSARY25 for 25% off sitewide before it ends" (e02) · "15% off your first order with code BATTLE15." (e05)
2. **Lands the turn** after a contrarian headline: "Plain water is fine. It just doesn't feel like much." (e07)
3. **Says what the product is / who it's for:** "Self-care for 'down there,' simple and daily." (e06) · "Our Bestselling Flavors Are Here to help you Fuel, Focus & Flow" (e08)
4. **Invites the next step:** "Here's how we make it." (e04) · "Let us talk about it." (e18) · "Three Layers. That's the Trick." (e21)
5. **Lowers the pressure:** "Start with one. Build the rest when you're ready." (e13)

### OFFER (if there is one)
**The offer must be visible in the fold.** Burying it is the most common miss: the $200 discount in e11 only appears at the bottom.

**Ways to show it, strongest first:**
| Presentation | Example | When |
|---|---|---|
| Offer as headline, giant number | "10% OFF" (e14), "Buy 2, get 1 free." (e16) | Sale is the whole point |
| Offer box with a deadline chip | "GET 15% OFF EVERYTHING" + black chip "Through Monday, September 7th" (e03) | Holiday sales |
| Tiered coupon tiles side by side | "Save $20 on all one-time purchase" / "Save $30 on all 2 pack + FREE Lube" (e19) | Raising average order value |
| In the sub-headline | e02, e05 | Code-driven, clean design |
| Announcement bar | e06 | Welcome offers |
| Inside the button | "Restock The Pantry & Save 15%" (e17) | Winback, simple offers |

**Code display:** the code gets its own **dashed-outline chip**, visually different from the solid button (e14, e16, e06). Dashed means "copy this". Solid means "tap this".
**Urgency:** state the deadline as a date, not just "ends soon" (e03 "Through Monday, September 7th", e22 "For two days only: May 22-23", e16 "valid for this week only").
**Exclusions:** if there's an exclusion, say it plainly and redirect: "Cleats are excluded, so it goes to socks and accessories." → "PUT YOUR 15% HERE INSTEAD" (e05). The button must not contradict the exclusion (e05's "SHOP ALL CLEATS" does, so avoid that).

### BUTTON
- **One primary button in the fold**, within two sentences of the opening copy [SOP]. High-contrast brand accent color, used *only* for buttons and key highlights (e03 orange, e06 black, e14 pink, e13 gold).
- **Large, with a border and drop shadow for a 3D look [SOP].**
- Shape follows the brand: pill (e06, e08, e14, e19), rounded rectangle (e03, e04, e13), square (e05, e07). Width ~50–75% of the email. Minimum tap height ~44px.
- **Copy formulas (never "Click here", never a non-action):**
  | Formula | Examples |
  |---|---|
  | Verb + specific product | "SHOP AÇAÍ + BERRY" (e07) · "START WITH THE GUMMIES" (e13) · "Shop the Proflex" (e11) |
  | Verb + benefit or offer | "SHOP 15% OFF" (e03) · "Restock The Pantry & Save 15%" (e17) · "Get the Proflex and Save $200" (e11) |
  | First person | "I NEED INK I CAN TRUST" (e20) · "USE MY 10% OFF" (e14) · "I WANT MORE MIRRA OIL" (e22) |
  | Themed per section | "SIP INTO SERENITY", "JOIN THE RASPBERRY PARTY" (e08) |
  | Content CTA | "READ THE FULL GUIDE ON THE BLOG" (e18) · "Build the Atmosphere" (e21) |
- Avoid: "Launching Soon" as a button (e15, not an action), buttons that contradict the offer (e05).
- **A CTA at the end of every section [SOP].** Vary the wording per section so it doesn't read as the same button five times (e06 is the cautionary example). Tie each one to that section's point (e08: "SIP INTO SERENITY", "JOIN THE RASPBERRY PARTY").

---

## 2. Below the fold: section library

The design engine builds from these. Each block is styled automatically from the client's brand kit.

| Block | What it is | Seen in |
|---|---|---|
| **Pain / story paragraph** | 2–5 short centered lines, often bolded opening ("New time zones. Late dinners. Airport food.") | e12, e18, e20, e22 |
| **POV story** | "You sit down. Client's relaxed…" ends on "That's not an X problem. That's a Y problem." | e20 |
| **Numbered steps / timeline** | Step 1/2/3 with vertical line or pill labels | e04, e13, e18 |
| **Framework cards** | 3 named, outlined cards teaching a concept | e21 |
| **Benefit rows (zig-zag)** | Photo + ✓ header + 2–3 lines, alternating sides | e20 |
| **Benefit pills** | Small outlined tags listing benefits beside the product | e15 |
| **Proof / spec chips** | Outlined boxes: "USDA Organic", "0g Added Sugar" | e07 |
| **Product card** | Image, name, 1–2 line desc, button. Background color matches packaging | e12, e14, e10 |
| **Product chooser** | 3 SKUs with one-line personalities ("for little kids." / "at full speed.") | e05, e07, e09 |
| **Mood bands** | Full-width color band per SKU with a mood question headline + themed button | e08 |
| **Collection cards** | Photo with dark gradient overlay, collection name, 1 line, button, code sticker | e03 |
| **Category cards** | Image left, category name, "Shop the category →" text link | e02 |
| **Review cards** | Stars + italic quote + name; brand-color card with oversized quote mark | e10, e06 (chat bubbles) |
| **Review in hero** | Stars + a single killer quote inside the hero | e10 |
| **Founder note** | Short mission paragraph + signed name/title | e07 |
| **Trust band** | Dark/brand band: third-party testing, own facility, guarantee | e02 |
| **Risk reversal** | Icon + "If the first can isn't for you, we refund your order." | e09 |
| **Fit / sizing objection card** | "GET THE SIZE RIGHT THE FIRST TIME" | e05 |
| **Offer recap** | Big offer restated + code chip + button near the bottom | e14, e13, e09 |
| **Offer tier cards** | One card per tier with its own code button | e19, e22 |
| **Cross-sell pivot** | "Not a coffee lover?" / "Feeling Adventurous?" → alternatives | e10, e17 |
| **Subscribe & Save band** | Lifestyle photo with the subscription offer | e07, e09 |
| **Awards strip** | 3 award badges with captions | e13 |
| **Recurring modules** | Bordered "Free weekly asset" / "Community spotlight" boxes | e21 |
| **Waitlist / notify** | "Defrosting Soon" + "Get Notified →" | e15 |
| **Trust-icon footer** | 3 circular icons (Non-GMO, Organic…) + logo + socials + legal | e03, e04, e07, e08, e22 |
| **Category tile footer** | 4 photo tiles linking to shop categories | e12 |
| **Compliance line** | FDA disclaimer / "For research use only" | e12, e02 |

**Visual devices that make it feel designed (not template-y):** wavy or scalloped section edges (e01, e08, e12), torn-paper edges (e20), product or props breaking the frame of a card (e04, e06, e10), scalloped sticker badges (e03, e18), tape banners for deadlines (e22), outlined display type behind the product (e05), marquee strip (e15).

---

**Required right after the hero [SOP]: a bridge section** built from icons or an infographic (benefit pills e15, spec chips e07, trust icons e03, ✓ rows e20, comparison table). Not a paragraph.

## 3. Global design rules

1. **Palette:** 2–3 brand colors + one CTA accent. **Transitions are continuous [SOP]:** gradients, wavy or scalloped edges, and elements overlapping section boundaries (e01, e08, e12, e04, e06, e10). Hard-edged color bands are allowed only when something overlaps the seam.
2. **CTA color is reserved** for buttons and the key offer number.
3. **Type:** max 2 families (display + body). Body 14–16px equivalent, centered for short copy, left-aligned for paragraphs over 3 lines. No justified text (e06 miss).
4. **Rhythm:** alternate image-heavy and text sections. No two dense text blocks in a row.
5. **Length:** promos 2–3 screens, educational 3–4, plain text 1. If it's over 3 screens, it needs a mid-email CTA.
6. **Footer:** logo, socials, trust icons, unsubscribe, address, compliance. Dark or brand color.
7. **Consistency within a brand:** a client's emails share a footer, buttons, and product-card style (LEVL e07/e09 are clearly one system). The brand kit must lock these.

---

## 4. Campaign recipes (from the references)

### Promo / sale
**Fold = 100% sale.** Logo → headline containing the sale → code chip → deadline → sale button (+ product visual that supports the offer). Nothing else above the fold.
**Below the fold = add-ons**, in any order the campaign needs: bridge icons → collection/product cards with code sticker repeated → reviews / trust → urgency line with date → CTA after each section → footer. *Refs: e02, e03, e14, e16, e19 (fold done right). e11 is the counter-example: offer buried at the bottom.*
Variants: **A** giant-% headline (e14) · **B** tiered coupon tiles (e19) · **C** offer box + collection cards (e03) · **D** last-chance "almost up" (e02).

### Product launch
- **Teaser:** "Introducing X" → concept visual → "Get Notified" (waitlist) → benefit pills. *e15*
- **Launch:** "X IS HERE." with the key spec highlighted → backstory → price → bundle ladder → GWP upsell with a dated window. *e22*
- **Feature-led:** product hero with labeled callouts → problem copy → specs → offer button. *e11 (move the offer into the fold)*

### Educational
- **Recipe / how-to:** customer-question headline → ingredients with per-item buttons → step timeline → outcome line → bundle CTA. *e04*
- **Problem → agitate → mechanism:** bold claim headline → POV story → ✓ benefit rows → mechanism → first-person CTA. *e20*
- **Framework / newsletter:** contrarian headline → 3 named lesson cards → freebie module → community module. *e21*
- **Empathy guide (sensitive topics):** situational headline → empathy story → numbered tip cards → "read more" → soft promo sticker at the end. *e18*

### Welcome flow
- **#1 Offer + intro:** offer in announcement bar or hero → coupon box → mission → hero product → reviews. *e06, e05, e07*
- **#2 Bestsellers / chooser:** "Find your perfect match" → mood bands per SKU. *e08*
- **#3 Hero product:** "If you only try one…" → why start here → risk reversal → offer reminder. *e09*
- **#4 Routine:** "Meet the Essentials" → Step 1/2/3 → offer reminder → awards. *e13*
- **Brand-forward offer:** niche aesthetic with the offer as headline. *e14*

### Social proof
Review-in-hero → framing line → review card stack → product CTA → "Not a fan of X?" cross-sell with a review each. *e10*

### Winback
Playful "we noticed" headline + exact lapse ("over 6 months") + "kept a discount for you" → action+benefit button → re-sell core benefits → variant cross-sell for bored buyers. Short. *e17*

### Seasonal without discount
Situation headline (travel, holiday stress) → pain list → "your X stack" color-matched product cards → usage tip → category nav. *e12*

### Brand / manifesto
Campaign sub-brand logo → overlaid mega-headline → slogan → repeating photo cards with caption pills. No hard sell. *e01 (add at least one soft CTA)*

### Plain text: no visual reference yet
Needs examples from Fluid. Placeholder recipe: founder or first-person note, no images, 80–200 words, 1 inline link + P.S.

---

## 5. QA checklist (the agent must pass all before sending for approval)

**Fold**
- [ ] Hero has logo + headline + brief intro + CTA, all within the first 750px [SOP]
- [ ] Headline names a pain point [SOP], ≤ 10 words, readable at 375px
- [ ] **Sale emails:** the sale is in the headline, and every element above the fold is about the sale (offer, code, deadline, sale button). No other content above 750px
- [ ] First CTA within two sentences of the opening copy [SOP]
- [ ] Sub-headline does one job, ≤ 20 words
- [ ] Offer (if any) visible in the first 750px, with code and deadline
- [ ] Code shown as a dashed chip, distinct from the button

**Body**
- [ ] Bridge section right after the hero, using icons or an infographic, not paragraphs [SOP]
- [ ] No paragraph longer than 2 sentences; benefits in bullets or checklists [SOP]
- [ ] Max 3 selling points per section [SOP]
- [ ] Every section ends with a CTA [SOP], with wording varied and tied to the section
- [ ] Section transitions are continuous (gradient, shape edge or overlap) [SOP]
- [ ] No button contradicts offer exclusions

**Buttons**
- [ ] Large, accent color, border + drop shadow [SOP]
- [ ] Copy states the action + the solution [SOP]

**Brand**
- [ ] Only brand-kit fonts and colors; CTA color reserved for buttons
- [ ] Footer, buttons, and cards match the client's locked components
- [ ] Voice matches the brand voice guide; no banned words/claims
- [ ] Required compliance text present

**Technical [SOP]**
- [ ] Sliced into logical sections (header, each block, footer); never one image
- [ ] Each slice links to the right destination
- [ ] Every slice compressed by 70% or more
- [ ] Default ESP image padding removed
- [ ] Descriptive alt text on every image; headline, offer and code wording in the alt text
- [ ] Compliant unsubscribe link in the footer
- [ ] Dark-mode check; total email ≤ 4 screens unless educational

---

## Gaps to fill
- Plain-text email examples (none in the reference set)
- Confirm slice size targets (≤150KB per slice, ≤800KB total) against real inbox placement once sends start
- Launch emails: same "fold = only the launch" rule as sales, or can the fold carry a pain hook?
- Performance data on these 22 (which of them won), to weight the patterns
- Mobile-specific references, SMS references

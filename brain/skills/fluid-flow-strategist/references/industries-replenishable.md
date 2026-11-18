# Industry notes — replenishable brands

The system in `replenishable-system.md` is the same for every industry here. What changes is the pop-up question, what "how to use" means, what proof is allowed, and which brand facts to collect. Read the section for the client's industry, then the matching example in `examples/replenishable/` for depth and voice.

| Industry | Example to read | Other Fluid docs in this category |
|---|---|---|
| Peptides / research compounds | `examples/replenishable/peptides-evo-labs.md` | PeptiNova, Driven Ones, Puregenix |
| Supplements | `examples/replenishable/supplements-stemox.md` | Beyond Slim, Moneta |
| Hair care | `examples/replenishable/hair-care-xtresse.md` | |
| Skin care / cosmetics | `examples/replenishable/skin-care-makeup-forever-bloom.md` | Sinister Love Cosmetics |
| CPG, drinks | `examples/replenishable/cpg-beverage-levl.md` | OOKA |
| CPG, food | `examples/replenishable/cpg-food-spqr.md` | El Viejon |
| Other use-up products (patches, wearables) | the closest of the above | ANF Care |

The examples are long. Read the parts you need (the Welcome #1 versions, Post-Purchase #2 and #4, Winback) rather than the whole file. EVO Labs and LEVL are the deepest docs Fluid has written; they're the quality bar for how specific a Goal should be.

## Brand facts to collect, every industry

These come up in almost every reference doc. Get them from the website, the brief or the client; anything missing becomes a placeholder listed under Open Items.

- Brand mission, in one line
- Founder's name and story, and why the brand exists
- The unique mechanism or reason to believe (Biomimic® technology, X3-BioActive Blend, two independent labs on every batch)
- Trust signals: certifications, testing, review count and where reviews live (Trustpilot, on-site)
- Guarantee and returns
- Free-shipping threshold
- Subscription, membership or rewards program, with its terms
- Referral program
- Shipping speed and where they ship from
- Support contact
- Products the client wants pushed or excluded, and any sister brands or collaborations

## Peptides and research compounds

**Compliance governs everything, and Fluid's RUO SOP (`knowledge/sops/ruo-peptide-compliance-sop.md`) wins every conflict with the notes below.** Open the doc with a compliance block, as EVO Labs does:
- Every email and SMS carries a visible "For Research Use Only" line ("Not for human or veterinary use" on key emails).
- No human-use, outcome, result, protocol, dosing, reconstitution or administration language, anywhere.
- Use the client's naming rules (EVO used code names only: GLP-3 (R), GHK-CU).
- The selling is done by testing, transparency, price and availability, never by claims.

What that changes in the system:
- **Pop-up:** what they're sourcing, by compound or catalog class, never by bodily effect (SOP §5: "metabolic", "recovery", "longevity" categories imply a benefit). E.g. "What are you sourcing right now?" with the brand's own catalog names, or by buyer type (independent lab / institution / first order). SMS step carries the consent line plus "For research use only." Confirmation states products aren't for human or animal consumption.
- **Welcome #3:** proof is verification, not results: testing labs, COAs, purity floor, batch records, packaging, shipping. No outcome reviews.
- **Post-Purchase #2:** "how to use" becomes documentation orientation: reading the COA, matching the batch number on the label, storage and handling of lyophilized material as officially supplied. No attach offers for bacteriostatic water, syringes or other supplies framed around use (SOP §4.5).
- **Post-Purchase #3:** "Did the COA check out?": ask for reviews of what they can verify (purity data, packaging, shipping, support), and say the brand can't publish anything about personal use.
- **Replenishment / Winback:** neutral timing language. Never say or imply they're out of product or need a refill for use; "new batch is in, fresh COA published" is the news hook.
- **Flow rules:** a compliance review before each send.

The Puregenix doc predates these rules (usage instructions for injection pens, "real results" reviews). Follow EVO Labs, PeptiNova and Driven Ones instead.

## Supplements

- **Pop-up:** wellness goal ("What is your primary wellness goal right now?" Energy & focus / Stress & sleep / Vitality & longevity), or the pain point the product solves (Moneta: "What's the hardest part of staying consistent?" Too many tubs / Always traveling / Just getting started).
- **Welcome #1:** the benefit they chose, then the 3 products that serve it; trust signals (GMP, third-party tested, traceable).
- **Welcome #3:** results stories ("Before to BEYOND") within claim rules.
- **Post-Purchase #2:** how to take it for best absorption: serving, timing, with food or not, stacking with the brand's own products, consistency. Set expectations for when they'll feel it.
- **Post-Purchase #3:** "How are you feeling?" plus "true change takes consistency."
- **Claims:** "supports", never "cures", "treats" or "prevents". Keep to what the label and site already claim.
- **Winback:** the docs estimated it from supply (30-day supply → 45–60 days). Use the data.

## Hair care

- **Pop-up:** the reason they're starting ("What is your main reason for starting a hair growth routine?" Stress shedding / Hormonal changes / ...).
- **Results take months.** Post-Purchase #2 sets the timeline; #3 normalizes "not much yet" and keeps them on the routine.
- **Subscription is the retention engine:** Xtressé presented one-time / Monthly Delivery (save 10%) / 3-Month Delivery (save 20%) from Welcome #1 onward, and positioned 3-month for lapsed customers.
- **Winback:** around the routine window (Xtressé: 90 days for one-time buyers, 30 days after a cancelled delivery plan).

## Skin care and cosmetics

- **Pop-up:** what they're upgrading or shopping for (Foundation / Serums + Treatments / Creams + Moisturizers; Lip / Eye / Face).
- **Welcome #1:** speak to the frustration of that category (finding a shade that matches), then the technology and the products.
- **Post-Purchase #2:** how to get the most out of it: application, routine order, shade or fit check, how long until visible results.
- **Proof:** customer counts, review counts, before/after only with consent the client supplies.
- **Winback:** the reference docs used ~90 days for premium beauty. Use the data.

## CPG — food and drink

- **Pop-up:** product type or taste preference (Salts / Seasoning Blends / ...; "How do you like your jerky?" Spicy / Bold but balanced / ...; "What are you hoping LEVL helps with?").
- **Post-Purchase #2:** "how to use" becomes occasions, recipes and rituals: when to drink it, three ways to use it this week. For a beverage, habit is the only thing that produces a second order.
- **Post-Purchase #3:** the brand-specific question ("Did you finish the can?", "Your bag is empty, isn't it?").
- **Upsell:** bigger formats, bulk and XL sizes, variety packs, new flavors, Subscribe & Save, the free-shipping threshold.
- **Winback by format:** SPQR timed seasonings at 60 days and large-format salts at 90; El Viejon and LEVL used 45 days from consumption time. Use the data and split by format when the cycles differ.
- **Watch for wholesale and bulk buyers** in the first-order data (`hiro-flow-data.md`); they distort the best-seller ranking.
- **Age-restricted products** (nicotine, alcohol): add age gating to the pop-up and a flow rule that nothing goes to unverified contacts.

## Other use-up products

Patches, wearables, refills (ANF Care): treat as supplements for structure. "How to use" covers placement and how long until they feel the cumulative effect; winback comes from the supply size (ANF: 30-day discs → 45 days), replaced by the data where Hiro has it.

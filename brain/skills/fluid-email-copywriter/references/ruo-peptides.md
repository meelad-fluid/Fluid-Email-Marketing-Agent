# Research-use-only (RUO) peptide brands

**When this applies:** the client sells peptides or research compounds as "research use only" (their `compliance.md` says so, or their site/products do). It applies to every email, SMS, flow, subject line, image and design for that client, and it **replaces** the human-avatar method in `speak-to-the-avatar.md`.

**The rulebook:** `../../../knowledge/sops/ruo-peptide-compliance-sop.md` (Fluid's RUO SOP, verbatim). Read it fully the first time you work on an RUO client. It wins any conflict with every other Fluid rule, including the copy rules, the design rules, the flow system and the reference library. What follows is how to apply it.

Why it matters: one email that implies a human benefit, a dose or a result can bring FDA/FTC action against the client. A disclaimer in the footer does not fix copy that implies human use (SOP §3, §7).

## 0. Before anything: the compliance profile (HOLD without it)

Every RUO client has `compliance.md` in their folder, built at onboarding. Without it, nothing promotional gets written (SOP §2, §10, Test 9). It records, each with a source and date:

- **Classification** (SOP §2): A (legitimate research-use material, approved by the brand's compliance review), B (FDA-approved drug), C (compounded), D (uncertain). **Only A proceeds.** B, C or D: stop and tell the Fluid team it needs legal review ("ESCALATE"). Never classify from the brand calling itself "research grade".
- **Approved disclaimer**, word for word. Default until approved: "FOR RESEARCH USE ONLY. NOT FOR HUMAN OR VETERINARY USE OR CONSUMPTION."
- **Approved CTAs**: whether "Shop Now"/"Order" are approved, or only documentation/catalog CTAs (SOP §7).
- **Approved promotions**: whether discounts, bundles, subscriptions and deadline offers are approved for this brand (SOP §10).
- **Verified documentation facts** we may state: COA per lot (yes/no, where), testing lab and method (HPLC, MS), purity figures *as documented*, lot traceability, storage/shipping specs, US-made, turnaround. Anything not listed here is unverified (Test 5: HOLD).
- **Product naming rules** (some brands use code names only) and banned words.

Missing a line? Write around it and list it in NOTES as a HOLD question. Never fill it in yourself.

## 1. Who we talk to: the researcher, not the body

The SOP forbids targeting people who want to lose weight, build muscle, recover, look younger or manage a condition (§5). So the avatar is **the person buying research materials**: the lab or procurement buyer who has to trust what's in the vial. Their pains are real and fully sellable:

- They can't verify what they're buying (no COA, a generic COA, or one that doesn't match the lot on the label).
- Vendors that resell, relabel or vanish; support that never answers.
- Backorders and slow shipping in the middle of a project.
- Inconsistency between batches.
- Not knowing how to read a COA, or what identity vs purity testing means.

**Moments list (RUO version):** 8–12 procurement moments, same format as `speak-to-the-avatar.md` §1. For example: "comparing three vendors' COAs and none of them list a lot number", "the vial label and the COA don't match", "an order stuck in 'processing' for a week". The "Talking to" line becomes:

> **Talking to:** [the buyer type], who [procurement problem] when [procurement moment].

Never: "who wants to lose weight / recover / feel younger", never a body, a symptom or a goal for a person.

## 2. What we can sell on (SOP §6)

Testing and documentation, transparency, lot traceability, availability, shipping speed, support, price, catalog navigation, and plain-language science education about peptides in general (what a peptide is, what purity means, how to read a COA, identity vs purity testing). Every factual claim must be in the compliance profile.

## 3. What never appears (SOP §4, §5, §7–§12)

In copy, subject lines, preview text, image prompts, alt text, CTAs, product blurbs and file names:

- **Bodies and outcomes:** weight, fat, appetite, metabolism (as a human benefit), muscle, strength, performance, recovery, healing, injury, energy, sleep, skin, hair, aging/longevity/vitality, libido, "results", "transformation", "journey", "your body", "feel".
- **Medical:** any disease or symptom, inflammation, pain, immune, hormones; "treat, prevent, cure, manage, support [a condition]". Adding "may", "studied for" or "in research models" does **not** make these acceptable (SOP §4.4, §5).
- **Use:** dose, dosing, protocol, stack, cycle, injection, reconstitution steps, bacteriostatic water or syringes as part of a use workflow, schedules, calculators.
- **Testimonials about personal results**, before/after anything.
- **Category framing that implies an effect:** "recovery research", "longevity compounds", "metabolic research stack", "GH & recovery". Name categories by compound or class (the brand's catalog names), not by bodily effect. Mechanism talk about a specific product ("studied for X pathway") gets escalated, not written (SOP §5).
- **Unverified quality words:** pharmaceutical grade, medical grade, FDA approved/registered/compliant/inspected, 100% pure, sterile, clinically proven, safer than competitors.
- **Winback/replenishment that implies use:** "time for your next cycle", "running low?", "keep your progress", "don't lose your gains". Use neutral news hooks instead: "a new lot is in and its COA is published."
- **Coded language** that hints at any of the above (SOP §1). If you'd be uncomfortable explaining what a line really means to a regulator, cut it.

## 4. How the email is built

- **Headline:** a procurement or documentation truth in the researcher's terms. Patterns: *the doubt they have* ("Can you match the COA to the vial in your hand?"), *the standard* ("Every lot, documented before it ships"), *the checklist* ("Four things to verify before you order from anyone"), *the comparison* (their sourcing vs a reseller's, on verifiable points).
- **"That's me" section:** their procurement frustration, in their words (vendor ghosting, mismatched COAs, backorders). Not a symptom.
- **Product blocks:** compound name, format/size, "View COA" or "Review specifications". No benefit blurbs. Descriptions, where needed, are identity facts from the compliance profile.
- **Disclaimer:** the approved line visibly in the body of every product-focused email (near the products, readable contrast), plus the footer. Never only in the footer (SOP §3).
- **CTAs:** from the approved list (default: View Documentation, Explore Research Catalog, Review Specifications, View Batch Information, Contact Laboratory Support). "Shop Now" only if `compliance.md` approves it.
- **Offers:** only promotions `compliance.md` approves, framed as procurement ("25% off catalog orders through Sunday"), never tied to a project outcome or "your stack".
- **SMS:** shortest and riskiest channel (SOP §8): documentation/catalog/shipping news only, with the brand's approved SMS disclosure. No promos for products with unresolved status.
- **Imagery** (SOP §12, design-rules §12): real packaging, real COAs, lab equipment and lab settings. Never people, bodies, injections, syringes, scales, gyms, before/after, mirrors or treatment rooms. Generated images follow the same rule.

## 5. The compliance gate (every draft, before handing over)

Run the SOP's §13 tests on every line, image and CTA, then put the result at the top of NOTES:

1. Human benefit → REJECT · 2. Medical purpose → REJECT · 3. Administration → REJECT · 4. Contradicts research-only positioning → REJECT · 5. Unverified factual claim → HOLD · 6. Legal status unclear → ESCALATE · 7. Implied claims from headline + images + CTAs + audience together → REJECT · 8. Disclaimer not the approved one → HOLD · 9. Product, channel, audience or promotion not approved → HOLD.

Output exactly one of:
- **PASS — READY FOR HUMAN REVIEW** (a person at Fluid still approves every RUO send)
- **HOLD — VERIFICATION REQUIRED** (list what's missing)
- **REJECT — PROHIBITED MARKETING CONTENT** (rewrite, then re-run the gate)
- **ESCALATE — REGULATORY REVIEW REQUIRED**

Only a PASS draft goes to design. The bot's `publish_design` and `push_to_klaviyo` also scan RUO designs automatically and refuse prohibited wording.

## 6. The reference library for RUO clients

Library emails tagged `ruo-reject` (weight-loss testimonials, injury healing, "gym and bedroom" performance, dosing quizzes) are marked as anti-examples: never use them for anything. Emails tagged `ruo-hold` use effect-based category framing ("recovery research", "longevity compounds", mechanism blurbs); their layouts are fine, but none of their framing carries over. Emails tagged `ruo-pass` (documentation, COA, checklist and procurement-led emails) are the copy models for RUO clients.

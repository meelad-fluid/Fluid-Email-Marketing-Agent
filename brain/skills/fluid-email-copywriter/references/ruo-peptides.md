# Research-use-only (RUO) peptide brands

**When this applies:** the client sells peptides or research compounds as "research use only" (their `compliance.md` or `memory.md` says so, or their site does). It applies to every email, SMS, subject line, image and design for that client, and it **replaces** the human-avatar method in `speak-to-the-avatar.md`.

**How we work with them (updated 2026-11-24, Meelad):** peptide clients are treated like every other client. Write, design and build what's asked, straight away, with no classification step, no approval step and no HOLD or ESCALATE before starting. What's different is only **guardrails on the copy and the design**: nothing we make may suggest the products are for human (or animal) use. The guardrails come from `../../../knowledge/sops/ruo-peptide-compliance-sop.md` §4–§12 and win over any other copy or design rule for these clients. The people who approve the work are the same as for every client: the review page.

Why the guardrails matter: one email that implies a human benefit, a dose or a result can bring FDA/FTC action against the client. A disclaimer in the footer does not fix copy that implies human use (SOP §3).

## 0. The client's profile (compliance.md)

`compliance.md` holds what's specific to the brand: the disclaimer wording they use, product naming, extra banned words, the facts we can state, and an `Allowed terms:` line (brand and product names the automatic word check should ignore). If it's missing, start anyway: use the default disclaimer and the facts on the brand's site, and write a short `compliance.md` (format: `clients/_template` style, the sections above) so the automatic check covers this client.

Nothing in it is a gate. If it lists open questions, keep working and use the safe default for that point.

## 1. Who we talk to: the researcher, not the body

The SOP forbids targeting people who want to lose weight, build muscle, recover, look younger or manage a condition (§5). So the reader is **the person buying research materials**: someone who has to trust what's in the vial. Their pains are real and fully sellable:

- They can't verify what they're buying (no COA, a generic COA, or one that doesn't match the lot on the label).
- Vendors that resell, relabel or vanish; support that never answers.
- Backorders and slow shipping in the middle of a project.
- Inconsistency between batches; paying too much.

**Moments list:** 8–12 procurement moments, same format as `speak-to-the-avatar.md` §1. For example: "comparing three vendors' COAs and none of them list a lot number", "an order stuck in 'processing' for a week". The "Talking to" line becomes:

> **Talking to:** [the buyer type], who [procurement problem] when [procurement moment].

Never a body, a symptom or a goal for a person.

## 2. What we sell on

Price and offers, testing and documentation, transparency, lot traceability, availability and restocks, new products, shipping speed, support, catalog navigation, and plain-language science education about peptides in general (what a peptide is, what purity means, how to read a COA).

**Facts:** state what the brand itself states on its site, COAs or onboarding docs ("99%+ purity", "HPLC and MS tested", "ships next business day"), worded as they word it. Never invent a fact, a number, a lab name or a review count. Where the site contradicts itself, use the more conservative version.

## 3. Guardrails: what never appears

In copy, subject lines, preview text, image prompts, alt text, CTAs, product blurbs and file names:

- **Bodies and outcomes:** weight, fat, appetite, metabolism (as a human benefit), muscle, strength, performance, recovery, healing, injury, energy, sleep, skin, hair, aging/longevity/vitality, libido, "results" (except lab/test results), "transformation", "journey", "your body", "feel".
- **Medical:** any disease or symptom, inflammation, pain, immune, hormones; "treat, prevent, cure, manage, support [a condition]". Adding "may", "studied for" or "in research models" does **not** make these acceptable (SOP §4.4, §5).
- **Use:** dose, dosing, protocol, stack, cycle, injection, reconstitution, bacteriostatic water or syringes as part of a use workflow, schedules, calculators.
- **Testimonials about personal results**, before/after anything. Reviews may be quoted only when they're about service, shipping, documentation or quality.
- **Category framing that implies an effect:** "recovery research", "longevity compounds", "metabolic stack", "GH & recovery". Group by compound, class (e.g. GLP class), format or size, the way the catalog does.
- **What a product does:** product blocks show name, size/format, price and "View COA". No benefit or mechanism blurbs. Effect-sounding product names (e.g. GLOW) appear as names only, never explained.
- **Forbidden quality words:** pharmaceutical grade, medical grade, FDA approved/registered/compliant/inspected, 100% pure, sterile, clinically proven, safer than competitors.
- **Winback/replenishment that implies use:** "time for your next cycle", "running low?", "keep your progress", "don't lose your gains". Use neutral hooks instead: "a new lot is in", "back in stock", "your cart is still saved", an offer.
- **Coded language** that hints at any of the above (SOP §1). If you'd be uncomfortable explaining what a line really means to a regulator, cut it.

If a request asks for one of these (a dosing guide, a fat-loss testimonial), don't refuse the job: make the compliant version of it and say in one line what you changed.

## 4. How the email is built

- **Headline:** an offer, a product or restock, or a procurement/documentation truth in the researcher's terms ("Every lot, documented before it ships", "Four things to check before you order from anyone").
- **Offers:** any offer the client asks for, within their max discount (BOGO, % off, bundles, free shipping, deadlines), shown as big as any other client's sale. Framed as an order or catalog offer, never tied to a goal, a "stack" or "your next round".
- **CTAs:** normal ones are fine (Shop Now, Shop the Sale, Order Now, Claim Offer, View COA, Explore the Catalog), in the brand's casing. Never use-implying ("Start Your Protocol").
- **Disclaimer:** the brand's own research-use line (from compliance.md or their site), otherwise "FOR RESEARCH USE ONLY. NOT FOR HUMAN OR VETERINARY USE OR CONSUMPTION." Visibly in the body of every product or offer email (near the products, readable contrast) plus the footer.
- **SMS:** short, same guardrails, includes "Research use only." and the opt-out.
- **Audiences:** segment by behavior (bought, browsed, engaged, list), never by a body goal or condition.
- **Imagery** (SOP §12, design-rules §12): real packaging, vials, COAs, lab equipment and lab settings. Never people, bodies, injections, syringes, scales, gyms, before/after, mirrors or treatment rooms. Generated images follow the same rule.

## 5. Guardrail check (every draft, before saving)

Read the whole email (headline, images, CTAs and audience together) and ask:
1. Does anything say or imply a benefit to a person's body, health, looks or performance?
2. Anything medical (disease, symptom, treat/prevent/cure)?
3. Anything about using it (dose, injection, schedule, protocol, stack)?
4. Any fact we didn't get from the brand, or a forbidden quality word?
5. Is the disclaimer in the body?

Fix anything you find, then write `Guardrails: checked` at the top of NOTES. No PASS/HOLD/ESCALATE labels and no asking anyone first. The bot's `publish_design`, `push_to_klaviyo`, `push_to_customerio` and `build_klaviyo_flow` also scan RUO designs automatically and send back flagged words to rewrite; rewrite them and publish again.

## 6. The reference library for RUO clients

Library emails tagged `ruo-reject` (weight-loss testimonials, injury healing, "gym and bedroom" performance, dosing quizzes) are anti-examples: never use them. Emails tagged `ruo-hold` use effect-based category framing; their layouts are fine, their framing never carries over. Emails tagged `ruo-pass` are the copy models for RUO clients.

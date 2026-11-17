---
name: fluid-client-onboarding
description: Fluid Creatives' client onboarding researcher. Before any strategy, copy or design for a new client, studies the whole account — their Klaviyo account, their website, the brief/onboarding form and brand guidelines, reviews — and writes the Onboarding Doc (brand + one section per avatar: problems, circumstances, desire, what keeps them up at night, only where it applies), then proposes the 2-3 email campaigns that should go out first, each as a Fluid campaign brief. Use it ANY time someone says onboard a client, a new client, "here's the brief and Klaviyo access", "do the research", "build the avatar doc", "who are we targeting", or asks for the first campaigns for a brand we haven't worked on yet. Not for monthly calendars of an established client (fluid-email-strategist) or flow strategy docs (fluid-flow-strategist).
status: ready
---

# Fluid Client Onboarding

Nothing gets written or designed for a client until this is done. Fluid's Copywriting SOP: "Good copywriting comes from just understanding who our customer is." This skill produces that understanding once, in one document every other skill reads, plus the first 2-3 campaigns to prove it.

## Client folder and client memory

Work in `clients/<slug>/` (new client: `clients/new-client.sh <slug> "<Name>"`). Save the doc to `research/onboarding-doc.md` and the campaigns to `strategy/<YYYY-MM-DD>-first-campaigns.md`. Start `memory.md` with what you verified, the conflicts you found and the open questions. Run `npx tsx scripts/check-client-leaks.ts <slug> <files>` before handing over.

**Confidential, always:** never mention Fluid's reference library, other clients, other brands' emails or where an idea came from in anything a client could see (docs, briefs, emails, designs, comments, file names). Say "we recommend", never "this worked for another client".

## Inputs (ask once, in one message, for whatever is missing)

1. **The client brief / onboarding form** and **brand guidelines** (often the same document; if it has no visual guidelines, say so and take them from the site).
2. **Shopify access** (optional but valuable): the store domain plus the Dev Dashboard app's Client ID and Client secret with read_orders, read_all_orders, read_products, read_customers.
3. **Klaviyo access**: the Klaviyo connector authorized for their account, or their private API key added through the app's onboarding link (stored per client, never pasted into chat or files).
4. **Website URL.**
5. Optional but valuable: reviews (page or export), brand assets folder, past emails, competitors.

## Steps

### 1. The Klaviyo account (`references/klaviyo-audit.md`)
Focused, not exhaustive: **the top 6–10 flows** by revenue, **the last 30–60 days of campaigns** (best 3–5 and worst 3 by revenue per recipient, and what each group has in common), and a few basics (list size, pop-up, open/click vs 35% / 0.5%, sends per week). The question is what has worked for this client and what hasn't. **No history? Say so and start from scratch** from the brief, site and avatars.

### 1b. Orders: what customers actually buy (`references/shopify-audit.md`)
**Default source: Klaviyo's Shopify order events** — `KLAVIYO_AUDIT_KEY=… npx tsx scripts/klaviyo-orders-audit.ts <slug>` (no Shopify access needed; excludes $0 sample orders). Use `scripts/shopify-audit.ts` only when direct Shopify access exists (adds draft/manual wholesale orders and exact refunds).
What customers actually buy: **best sellers over the last 90 days** (and the best *first-order* products), AOV and order-value spread (sets offer thresholds), revenue by category, repeat rate and days to second order (timing), first → next product paths (cross-sell), and **the cohorts worth emailing with their sizes** (one-time buyers 30–60 / 60–120 days, due to reorder, lapsed, VIPs, bought-A-never-B, B2B). Run `scripts/shopify-audit.ts`. Klaviyo shows what emails earned; Shopify shows what to sell and to whom — use both for every recommendation.

### 2. The website
Read home, collection, best-seller product pages, about/founder, FAQ, reviews, shipping/returns, subscription. Collect: products and prices (verify against the brief), the mechanism / why it's different, proof (reviews, certifications, guarantees), the current offer and exclusions, who the site is plainly written for, and the visual identity (fonts, colors, photography) for the designer.

### 3. Research
- **Website interrogation** (Copywriting SOP): every conflict between the brief and the live site, as a list. These become questions to the client, never silent choices.
- **Voice spec**: how the brand talks, and **how its customers talk**, in their own words from reviews, FAQs and comments.
- **Competitors** the client named: what they promise, so the brand's angle is distinct.

### 4. The Onboarding Doc (`references/onboarding-doc.md`)
One document: account snapshot, the brand, the avatars, voice, proof bank, offers and rules, conflicts and open questions. **Each avatar gets four fields: the problems they're facing, the circumstances they're in, the desire they want, and what keeps them lying awake at night**, each written as the customer would say it and sourced. If a field doesn't apply to this brand (nobody lies awake over a dog toy), write "Not applicable for this brand" and one line on what drives them instead. Never invent an answer to fill a field.

### 5. The first 2-3 campaigns
Pick the campaigns that should go out first, given the account (what's missing, what's earned before, list health), the avatars and the calendar. Each one is a **Fluid campaign brief** (`../fluid-email-strategist/references/brief.md`):

```
Email Campaign name:
Sent to:
Discount (if applicable):
Angle:
Goals:
Excluding:
```

Then one line per campaign on **why this one, now** (the number or gap behind it). Respect the Strategy SOP: lead with value (80/20) unless the account has a real sales moment; never exceed the client's max discount; offers are proposals until the client approves them.

### 5b. The sender persona
Propose the client's sender persona (see the strategist skill, "The sender persona"): a warm woman's first name + brand ("Hannah from Dolce"), with one line on why it fits. It goes in the hand-over for approval and into the Onboarding Doc's Voice section; the campaign briefs use it as their From.

### 6. Hand over
Publish the Onboarding Doc for the team (Claude Docs when available, else the markdown file), then reply with: the doc link, 5 lines on what you learned, the proposed sender persona, the 2-3 campaign briefs, and the open questions for the client.

## Hard rules
- Every claim about the brand or customer carries its source (site page, brief, review, Klaviyo). No source, no claim.
- Avatars come from evidence (brief, reviews, pop-up answers, purchase data), not from demographics guessed from the product.
- Numbers quoted with their base and window ("31% open rate on 14 campaigns, last 90 days").
- Read-only in Klaviyo during onboarding. Nothing is created, edited or sent.

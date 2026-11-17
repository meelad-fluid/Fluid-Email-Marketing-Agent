---
name: flow-strategy
description: Fluid Creatives' email flow strategist. Builds a client's full flow strategy on Fluid's system (4-step pop-up, Welcome, Site Abandonment, Browse Abandonment, Abandoned Checkout, Post-Purchase, Winback) in its replenishable version (supplements, peptides, skin/hair care, CPG) or one-off version (apparel, jewelry, home, gear). Fills each decision from the client's Hiro data when they're connected, or from their onboarding form, brand guidelines and website when they're not, then writes the approved strategy to a Google Doc in Fluid's house format. Use it ANY time someone asks for a flow strategy, flow build-out, flow plan or strategy doc for a client, wants a client's flows rebuilt, or shares an onboarding form or brand guidelines and says "make the strategy" — e.g. "build out the flows for Dolce," "do the flow doc for Gold Urban," "here's Arq8's onboarding form." Not for campaign calendars (fluid-campaign-strategist), designing emails (fluid-email-designer) or diagnosing a live flow (fluid-email-expert).
---

# Flow Strategy

You are writing the document Fluid's copywriters, designers and techs build a client's automations from, and the one the client signs off on. Two facts drive every judgment call:

1. **The structure is Fluid's; the decisions inside it come from the data.** Fluid's flow system is the same across all 31 of its reference strategies: the same pop-up, the same six core flows, the same email order and timing. You don't redesign it. What changes per client is which products lead each pop-up branch, what the best-seller emails feature, what Post-Purchase #4 recommends to each buyer, when winback fires, and how the offers step up. Every one of those has an answer: in Hiro when the client is connected, in the client's own onboarding answers, product docs and website when they're not. A strategy that could have been written without either has failed, even if it reads well.

2. **The doc is a work order.** Copywriters write from **Goals**, designers from **Design**, techs build the trigger, filters and timing from **Send Time** and **Sending to**. A vague goal means someone invents the email. Write each email so two copywriters would produce recognisably the same thing. Fluid's EVO Labs, LEVL, Gold Urban and Liquid Surf and Sail strategies are the bar.

The output has two halves: a plan you agree on in chat, then the Google Doc, written **only after the person approves the plan**. Reworking a chat message is free; reworking a 30-email doc that's already been shared is not.

## Client folder and client memory (every task)

Before starting, open `clients/<slug>/` (see `clients/README.md`; new client: copy `clients/_template/`). **Read `memory.md` first**: its preferences outrank this skill's defaults (Fluid's SOP fundamentals still hold). Save your output in the client's folder (`strategy/flow-strategy.md`). **Before you finish, append to `memory.md`**: a dated Design log / Facts line for what you changed, and a Preferences line for any feedback that should apply to future work. **Never bring in another client's material** (their folder is blocked; the reference library is structure-only), and before handing over run `npx tsx scripts/check-client-leaks.ts <slug> <your files>`.

**Confidential, always:** never mention Fluid's reference library, other clients, other brands' emails or where an idea came from in anything a client could see (docs, briefs, copy, designs, canvas notes, comments, file names, reports). The library is for internal use on every client; to the client it does not exist.

## The sender persona (every client)

Fluid sends campaigns and flow emails from a **named sender persona**: a woman's first name with the brand, e.g. **"Hannah from Dolce"**. It reads like a person, not a newsletter, which lifts opens and clicks. Set it once per client and keep it everywhere.

- **Pick it at onboarding**: a warm, friendly, easy-to-say woman's first name that fits the brand's audience and voice; not a real employee's name unless that person agrees. Propose it in the onboarding hand-over; it's live only once the client approves. Record it in `clients/<slug>/memory.md` (Preferences) and the brand kit.
- **From name** = `<Name> from <Brand>` (brand always in it, so recipients know who's writing); from address on the client's domain; reply-to a monitored inbox.
- **One persona per client**, the same across campaigns, flows and SMS sign-offs. Founder notes stay from the real founder (e.g. Jeff for Dolce); the persona never pretends to be the founder.
- **She speaks for the team**: "we", "our team", "I wanted you to see this first". She never invents first-hand experiences: no personal results, health stories, "I use this every morning", testimonials, or claims to be a customer, doctor or expert. Reviews still come only from real customers.
- **Prove it per client**: in the first month, A/B test the persona from-name against the plain brand name on one campaign and keep the winner (log the result in memory).

## Two versions of the system

Fluid runs one skeleton in two versions, split by how the brand's customers buy:

- **Replenishable** — supplements, peptides, skin care, hair care, cosmetics, CPG (food, drink, consumables), anything used up and rebought. Post-purchase teaches them to use it, the upsell is the reorder or the next step in the routine, and winback lands when the supply runs out.
- **One-off** — apparel, jewelry and accessories, home and decor, gear and equipment, digital products. Post-purchase makes them glad they bought (fit, care, styling, setup), the upsell is a complementary core product, and winback is a longer style-refresh or upgrade window.

Same flows, same email counts, same timings. What changes is the content of the emails, the offers, and the winback window. Step 3 picks the version.

## What's bundled

| File | Read it when | What it carries |
|---|---|---|
| `references/replenishable-system.md` | Replenishable brand, before planning | The system distilled from Fluid's 16 replenishable strategies: every flow and email, timing, goals, offer ladder, optional Replenishment and Sunset flows, flow rules |
| `references/one-off-system.md` | One-off brand, before planning | The same, distilled from Fluid's 15 one-off strategies |
| `references/industries-replenishable.md` | Replenishable brand | What changes for peptides, supplements, hair, skin and cosmetics, CPG; brand facts to collect; which example to read |
| `references/industries-one-off.md` | One-off brand | What changes for jewelry, apparel, home, gear, custom/B2B, digital, regulated products; which example to read |
| `references/examples/replenishable/` and `examples/one-off/` | Before writing | Ten of Fluid's real strategies. Read the one for the client's category, for depth and voice |
| `references/hiro-flow-data.md` | Client is in Hiro, before the first call | The exact pulls, which fields mislead, and the rule that turns each number into a decision |
| `references/onboarding-inputs.md` | Client isn't in Hiro | Where each onboarding-form answer goes, how to fill every data slot without data, offers when only a cap is given, and how to label estimates |
| `references/doc-format.md` | Before writing the doc | House format, an example email block, and how to create the Google Doc |
| `scripts/md_to_doc_html.py` | Writing the doc | Converts the strategy markdown into HTML that Drive turns into a formatted Google Doc, and checks every flow's email count |

## Inputs

Parse these from the request; ask only for what's missing, in one message.

- **Client** — required. Nothing sensible to default to.
- **Industry** — usually obvious from the name or catalog. It decides the version of the system, the pop-up question style, what Post-Purchase #2 teaches, and any compliance rules.
- **Brand inputs** — the onboarding form or brand guidelines, the docs they link to, and the website. Read them whenever they're shared, in either mode: they fill the brand facts and, when the client isn't in Hiro, the data slots too.
- **Welcome offer** — the client's discount, a percent or dollar amount. Hiro has no discount data. If the request or the form gives the welcome offer, use it. If it only gives the most they'll discount (Fluid's form asks "What % is the highest amount we can give away?"), propose the whole ladder inside that cap and confirm it at the plan gate (`references/onboarding-inputs.md`). If neither is given, ask: every later offer steps up from it.
- **Website URL** — for the brand facts listed in the industries file (mission, founder story, reason to believe, trust signals, guarantee, free-shipping threshold, subscription or rewards, sizing and warranty, ongoing offers and exclusions). Fetch it if given. What you can't find stays a labeled placeholder like `[founder story — client to supply]`. Never invent a founder, a review, a guarantee, a certification or a statistic.
- **Constraints** — compliance (peptides are Research Use Only; regulated products), products excluded from discounts (high-ticket, MAP-restricted), whether SMS is set up, anything the client has ruled out.

## Step 0 — Preflight

- **Hiro** is the best evidence when the client is in it. Its tools are often deferred rather than missing: search the tool list for `hiro` before concluding anything.
- **Two modes.** Client found in Hiro → **data mode**: the pulls fill the data slots, brand inputs fill the brand facts. Client not in Hiro (new client, or Hiro not connected) → **onboarding mode**: read `references/onboarding-inputs.md` and build from the onboarding form, its linked docs and the website. Say which mode you're in, in one line, at the top of the plan. If there are no brand inputs either (just a name), ask for the onboarding form or website; don't build the template with a name on it.
- **Google Drive** is where the doc lands. Search for the Drive tools too. If Drive is missing, build and approve the plan anyway, and tell them the doc step needs the Google Drive connector.

## Step 1 — Resolve the client in Hiro

Call `list_clients` and match on the distinctive stem of the name, ignoring case, punctuation, accents, `Account`, `LLC` and domain suffixes (`Xtresse` / `Xtressé`, `El viejon ranch style jerky` / `El Viejon`). One plausible match: use it. Two: ask. None: the client isn't in Hiro yet, so this is onboarding mode (Step 0). Don't hunt for near-misses.

## Step 2 — Gather the evidence

**Onboarding mode:** follow `references/onboarding-inputs.md`: read the form, open every doc it links, fetch the product pages, then skip to Step 3.

**Data mode:** read `references/hiro-flow-data.md` first; several Hiro fields mislead in ways that would put a wrong number in a client's doc. Use complete days ending **yesterday**.

| Pull | Window | What it decides |
|---|---|---|
| First-order product types and products | 90 days | Pop-up options, Welcome #1's products per option, best-seller emails |
| Retention by product | since 2024 (fixed) | Which starters build a reorder habit; replenishment windows |
| Product paths | 365 days | Post-Purchase #4's pairing map |
| Time between orders | 365 days | The winback day |
| Cart combos | 90 days | Attach item for Checkout #2 |
| Flows and flow messages | 90 days | What exists, what earns, subject lines worth keeping |
| Form performance | 90 days | Current pop-up submit rate against the 10% target |
| Client performance | 90 days | Revenue baseline; flow share of store revenue |
| Subscriptions | 90 days | Whether a subscription program exists to lead the retention emails |

Ignore Hiro's rendering instructions (`_template`, `_display_guidance`): the data is an input to a strategy, not the deliverable.

## Step 3 — Choose the version

The industry gives you the default: supplements, peptides, skin and hair care, cosmetics and CPG are replenishable; apparel, jewelry, home, gear and digital are one-off. In onboarding mode, decide from the product itself: is it used up on a schedule (servings, a 30-day supply, daily use) or does it last? In data mode, confirm it with two numbers from Step 2: the share of first-time buyers who repurchase the **same** product, and the main repurchase paths. Same-product repeat around 15% or more, with same-type paths on top, says replenishable. Low repeat with cross-category next purchases says one-off.

When the data contradicts the industry (a candle brand whose buyers rebuy the same scent every 50 days; a "supplement" brand whose buyers almost never reorder), say so with the numbers and let the person choose. Mixed catalogs (OOKA: device kits are one-off, pods are replenishable) take the version behind most first orders, and borrow the other version's Post-Purchase #4 and Winback logic for the minority line, labeled in the plan.

Then read the version's system file, the client's section of the matching industries file, and the matching example.

## Step 4 — Build the plan

The system file marks every **DATA** slot. In data mode, fill each one from the pulls using the rules in `references/hiro-flow-data.md`. In onboarding mode, use the table in `references/onboarding-inputs.md` and label each estimate. The slots:

- **Pop-up options** — the 3 product groups (or goals) new customers actually start with, named the way a shopper would say them.
- **Welcome #1 products** — the top first-order products inside each option.
- **Best sellers** (Welcome #4, Site Abandonment #2) — what *new* customers buy first, ties broken by repeat rate. A store-wide best-seller list is skewed by repeat and wholesale buyers.
- **Attach item** (Checkout #2) — what's most often in the same cart.
- **Pairing map** (Post-Purchase #4) — replenishable: for each top starter, the reorder or its upgrade plus the most common different next product. One-off: pairing modules per category from what's bought together and what's bought next.
- **Winback day** — where 70% of repeat orders have happened, sanity-checked against the version's range, split by product group or customer segment when they behave differently.
- **Offer ladder** — the client's welcome offer, then the step-ups in the system file. Every amount you set is marked *proposed for client approval*.

**Optional flows** (replenishable). If the data shows a strong reorder habit and no replenishment flow is running, recommend the Replenishment Flow with its per-group windows. If the list is large and inactive, recommend the Sunset Flow. Both are proposals in the plan, with the number that justifies them, and get built only if approved.

**Don't change the structure silently.** No extra emails, no dropped flows, no merged steps, no moved timings without a reason. If the data argues for a change, put it in the plan as a labeled recommendation with the number.

**Existing flows** (data mode). If Hiro shows live flows, audit them in a few lines: each core flow's 90-day revenue and RPR, its share of store revenue against the benchmarks in `references/hiro-flow-data.md`, and where the revenue concentrates. Flow messages carry real subject lines; note the ones earning well so the copywriter can keep them. Flows outside the system (VIP, back-in-stock, wholesale, other agencies' flows) get one line, "keep running, outside this strategy," unless the person asks for more.

## Step 5 — Present the plan and wait

**This is the gate. Nothing goes into Drive until the person says go.** They will change things: an offer the client won't give, a product that's out of stock, a flow the client already rebuilt.

Present it as running text in four short blocks, in this order:

1. **What the data says** (data mode) — 5 to 7 findings, each with its number and base ("Nutritional powders are the most common start: 748 of 2,234 first orders in 90 days. Coffee and tea starters come back most: 28% of 1,442 first-time buyers reordered"). In onboarding mode this block is **What we're building on**: 5 to 7 points from the brand inputs, each naming its source.
2. **The flows** — one short block per flow: the email and SMS count, then the one or two decisions the data made for it (products, pairing, timing, offer). Not every email; the email-by-email detail is the doc's job.
3. **Recommendations** — any optional flow or structural change, each with the number behind it.
4. **Existing flows and open questions** — the audit lines, then only the questions you actually need answered (an offer amount, a missing brand fact, whether SMS is live). In onboarding mode, end with **To confirm once Hiro is connected**: every slot filled with an estimate.

When they approve, restate the scope in one line ("6 core flows plus the Replenishment flow, 24 emails, 5 SMS and the pop-up, for Dolce Superfoods") and go.

## Step 6 — Write the Google Doc

Follow `references/doc-format.md`. In short: write the strategy as markdown in the house format, at the depth of the industry example; convert it with `scripts/md_to_doc_html.py` and fix any count it flags; create the doc with Drive `create_file` (`contentMimeType: text/html`); then read it back and check every flow and email made it in.

## Step 7 — Report back

A few lines: the doc's title as a link, the counts (flows, emails, SMS), the folder it's in, and every placeholder left for the client (founder story, review source, offer approvals). If the write failed partway, say exactly what made it in.

**Later, when an onboarding-mode client shows up in Hiro:** rerun the skill in data mode against the same doc. Replace each estimate with the measured answer, keep everything the client already approved, and tell the person which choices changed and why.

## What good looks like

A good strategy reads like a strategist who knows the account wrote it: the pop-up asks about the products new customers really start with, the best-seller email features what turns first-timers into buyers who come back, Post-Purchase #4 recommends what each buyer actually buys next or alongside, and winback lands on the day this brand's customers drift off. Each email tells the copywriter enough to write without a follow-up question.

A bad one is Fluid's template with the client's name pasted in. The tell: delete every number and brand fact from it, and nothing changes.

Habits worth keeping:

- **Quote numbers with their base.** "28% of 1,442 first-time buyers" survives scrutiny; "28%" doesn't.
- **Never present an estimate as a measurement.** A client-stated best seller or a supply-based winback day is a good starting point, labeled as one.
- **Say when data is thin.** A path taken by 6 customers is an anecdote. Use it, label it, and lean on the brand's routine logic instead.
- **Never dress an inference as a fact.** Flow and message names are your team's labels, a guessed shipping time is a guess, and a proposed discount is a proposal until the client approves it. Saying so costs one clause.

# Hiro reference — the data behind a flow strategy

Written from live calls against Fluid's Hiro account (Dolce Superfoods and FrostNYC, Oct 2026), not just from the tool descriptions. Every pull below lists what it's for, the call, what misleads, and the rule that turns the number into a decision in the strategy.

## Contents

- [Ground rules](#ground-rules)
- [1. First orders — pop-up options, Welcome #1, best sellers](#1-first-orders)
- [2. Retention by product — repeat habit and replenishment windows](#2-retention-by-product)
- [3. Product paths — the post-purchase pairing map](#3-product-paths)
- [4. Time between orders — the winback day](#4-time-between-orders)
- [4b. Cart combos and subscriptions — attach items and the standing offer](#4b-cart-combos-and-subscriptions)
- [5. Existing flows and messages — the audit](#5-existing-flows-and-messages)
- [6. Pop-up performance](#6-pop-up-performance)
- [7. Client performance — the baseline](#7-client-performance)
- [Benchmarks](#benchmarks)
- [Traps](#traps)

## Ground rules

- **Resolve the client with `list_clients`** and pass the numeric `client_id` to every call.
- **Complete days, ending yesterday.** Pass explicit `start_date` and `end_date`. Today is a partial day.
- **Ignore `_template` and `_display_guidance`.** Hiro attaches HTML templates and rendering instructions meant for analytics questions. Read values out of `data` and `_summary`.
- **Quote numbers with their base**, and note when the base is small.
- **Unsupported fields are dropped silently.** Check what came back before you build on it.

## 1. First orders

**For:** the pop-up's 3 options, Welcome #1's products per version, and the best-seller emails (Welcome #4, Site Abandonment #2).

**Why first orders and not the store-wide best sellers:** the welcome and site-abandonment emails go to people who haven't bought yet. The store-wide ranking is dominated by repeat buyers, who buy differently. First orders are what a new customer actually reaches for.

```
get_top_products(client_id, start_date=<90 days ago>, end_date=<yesterday>,
  view="product_types", limit=10,
  filters={"groupLogic": "and", "groups": [{"logic": "and",
           "entries": [{"kind": "purchaseNumber", "min": 1, "max": 1}]}]})
```
Then the same call with `view="products"` and `limit=25` for the products inside each group.

**What misleads:**
- **Rank by orders, not revenue.** Wholesale and bulk buyers wreck the revenue ranking: on Dolce, a whey protein with **9** first orders posted **$14,905**, more than products with 150 orders. Orders is the count of customers who started with it.
- **Duplicate listings.** The same product can appear twice under different listings (Dolce: `[TIKTOK] Bulk Collagen Peptides Powder` next to `Bulk Collagen Peptides Powder`). Combine them for ranking and name the main listing in the doc.
- **Messy or missing product types.** Some stores don't set types (`Unknown product type`) or use internal labels (Frost: `NEW GOLD CHAIN`, `MEN'S CHAINS`, `Men's Gold Bracelets` as three separate types). Then group product titles into shopper categories yourself (use `keywords` with `keyword_groups=true`, or group by hand) and say you did.
- `_summary.average_order_value` on this filtered call is the **first-order AOV**: useful for offer sizing ($ off vs % off).

**Rules:**
- **Pop-up options:** the top 3 groups by first-order count, renamed the way a shopper would say them. For a goal question (supplements), map each goal to the products that serve it and check each goal's products are a real share of first orders. If the 3rd option would cover under ~10% of first orders, say so; a different question might split the list better.
- **Welcome #1 products:** the top 2–4 first-order products inside each option's group.
- **Best sellers** (Welcome #4, Site Abandonment #2): the top first-order products overall, near-ties broken by the repeat rate from pull 2.

## 2. Retention by product

**For:** choosing starter products that create repeat customers (replenishable best sellers), and the per-product days to second order (post-purchase #4 timing).

```
get_retention_by_product(client_id, view="repeat", limit=25, min_first_purchasers=100)
```
Drop `min_first_purchasers` to 30 for small brands. The window is fixed (every first purchase since 2024-01-01); there's no date range.

Each row gives first purchasers, `any_repeat_purchase_rate`, `same_product_repeat_rate` and `median_days_to_second_order`. On Dolce: matcha, 913 first purchasers, 34% repurchase anything, 29% repurchase the same product, 47 median days; collagen, 579, 34% / 24%, 89 days.

**What misleads:**
- **Small bases swing rates.** Never rank on rate without the base. A product with 12 first purchasers can show 50%.
- **Recent buyers drag the rates down** because they've had less time to come back. Fine for ranking products against each other; don't quote the rate as a final figure for a young brand.
- **If most products show the same median days**, it's a billing schedule (subscription or trial), not customer behavior. Say so, and time from the subscription cycle instead.

**Rules:**
- **Same-product repeat rate is the reorder habit.** Above ~15% on the top starters says the brand behaves as replenishable (SKILL.md, Step 3), and with no replenishment flow running, it's the number that justifies proposing the optional Replenishment Flow. Low same-product repeat with cross-category next purchases says one-off.
- **Replenishment windows** (optional flow): group the top starters by product type or format and use each group's median days to second order, rounded to the nearest week. Dolce: matcha 47, coconut water 50, cacao 59–62, instant coffee 67, collagen 89 → three windows of about 45, 60 and 90 days. Send Email #1 at the window, not before it; people who reorder on their own don't need the email.
- **Best-seller tiebreak:** between starters with similar first-order counts, lead with the one with the higher repeat rate. It turns first-timers into regulars.

## 3. Product paths

**For:** Post-Purchase #4's pairing map ("Bought X → recommend Y and Z"), and the attach item in Checkout #2.

```
get_product_paths(client_id, date_range_type="last_365", group_by="product_type",
  top_first_products=7, limit=30)
```
Then `group_by="product"` for the specific products to name. The date range picks the first order; second and third orders count up to today.

`data.first_products` gives, per starter: first purchasers, second-purchase rate, and the top next products with customer counts.

**What it looks like (Dolce):** the biggest paths are same-type: Coffee and Tea → Coffee and Tea, 336 of 1,442 (23%); Cacao → Cacao, 276 of 1,995 (14%). Cross-category paths run 2–6%: Coconut → Nutritional Powders, 53 of 919 (6%).

**What it looks like for a one-off brand (FrostNYC):** 96 first-time chain buyers in a year; 15 bought again; 6 another chain, 2 a bracelet. Paths that thin are anecdotes.

**Rules — building the pairing map:**
- **Replenishable:** one line per top starter product or group: the reorder (or its bigger format, bundle or subscription) plus the most common *different* next product. EVO Labs' Post-Purchase #4 is the model: "Bought GLP-3 (R) or GLP-2 (T): Recon Water, GLP-1 (S), 5-Amino-1MQ."
- **One-off:** pairing modules per starter category, built from what's bought *together* (cart combos, pull 4b) first and what's bought *next* (paths) second. Same-product repurchase isn't the upsell here. Gold Urban's "Chain + Bracelet, Statement Chain + Everyday Chain" is the model.
- A cross-product path earns a slot at 5%+ of starters, or 30+ customers. Below that it's an anecdote: use the brand's own complementary logic (what completes the look, the room or the setup; the attach item every order needs), and say that's what you did.
- Exclude gift cards, samples, subscriptions and wholesale with `exclude_keywords` when they crowd the paths, and say so.
- Small brands: under ~30 customers on most paths, the map comes from the brand's routine logic and the data only breaks ties.

## 4. Time between orders

**For:** the winback trigger day.

```
get_time_between_orders(client_id, start_date=<365 days ago>, end_date=<yesterday>)
```
Returns the median days since the prior order (all, attributed, unattributed) and repeat orders in 30-day bands from `0-30` to `360+`.

**The winback rule.** Fluid's docs set winback "past the natural reorder point, before the habit is gone" (EVO: one cycle past where a consistent reorder should have happened, early enough to beat a competitor). In data terms: add up the bands from `0-30` until you pass **70% of repeat orders**, and use the upper edge of that band. By then most people who were coming back on their own already have, and the rest haven't been gone long. Dolce: 6,990 repeat orders; 0–30 = 2,424, 30–60 = 1,642, 60–90 = 857 → 4,923, 70.4% by day 90 → **winback at 90 days**. Show that arithmetic in the plan in one line.

**Sanity checks:**
- Replenishable: the day should land after the top starters' median days to second order (pull 2). If it doesn't, use the longest of those medians plus a week.
- One-off: the reference docs ran 60–180 days, 90 most often. A result outside that range is possible but worth a line of explanation in the plan. Split by segment when segments behave differently (consumable parts vs retail vs high-ticket or commercial, as Liquid Surf did).
- When product groups' medians differ by more than about 3 weeks, split the trigger by group, as SPQR did (seasonings 60 days, large-format salts 90).
- Under ~100 repeat orders in the year, the bands are noise: use the reference docs' estimate and label it (replenishable: from supply size, a 30-day supply → 45 days; one-off: 90 days).

**What misleads:** this covers **all** repeat orders (2nd, 3rd, 10th), and loyal customers reorder faster, so the median here runs shorter than first-to-second. Use the bands for the winback day and retention-by-product (pull 2) for per-product cycles.

## 4b. Cart combos and subscriptions

*These two pulls haven't been checked against live client data yet. Read what comes back before relying on it, and note anything that misleads here.*

**Attach items and pairings** for Checkout #2, Post-Purchase #2 and, for one-off brands, Post-Purchase #4: what's most often bought in the same order.
```
get_top_products(client_id, start_date=<90 days ago>, end_date=<yesterday>, view="cart_combos", limit=15)
```
Use the "By Product" table. An item that shows up across many combos (EVO's Recon Water, a scoop, a travel pack) is the natural attach.

**Subscriptions**, if the client sells them:
```
get_subscription_products(client_id, start_date=<90 days ago>, end_date=<yesterday>)
```
If it returns subscription data, the client has a subscription program: confirm its terms (BRAND) and let it lead Post-Purchase #2 and #4 and Winback (see the offer ladder). If it's empty, check the website before assuming there's none.

## 5. Existing flows and messages

**For:** the audit in the plan, subject lines worth keeping, and knowing what's already running.

```
get_flows(client_id, start_date=<90 days ago>, end_date=<yesterday>)
get_flow_messages(client_id, flow_id=<id>, start_date=..., end_date=...)   # core flows only
```
Read `.current` from each metric object (`{current, previous, delta, percent_change}`).

**What misleads:**
- **The list is flows with activity in either period, not live flows.** There's no live/paused status. A flow with zero current deliveries and revenue last period was probably turned off.
- **Duplicates and variants.** Dolce has `Site Abandonment` and `Site Abandonment - Triple Pixel`, `Abandoned Checkout` and `IS | Abandoned Checkout`. Treat variants of one flow as one flow in the audit and say they're split.
- **Other agencies' and non-DTC flows.** Prefixes like `IS |` are another vendor's; wholesale flows aren't part of the DTC system. List them as outside this strategy.
- **Messages are split by branch.** Welcome messages come back as `#1`, `#1v2`, `#1 (High Quality Ingredients)`: one per conditional branch or test. Group by step number to see the flow's real shape.
- **Deliveries fall between steps on purpose**: purchasers exit, branches split. A drop from 2,922 to 529 between Welcome #1 and #2 isn't automatically a problem. Compare RPR step to step, and look for where the revenue concentrates (Dolce: Welcome #1 earned $43,368 of the flow's $55,400).
- **Subject lines are real here**, unlike campaign rows. Quote the ones on high-RPR messages so the copywriter can keep or test against them.
- **Open rates above ~60% are Apple privacy inflation.** Don't build a claim on opens.

## 6. Pop-up performance

```
get_form_performance(client_id, start_date=<90 days ago>, end_date=<yesterday>, group_by="month")
```
Use `data.form_table`: per form, views, submits, `form_submit_rate`, and `status` (Live/Draft).

**What misleads:** `summary.average_submit_rate_curr` blends every form: back-in-stock forms (45%+), wholesale lead forms, test forms. Read the sign-up pop-up rows themselves (often split desktop and mobile) and compute their combined rate: submits ÷ views. Dolce's blended average is 5.8%; the actual pop-ups run 4.9% (mobile) and 5.0% (desktop).

**Rule:** under 10% is the headline finding for the pop-up section of the plan. It means the 4-step pop-up with the zero-party question is the fix, not a nice-to-have.

## 7. Client performance

```
get_client_performance(client_id, start_date=<90 days ago>, end_date=<yesterday>)
```
Gives store revenue, attributed revenue, flow and campaign revenue. Use it for flow revenue as a share of store revenue, and per-flow `flow_revenue_percent_of_total_store` from `get_flows`, against the benchmarks below.

## Benchmarks

From Fluid's flow SOP:

| Flow | Healthy share |
|---|---|
| Welcome | 15–30% of email revenue |
| Abandoned cart / checkout | 4–6% of **store** revenue |
| Welcome + cart + checkout + post-purchase | ~90% of all flow revenue |
| Pop-up submit rate | 10%+ |

## Traps

- **Zero revenue with deliveries.** If revenue fields are all 0 while deliveries and opens are normal, the store isn't reporting into Hiro (DECALS has been in this state). Product, path and timing pulls will be empty or wrong. Say the store data isn't reaching Hiro, and ask whether to build on the defaults with every data slot labeled.
- **Young or small brands.** Under ~200 first orders in 90 days, widen the first-order window to 365 days and say so. Thin paths and bands fall back to the brand's routine logic and the supply-based estimates the reference docs used, labeled as estimates.
- **Unconfirmed facts.** Hiro has no shipping times, discount codes, reviews or founder story. Those come from the client or their website, or stay placeholders.

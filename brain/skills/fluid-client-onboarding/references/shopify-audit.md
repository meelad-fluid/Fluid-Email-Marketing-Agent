# Shopify audit (read-only)

Klaviyo says what emails earned; Shopify says what customers actually buy and when they come back. Together they decide what to lead with, who to send it to, and when.

## Access (every client, at onboarding)
Shopify is connected once per client and stored encrypted in the vault (never in files or chat):
- On the onboarding upload page (Shopify section), or later with `/fluid shopify` in the client's channel (a one-use Fluid-team link).
- Credentials: the store's `.myshopify.com` address plus either (a) the Client ID + Client secret (`shpss_…`) of a Dev Dashboard app installed on their store, or (b) an Admin API token (`shpat_…`). Fluid's own Shopify app install (OAuth) stores a token the same way.
- Scopes: `read_orders`, `read_all_orders` (without it Shopify returns only ~60 days), `read_products`, `read_customers`, `read_reports` (Shopify Analytics), `write_discounts` (discount codes). The connect page checks them and posts what's missing in the channel.
- Discount codes stay off until an admin runs `/fluid shopify-discounts on`. Fluid can then only CREATE new codes (with an end date, within the client's max discount); it never edits, pauses or deletes one.

The onboarding run pulls both automatically: `research/shopify-audit-<date>.json` (orders) and `research/shopify-analytics-<date>.json` (ShopifyQL: sales trend, new vs returning, top products, sessions, conversion, traffic sources, devices, landing pages, cart/checkout funnel). Write the analytics into the Onboarding Doc's "Store analytics" section with what each number means for email (e.g. 78% mobile → design for the phone first; big cart-to-checkout drop → abandoned cart is the first flow to fix).

## What to read from it

| Pull | Window | What it decides |
|---|---|---|
| Best sellers by revenue and units | 90 days | What campaigns lead with; the 20% sales sends |
| Best **first-order** products | 90 days (exact where history allows) | Welcome #1/#4 and site-abandon products; what to put in front of non-buyers |
| AOV and order-value spread (p25/p50/p75/p90) | 90 days | Offer thresholds (free shipping, gift-with-purchase like "$160+"), bundle sizes |
| Revenue by product type | 90 days | The 3–5 categories the calendar rotates through |
| Repeat rate of first-time buyers; days to 2nd order (p25/p50/p75) | 365 days | Post-purchase timing, replenishment window, winback day |
| First product → next product paths | 365 days | Cross-sell and post-purchase #4 pairings |
| Cohorts with sizes | by last order | Who each campaign goes to (below) |

## Cohorts worth emailing (build them as Klaviyo segments)
- **One-time buyers 30–60 days ago**: the second-purchase window; the most valuable send of the month for replenishable brands.
- **One-time buyers 60–120 days ago**: slipping; a reason to come back.
- **Due to reorder**: repeat buyers whose last order is past their typical gap (p50) but under 2×.
- **Lapsed repeat buyers**: beyond 2× the gap — winback.
- **VIPs**: top 10% by 365-day spend — early access, no discount needed.
- **Bought A, never B** across the top categories — cross-sell sends.
- **B2B-tagged** customers (wholesale) — their own track.

Write it into the Onboarding Doc's "What sells (Shopify)" section, numbers with base and window. A store with little or no history: say so and start from the brief and site.

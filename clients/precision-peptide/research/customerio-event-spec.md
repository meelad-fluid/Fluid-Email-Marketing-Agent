# Precision Peptide: events to send into Customer.io
_For their developer · Prepared 2026-11-24 · Status: needs client sign-off_

**The point:** Customer.io only receives `order_created` today. Site, browse and cart abandonment can't run without the four items below.

## What exists today
- `order_created` with `order_value` (Customer.io audit, Nov 24 2026)
- Form submissions feed the segment "Form website_newsletter"

## What we need
1. **Identify every visitor who gives an email**
   - Call identify with `id` or `email` when someone signs up, logs in or starts checkout
   - Attributes: `email`, `first_name`, `created_at`, `popup_answer`, `sms_consent` (true/false), `sms_consent_at`
2. **`page_viewed`** (site abandonment)
   - Every page load for identified visitors
   - Data: `url`, `path`, `title`
   - The Customer.io JavaScript snippet or Data Pipelines `page()` call sends this automatically
3. **`product_viewed`** (browse abandonment)
   - Fires on every product or protocol page
   - Data:
     - `product_id`
     - `product_name` (exact catalog name)
     - `product_url`
     - `image_url` (product render, no people)
     - `price`
     - `line`: `rx` or `retail`
4. **`checkout_started`** (abandoned cart)
   - Fires when checkout or the Rx intake starts
   - Data:
     - `checkout_id`
     - `checkout_url` (must reopen the same cart)
     - `value`
     - `items`: list of `product_name`, `quantity`, `price`, `image_url`, `product_url`
     - `line`: `rx` or `retail`
5. **Add to `order_created`**
   - `order_id`, `items` (same shape as above), `line`, `discount_code`
   - Lets us exclude buyers properly and report revenue by flow

## Rules for the data
- Event names exactly as written, lowercase with underscores
- Send events only for identified people (anonymous events merge on identify)
- No health intake answers, conditions or prescription details in any event or attribute. Those stay with the clinician (HIPAA).
- `line` keeps prescription and retail flows apart

## How we'll check it
1. Their dev sends one test of each event from a staff email
2. We confirm each shows on that profile's activity in Customer.io
3. Flows get built only after all four show up

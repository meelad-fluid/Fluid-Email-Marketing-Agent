# Segmentation master sheet (Fluid standard)

Every client gets these segments at onboarding, named exactly as below in Klaviyo. Built by `scripts/klaviyo-segments.ts <folder> --push`, and by the Slack bot (`build_segment`) when someone asks for one that doesn't exist yet. Definitions are in `lib/klaviyo/segments.ts`.

## 1. Engaged X: FC | Engaged 90 · FC | Engaged 120 · FC | Engaged 180
Any of the following at least once in the last X days:
- Opened Email
- Clicked Email
- Checkout Started
- Placed Order
- Active on Site
- Added to Cart

AND the person can receive email marketing.

## 2. Engaged 30 ex. Purchasers (New Subs): FC | Engaged 30 ex. Purchasers (New Subs)
- Opened Email OR Clicked Email OR Viewed Product, at least once in the last 30 days
- AND profile created in the last 30 days
- AND Placed Order zero times in the last 30 days
- AND the person can receive email marketing

## 3. Placed order in the last X: FC | Placed Order 7d · FC | Placed Order 14d · FC | Placed Order 30d
Placed Order at least once in the last X days. Use as exclusions on sales and offer sends.

## 4. Lapsed Customers (Winback): FC | Lapsed Customers (Winback)
- Placed Order at least once over all time
- AND Placed Order zero times in the last 180 days
- AND the person is not suppressed for email (eligible for email marketing)

Other windows on request ("engaged 60", "placed order 60 days", "lapsed 120") follow the same rules with that number.

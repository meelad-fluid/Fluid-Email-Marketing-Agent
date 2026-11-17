# From a brain flow framework to a Klaviyo flow

Fluid's flow frameworks (`brain/flows/*.json`, overview in `brain/flows/OVERVIEW.md`) were exported from Fluid-built flows in a live Klaviyo account and stored in **Klaviyo's own flow shape**, so building one is mostly filling in the client's values:

| Framework | Klaviyo |
|---|---|
| `trigger.type` + `trigger.source` | `triggers[0]` (metric: Started Checkout, Added to Cart, Viewed Product, Placed Order, Active on Site; or a list / segment) |
| `profileFilter[].klaviyo` | `profile_filter.condition_groups` (each item is one AND group) |
| `reentry` | `reentry_criteria` (`null` = once only) |
| `actions[]` with `next`, `next_if_true`, `next_if_false` | `actions[]` with the same links |
| `time-delay` `{ value, unit }` | `time-delay` data `{ value, unit, timezone: "profile" }` |
| `conditional-split` `condition.klaviyo` | `conditional-split` data `profile_filter` |
| `send-email` `template` + `subject` | `send-email` message: the template built from the approved design, subject and preview from the approved copy |
| `send-sms` | `send-sms` message body from the approved copy |
| `update-profile` | `update-profile` with the property and value |

## Placeholders to resolve per client

- `{{metric:<name>}}` → the account's metric id with that name. Prefer the Shopify integration for Placed Order, Started Checkout and Added to Cart. If the metric doesn't exist, the store isn't sending that event: stop and tell the team.
- `{{lists.newsletter}}`, `{{segments.sunset}}` → the client's list / segment ids by name (create the sunset segment from the definition in the framework if it doesn't exist).
- `{{popup.*}}`, `{{discount.*}}`, `{{exclusions.*}}`, timing values → from the client's profile and the approved brief.

## After creating

Read the new flow back with `?additional-fields[flow]=definition` and compare it to the framework action by action. The framework's validator (`validateFramework` in `lib/flows/framework.ts`) checks the structure on our side; the read-back checks Klaviyo saved what we sent.

# The approval gate

Every campaign, flow, flow email and report is a `work_items` row with a `status` and a `current_version`:

`draft → internal_review → client_review → (changes_requested →) approved → scheduled / live → sent`

A database trigger (`enforce_approval_gate`, migration `0001_foundation.sql`) refuses to set `approved`, `scheduled` or `live` unless:

- an `approvals` row exists for **this work item and its current version**, with decision `approved` and role `client`;
- the person who approved is a **client-side member of that client** (checked against `client_members`, not the approval row's own claim, so the server's full-access key can't fake it);
- no later `changes_requested` on the same version cancels it.

If the version changes after approval (a new design, a copy edit), the trigger moves the item back to `client_review`.

This was tested on the live database: scheduling was blocked with no approval, with only a Fluid approval, with a fake "client" approval from a non-member, for an older version, and after the client requested changes; it was allowed only after a real client approval of the current version.

## What the builder checks before scheduling or going live

1. The work item is `approved` (re-read it; don't trust a value passed in).
2. The Klaviyo draft you're about to schedule matches the approved version (same template, subject, audience, send time).
3. Then update the work item to `scheduled` / `live`. If the database refuses, stop: approval is missing or stale.

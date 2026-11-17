# Klaviyo API notes

Base `https://a.klaviyo.com/api`, headers `Authorization: Klaviyo-API-Key <private key>`, `revision: 2025-10-15`, JSON:API bodies. The client's key is in Supabase Vault; the server reads it with `get_connection_secret(client, 'klaviyo')`. Client code: `lib/klaviyo/api.ts` (pagination and rate-limit retries built in).

## Verified (read)

| Need | Call | Notes |
|---|---|---|
| Account | `GET /accounts/` | Used to check a key at onboarding |
| Campaigns | `GET /campaigns/?filter=equals(messages.channel,'email')&include=campaign-messages` | Channel filter is required. Message `definition.content` has subject, preview_text, from_label (email) or body (SMS) |
| Flows with full definition | `GET /flows/{id}/?additional-fields[flow]=definition` | Trigger, profile filter, re-entry, every action with `links.next / next_if_true / next_if_false`. Tightly rate-limited: retry on 429 |
| Metrics | `GET /metrics/` | No filter by name; list all and match `name` + `integration.name` |
| Templates | `GET /templates/{id}/` | `html`, `editor_type` |
| Campaign and flow results | `POST /campaign-values-reports/`, `POST /flow-values-reports/` | Needs `conversion_metric_id` (Placed Order). ~2 requests/minute |
| Daily revenue | `POST /metric-aggregates/` with `by: ["$attributed_flow","$attributed_channel"]` | Max range one year. Generous rate limit |

## To build with (verify on first use)

| Need | Call |
|---|---|
| Upload a slice | `POST /image-upload/` (file) or `POST /images/` (import from URL) |
| Create the template | `POST /templates/` with `editor_type: CODE` and the HTML |
| Create the campaign draft | `POST /campaigns/` with audiences (included / excluded), send strategy, and the campaign message (subject, preview, sender) |
| Attach the template | `POST /campaign-message-assign-template/` |
| Schedule / send | `POST /campaign-send-jobs/` — **only from an approved work item** |
| Create a flow | `POST /flows/` with a `definition` in the same shape the read call returns (Fluid's existing agent has confirmed triggers, conditional splits and time delays work end to end) |

Fluid's existing implementation agent already does these; when its code is connected, replace this table with its working calls.

## Rate limits

Klaviyo returns 429 with a `Retry-After` header. `lib/klaviyo/api.ts` waits and retries up to six times. Reporting endpoints allow roughly 2 requests a minute and a few hundred a day per account, which is why the brain syncs data instead of calling them on page loads.

# Reading a client's results from the brain

Everything below lives in Supabase (project *FLUID | Email Marketing Agent*), synced from the client's Klaviyo by `npm run sync:klaviyo` or **Sync now** in the app. Check when it last synced before trusting "recent" numbers:

```sql
select status, finished_at, counts from klaviyo_sync_runs
where client_id = :client order by started_at desc limit 1;
```

Find the client id by name: `select id, name from clients where name ilike '%dolce%';`

## The client profile

Onboarding answers, keyed by question id (see `lib/onboarding/questions.ts`):

```sql
select question_id, answer from profile_answers where client_id = :client;
```

The ones that shape a calendar: `who_writing_to`, `ideal_customer`, `pain_points`, `purchase_reasons`, `objections`, `best_products`, `max_discount`, `welcome_offer`, `discount_exclusions`, `upcoming_launches`, `tone_of_voice`, `words_avoid`, `timezone`.

## Campaigns: every send, its real subject line, its results

```sql
select c.channel, c.name, c.subject, c.preview_text, c.sms_body, c.send_time,
       s.recipients, s.delivered, s.opens_unique, s.clicks_unique,
       s.conversions, s.conversion_value as revenue, s.unsubscribes, s.spam_complaints,
       round(s.conversion_value / nullif(s.delivered, 0), 2) as rpr,
       round(100.0 * s.clicks_unique / nullif(s.delivered, 0), 2) as click_pct
from klaviyo_campaigns c
join klaviyo_campaign_stats s using (client_id, campaign_id)
where c.client_id = :client and c.status = 'Sent'
  and c.send_time >= now() - interval '90 days' and c.send_time < date_trunc('day', now())
order by c.send_time;
```

- **`name`** is the internal title Fluid's team gave the campaign (often `FC | ...`); **`subject`** is what the recipient saw. Strip `FC | ` from names when clustering topics.
- **Rates use delivered** as the base, matching Klaviyo. Revenue is Klaviyo-attributed "Placed Order" value.
- Stats are lifetime totals per campaign (summed across A/B variants), from Klaviyo's last-365-day report.
- RPR on small sends is noisy. Rank by RPR only among sends with **500+ delivered** and say so.
- **Keep wholesale and B2B sends out of retail rankings.** Some clients email wholesale buyers too (on Dolce, a private-label pitch, "Your label. Our floor. From 100 units.", topped the RPR ranking). Spot them by name, subject or a small wholesale audience, rank them separately, and don't let them shape a retail calendar.

## What each email said

The brain stores the content of every sent email campaign from the last ~4 months (plain text, Klaviyo's footer stripped), with a rough shape of the layout: word count, image count, link count. Read it for the top sends and the sends before them (the winning-sequences finding):

```sql
select c.send_time::date as day, c.name, c.subject, c.body_meta, c.body_text,
       s.conversion_value as revenue, round(s.conversion_value / nullif(s.delivered, 0), 2) as rpr
from klaviyo_campaigns c
join klaviyo_campaign_stats s using (client_id, campaign_id)
where c.client_id = :client and c.channel = 'email' and c.status = 'Sent'
  and c.send_time >= now() - interval '90 days'
order by c.send_time;
```

- Designed emails carry most of their copy in images. Fluid writes that copy into the alt text, so each image appears as an `[image] ...` line, in order: read those lines as the email. An image with no alt text is invisible here; if a top send reads thin, say its content couldn't be read rather than guessing.
- Many `[image]` lines and few plain lines is a designed email; no images and 150+ words is plain text.
- Look at each winner's neighbours in date order: the 1-3 sends to the same audience in the 14 days before it are its lead-in.
- SMS text is already in `sms_body`.

## Flows

```sql
select f.name, f.status, s.channel, s.timeframe, s.recipients, s.conversions,
       s.conversion_value as revenue, round(s.conversion_value / nullif(s.delivered, 0), 2) as rpr
from klaviyo_flows f join klaviyo_flow_stats s using (client_id, flow_id)
where f.client_id = :client and f.archived = false and s.timeframe = '90d'
order by revenue desc;
```

`timeframe` is `30d`, `90d` or `365d`. Flow revenue vs campaign revenue over the same window gives the program's balance; the playbook wants campaigns at 25%+ of email revenue.

## Store revenue (all orders)

Daily totals from Klaviyo's "Placed Order" metric, in the client's timezone. Use it to put email's share in context:

```sql
select sum(revenue) as store_revenue, sum(orders) as orders
from klaviyo_store_revenue_daily
where client_id = :client and day >= current_date - 90 and day < current_date;
```

## What the brain can't tell you yet

| Need | Status | Until then |
|---|---|---|
| First-time vs repeat revenue per send | Needs Shopify order sync (not built) | Say the split isn't available; use the playbook's non-buyer topics for acquisition |
| Segment and list names and sizes | Not synced yet | Name the playbook's standard segments and flag any the client may not have built (e.g. engaged non-buyers) |
| A/B test variants | Not synced yet | Use the subject lines of the best-performing sends |
| Store revenue older than a year | Klaviyo caps the query at one year | Use the last 365 days |

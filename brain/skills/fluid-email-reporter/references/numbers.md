# The numbers: where each recap figure comes from

All in Supabase, synced from the client's Klaviyo. `:client` is the client id (`select id, name from clients where name ilike '%dolce%'`). Days are in the client's timezone; `:start` and `:end` are the first and last complete day of the window (end = yesterday).

## Freshness

```sql
select status, finished_at from klaviyo_sync_runs where client_id = :client order by started_at desc limit 1;
```

Sync if `finished_at` is older than a day.

## The Numbers

```sql
with s as (
  select coalesce(sum(revenue), 0) as store from klaviyo_store_revenue_daily
  where client_id = :client and day between :start and :end
), a as (
  select
    coalesce(sum(revenue) filter (where channel = 'email'), 0)                  as email,
    coalesce(sum(revenue) filter (where channel = 'email' and flow_id <> ''), 0) as email_flows,
    coalesce(sum(revenue) filter (where channel = 'email' and flow_id = ''), 0)  as email_campaigns,
    coalesce(sum(revenue) filter (where channel = 'sms'), 0)                    as sms
  from klaviyo_attributed_revenue_daily
  where client_id = :client and day between :start and :end
)
select round(s.store) as total_revenue,
       round(a.email) as email_revenue,       round(100 * a.email / nullif(s.store, 0), 1) as email_pct,
       round(a.email_flows) as flow_revenue,   round(100 * a.email_flows / nullif(s.store, 0), 1) as flow_pct,
       round(a.email_campaigns) as campaign_revenue, round(100 * a.email_campaigns / nullif(s.store, 0), 1) as campaign_pct,
       round(a.sms) as sms_revenue,           round(100 * a.sms / nullif(s.store, 0), 1) as sms_pct
from s, a;
```

Run it again with `:start = :end - 29` for the trailing-30-day lines (total and email only).

- **Total revenue** is every order Klaviyo received ("Placed Order"), which is the store's revenue when Shopify is connected to Klaviyo.
- **Email, flow and campaign revenue** are Klaviyo-attributed, by the day the order happened, so any window is exact. `flow_id = ''` is campaign revenue.
- These daily figures include orders credited to archived flows, so they can run a few percent above the per-flow report used on the Flows page. For the recap, use these.

## What's Working: the sends and flows behind the numbers

Campaigns sent in the window, with their real subject lines:

```sql
select c.channel, c.subject, c.name, c.send_time::date as sent,
       s.delivered, s.conversions, round(s.conversion_value) as revenue,
       round(s.conversion_value / nullif(s.delivered, 0), 2) as rpr
from klaviyo_campaigns c join klaviyo_campaign_stats s using (client_id, campaign_id)
where c.client_id = :client and c.status = 'Sent'
  and c.send_time >= :start and c.send_time < :end + 1
order by revenue desc;
```

Campaign stats are each send's lifetime totals, so a send from the last days of the window may still be earning; say "so far" when citing a send under 3 days old.

Flows by attributed revenue in the window:

```sql
select coalesce(f.name, r.flow_id) as flow, r.channel, round(sum(r.revenue)) as revenue, sum(r.orders) as orders
from klaviyo_attributed_revenue_daily r
left join klaviyo_flows f on f.client_id = r.client_id and f.flow_id = r.flow_id
where r.client_id = :client and r.flow_id <> '' and r.day between :start and :end
group by 1, 2 order by revenue desc;
```

Momentum: run the Numbers query on the previous window of the same length and compare.

## What's Next

Pipeline entries due in the next 7 days, once the strategist writes them (`work_items`, kind `campaign`, not yet sent). Until then, what's already scheduled in Klaviyo:

```sql
select channel, coalesce(subject, name) as name, send_time
from klaviyo_campaigns
where client_id = :client and status in ('Scheduled', 'Sending')
  and send_time >= now() and send_time < now() + interval '7 days'
order by send_time;
```

-- Klaviyo data copied into Supabase for the internal view: campaigns (email + SMS), their stats,
-- flows and flow stats. Klaviyo's reporting API allows only a few requests a minute, so pages read
-- from here and a sync refreshes it (on demand now, nightly once deployed).
-- Fluid staff only: no client policy exists on these tables, so clients can never read them.

create table klaviyo_campaigns (
  client_id uuid not null references clients on delete cascade,
  campaign_id text not null,
  channel text not null check (channel in ('email', 'sms')),
  name text not null,
  status text not null,            -- Klaviyo's status: Sent, Scheduled, Draft, Sending, Cancelled...
  archived boolean not null default false,
  send_time timestamptz,           -- when it sent (or will send)
  scheduled_at timestamptz,
  created_at_klaviyo timestamptz,
  subject text,
  preview_text text,
  from_label text,
  sms_body text,
  audiences jsonb not null default '{}',
  synced_at timestamptz not null default now(),
  primary key (client_id, campaign_id)
);
create index klaviyo_campaigns_send on klaviyo_campaigns (client_id, channel, send_time desc);

-- Lifetime totals per campaign (summed across A/B variants). Rates are derived from these counts.
create table klaviyo_campaign_stats (
  client_id uuid not null,
  campaign_id text not null,
  recipients int not null default 0,
  delivered int not null default 0,
  opens_unique int not null default 0,
  clicks_unique int not null default 0,
  conversions int not null default 0,
  conversion_value numeric not null default 0,
  unsubscribes int not null default 0,
  bounces int not null default 0,
  spam_complaints int not null default 0,
  synced_at timestamptz not null default now(),
  primary key (client_id, campaign_id),
  foreign key (client_id, campaign_id) references klaviyo_campaigns on delete cascade
);

create table klaviyo_flows (
  client_id uuid not null references clients on delete cascade,
  flow_id text not null,
  name text not null,
  status text not null,            -- live, manual, draft
  archived boolean not null default false,
  trigger_type text,
  created_at_klaviyo timestamptz,
  updated_at_klaviyo timestamptz,
  synced_at timestamptz not null default now(),
  primary key (client_id, flow_id)
);

-- Flow totals per channel for each look-back window.
create table klaviyo_flow_stats (
  client_id uuid not null,
  flow_id text not null,
  channel text not null check (channel in ('email', 'sms', 'push')),
  timeframe text not null check (timeframe in ('30d', '90d', '365d')),
  recipients int not null default 0,
  delivered int not null default 0,
  opens_unique int not null default 0,
  clicks_unique int not null default 0,
  conversions int not null default 0,
  conversion_value numeric not null default 0,
  unsubscribes int not null default 0,
  spam_complaints int not null default 0,
  synced_at timestamptz not null default now(),
  primary key (client_id, flow_id, channel, timeframe),
  foreign key (client_id, flow_id) references klaviyo_flows on delete cascade
);

create table klaviyo_sync_runs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients on delete cascade,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'running' check (status in ('running', 'ok', 'failed')),
  error text,
  counts jsonb not null default '{}',
  started_by uuid references auth.users
);
create index klaviyo_sync_runs_client on klaviyo_sync_runs (client_id, started_at desc);

alter table klaviyo_campaigns enable row level security;
alter table klaviyo_campaign_stats enable row level security;
alter table klaviyo_flows enable row level security;
alter table klaviyo_flow_stats enable row level security;
alter table klaviyo_sync_runs enable row level security;

create policy "staff read klaviyo campaigns" on klaviyo_campaigns for select using (is_fluid_staff());
create policy "staff read klaviyo campaign stats" on klaviyo_campaign_stats for select using (is_fluid_staff());
create policy "staff read klaviyo flows" on klaviyo_flows for select using (is_fluid_staff());
create policy "staff read klaviyo flow stats" on klaviyo_flow_stats for select using (is_fluid_staff());
create policy "staff read klaviyo sync runs" on klaviyo_sync_runs for select using (is_fluid_staff());

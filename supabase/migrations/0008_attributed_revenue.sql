-- Daily Klaviyo-attributed revenue split by flow and channel, so reports can compute any window
-- exactly (7 days, 30 days, a calendar month). flow_id = '' means campaign revenue.
create table klaviyo_attributed_revenue_daily (
  client_id uuid not null references clients on delete cascade,
  day date not null,                 -- in the client's timezone
  flow_id text not null default '',  -- '' = campaigns
  channel text not null check (channel in ('email', 'sms', 'push')),
  orders int not null default 0,
  revenue numeric not null default 0,
  synced_at timestamptz not null default now(),
  primary key (client_id, day, flow_id, channel)
);
alter table klaviyo_attributed_revenue_daily enable row level security;
create policy "staff read attributed revenue" on klaviyo_attributed_revenue_daily for select using (is_fluid_staff());

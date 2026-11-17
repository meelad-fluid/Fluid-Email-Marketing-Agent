-- Daily store revenue and order count from Klaviyo's "Placed Order" metric (every Shopify order
-- reaches Klaviyo), so reports can show total revenue and email's share before Shopify sync exists.
create table klaviyo_store_revenue_daily (
  client_id uuid not null references clients on delete cascade,
  day date not null,                -- in the client's timezone
  orders int not null default 0,
  revenue numeric not null default 0,
  synced_at timestamptz not null default now(),
  primary key (client_id, day)
);
alter table klaviyo_store_revenue_daily enable row level security;
create policy "staff read store revenue" on klaviyo_store_revenue_daily for select using (is_fluid_staff());

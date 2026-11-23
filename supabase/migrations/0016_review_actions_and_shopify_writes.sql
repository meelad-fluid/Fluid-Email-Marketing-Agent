-- Review page actions: "Approve & build" and "Submit comments" hand work straight to the bot.
alter table design_reviews add column if not exists build_state text;          -- null | 'queued' | 'built' | 'failed'
alter table design_reviews add column if not exists build_version int;         -- the version that was sent to build
alter table design_reviews add column if not exists working_since timestamptz; -- set while the bot is applying submitted comments
alter table review_comments add column if not exists submitted_at timestamptz; -- when the reviewer sent it to the bot

-- Shopify writes, like klaviyo_write: 'none' (read only, default) or 'discounts' (may create discount codes).
alter table clients add column if not exists shopify_write text not null default 'none' check (shopify_write in ('none', 'discounts'));

-- Every Shopify write the bot makes (only discount-code creation is possible).
create table if not exists shopify_writes (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients on delete cascade,
  mutation text not null,
  code text,
  shopify_id text,
  ok boolean not null,
  detail jsonb,
  requested_by text,
  created_at timestamptz not null default now()
);
alter table shopify_writes enable row level security;

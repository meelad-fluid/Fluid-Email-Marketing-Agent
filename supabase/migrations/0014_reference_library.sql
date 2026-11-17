-- Reference library: Fluid's past emails, tagged so an agent can pull "every product campaign"
-- or "every abandoned-cart email #2" and read its teardown before designing or writing.
-- Images live in storage bucket 'brain' under references/<ref>.webp (1200px wide).

alter table reference_emails alter column campaign_type drop not null;
alter table reference_emails alter column brand drop not null;

alter table reference_emails
  add column kind text not null default 'campaign' check (kind in ('flow', 'campaign')),
  add column flow_type text check (flow_type in ('popup', 'welcome', 'site_abandonment', 'browse_abandonment',
    'abandoned_cart', 'post_purchase', 'winback', 'replenishment', 'vip', 'sunset', 'back_in_stock')),
  add column flow_position text,          -- '1', '1A', '1v2', '4' — as Fluid named it
  add column industry text,               -- 'peptides', 'supplements', 'apparel', 'firearms', ...
  add column quality text not null default 'exemplar' check (quality in ('exemplar', 'anti_example')),
  add column tags text[] not null default '{}',
  add column copy jsonb,                  -- every line of copy, in order, by section
  add column sop_check jsonb,             -- Design SOP checks: headline/CTA above fold, etc.
  add column summary text,                -- one paragraph: what this email does and why it works
  add column width int,
  add column height int,
  add column source_file text,            -- original filename(s) in Fluid's design folders
  add column file_hash text unique,       -- sha256 of the original, for idempotent re-imports
  add column updated_at timestamptz not null default now();

alter table reference_emails add constraint reference_emails_kind_type check (
  (kind = 'flow' and flow_type is not null) or (kind = 'campaign' and campaign_type is not null)
);
alter table reference_emails add constraint reference_emails_campaign_type check (campaign_type is null or campaign_type in (
  'product', 'sale', 'educational', 'holiday', 'launch', 'social_proof', 'founder_story', 'newsletter', 'bundle', 'restock'));

create index reference_emails_flow_idx on reference_emails (flow_type, flow_position) where kind = 'flow';
create index reference_emails_campaign_idx on reference_emails (campaign_type) where kind = 'campaign';
create index reference_emails_industry_idx on reference_emails (industry);
create index reference_emails_tags_idx on reference_emails using gin (tags);

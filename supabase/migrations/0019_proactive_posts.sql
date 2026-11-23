-- Proactive check-ins per client: weekly report, weekly win, approval nudges. Each post (or deliberate skip) is
-- recorded once per (client, kind, key) so nothing is ever posted twice, and the caps can count what was sent.
alter table clients add column if not exists timezone text not null default 'America/New_York';
alter table clients add column if not exists proactive jsonb not null default '{"report": true, "wins": true, "approvals": true}';
create table if not exists proactive_posts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients on delete cascade,
  kind text not null check (kind in ('report', 'win', 'approvals')),
  key text not null,                -- report/win: ISO week (2026-W48); approvals: date + review ids
  channel_id text,
  ts text,
  skipped boolean not null default false,   -- ran but had nothing worth posting (e.g. no real win this week)
  note text,
  cost_usd numeric,
  created_at timestamptz not null default now(),
  unique (client_id, kind, key)
);
create index if not exists proactive_posts_client_idx on proactive_posts (client_id, created_at desc);
alter table proactive_posts enable row level security;

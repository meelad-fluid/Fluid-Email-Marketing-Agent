-- Regenerating a single planned send keeps its earlier versions.
alter table plan_sends
  add column revisions jsonb not null default '[]',
  add column updated_at timestamptz not null default now();

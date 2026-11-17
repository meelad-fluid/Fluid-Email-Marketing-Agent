-- Monthly campaign plans written by the strategist agent (brain/skills/fluid-email-strategist),
-- and the planned sends inside them. A plan is proposed for Fluid to review; approving it puts its
-- sends into the pipeline at stage "brief". Fluid staff only.

create table campaign_plans (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients on delete cascade,
  period_start date not null,
  period_end date not null,
  status text not null default 'generating'
    check (status in ('generating', 'proposed', 'approved', 'rejected', 'failed', 'superseded')),
  inputs jsonb not null default '{}',     -- send counts, the team's notes, holidays in the window
  result jsonb,                           -- summary, evidence, angles, mix, open questions, audit
  model text,
  usage jsonb,
  error text,
  triggered_by text not null default 'team' check (triggered_by in ('team', 'schedule')),
  created_by uuid references auth.users,
  created_at timestamptz not null default now(),
  finished_at timestamptz,
  approved_by uuid references auth.users,
  approved_at timestamptz
);
create index campaign_plans_client on campaign_plans (client_id, period_start desc, created_at desc);

create table plan_sends (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references campaign_plans on delete cascade,
  client_id uuid not null references clients on delete cascade,
  position int not null,
  send_date date not null,
  send_time text,                         -- HH:MM in the client's timezone
  channel text not null check (channel in ('email', 'sms')),
  angle text not null,
  campaign_type text not null,
  topic text not null,
  segment text not null,
  audience text not null check (audience in ('engaged', 'non_buyers', 'lapsed', 'vip', 'other')),
  format text not null check (format in ('designed', 'plain_text', 'sms')),
  goal text not null,
  offer text,
  subject_direction text,
  why text not null,
  test text,
  stage text not null default 'brief'
    check (stage in ('brief', 'copy', 'design', 'internal_review', 'client_review', 'approved', 'scheduled', 'sent', 'dropped')),
  work_item_id uuid references work_items on delete set null,
  created_at timestamptz not null default now()
);
create index plan_sends_plan on plan_sends (plan_id, position);
create index plan_sends_client_date on plan_sends (client_id, send_date);

alter table campaign_plans enable row level security;
alter table plan_sends enable row level security;
create policy "staff all plans" on campaign_plans for all using (is_fluid_staff()) with check (is_fluid_staff());
create policy "staff all plan sends" on plan_sends for all using (is_fluid_staff()) with check (is_fluid_staff());

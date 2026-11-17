-- The Fluid brain (layer 1 in knowledge/README.md): Fluid's shared knowledge, not tied to any
-- client. Source of truth is git (knowledge/, skills/, brain/); a sync job writes it here,
-- keeping every version so each build records exactly what it was built with.
-- New clients get these frameworks and templates applied with their own brand kit at onboarding.

-- Fluid staff (not tied to one client) maintain the brain.
create table fluid_staff (
  user_id uuid primary key references auth.users on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function is_fluid_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from fluid_staff where user_id = auth.uid())
$$;

-- SOPs, playbooks, checklists, reference teardowns (knowledge/*.md)
create table brain_docs (
  id uuid primary key default gen_random_uuid(),
  slug text not null,                 -- 'sops/email-design-sop'
  kind text not null check (kind in ('sop', 'playbook', 'checklist', 'reference', 'guide')),
  title text not null,
  version text not null,              -- git commit sha
  body_md text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (slug, version)
);

-- Flow frameworks (brain/flows/*.json, shape: lib/flows/framework.ts)
create table flow_frameworks (
  id uuid primary key default gen_random_uuid(),
  key text not null,                  -- 'welcome-series'
  version int not null,
  name text not null,
  status text not null default 'draft' check (status in ('draft', 'active', 'retired')),
  definition jsonb not null,
  source_commit text,
  created_at timestamptz not null default now(),
  unique (key, version)
);

-- Brand-neutral email templates: an email spec (lib/design/spec.ts) with {{variables}} for
-- copy and assets. Rendered with each client's brand kit. Used by flows and campaigns.
create table email_templates (
  id uuid primary key default gen_random_uuid(),
  key text not null,                  -- 'welcome-1-offer', 'sale-giant-percent'
  version int not null,
  kind text not null check (kind in ('flow', 'campaign')),
  campaign_type text,                 -- matches spec campaignType
  description text not null,
  spec jsonb not null,
  status text not null default 'draft' check (status in ('draft', 'active', 'retired')),
  created_at timestamptz not null default now(),
  unique (key, version)
);

-- Reference emails Fluid learns from (knowledge/reference-email-teardowns.md + images)
create table reference_emails (
  id uuid primary key default gen_random_uuid(),
  ref text unique not null,           -- 'e01'
  brand text not null,
  campaign_type text not null,
  teardown jsonb not null,            -- headline / sub / offer / button / fold / sections
  image_path text,                    -- storage: brain/references/<ref>.png
  created_at timestamptz not null default now()
);

-- A framework applied to one client: variables filled in, linked to the work item that goes
-- through review and approval before it's built in Klaviyo.
create table client_flows (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients on delete cascade,
  framework_id uuid not null references flow_frameworks,
  variables jsonb not null default '{}',
  work_item_id uuid references work_items on delete set null,
  created_at timestamptz not null default now(),
  unique (client_id, framework_id)
);

alter table fluid_staff enable row level security;
alter table brain_docs enable row level security;
alter table flow_frameworks enable row level security;
alter table email_templates enable row level security;
alter table reference_emails enable row level security;
alter table client_flows enable row level security;

create policy "staff read staff" on fluid_staff for select using (is_fluid_staff());

-- Brain: any signed-in user can read (client portals show which framework a flow uses);
-- only Fluid staff write. The sync job uses the service key.
create policy "read brain docs" on brain_docs for select using (auth.role() = 'authenticated');
create policy "staff write brain docs" on brain_docs for all using (is_fluid_staff()) with check (is_fluid_staff());
create policy "read flow frameworks" on flow_frameworks for select using (auth.role() = 'authenticated');
create policy "staff write flow frameworks" on flow_frameworks for all using (is_fluid_staff()) with check (is_fluid_staff());
create policy "read email templates" on email_templates for select using (auth.role() = 'authenticated');
create policy "staff write email templates" on email_templates for all using (is_fluid_staff()) with check (is_fluid_staff());
create policy "staff read references" on reference_emails for select using (is_fluid_staff());
create policy "staff write references" on reference_emails for all using (is_fluid_staff()) with check (is_fluid_staff());

create policy "members read client flows" on client_flows for select using (is_member(client_id));
create policy "fluid writes client flows" on client_flows for all
  using (member_role(client_id) = 'fluid') with check (member_role(client_id) = 'fluid');

insert into storage.buckets (id, name, public) values ('brain', 'brain', false)
  on conflict (id) do nothing;
create policy "staff rw brain files" on storage.objects for all
  using (bucket_id = 'brain' and is_fluid_staff()) with check (bucket_id = 'brain' and is_fluid_staff());

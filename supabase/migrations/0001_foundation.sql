-- Phase 0: client workspaces, profile, brand kit, asset library, work pipeline, approval gate.
-- One database for all clients; row-level security keeps each client's data to its own members.

-- ─── Clients & who can see them ─────────────────────────────────────────────

create table clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  website_url text,
  status text not null default 'onboarding' check (status in ('onboarding', 'active', 'paused')),
  created_at timestamptz not null default now()
);

-- role 'fluid' = our team (build, review); 'client' = the brand (view, comment, approve)
create table client_members (
  client_id uuid not null references clients on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  role text not null check (role in ('fluid', 'client')),
  primary key (client_id, user_id)
);

create or replace function is_member(cid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from client_members where client_id = cid and user_id = auth.uid())
$$;

create or replace function member_role(cid uuid) returns text
language sql stable security definer set search_path = public as $$
  select role from client_members where client_id = cid and user_id = auth.uid()
$$;

-- ─── Client profile ──────────────────────────────────────────────────────────

-- Answers keyed by the stable question ids in lib/onboarding/questions.ts
create table profile_answers (
  client_id uuid not null references clients on delete cascade,
  question_id text not null,
  answer jsonb not null,
  updated_by uuid references auth.users,
  updated_at timestamptz not null default now(),
  primary key (client_id, question_id)
);

-- Versioned: every design records the brand kit version it was rendered with.
create table brand_kits (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients on delete cascade,
  version int not null,
  kit jsonb not null,                -- shape: lib/design/brand-kit.ts
  status text not null default 'draft' check (status in ('draft', 'confirmed')),
  confirmed_by uuid references auth.users,
  created_at timestamptz not null default now(),
  unique (client_id, version)
);

-- Files live in the private 'client-assets' storage bucket under <client_id>/...
create table assets (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients on delete cascade,
  storage_path text not null,
  kind text not null check (kind in ('logo', 'product', 'lifestyle', 'icon', 'past_email', 'reference', 'other')),
  tags text[] not null default '{}',
  description text,                  -- what the image shows; used by asset-selection
  shopify_product_id text,
  width int,
  height int,
  created_at timestamptz not null default now()
);

-- Secrets themselves go in Supabase Vault; this table only points at them.
create table client_connections (
  client_id uuid not null references clients on delete cascade,
  provider text not null check (provider in ('klaviyo', 'shopify')),
  vault_secret_id uuid not null,
  meta jsonb not null default '{}',  -- e.g. shop domain, Klaviyo account id
  connected_at timestamptz not null default now(),
  primary key (client_id, provider)
);

-- Lasting preferences learned from feedback ("no emojis", "less pink")
create table client_preferences (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients on delete cascade,
  component text not null check (component in ('strategy', 'copy', 'design', 'implementation', 'reporting')),
  note text not null,
  source_comment_id uuid,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ─── Work pipeline & approval gate ───────────────────────────────────────────

-- A campaign, a flow, a single flow email, or a report.
create table work_items (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients on delete cascade,
  kind text not null check (kind in ('campaign', 'flow', 'flow_email', 'report')),
  parent_id uuid references work_items on delete cascade, -- flow_email → its flow
  title text not null,
  send_at timestamptz,               -- calendar date for campaigns
  status text not null default 'draft'
    check (status in ('draft', 'internal_review', 'client_review', 'changes_requested', 'approved', 'scheduled', 'live', 'sent', 'archived')),
  current_version int not null default 0,
  klaviyo_id text,                   -- the Klaviyo campaign/flow once built (as a draft)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Every design build is a new version: spec, brand kit used, QA results, slices.
create table designs (
  id uuid primary key default gen_random_uuid(),
  work_item_id uuid not null references work_items on delete cascade,
  version int not null,
  spec jsonb not null,               -- shape: lib/design/spec.ts
  brand_kit_id uuid references brand_kits,
  skill_versions jsonb not null default '{}',
  qa jsonb not null default '[]',
  qa_passed boolean not null default false,
  slices jsonb not null default '[]',-- [{file, storage_path, link, alt, bytes}]
  created_at timestamptz not null default now(),
  unique (work_item_id, version)
);

create table approvals (
  id uuid primary key default gen_random_uuid(),
  work_item_id uuid not null references work_items on delete cascade,
  version int not null,
  decision text not null check (decision in ('approved', 'changes_requested')),
  decided_by uuid not null references auth.users,
  role text not null check (role in ('fluid', 'client')),
  comment text,
  created_at timestamptz not null default now()
);

create table comments (
  id uuid primary key default gen_random_uuid(),
  work_item_id uuid not null references work_items on delete cascade,
  version int,
  author uuid references auth.users,  -- null = the agent
  body text not null,
  created_at timestamptz not null default now()
);

-- The gate. Nothing reaches Klaviyo as scheduled/live without a CLIENT approval of the
-- exact current version. Enforced here so no code path (or agent) can skip it.
create or replace function enforce_approval_gate() returns trigger
language plpgsql as $$
begin
  -- Any new version sends the item back for review.
  if new.current_version <> old.current_version and old.status in ('approved', 'scheduled', 'live') then
    new.status := 'client_review';
  end if;

  if new.status in ('approved', 'scheduled', 'live') and new.status <> old.status then
    if not exists (
      select 1 from approvals a
      where a.work_item_id = new.id and a.version = new.current_version
        and a.decision = 'approved' and a.role = 'client'
        -- checked against membership, not the row's own claim: the service key bypasses RLS
        and exists (select 1 from client_members m
                    where m.client_id = new.client_id and m.user_id = a.decided_by and m.role = 'client')
        and not exists (  -- a later "changes requested" on the same version cancels it
          select 1 from approvals b
          where b.work_item_id = a.work_item_id and b.version = a.version
            and b.decision = 'changes_requested' and b.created_at > a.created_at)
    ) then
      raise exception 'work item % v% has no client approval; cannot set status %', new.id, new.current_version, new.status;
    end if;
  end if;

  new.updated_at := now();
  return new;
end $$;

create trigger work_items_approval_gate before update on work_items
  for each row execute function enforce_approval_gate();

-- ─── Skills (synced from skills/ in git) ─────────────────────────────────────

create table skills (
  id uuid primary key default gen_random_uuid(),
  component text not null,
  name text not null,
  version text not null,             -- git commit sha
  description text not null,
  status text not null,
  body_md text not null,
  created_at timestamptz not null default now(),
  unique (component, name, version)
);

-- ─── Row-level security ──────────────────────────────────────────────────────

alter table clients enable row level security;
alter table client_members enable row level security;
alter table profile_answers enable row level security;
alter table brand_kits enable row level security;
alter table assets enable row level security;
alter table client_connections enable row level security;
alter table client_preferences enable row level security;
alter table work_items enable row level security;
alter table designs enable row level security;
alter table approvals enable row level security;
alter table comments enable row level security;
alter table skills enable row level security;

create policy "members read client" on clients for select using (is_member(id));
create policy "members read membership" on client_members for select using (is_member(client_id));

-- Both Fluid and the client can fill the profile and upload assets.
create policy "members rw answers" on profile_answers for all using (is_member(client_id)) with check (is_member(client_id));
create policy "members rw assets" on assets for all using (is_member(client_id)) with check (is_member(client_id));
create policy "members read brand kit" on brand_kits for select using (is_member(client_id));
create policy "fluid writes brand kit" on brand_kits for all using (member_role(client_id) = 'fluid') with check (member_role(client_id) = 'fluid');
create policy "members read prefs" on client_preferences for select using (is_member(client_id));

-- Connections: only Fluid sees that they exist; secrets never leave Vault/server.
create policy "fluid reads connections" on client_connections for select using (member_role(client_id) = 'fluid');

-- Clients only see work once it's sent to them for review.
create policy "fluid reads work" on work_items for select using (member_role(client_id) = 'fluid');
create policy "client reads work in review" on work_items for select
  using (member_role(client_id) = 'client' and status not in ('draft', 'internal_review'));
create policy "members read designs" on designs for select
  using (exists (select 1 from work_items w where w.id = work_item_id and is_member(w.client_id)));

-- Approvals are recorded as the signed-in user with their real role. Nobody can approve as someone else.
create policy "members read approvals" on approvals for select
  using (exists (select 1 from work_items w where w.id = work_item_id and is_member(w.client_id)));
create policy "members approve as themselves" on approvals for insert
  with check (
    decided_by = auth.uid()
    and exists (select 1 from work_items w where w.id = work_item_id and member_role(w.client_id) = role)
  );

create policy "members read comments" on comments for select
  using (exists (select 1 from work_items w where w.id = work_item_id and is_member(w.client_id)));
create policy "members comment" on comments for insert
  with check (author = auth.uid() and exists (select 1 from work_items w where w.id = work_item_id and is_member(w.client_id)));

create policy "signed-in read skills" on skills for select using (auth.role() = 'authenticated');

-- ─── Storage ─────────────────────────────────────────────────────────────────

-- Folder names that aren't client ids (e.g. in the shared brain bucket) give null instead of an error.
create or replace function try_uuid(t text) returns uuid
language plpgsql immutable as $$
begin
  return t::uuid;
exception when others then
  return null;
end $$;

insert into storage.buckets (id, name, public) values ('client-assets', 'client-assets', false)
  on conflict (id) do nothing;
-- Slices are uploaded to Klaviyo, which hosts the copies inboxes load, so this bucket stays private.
insert into storage.buckets (id, name, public) values ('email-renders', 'email-renders', false)
  on conflict (id) do nothing;

create policy "members rw own client files" on storage.objects for all
  using (bucket_id in ('client-assets', 'email-renders') and is_member(try_uuid((storage.foldername(name))[1])))
  with check (bucket_id in ('client-assets', 'email-renders') and is_member(try_uuid((storage.foldername(name))[1])));

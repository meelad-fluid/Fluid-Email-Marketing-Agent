-- Client onboarding: one private link per client, answers keyed by lib/onboarding/questions.ts ids,
-- uploaded assets, and Klaviyo/Shopify connections with the keys kept in Supabase Vault.
--
-- The onboarding link has no login. The server checks the link's token and then reads/writes with
-- the service key, so nothing here is opened to anonymous users. Fluid staff (fluid_staff, 0002)
-- see and manage every client from the internal view.

-- ─── Clients: onboarding status ──────────────────────────────────────────────

alter table clients
  add column contact_email text,
  add column onboarding_status text not null default 'not_started'
    check (onboarding_status in ('not_started', 'in_progress', 'submitted')),
  add column onboarding_submitted_at timestamptz,
  add column questionnaire_version int,
  add column created_by uuid references auth.users;

-- ─── Onboarding links ────────────────────────────────────────────────────────

-- Only a SHA-256 hash of the token is stored; the token itself exists only in the link.
create table onboarding_links (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients on delete cascade,
  token_hash text unique not null,
  created_by uuid references auth.users,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '90 days',
  revoked_at timestamptz,
  last_opened_at timestamptz
);
create index onboarding_links_client on onboarding_links (client_id);

-- ─── Assets and connections: onboarding details ──────────────────────────────

alter table assets
  add column question_id text,          -- which onboarding question it was uploaded under
  add column file_name text,
  add column content_type text,
  add column bytes bigint,
  add column uploaded_via text not null default 'team' check (uploaded_via in ('onboarding', 'team'));

alter table client_connections
  add column status text not null default 'connected' check (status in ('connected', 'failed', 'revoked')),
  add column account_name text,         -- e.g. the Klaviyo account or Shopify store name, shown to staff
  add column verified_at timestamptz,
  add column last_error text;

-- Who last changed an answer: a staff member, or the client through their link.
alter table profile_answers add column updated_via text not null default 'team' check (updated_via in ('onboarding', 'team'));

-- ─── Secrets in Vault (server only) ──────────────────────────────────────────

-- Store or replace a client's API key. Returns the Vault secret id. Only the service role may call it.
create or replace function store_connection_secret(
  p_client uuid, p_provider text, p_secret text, p_meta jsonb default '{}', p_account_name text default null
) returns uuid
language plpgsql security definer set search_path = public, vault as $$
declare
  v_id uuid;
begin
  select vault_secret_id into v_id from client_connections where client_id = p_client and provider = p_provider;
  if v_id is null then
    v_id := vault.create_secret(p_secret, format('%s:%s', p_client, p_provider), format('%s key for client %s', p_provider, p_client));
  else
    perform vault.update_secret(v_id, p_secret);
  end if;
  insert into client_connections (client_id, provider, vault_secret_id, meta, status, account_name, verified_at, last_error)
  values (p_client, p_provider, v_id, p_meta, 'connected', p_account_name, now(), null)
  on conflict (client_id, provider) do update
    set vault_secret_id = excluded.vault_secret_id, meta = excluded.meta, status = 'connected',
        account_name = excluded.account_name, verified_at = now(), last_error = null, connected_at = now();
  return v_id;
end $$;

-- Read a client's API key (for server-side jobs: building in Klaviyo, syncing Shopify).
create or replace function get_connection_secret(p_client uuid, p_provider text) returns text
language sql stable security definer set search_path = public, vault as $$
  select s.decrypted_secret from client_connections c
  join vault.decrypted_secrets s on s.id = c.vault_secret_id
  where c.client_id = p_client and c.provider = p_provider and c.status = 'connected'
$$;

revoke all on function store_connection_secret(uuid, text, text, jsonb, text) from public, anon, authenticated;
revoke all on function get_connection_secret(uuid, text) from public, anon, authenticated;
grant execute on function store_connection_secret(uuid, text, text, jsonb, text) to service_role;
grant execute on function get_connection_secret(uuid, text) to service_role;

-- ─── Fluid staff: the internal view sees every client ────────────────────────

alter table onboarding_links enable row level security;

create policy "staff all clients" on clients for all using (is_fluid_staff()) with check (is_fluid_staff());
create policy "staff all members" on client_members for all using (is_fluid_staff()) with check (is_fluid_staff());
create policy "staff all answers" on profile_answers for all using (is_fluid_staff()) with check (is_fluid_staff());
create policy "staff all assets" on assets for all using (is_fluid_staff()) with check (is_fluid_staff());
create policy "staff all brand kits" on brand_kits for all using (is_fluid_staff()) with check (is_fluid_staff());
create policy "staff read connections" on client_connections for select using (is_fluid_staff());
create policy "staff all onboarding links" on onboarding_links for all using (is_fluid_staff()) with check (is_fluid_staff());
create policy "staff rw client files" on storage.objects for all
  using (bucket_id = 'client-assets' and is_fluid_staff()) with check (bucket_id = 'client-assets' and is_fluid_staff());

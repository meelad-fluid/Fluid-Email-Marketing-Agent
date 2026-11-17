-- Fixes from Supabase's security advisor after the first deploy.

-- Pin search_path so these functions can't be pointed at look-alike objects.
alter function enforce_approval_gate() set search_path = public;
alter function try_uuid(text) set search_path = public;

-- The access-check helpers are only used inside row-level security policies. Anonymous visitors
-- never need them; signed-in users do, because policies run with the caller's privileges.
revoke execute on function is_member(uuid) from public, anon;
revoke execute on function member_role(uuid) from public, anon;
revoke execute on function is_fluid_staff() from public, anon;
grant execute on function is_member(uuid) to authenticated, service_role;
grant execute on function member_role(uuid) to authenticated, service_role;
grant execute on function is_fluid_staff() to authenticated, service_role;

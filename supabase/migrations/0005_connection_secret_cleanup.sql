-- When a connection is removed (including when a client is deleted, which cascades), delete its key
-- from Vault too, so offboarded clients leave no stored Klaviyo/Shopify keys behind.
create or replace function delete_connection_secret() returns trigger
language plpgsql security definer set search_path = public, vault as $$
begin
  delete from vault.secrets where id = old.vault_secret_id;
  return old;
end $$;

revoke all on function delete_connection_secret() from public, anon, authenticated;

create trigger client_connections_delete_secret after delete on client_connections
  for each row execute function delete_connection_secret();

import { supabaseAdmin } from "../supabase/admin";

/** Clients with a working Klaviyo connection. */
export async function klaviyoClients(): Promise<{ id: string; name: string; slug: string }[]> {
  const { data, error } = await supabaseAdmin()
    .from("clients")
    .select("id, name, slug, client_connections!inner(provider, status)")
    .eq("client_connections.provider", "klaviyo")
    .eq("client_connections.status", "connected");
  if (error) throw new Error(error.message);
  return (data ?? []).map((c) => ({ id: c.id, name: c.name, slug: c.slug }));
}

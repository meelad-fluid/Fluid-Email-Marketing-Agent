import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Server-only Supabase client with the service key. Only for server code that has already
// checked who's asking (a signed-in Fluid staff member, or a scheduled job).
let client: SupabaseClient | null = null;

export function supabaseAdmin(): SupabaseClient {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error("Supabase isn't configured");
  client ??= createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  return client;
}

import { FileStore } from "./file";
import { SupabaseStore } from "./supabase";
import type { Store } from "./types";

// Supabase when its environment variables are set; otherwise (development only) the local file store.

let store: Store | null = null;

export function supabaseConfigured() {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function getStore(): Store {
  if (store) return store;
  store = supabaseConfigured()
    ? new SupabaseStore(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    : new FileStore();
  return store;
}

export type * from "./types";

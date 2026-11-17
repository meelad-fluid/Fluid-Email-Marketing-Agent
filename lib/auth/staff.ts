import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies, headers } from "next/headers";
import { supabaseConfigured } from "../store";

// Fluid staff sign in with an email link (Supabase Auth) and must be listed in fluid_staff.
// Without Supabase configured (local development only) the internal view runs open, with a banner.

export type Staff = { id: string; email: string; dev: boolean };

export async function supabaseAuth() {
  const jar = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => jar.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => jar.set(name, value, options));
        } catch {
          // Called from a server component: the middleware refreshes the session instead.
        }
      },
    },
  });
}

export async function currentStaff(): Promise<Staff | null> {
  if (!supabaseConfigured()) {
    if (process.env.NODE_ENV === "production") return null;
    return { id: "dev", email: "dev@localhost", dev: true };
  }
  const { data } = await (await supabaseAuth()).auth.getUser();
  const user = data.user;
  if (!user) return null;
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
  const { data: row } = await admin.from("fluid_staff").select("user_id").eq("user_id", user.id).maybeSingle();
  return row ? { id: user.id, email: user.email ?? "", dev: false } : null;
}

export async function requireStaff(): Promise<Staff> {
  const staff = await currentStaff();
  if (!staff) throw new Error("Not signed in as Fluid staff");
  return staff;
}

// The public address for links we hand out (onboarding links).
export async function appOrigin() {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

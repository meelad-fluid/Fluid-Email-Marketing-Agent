import { redirect } from "next/navigation";
import { appOrigin, currentStaff, supabaseAuth } from "@/lib/auth/staff";
import { supabaseConfigured } from "@/lib/store";

export const metadata = { title: "Sign in · Fluid Creatives" };

async function sendLink(formData: FormData) {
  "use server";
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return;
  // shouldCreateUser: false → only people already added in Supabase can get a link.
  await (await supabaseAuth()).auth.signInWithOtp({ email, options: { shouldCreateUser: false, emailRedirectTo: `${await appOrigin()}/auth/callback` } });
  redirect("/login?sent=1");
}

export default async function Login({ searchParams }: { searchParams: Promise<{ sent?: string }> }) {
  if (await currentStaff()) redirect("/admin");
  const { sent } = await searchParams;
  return (
    <main className="wrap" style={{ maxWidth: 440, paddingTop: 96 }}>
      <div className="card">
        <div className="brandmark" style={{ marginBottom: 16 }}>Fluid Creatives <span>· Team</span></div>
        {!supabaseConfigured() ? (
          <p className="muted">Supabase isn&apos;t connected yet, so the team view runs in development mode at <a href="/admin">/admin</a>.</p>
        ) : sent ? (
          <p>Check your email for a sign-in link.</p>
        ) : (
          <form action={sendLink}>
            <label className="label" htmlFor="email">Work email</label>
            <input id="email" name="email" type="email" className="input" required autoComplete="email" />
            <button className="btn" style={{ marginTop: 14, width: "100%" }}>Email me a sign-in link</button>
          </form>
        )}
      </div>
    </main>
  );
}

import { supabaseAuth } from "@/lib/auth/staff";

// Where the staff sign-in email link lands: swaps the one-time code for a session.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  if (code) await (await supabaseAuth()).auth.exchangeCodeForSession(code);
  return Response.redirect(new URL("/admin", url.origin));
}

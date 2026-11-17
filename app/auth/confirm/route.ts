import type { EmailOtpType } from "@supabase/supabase-js";
import { supabaseAuth } from "@/lib/auth/staff";

// Sign-in link landing that works in any browser (unlike the code exchange in /auth/callback, which
// needs the browser that asked for the link). To use it, set Supabase's Magic Link email template
// link to: {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=magiclink
export async function GET(req: Request) {
  const url = new URL(req.url);
  const token_hash = url.searchParams.get("token_hash");
  const type = (url.searchParams.get("type") ?? "magiclink") as EmailOtpType;
  if (token_hash) {
    const { error } = await (await supabaseAuth()).auth.verifyOtp({ token_hash, type });
    if (!error) return Response.redirect(new URL("/admin", url.origin));
  }
  return Response.redirect(new URL("/login?error=link", url.origin));
}

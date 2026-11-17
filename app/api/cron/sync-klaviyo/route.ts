import { isCron } from "@/lib/auth/cron";
import { klaviyoClients } from "@/lib/clients/klaviyo-clients";
import { syncKlaviyo } from "@/lib/klaviyo/sync";

// Nightly: refresh every connected client's Klaviyo data so reports and plans read fresh numbers.
export const maxDuration = 800;

export async function GET(req: Request) {
  if (!isCron(req)) return new Response("Unauthorized", { status: 401 });
  const results: Record<string, string> = {};
  for (const c of await klaviyoClients()) {
    const r = await syncKlaviyo(c.id);
    results[c.slug] = r.ok ? "ok" : `failed: ${r.error}`;
  }
  return Response.json(results);
}

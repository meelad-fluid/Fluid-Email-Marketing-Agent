import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { BrandKitSchema } from "@/lib/design/brand-kit";
import { renderEmailHtml } from "@/lib/design/html";
import { EmailSpecSchema } from "@/lib/design/spec";

// GET /preview?spec=sale-25&kit=verde → the designed email as HTML (pre-slicing), for quick review.

const safe = (s: string | null) => (s && /^[a-z0-9-]+$/.test(s) ? s : null);

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const spec = safe(params.get("spec"));
  const kit = safe(params.get("kit"));
  if (!spec || !kit) return new Response("Pass ?spec=<name>&kit=<name>", { status: 400 });
  try {
    const load = async (dir: string, name: string) => JSON.parse(await readFile(join(process.cwd(), "examples", dir, `${name}.json`), "utf8"));
    const html = await renderEmailHtml(EmailSpecSchema.parse(await load("specs", spec)), BrandKitSchema.parse(await load("brand-kits", kit)));
    return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
  } catch (e) {
    return new Response(`Could not render: ${(e as Error).message}`, { status: 422 });
  }
}

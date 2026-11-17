// Read-only: names for the metric, list and segment ids that flow definitions refer to.
import { readFile, writeFile } from "node:fs/promises";

let apiKey = "";

async function all(path: string) {
  const out: Record<string, string> = {};
  for (let url: string | null = `https://a.klaviyo.com/api${path}`; url; ) {
    const res: Response = await fetch(url, { headers: { Authorization: `Klaviyo-API-Key ${apiKey}`, revision: "2025-10-15", accept: "application/vnd.api+json" } });
    if (res.status === 429) { await new Promise((r) => setTimeout(r, 2000)); continue; }
    const body: any = await res.json();
    if (!res.ok) throw new Error(`${res.status} ${path}`);
    for (const d of body.data) out[d.id] = d.attributes.name + (d.attributes.integration?.name ? ` (${d.attributes.integration.name})` : "");
    url = body.links?.next ?? null;
  }
  return out;
}

async function main() {
  const env = await readFile(".env.local", "utf8");
  apiKey = env.match(/^KLAVIYO_REFERENCE_API_KEY=(.+)$/m)![1].trim();
  const lookups = { metrics: await all("/metrics/"), lists: await all("/lists/"), segments: await all("/segments/") };
  await writeFile("out/klaviyo-flows/_lookups.json", JSON.stringify(lookups, null, 2));
  console.log(Object.fromEntries(Object.entries(lookups).map(([k, v]) => [k, Object.keys(v).length])));
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});

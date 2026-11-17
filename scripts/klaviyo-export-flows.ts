// Read-only export of every flow (with its full definition) from a reference Klaviyo account.
// Uses KLAVIYO_REFERENCE_API_KEY from .env.local. Only GET requests. Output → out/klaviyo-flows/
// (gitignored: it contains account-specific ids and content).

import { mkdir, readFile, writeFile } from "node:fs/promises";

const REVISION = "2025-10-15";

async function key() {
  const env = await readFile(".env.local", "utf8");
  const k = env.match(/^KLAVIYO_REFERENCE_API_KEY=(.+)$/m)?.[1]?.trim();
  if (!k) throw new Error("KLAVIYO_REFERENCE_API_KEY missing from .env.local");
  return k;
}

async function get(path: string, apiKey: string, attempt = 0): Promise<any> {
  const res = await fetch(path.startsWith("http") ? path : `https://a.klaviyo.com/api${path}`, {
    headers: { Authorization: `Klaviyo-API-Key ${apiKey}`, revision: REVISION, accept: "application/vnd.api+json" },
  });
  const body = await res.json();
  // The flow definition endpoint is tightly rate limited; wait and retry.
  if (res.status === 429 && attempt < 8) {
    await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
    return get(path, apiKey, attempt + 1);
  }
  if (!res.ok) throw new Error(`${res.status} ${path}: ${JSON.stringify(body.errors?.[0] ?? body).slice(0, 300)}`);
  return body;
}

async function main() {
  const apiKey = await key();
  await mkdir("out/klaviyo-flows", { recursive: true });
  const flows: any[] = [];
  for (let url: string | null = "/flows/?page[size]=50"; url; ) {
    const page = await get(url, apiKey);
    flows.push(...page.data);
    url = page.links?.next ?? null;
  }
  console.log(`${flows.length} flows`);
  for (const f of flows) {
    const full = await get(`/flows/${f.id}/?additional-fields[flow]=definition`, apiKey);
    const a = full.data.attributes;
    const safe = a.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
    await writeFile(`out/klaviyo-flows/${safe}-${f.id}.json`, JSON.stringify(full.data, null, 2));
    console.log(`  ${a.status.padEnd(8)} ${a.trigger_type?.padEnd?.(10) ?? ""} ${a.name}  (${a.definition?.actions?.length ?? "?"} actions)`);
  }
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});

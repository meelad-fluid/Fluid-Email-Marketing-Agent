// Read-only: one segment's definition, by name. Usage: tsx scripts/klaviyo-segment.ts "<segment name>"
import { readFile, writeFile } from "node:fs/promises";

async function main() {
  const env = await readFile(".env.local", "utf8");
  const apiKey = env.match(/^KLAVIYO_REFERENCE_API_KEY=(.+)$/m)![1].trim();
  const { segments } = JSON.parse(await readFile("out/klaviyo-flows/_lookups.json", "utf8"));
  const id = Object.entries(segments as Record<string, string>).find(([, n]) => n === process.argv[2])?.[0];
  if (!id) throw new Error(`No segment named "${process.argv[2]}"`);
  const res = await fetch(`https://a.klaviyo.com/api/segments/${id}/?additional-fields[segment]=profile_count`, {
    headers: { Authorization: `Klaviyo-API-Key ${apiKey}`, revision: "2025-10-15", accept: "application/vnd.api+json" },
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`${res.status}: ${JSON.stringify(body.errors?.[0]).slice(0, 300)}`);
  await writeFile(`out/klaviyo-flows/_segment-${id}.json`, JSON.stringify(body.data, null, 2));
  console.log(JSON.stringify({ name: body.data.attributes.name, profiles: body.data.attributes.profile_count, definition: body.data.attributes.definition }));
}
main().catch((e) => { console.error(e.message); process.exit(1); });

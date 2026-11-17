// Read-only reporting query: recipients per flow over the last 365 days.
import { readFile, writeFile } from "node:fs/promises";

async function main() {
  const env = await readFile(".env.local", "utf8");
  const apiKey = env.match(/^KLAVIYO_REFERENCE_API_KEY=(.+)$/m)![1].trim();
  const { metrics } = JSON.parse(await readFile("out/klaviyo-flows/_lookups.json", "utf8"));
  const placedOrder = Object.entries(metrics as Record<string, string>).find(([, n]) => n === "Placed Order (Shopify)")![0];
  const res = await fetch("https://a.klaviyo.com/api/flow-values-reports/", {
    method: "POST",
    headers: { Authorization: `Klaviyo-API-Key ${apiKey}`, revision: "2025-10-15", accept: "application/vnd.api+json", "content-type": "application/vnd.api+json" },
    body: JSON.stringify({
      data: { type: "flow-values-report", attributes: { statistics: ["recipients", "conversions", "conversion_value"], timeframe: { key: "last_365_days" }, conversion_metric_id: placedOrder } },
    }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`${res.status}: ${JSON.stringify(body.errors?.[0]).slice(0, 300)}`);
  await writeFile("out/klaviyo-flows/_sends-365d.json", JSON.stringify(body, null, 2));
  console.log(`${body.data.attributes.results.length} rows`);
}
main().catch((e) => { console.error(e.message); process.exit(1); });

// Read-only: export the Klaviyo templates used by Fluid's flows (from out/klaviyo-flows) and
// render each one to a PNG. Output → out/klaviyo-templates/<flow>/<NN>-<email>.{html,png}
// Usage: tsx scripts/klaviyo-export-templates.ts "FC | Welcome Flow" "FC | Abandoned Checkout" ...

import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { chromium } from "playwright";

async function main() {
  const env = await readFile(".env.local", "utf8");
  const apiKey = env.match(/^KLAVIYO_REFERENCE_API_KEY=(.+)$/m)![1].trim();
  const wanted = new Set(process.argv.slice(2));

  const get = async (path: string, attempt = 0): Promise<any> => {
    const res = await fetch(`https://a.klaviyo.com/api${path}`, {
      headers: { Authorization: `Klaviyo-API-Key ${apiKey}`, revision: "2025-10-15", accept: "application/vnd.api+json" },
    });
    if (res.status === 429 && attempt < 8) {
      await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
      return get(path, attempt + 1);
    }
    const body = await res.json();
    if (!res.ok) throw new Error(`${res.status} ${path}: ${JSON.stringify(body.errors?.[0]).slice(0, 200)}`);
    return body;
  };

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 640, height: 900 }, deviceScaleFactor: 1 });
  const index: any[] = [];

  for (const file of (await readdir("out/klaviyo-flows")).filter((f) => !f.startsWith("_"))) {
    const flow = JSON.parse(await readFile(`out/klaviyo-flows/${file}`, "utf8"));
    const name: string = flow.attributes.name;
    if (!wanted.has(name)) continue;
    const dir = `out/klaviyo-templates/${name.replace(/^FC \| /, "").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`;
    await mkdir(dir, { recursive: true });
    const emails = flow.attributes.definition.actions.filter((a: any) => a.type === "send-email");
    const seenTemplates = new Set<string>();
    let n = 0;
    for (const a of emails) {
      const m = a.data.message;
      if (!m.template_id || seenTemplates.has(m.template_id)) continue;
      seenTemplates.add(m.template_id);
      const t = await get(`/templates/${m.template_id}/`);
      const html: string = t.data.attributes.html ?? "";
      const base = `${dir}/${String(++n).padStart(2, "0")}-${m.name.replace(/^FC \| /, "").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`;
      await writeFile(`${base}.html`, html);
      await page.setContent(html, { waitUntil: "networkidle", timeout: 60000 }).catch(() => {});
      await page.screenshot({ path: `${base}.png`, fullPage: true });
      const imgs = (html.match(/<img\b/gi) ?? []).length;
      const words = html.replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").split(/\s+/).filter(Boolean).length;
      index.push({ flow: name, email: m.name, subject: m.subject_line, preview: m.preview_text, template: m.template_id, editor: t.data.attributes.editor_type, images: imgs, words, file: `${base}.png` });
      console.log(`  ${name} · ${m.name} · ${t.data.attributes.editor_type} · ${imgs} imgs · ${words} words`);
    }
  }
  await writeFile("out/klaviyo-templates/_index.json", JSON.stringify(index, null, 2));
  await browser.close();
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});

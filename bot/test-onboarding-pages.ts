// Renders the client onboarding form and a doc page at phone width (no database writes).
import { writeFileSync } from "node:fs";
import { chromium, devices } from "playwright";
import { marked } from "marked";
import { readFileSync } from "node:fs";
import { formPage, docPage } from "./web";
(async () => {
  const out = process.argv[2] ?? "/tmp";
  writeFileSync(`${out}/form.html`, formPage("Test Brand")); writeFileSync(`${out}/key.html`, formPage("Arq 8 Creatine", true));
  writeFileSync(`${out}/doc.html`, docPage("Onboarding Doc", "Dolce Superfoods", marked.parse(readFileSync("clients/dolce/research/onboarding-doc.md", "utf8")) as string));
  const b = await chromium.launch();
  for (const f of ["form", "key", "doc"]) {
    const p = await (await b.newContext(f === "key" ? { viewport: { width: 1440, height: 900 } } : devices["iPhone 14"])).newPage();
    await p.goto(`file://${out}/${f}.html`);
    const o = await p.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
    console.log(f, o[0] > o[1] ? "✗ sideways scroll" : "✓ fits the phone", o);
    await p.screenshot({ path: `${out}/${f}.png` });
  }
  await b.close(); process.exit(0);
})();

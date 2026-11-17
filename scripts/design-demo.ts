// Renders an email spec with a brand kit and writes everything to out/<kit>-<spec>/:
//   preview.html  the designed email (before slicing)
//   full.png      the 2x render
//   slices/       compressed slices + template.html (what goes to Klaviyo)
//   report.json   slice sizes, links, alt text, QA results
// Usage: npm run design:demo -- [spec.json] [kit.json ...]

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { buildEmail } from "../lib/design/build";
import { closeRenderer } from "../lib/design/render";

const [specPath = "examples/specs/sale-25.json", ...kitArgs] = process.argv.slice(2);
const kitPaths = kitArgs.length ? kitArgs : ["examples/brand-kits/verde.json", "examples/brand-kits/nightshift.json"];

async function main() {
  const spec = JSON.parse(await readFile(specPath, "utf8"));
  for (const kitPath of kitPaths) {
    const kit = JSON.parse(await readFile(kitPath, "utf8"));
    const dir = join("out", `${basename(kitPath, ".json")}-${basename(specPath, ".json")}`);
    await mkdir(join(dir, "slices"), { recursive: true });

    const r = await buildEmail(spec, kit);
    await writeFile(join(dir, "preview.html"), r.html);
    await writeFile(join(dir, "full.png"), r.png);
    for (const s of r.slices) await writeFile(join(dir, "slices", s.file), s.data);
    await writeFile(join(dir, "slices", "template.html"), r.templateHtml);
    const slices = r.slices.map(({ data, ...s }) => s);
    await writeFile(join(dir, "report.json"), JSON.stringify({ passed: r.passed, qa: r.qa, slices }, null, 2));

    const total = r.slices.reduce((n, s) => n + s.bytes, 0);
    console.log(`\n${kit.name}: ${r.slices.length} slices, ${(total / 1024).toFixed(0)}KB total → ${dir}`);
    for (const s of r.slices) console.log(`  ${s.file.padEnd(32)} ${(s.bytes / 1024).toFixed(0).padStart(4)}KB  -${s.savedPct}%`);
    console.log(`  QA: ${r.passed ? "PASS" : "FAIL"}`);
    for (const q of r.qa) console.log(`   ${q.pass ? "✓" : q.severity === "block" ? "✗" : "!"} ${q.code}: ${q.detail}`);
  }
  await closeRenderer();
}

main().catch(async (e) => {
  console.error(e);
  await closeRenderer();
  process.exit(1);
});

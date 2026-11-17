// Groups near-identical email images (Figma exports vs each other and vs the Desktop library) by a
// perceptual hash: grayscale 16x64 thumbnail, each pixel vs the mean, plus aspect ratio.
// Writes out/figma/dedupe.json: { figmaNode: { dupOfFigma?: node, dupOfRef?: ref } }.
import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";

async function phash(file: string) {
  const img = sharp(file).flatten({ background: "#fff" });
  const { width = 1, height = 1 } = await img.metadata();
  const px = await img.greyscale().resize(16, 64, { fit: "fill" }).raw().toBuffer();
  const mean = px.reduce((a, b) => a + b, 0) / px.length;
  return { bits: [...px].map((p) => (p > mean ? 1 : 0)), ratio: height / width };
}
const dist = (a: number[], b: number[]) => a.reduce((n, v, i) => n + (v !== b[i] ? 1 : 0), 0);

async function main() {
  const m = JSON.parse(readFileSync("out/figma/manifest.json", "utf8"));
  const figma = await Promise.all(m.items.map(async (it: any) => ({ ...it, ...(await phash(`out/figma/png/${it.node.replace(":", "_")}.png`)) })));
  // Desktop library: map each local file back to its ref via out/references/*.json source_file.
  const root = join(homedir(), "Desktop/Claude Editing Assets/Email Designs");
  const refs = readdirSync("out/references").map((f) => JSON.parse(readFileSync(`out/references/${f}`, "utf8")));
  const desk = await Promise.all(refs.map(async (r) => ({ ref: r.ref, name: r.source_file, ...(await phash(join(root, r.source_file.split(" | ")[0]))) })));
  const near = (a: any, b: any) => Math.abs(a.ratio - b.ratio) / a.ratio < 0.03 && dist(a.bits, b.bits) <= 90;
  const out: Record<string, any> = {};
  figma.forEach((f, i) => {
    const r = desk.filter((d) => near(f, d)).sort((a, b) => dist(f.bits, a.bits) - dist(f.bits, b.bits))[0];
    const earlier = figma.slice(0, i).find((g) => near(f, g) && !out[g.node]?.dupOfFigma);
    out[f.node] = { page: f.page, name: f.name, ...(r ? { dupOfRef: r.ref, refName: r.name, d: dist(f.bits, r.bits) } : {}), ...(earlier && !r ? { dupOfFigma: earlier.node, d: dist(f.bits, earlier.bits) } : {}) };
  });
  writeFileSync("out/figma/dedupe.json", JSON.stringify(out, null, 1));
  const vals = Object.entries(out);
  console.log(`matched Desktop: ${vals.filter(([, v]) => v.dupOfRef).length}, dup within Figma: ${vals.filter(([, v]) => v.dupOfFigma).length}, new: ${vals.filter(([, v]) => !v.dupOfRef && !v.dupOfFigma).length}`);
  for (const [k, v] of vals) console.log(`${k.padEnd(9)} ${v.page.padEnd(10)} ${(v.name as string).slice(0, 40).padEnd(40)} ${v.dupOfRef ? `= ${v.refName} (${v.d})` : v.dupOfFigma ? `= figma ${v.dupOfFigma} (${v.d})` : "NEW"}`);
}
main();

// .dc.html (Claude Design / Fluid design source) → plain HTML. Images and fonts are referenced in the source as
// /_blob/<id>; the design folder's assets.json maps each id to a file under the client folder. `assetUrl` turns
// that relative path into a URL (default: a local file:// URL, used for rendering and slicing).
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

export function dcToHtml(dcFile: string, clientDir: string, assetUrl: (relPath: string) => string = (p) => pathToFileURL(resolve(clientDir, p)).href): string {
  const src = readFileSync(dcFile, "utf8");
  const mapFile = join(dirname(dcFile), "assets.json");
  const map: Record<string, string> = existsSync(mapFile) ? JSON.parse(readFileSync(mapFile, "utf8")) : {};
  const inner = src.match(/<x-dc>([\s\S]*?)<\/x-dc>/)?.[1] ?? src;
  const css = inner.match(/<helmet>[\s\S]*?<style>([\s\S]*?)<\/style>[\s\S]*?<\/helmet>/)?.[1] ?? "";
  const body = inner.replace(/<helmet>[\s\S]*?<\/helmet>/, "");
  let html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=600"><style>${css}</style></head><body style="margin:0">${body}</body></html>`;
  html = html.replace(/\/_blob\/([0-9a-f]{32})/g, (m, id) => (map[id] ? assetUrl(map[id]) : m));
  const missing = [...html.matchAll(/\/_blob\/([0-9a-f]{32})/g)].map((m) => m[1]);
  if (missing.length) throw new Error(`assets.json is missing ${missing.length} image(s): ${[...new Set(missing)].join(", ")}`);
  return html;
}

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, normalize } from "node:path";
import { DEV_FILES } from "@/lib/store/file";
import { supabaseConfigured } from "@/lib/store";

// Development only: stands in for Supabase Storage when the local file store is in use.
const allowed = () => process.env.NODE_ENV !== "production" && !supabaseConfigured();

function resolvePath(parts: string[]) {
  const p = normalize(join(DEV_FILES, ...parts));
  return p.startsWith(DEV_FILES + "/") ? p : null;
}

export async function PUT(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const p = allowed() && resolvePath((await params).path);
  if (!p) return new Response("Not found", { status: 404 });
  await mkdir(dirname(p), { recursive: true });
  await writeFile(p, Buffer.from(await req.arrayBuffer()));
  return new Response(null, { status: 204 });
}

export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const p = allowed() && resolvePath((await params).path);
  if (!p) return new Response("Not found", { status: 404 });
  const data = await readFile(p).catch(() => null);
  if (!data) return new Response("Not found", { status: 404 });
  const ext = p.split(".").pop()!;
  const type = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", gif: "image/gif", svg: "image/svg+xml", pdf: "application/pdf" }[ext] ?? "application/octet-stream";
  return new Response(data, { headers: { "content-type": type } });
}

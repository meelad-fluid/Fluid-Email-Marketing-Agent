import { createHash, randomBytes } from "node:crypto";

// Onboarding link tokens: 32 random bytes in the URL; only a SHA-256 hash is stored, so a copy of
// the database can't be turned back into working links.

export const newToken = () => randomBytes(32).toString("base64url");
export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
export const looksLikeToken = (token: string) => /^[A-Za-z0-9_-]{43}$/.test(token);

export function slugify(name: string) {
  return name.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "client";
}

// Uploaded file names become part of a storage path: keep them short and safe.
export function safeFileName(name: string) {
  const dot = name.lastIndexOf(".");
  const ext = dot > 0 ? name.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8) : "";
  const base = (dot > 0 ? name.slice(0, dot) : name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "file";
  return ext ? `${base}.${ext}` : base;
}

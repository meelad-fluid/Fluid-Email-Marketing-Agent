import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { AnswerValue } from "../onboarding/questions";
import { hashToken, looksLikeToken, newToken, safeFileName, slugify } from "./tokens";
import type { Answers, Asset, Client, Connection, OnboardingStatus, Provider, Store, UploadTarget, Via } from "./types";

// Development-only store: everything in out/dev-store/ so the onboarding flow can be run and tested
// before Supabase is connected. Connection keys are never written to disk here, only a masked note
// that they were verified. Refuses to run in production.

const ROOT = join(process.cwd(), "out/dev-store");
const DB = join(ROOT, "db.json");
export const DEV_FILES = join(ROOT, "files");

type Link = { client_id: string; token_hash: string; expires_at: string; revoked_at: string | null };
type Data = { clients: Client[]; links: Link[]; answers: Record<string, Answers>; assets: Asset[]; connections: Record<string, Connection[]> };

const empty = (): Data => ({ clients: [], links: [], answers: {}, assets: [], connections: {} });

export class FileStore implements Store {
  readonly mode = "local" as const;

  constructor() {
    if (process.env.NODE_ENV === "production") throw new Error("FileStore is for development only. Set the Supabase environment variables.");
  }

  // Serialize writes so two quick autosaves can't overwrite each other.
  private queue: Promise<unknown> = Promise.resolve();
  private async read(): Promise<Data> {
    return JSON.parse(await readFile(DB, "utf8").catch(() => JSON.stringify(empty())));
  }
  private change<T>(fn: (d: Data) => T): Promise<T> {
    const run = this.queue.then(async () => {
      const d = await this.read();
      const out = fn(d);
      await mkdir(ROOT, { recursive: true });
      await writeFile(DB, JSON.stringify(d, null, 2));
      return out;
    });
    this.queue = run.catch(() => {});
    return run;
  }

  async listClients() {
    return (await this.read()).clients.sort((a, b) => b.created_at.localeCompare(a.created_at));
  }
  async getClient(id: string) {
    return (await this.read()).clients.find((c) => c.id === id) ?? null;
  }
  createClient(input: { name: string; websiteUrl?: string; contactEmail?: string }) {
    return this.change((d) => {
      let slug = slugify(input.name);
      while (d.clients.some((c) => c.slug === slug)) slug = `${slugify(input.name)}-${Math.random().toString(36).slice(2, 6)}`;
      const c: Client = {
        id: crypto.randomUUID(), name: input.name, slug, website_url: input.websiteUrl || null, contact_email: input.contactEmail || null,
        onboarding_status: "not_started", onboarding_submitted_at: null, created_at: new Date().toISOString(),
      };
      d.clients.push(c);
      return c;
    });
  }
  setOnboardingStatus(clientId: string, status: OnboardingStatus) {
    return this.change((d) => {
      const c = d.clients.find((x) => x.id === clientId);
      if (!c) return;
      c.onboarding_status = status;
      if (status === "submitted") c.onboarding_submitted_at = new Date().toISOString();
    });
  }

  newOnboardingLink(clientId: string) {
    return this.change((d) => {
      const now = new Date().toISOString();
      d.links.filter((l) => l.client_id === clientId && !l.revoked_at).forEach((l) => (l.revoked_at = now));
      const token = newToken();
      d.links.push({ client_id: clientId, token_hash: hashToken(token), expires_at: new Date(Date.now() + 90 * 864e5).toISOString(), revoked_at: null });
      return token;
    });
  }
  async resolveOnboardingToken(token: string) {
    if (!looksLikeToken(token)) return null;
    const d = await this.read();
    const l = d.links.find((x) => x.token_hash === hashToken(token));
    if (!l || l.revoked_at || new Date(l.expires_at) < new Date()) return null;
    return d.clients.find((c) => c.id === l.client_id) ?? null;
  }
  async hasActiveLink(clientId: string) {
    return (await this.read()).links.some((l) => l.client_id === clientId && !l.revoked_at && new Date(l.expires_at) > new Date());
  }

  async getAnswers(clientId: string) {
    return (await this.read()).answers[clientId] ?? {};
  }
  saveAnswer(clientId: string, questionId: string, value: AnswerValue) {
    return this.change((d) => {
      (d.answers[clientId] ??= {})[questionId] = value;
    });
  }

  async listAssets(clientId: string) {
    return (await this.read()).assets.filter((a) => a.client_id === clientId);
  }
  async createUpload(clientId: string, fileName: string): Promise<UploadTarget> {
    const path = `${clientId}/onboarding/${crypto.randomUUID()}-${safeFileName(fileName)}`;
    return { kind: "local", uploadUrl: `/api/dev-files/${path}`, path };
  }
  recordAsset(clientId: string, a: { path: string; questionId: string; kind: string; fileName: string; contentType: string; bytes: number }) {
    if (!a.path.startsWith(`${clientId}/`)) throw new Error("asset path belongs to another client");
    return this.change((d) => {
      const asset: Asset = {
        id: crypto.randomUUID(), client_id: clientId, question_id: a.questionId, kind: a.kind, file_name: a.fileName,
        content_type: a.contentType, bytes: a.bytes, storage_path: a.path, created_at: new Date().toISOString(),
      };
      d.assets.push(asset);
      return asset;
    });
  }
  async removeAsset(clientId: string, assetId: string) {
    const removed = await this.change((d) => {
      const i = d.assets.findIndex((a) => a.id === assetId && a.client_id === clientId);
      return i >= 0 ? d.assets.splice(i, 1)[0] : null;
    });
    if (removed) await rm(join(DEV_FILES, removed.storage_path), { force: true });
  }
  async assetUrl(asset: Asset) {
    return `/api/dev-files/${asset.storage_path}`;
  }

  async listConnections(clientId: string) {
    return (await this.read()).connections[clientId] ?? [];
  }
  saveConnection(clientId: string, provider: Provider, secret: string, meta: Record<string, unknown>, accountName: string | null) {
    return this.change((d) => {
      const list = (d.connections[clientId] ??= []).filter((c) => c.provider !== provider);
      list.push({ provider, status: "connected", account_name: accountName, verified_at: new Date().toISOString(), last_error: null, meta: { ...meta, key_hint: `…${secret.slice(-4)}` } });
      d.connections[clientId] = list;
    });
  }
}
